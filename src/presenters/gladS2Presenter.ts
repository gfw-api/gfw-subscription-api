import logger from 'logger';
import moment from 'moment';
import EmailHelpersService from 'services/emailHelpersService';
import GladAllPresenter from 'presenters/gladAllPresenter';
import GladS2Service from 'services/gfw-data-api/gladS2Service';
import { PresenterData, PresenterInterface } from 'presenters/presenter.interface';
import { ISubscription } from 'models/subscription';
import { ILayer } from 'models/layer';
import { GladS2Alert } from 'types/analysis.type';
import { GladUpdatedNotification } from 'types/email.type';

class GLADS2Presenter implements PresenterInterface<GladS2Alert> {

    async transform(results: PresenterData<GladS2Alert>, subscription: ISubscription, layer: ILayer, begin: Date, end: Date): Promise<GladUpdatedNotification> {
        try {
            const resultObject: GladUpdatedNotification = GladAllPresenter.buildResultObject(results, subscription, layer, begin, end);

            resultObject.downloadUrls = await GladS2Service.getDownloadURLs(
                moment(begin).format('YYYY-MM-DD'),
                moment(end).format('YYYY-MM-DD'),
                subscription.params
            );

            resultObject.glad_alert_type = EmailHelpersService.translateAlertType('glad-s2', subscription.language);

            logger.info('GLAD-S2 Results ', resultObject);
            return resultObject;
        } catch (err) {
            logger.error(err);
            throw err;
        }

    }

}

export default new GLADS2Presenter();
