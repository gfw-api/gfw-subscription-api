import logger from 'logger';
import moment, { Moment } from 'moment';
import EmailHelpersService from 'services/emailHelpersService';
import GladAllService from 'services/gfw-data-api/gladAllService';
import AlertUrlService from 'services/alertUrlService';
import UrlService from 'services/urlService';
import { PresenterData, PresenterInterface } from 'presenters/presenter.interface';
import { ISubscription } from 'models/subscription';
import { ILayer } from 'models/layer';
import { BaseAlertWithArea, GladAllAlert } from 'types/analysis.type';
import { GladUpdatedNotification } from 'types/email.type';

class GLADAllPresenter implements PresenterInterface<GladAllAlert> {

    buildResultObject(results: PresenterData<BaseAlertWithArea>, subscription: ISubscription, layer: ILayer, begin: Date, end: Date): GladUpdatedNotification {
        const resultObject: Partial<GladUpdatedNotification> = { value: results.value };
        EmailHelpersService.updateMonthTranslations();
        moment.locale(subscription.language || 'en');

        const startDate: Moment = moment(begin);
        const endDate: Moment = moment(end);

        resultObject.month = startDate.format('MMMM');
        resultObject.year = startDate.format('YYYY');
        resultObject.week_of = `${startDate.format('DD MMM')}`;
        resultObject.week_start = startDate.format('DD/MM/YYYY');
        resultObject.week_end = endDate.format('DD/MM/YYYY');
        const alertCount: number = results.data.reduce((acc: number, curr: BaseAlertWithArea) => acc + curr.alert__count, 0)
        resultObject.glad_count = alertCount;
        resultObject.alert_count = alertCount;

        resultObject.priority_areas = EmailHelpersService.calculateGLADPriorityAreaValues(results.data, resultObject.alert_count);
        resultObject.formatted_alert_count = EmailHelpersService.formatAlertCount(resultObject.alert_count);
        resultObject.formatted_priority_areas = EmailHelpersService.formatPriorityAreas(resultObject.priority_areas);

        resultObject.alert_link = AlertUrlService.generate(subscription, layer, begin, end);
        resultObject.dashboard_link = UrlService.dashboardUrl(subscription.id, subscription.language, 'glad');
        resultObject.map_url_intact_forest = AlertUrlService.generateIntactForestMapURL(subscription, layer, begin, end);
        resultObject.map_url_primary_forest = AlertUrlService.generatePrimaryForestMapURL(subscription, layer, begin, end);
        resultObject.map_url_peat = AlertUrlService.generatePeatMapURL(subscription, layer, begin, end);
        resultObject.map_url_wdpa = AlertUrlService.generateWDPAMapURL(subscription, layer, begin, end);

        const sumArea: number = results.data.reduce((acc: number, curr: BaseAlertWithArea) => acc + curr.alert_area__ha, 0);
        resultObject.area_ha_sum = EmailHelpersService.globalFormatter(EmailHelpersService.roundXDecimals(sumArea, 2));

        const intactForestAlerts: BaseAlertWithArea[] = results.data.filter((al: BaseAlertWithArea) => !!al.is__ifl_intact_forest_landscape_2016);
        const intactForestSumArea: number = intactForestAlerts.reduce((acc: number, curr: BaseAlertWithArea) => acc + curr.alert_area__ha, 0);
        resultObject.intact_forest_ha_sum = EmailHelpersService.globalFormatter(EmailHelpersService.roundXDecimals(intactForestSumArea, 2));

        const primaryForestAlerts: BaseAlertWithArea[] = results.data.filter((al: BaseAlertWithArea) => !!al.is__umd_regional_primary_forest_2001);
        const primaryForestSumArea: number = primaryForestAlerts.reduce((acc: number, curr: BaseAlertWithArea) => acc + curr.alert_area__ha, 0);
        resultObject.primary_forest_ha_sum = EmailHelpersService.globalFormatter(EmailHelpersService.roundXDecimals(primaryForestSumArea, 2));

        const peatLandAlerts: BaseAlertWithArea[] = results.data.filter((al: BaseAlertWithArea) => !!al.is__peatland);
        const peatLandSumArea: number = peatLandAlerts.reduce((acc: number, curr: BaseAlertWithArea) => acc + curr.alert_area__ha, 0);
        resultObject.peat_ha_sum = EmailHelpersService.globalFormatter(EmailHelpersService.roundXDecimals(peatLandSumArea, 2));

        const wdpaAlerts: BaseAlertWithArea[] = results.data.filter((al: BaseAlertWithArea) => !!al.wdpa_protected_area__iucn_cat);
        const wdpaSumArea: number = wdpaAlerts.reduce((acc: number, curr: BaseAlertWithArea) => acc + curr.alert_area__ha, 0);
        resultObject.wdpa_ha_sum = EmailHelpersService.globalFormatter(EmailHelpersService.roundXDecimals(wdpaSumArea, 2));

        return resultObject as GladUpdatedNotification;
    }

    async transform(results: PresenterData<GladAllAlert>, subscription: ISubscription, layer: ILayer, begin: Date, end: Date): Promise<GladUpdatedNotification> {
        try {
            const resultObject: GladUpdatedNotification = this.buildResultObject(results, subscription, layer, begin, end);

            resultObject.downloadUrls = await GladAllService.getDownloadURLs(
                moment(begin).format('YYYY-MM-DD'),
                moment(end).format('YYYY-MM-DD'),
                subscription.params
            );

            resultObject.glad_alert_type = EmailHelpersService.translateAlertType('glad-all', subscription.language);

            logger.info('GLAD-ALL Results ', resultObject);
            return resultObject;
        } catch (err) {
            logger.error(err);
            throw err;
        }

    }

}

export default new GLADAllPresenter();
