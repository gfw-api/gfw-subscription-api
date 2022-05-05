import type { Document, Model, PaginateModel, Schema as ISchema, Types } from 'mongoose';
import { model, Schema } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate';
import logger from 'logger';
import Layer, { ILayer } from 'models/layer';
import Statistic from 'models/statistic';
import AnalysisService from 'services/analysisService';
import AnalysisResultsPresenter from 'presenters/analysisResultsPresenter';
import EmailPublisher from 'publishers/emailPublisher';
import UrlPublisher from 'publishers/urlPublisher';
import { PublisherInterface } from 'publishers/publisher.interface';
import { BaseAlert } from 'types/analysis.type';
import { EmailLanguageType, SubscriptionEmailData } from 'types/email.type';
import { PresenterData, PresenterResponse } from 'presenters/presenter.interface';

const ALERT_TYPES: string[] = ['EMAIL', 'URL'];

const ALERT_TYPES_PUBLISHER: Record<typeof ALERT_TYPES[number], PublisherInterface> = {
    EMAIL: EmailPublisher,
    URL: UrlPublisher,
};

export interface DatasetQuery {
    id: string,
    type: string,
    lastSentDate: Date,
    threshold: number,
    historical: {
        value: number,
        date: Date
    }[]
}

export interface ISubscription extends Document {
    name: string,
    confirmed: boolean
    resource: {
        type: typeof ALERT_TYPES[number],
        content: string
    },
    datasets: Types.Array<string>,
    datasetsQuery: DatasetQuery[],
    params: Record<string, any>,
    userId: string,
    language: EmailLanguageType,
    createdAt: Date,
    updatedAt: Date,
    application: string,
    env: string,
    publish: (layerConfig: { slug: string, name: string }, begin: Date, end: Date, sendEmail?: boolean) => Promise<boolean>
}

export const Subscription: ISchema<ISubscription> = new Schema<ISubscription>({
    name: { type: String, required: false, trim: true },
    confirmed: { type: Boolean, required: false, default: false },
    resource: {
        type: {
            type: String, trim: true, enum: ALERT_TYPES, default: ALERT_TYPES[0]
        },
        content: { type: String, trim: true }
    },
    datasets: [{ type: String, default: null }],
    datasetsQuery: [{
        _id: false,
        id: { type: String, required: false, trim: true },
        type: { type: String, required: false, trim: true },
        lastSentDate: { type: Date, required: true, default: Date.now },
        threshold: { type: Number, required: false, default: 0 },
        historical: [{
            _id: false,
            value: { type: Number, required: false },
            date: { type: Date, required: true, default: Date.now }
        }]
    }],
    params: { type: Schema.Types.Mixed, default: {} },
    userId: { type: String, trim: true, required: false },
    language: {
        type: String, trim: true, required: false, default: 'en'
    },
    createdAt: { type: Date, required: true, default: Date.now },
    updatedAt: { type: Date, required: false, default: Date.now },
    application: {
        type: String, required: true, default: 'gfw', trim: true
    },
    env: { type: String, required: true, default: 'production' }
});

// this can't be converted to an arrow function, as it will change the behavior of things and cause tests to rightfully fail
// eslint-disable-next-line func-names
Subscription.methods.publish = async function (layerConfig: { slug: string, name: string }, begin: Date, end: Date, publish: boolean = true): Promise<boolean> {
    logger.info('[SubscriptionEmails] Publishing subscription with data', layerConfig, begin, end);
    const layer: ILayer = Layer.findBySlug(layerConfig.name);
    if (!layer) {
        return null;
    }

    const analysisResults: BaseAlert[] = await AnalysisService.execute(this, layerConfig.slug, begin, end);
    if (!analysisResults) {
        logger.info('[SubscriptionEmails] Results are null, returning.');
        return null;
    }
    logger.debug('Results obtained', analysisResults);

    const totalAlertCount: number = analysisResults.reduce((acc: number, curr: BaseAlert) => acc + curr.alert__count, 0);
    const analysisResultsWithSum: PresenterData<BaseAlert> = { value: totalAlertCount, data: analysisResults };

    if (totalAlertCount <= 0) {
        logger.info('[SubscriptionEmails] Zero value result, not sending email for subscription.');
        return false;
    }

    if (publish) {
        const renderedResults: PresenterResponse = await AnalysisResultsPresenter.render(analysisResultsWithSum, this, layer, begin, end);
        await ALERT_TYPES_PUBLISHER[this.resource.type].publish(
            this, renderedResults, layer
        );
        logger.info('[SubscriptionEmails] Saving statistic');
        await new Statistic({ slug: layerConfig.slug, application: this.application }).save();
    }

    return true;
};

Subscription.plugin(mongoosePaginate);

interface SubscriptionModel<T extends Document> extends Model<T>, PaginateModel<T> {
}

const SubscriptionModel: SubscriptionModel<ISubscription> = model<ISubscription>('Subscription', Subscription) as SubscriptionModel<ISubscription>;

export default SubscriptionModel;
