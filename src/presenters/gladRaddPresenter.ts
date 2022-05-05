import logger from 'logger';
import moment from 'moment';
import EmailHelpersService from 'services/emailHelpersService';
import GladAllPresenter from 'presenters/gladAllPresenter';
import GladRaddService from 'services/gfw-data-api/gladRaddService';
import { ISubscription } from 'models/subscription';
import { GladRaddPresenterResponse, PresenterData, PresenterInterface } from 'presenters/presenter.interface';
import { ILayer } from 'models/layer';
import { GladRaddAlert } from 'types/analysis.type';

class GLADRaddPresenter implements PresenterInterface<GladRaddAlert> {

    async transform(results: PresenterData<GladRaddAlert>, subscription: ISubscription, layer: ILayer, begin: Date, end: Date): Promise<GladRaddPresenterResponse> {
        try {
            const resultObject: GladRaddPresenterResponse = GladAllPresenter.buildResultObject(results, subscription, layer, begin, end);

            resultObject.downloadUrls = await GladRaddService.getDownloadURLs(
                moment(begin).format('YYYY-MM-DD'),
                moment(end).format('YYYY-MM-DD'),
                subscription.params
            );

            resultObject.glad_alert_type = EmailHelpersService.translateAlertType('glad-radd', subscription.language);

            logger.info('GLAD-RADD Results ', resultObject);
            return resultObject;
        } catch (err) {
            logger.error(err);
            throw err;
        }

    }

}

export default new GLADRaddPresenter();
