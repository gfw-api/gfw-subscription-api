import logger from 'logger';
import moment from 'moment';
import EmailHelpersService from 'services/emailHelpersService';
import GladAllPresenter from 'presenters/gladAllPresenter';
import GladLService from 'services/gfw-data-api/gladLService';
import { PresenterData, PresenterInterface } from 'presenters/presenter.interface';
import { ISubscription } from 'models/subscription';
import { ILayer } from 'models/layer';
import { GladLAlert } from 'types/analysis.type';
import { GladUpdatedNotification } from 'types/email.type';

class GLADLPresenter implements PresenterInterface<GladLAlert> {

    async transform(results: PresenterData<GladLAlert>, subscription: ISubscription, layer: ILayer, begin: Date, end: Date): Promise<GladUpdatedNotification> {
        try {
            const resultObject: GladUpdatedNotification = GladAllPresenter.buildResultObject(results, subscription, layer, begin, end);

            resultObject.downloadUrls = await GladLService.getDownloadURLs(
                moment(begin).format('YYYY-MM-DD'),
                moment(end).format('YYYY-MM-DD'),
                subscription.params
            );

            resultObject.glad_alert_type = EmailHelpersService.translateAlertType('glad-l', subscription.language);

            logger.info('GLAD-L Results ', resultObject);
            return resultObject;
        } catch (err) {
            logger.error(err);
            throw err;
        }

    }

}

export default new GLADLPresenter();
