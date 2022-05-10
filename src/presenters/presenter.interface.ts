import { ISubscription } from 'models/subscription';
import { ILayer } from 'models/layer';
import { AlertResultType } from 'types/alertResult.type';
import { PublisherInterface } from 'publishers/publisher.interface';
import logger from 'logger';
import EmailPublisher from 'publishers/emailPublisher';
import UrlPublisher from 'publishers/urlPublisher';
import { isEmpty } from 'lodash';
import moment from 'moment';
import UrlService from 'services/urlService';
import { PresenterResponseDataType } from 'types/presenterResponse.type';

export type FormattedPriorityArea = {
    intact_forest: string
    primary_forest: string
    peat: string
    protected_areas: string
    plantations: string
    other: string
};

export type PriorityArea = {
    intact_forest: number
    primary_forest: number
    peat: number
    protected_areas: number
    plantations: number
    other: number
};

export type AlertResultWithCount<T extends AlertResultType> = { value: number, data: T[] }

const ALERT_TYPES: string[] = ['EMAIL', 'URL'];

const ALERT_TYPES_PUBLISHER: Record<typeof ALERT_TYPES[number], PublisherInterface> = {
    EMAIL: EmailPublisher,
    URL: UrlPublisher,
};

export abstract class PresenterInterface<T extends AlertResultType, U extends PresenterResponseDataType> {

    #decorateWithName(results: U, subscription: ISubscription): U {
        if (!isEmpty(subscription.name)) {
            results.alert_name = subscription.name;
        } else {
            results.alert_name = 'Unnamed Subscription';
        }

        return results;
    }

    #decorateWithDates(results: U, begin: Date, end: Date): U {
        results.alert_date_begin = moment(begin).format('YYYY-MM-DD');
        results.alert_date_end = moment(end).format('YYYY-MM-DD');

        return results;
    }

    #decorateWithLinks(results: U, subscription: ISubscription): U {
        results.unsubscribe_url = UrlService.unsubscribeUrl(subscription);
        results.subscriptions_url = UrlService.flagshipUrl('/my-gfw', subscription.language);

        // New Help Center links with language
        results.help_center_url_manage_areas = UrlService.flagshipUrl('/help/map/guides/manage-saved-areas', subscription.language);
        results.help_center_url_save_more_areas = UrlService.flagshipUrl('/help/map/guides/save-area-subscribe-forest-change-notifications', subscription.language);
        results.help_center_url_investigate_alerts = UrlService.flagshipUrl('/help/map/guides/investigate-forest-change-satellite-imagery', subscription.language);

        return results;
    }

    #decorateWithArea(results: U, subscription: ISubscription): U {
        const params: Record<string, any> = subscription.params || {};

        if (params.iso && params.iso.country) {
            results.selected_area = `ISO Code: ${params.iso.country}`;

            if (params.iso.region) {
                results.selected_area += `, ID1: ${params.iso.region}`;

                if (params.iso.subregion) {
                    results.selected_area += `, ID2: ${params.iso.subregion}`;
                }
            }
        } else if (params.wdpaid) {
            results.selected_area = `WDPA ID: ${params.wdpaid}`;
        } else {
            results.selected_area = 'Custom Area';
        }

        return results;
    }

    #decorate(presenterResponse: U, subscription: ISubscription, layer: ILayer, begin: Date, end: Date): U {
        try {
            presenterResponse.layerSlug = layer.slug;
            // eslint-disable-next-line no-param-reassign
            presenterResponse = this.#decorateWithName(presenterResponse, subscription);
            // eslint-disable-next-line no-param-reassign
            presenterResponse = this.#decorateWithArea(presenterResponse, subscription);
            // eslint-disable-next-line no-param-reassign
            presenterResponse = this.#decorateWithLinks(presenterResponse, subscription);
            // eslint-disable-next-line no-param-reassign
            presenterResponse = this.#decorateWithDates(presenterResponse, begin, end);

            return presenterResponse;
        } catch (err) {
            logger.error(err);
            throw err;
        }
    }

    protected abstract getAlertsForSubscription(startDate: string, endDate: string, params: Record<string, any>, layerSlug: string): Promise<T[]>

    protected abstract transform(results: AlertResultWithCount<T>, subscription: ISubscription, layer: ILayer, begin: Date, end: Date): Promise<U>

    protected async getAlertsWithCountForSubscription(startDate: string, endDate: string, params: Record<string, any>, layerSlug: string): Promise<AlertResultWithCount<T>> {
        const analysisResults: T[] = await this.getAlertsForSubscription(startDate, endDate, params, layerSlug);

        if (!analysisResults) {
            logger.info('[SubscriptionEmails] Results are null, returning.');
            return null;
        }
        logger.debug('Results obtained', analysisResults);

        const totalAlertCount: number = analysisResults.reduce((acc: number, curr: AlertResultType) => acc + curr.alert__count, 0);
        const analysisResultsWithSum: AlertResultWithCount<T> = { value: totalAlertCount, data: analysisResults };

        return analysisResultsWithSum;
    }

    protected async notify(results: AlertResultWithCount<T>, subscription: ISubscription, layer: ILayer, begin: Date, end: Date): Promise<void> {
        try {

            let presenterResponse: U;
            presenterResponse = await this.transform(results, subscription, layer, begin, end);

            presenterResponse = this.#decorate(presenterResponse, subscription, layer, begin, end);

            await ALERT_TYPES_PUBLISHER[subscription.resource.type].publish(
                subscription, presenterResponse, layer
            );
        } catch (err) {
            logger.error(err);
            throw err;
        }
    }

    async publish(layerConfig: { slug: string, name: string }, begin: Date, end: Date, subscription: ISubscription, publish: boolean = true, layer: ILayer): Promise<boolean> {
        const formatDate = (date: Date): string => moment(date).format('YYYY-MM-DD');

        const analysisResultsWithCount: AlertResultWithCount<T> = await this.getAlertsWithCountForSubscription(formatDate(begin), formatDate(end), subscription.params, layerConfig.slug);

        if (analysisResultsWithCount.value <= 0) {
            logger.info('[SubscriptionEmails] Zero value result, not sending email for subscription.');
            return false;
        }

        if (publish) {
            await this.notify(analysisResultsWithCount, subscription, layer, begin, end)
            return true;
        } else {
            return false
        }
    }
}
