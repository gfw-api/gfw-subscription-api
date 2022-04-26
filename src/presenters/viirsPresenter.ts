import logger from 'logger';
import moment, { Moment } from 'moment';

import AlertUrlService from 'services/alertUrlService';
import ViirsAlertsService from 'services/gfw-data-api/viirsAlertsService';
import EmailHelpersService from 'services/emailHelpersService';
import UrlService from 'services/urlService';
import { ISubscription } from 'models/subscription';
import { PresenterData, PresenterInterface } from 'presenters/presenter.interface';
import { ILayer } from 'models/layer';
import { BaseAlert, ViirsActiveFiresAlert } from 'types/analysis.type';
import { ForestFiresNotification } from 'types/email.type';

class ViirsPresenter implements PresenterInterface<ViirsActiveFiresAlert> {

    async transform(results: PresenterData<ViirsActiveFiresAlert>, subscription: ISubscription, layer: ILayer, begin: Date, end: Date): Promise<ForestFiresNotification> {
        const resultObject: Partial<ForestFiresNotification> = { value: results.value };
        EmailHelpersService.updateMonthTranslations();
        moment.locale(subscription.language || 'en');

        try {
            const startDate: Moment = moment(begin);
            const endDate: Moment = moment(end);

            resultObject.month = startDate.format('MMMM');
            resultObject.year = startDate.format('YYYY');
            resultObject.week_of = `${startDate.format('DD MMM')}`;
            resultObject.week_start = startDate.format('DD/MM/YYYY');
            resultObject.week_end = endDate.format('DD/MM/YYYY');
            const alertCount: number = results.data.reduce((acc: number, curr: BaseAlert) => acc + curr.alert__count, 0)
            resultObject.viirs_count = alertCount;
            resultObject.alert_count = alertCount;

            // Add download URLs
            resultObject.downloadUrls = await ViirsAlertsService.getDownloadURLs(
                startDate.format('YYYY-MM-DD'),
                endDate.format('YYYY-MM-DD'),
                subscription.params
            );

            // Calculate alerts grouped by area types
            resultObject.priority_areas = EmailHelpersService.calculateVIIRSPriorityAreaValues(results.data, resultObject.alert_count);
            resultObject.formatted_alert_count = EmailHelpersService.formatAlertCount(resultObject.alert_count);
            resultObject.formatted_priority_areas = EmailHelpersService.formatPriorityAreas(resultObject.priority_areas);

            // Finding alerts for the same period last year and calculate frequency
            const lastYearAlerts: ViirsActiveFiresAlert[] = await ViirsAlertsService.getAnalysisSamePeriodLastYearForSubscription(begin, end, subscription.params);
            resultObject.viirs_frequency = await EmailHelpersService.calculateAlertFrequency(results.data, lastYearAlerts, subscription.language);

            // Set custom map and dashboard URLs
            resultObject.alert_link = AlertUrlService.generate(subscription, layer, begin, end);
            resultObject.dashboard_link = UrlService.dashboardUrl(subscription.id, subscription.language, 'fires');
            resultObject.map_url_intact_forest = AlertUrlService.generateIntactForestMapURL(subscription, layer, begin, end);
            resultObject.map_url_primary_forest = AlertUrlService.generatePrimaryForestMapURL(subscription, layer, begin, end);
            resultObject.map_url_peat = AlertUrlService.generatePeatMapURL(subscription, layer, begin, end);
            resultObject.map_url_wdpa = AlertUrlService.generateWDPAMapURL(subscription, layer, begin, end);

        } catch (err) {
            logger.error(err);
            throw err;
        }

        logger.info('VIIRS Active Fires results: ', results);
        return resultObject as ForestFiresNotification;
    }

}

export default new ViirsPresenter();
