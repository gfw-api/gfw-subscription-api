import logger from 'logger';
import moment, { Moment } from 'moment';

import AlertUrlService from 'services/alertUrlService';
import EmailHelpersService from 'services/emailHelpersService';
import UrlService from 'services/urlService';
import { ISubscription } from 'models/subscription';
import { AlertResultWithCount, PresenterInterface } from 'presenters/presenter.interface';
import { ILayer } from 'models/layer';
import config from 'config';
import GeostoreService from 'services/geostoreService';
import axios, { AxiosResponse } from 'axios';
import { ViirsPresenterResponse } from 'types/presenterResponse.type';
import { ViirsActiveFiresAlertResultType } from 'types/alertResult.type';
import AreaService from 'services/areaService';

class ViirsPresenter extends PresenterInterface<ViirsActiveFiresAlertResultType, ViirsPresenterResponse> {

    /**
     * Returns the URL that should be used to fetch alerts for a subscription related to an ISO.
     *
     * @param {string} startDate YYYY-MM-DD formatted date representing the start date of the period.
     * @param {string} endDate YYYY-MM-DD formatted date representing the end date of the period.
     * @param {Object} params Params containing the ISO info that should be used.
     *
     * @returns {string} The URL that should be used to fetch the alerts.
     */
    static #getURLInPeriodForISO(startDate: string, endDate: string, params: Record<string, any> = {}): string {
        const { country, region, subregion } = params.iso;
        let sql: string = `SELECT *
                           FROM data
                           WHERE alert__date > '${startDate}'
                             AND alert__date <= '${endDate}' `;

        if (country) {
            sql += `AND iso = '${country}' `;
        }

        if (region) {
            sql += `AND adm1 = ${region} `;
        }

        if (subregion) {
            sql += `AND adm2 = ${subregion} `;
        }

        sql += ' ORDER BY alert__date';

        return `/dataset/${config.get('datasets.viirsISODataset')}/latest/query?sql=${sql}`;
    }

    /**
     * Returns the URL that should be used to fetch alerts for a subscription related to a WDPA.
     *
     * @param {string} startDate YYYY-MM-DD formatted date representing the start date of the period.
     * @param {string} endDate YYYY-MM-DD formatted date representing the end date of the period.
     * @param {Object} params Params containing the WDPA info that should be used.
     *
     * @returns {string} The URL that should be used to fetch the alerts.
     */
    static #getURLInPeriodForWDPA(startDate: string, endDate: string, params: { wdpaid: string }): string {
        const { wdpaid }: { wdpaid: string } = params;
        let sql: string = `SELECT *
                           FROM data
                           WHERE alert__date > '${startDate}'
                             AND alert__date <= '${endDate}' `;
        sql += `AND wdpa_protected_area__id = '${wdpaid}'`;
        sql += ' ORDER BY alert__date';
        return `/dataset/${config.get('datasets.viirsWDPADataset')}/latest/query?sql=${sql}`;
    }

    /**
     * Returns the URL that should be used to fetch alerts for a subscription related to a geostore.
     *
     * @param {string} startDate YYYY-MM-DD formatted date representing the start date of the period.
     * @param {string} endDate YYYY-MM-DD formatted date representing the end date of the period.
     * @param {string} geostoreId The ID of the geostore.
     *
     * @returns {string} The URL that should be used to fetch the alerts.
     */
    static #getURLInPeriodForGeostore(startDate: string, endDate: string, geostoreId: string): string {
        const sql: string = `SELECT *
                             FROM data
                             WHERE alert__date > '${startDate}'
                               AND alert__date <= '${endDate}' `
            + `AND geostore__id = '${geostoreId}' ORDER BY alert__date`;
        return `/dataset/${config.get('datasets.viirsGeostoreDataset')}/latest/query?sql=${sql}`;
    }

    static getURLInPeriodForDownload(startDate: string, endDate: string, geostoreId: string, geostoreSource: 'gfw' | 'rw' = 'rw'): string {
        const sql: string = ViirsPresenter.#buildDownloadSQL(startDate, endDate);
        return `/dataset/${config.get('datasets.viirsDownloadDataset')}/latest/download/{format}?sql=${sql}&geostore_id=${geostoreId}&geostore_origin=${geostoreSource}`;
    }

    static #getAdminURLForDownload(startDate: string, endDate: string, params: Record<string, any>):string {
        const parseSimplifyGeom = (iso: string, id1: string, id2: string): number => {
            const bigCountries: string[] = ['USA', 'RUS', 'CAN', 'CHN', 'BRA', 'IDN'];
            const baseThresh: 0.1|0.005 = bigCountries.includes(iso) ? 0.1 : 0.005;
            if (iso && !id1 && !id2) {
                return baseThresh;
            }
            return id1 && !id2 ? baseThresh / 10 : baseThresh / 100;
        };

        const { country, region, subregion, source: { provider, version } } = params.iso;
        const simplify: number = parseSimplifyGeom(country, region, subregion);
        const sql: string = ViirsPresenter.#buildDownloadSQL(startDate, endDate);
        return `/dataset/${config.get('datasets.viirsDownloadDataset')}/latest/download_by_aoi/{format}?sql=${sql}` +
            '&aoi[type]=admin' +
            `&aoi[country]=${country}` +
            (region ? `&aoi[region]=${region}` : '') +
            (subregion ? `&aoi[subregion]=${subregion}` : '') +
            (provider ? `&aoi[provider]=${provider}`: '') +
            (version ? `&aoi[version]=${version}` : '') +
            (simplify ? `&aoi[simplify]=${simplify}` : '');
    }

    static #buildDownloadSQL(startDate: string, endDate: string): string {
        return `SELECT latitude, longitude, alert__date, confidence__cat, `
            + `is__ifl_intact_forest_landscape_2016 as in_intact_forest, is__umd_regional_primary_forest_2001 as in_primary_forest, `
            + `is__peatland as in_peat, CASE WHEN wdpa_protected_area__iucn_cat <> '' THEN 'True' ELSE 'False' END as in_protected_areas `
            + `FROM ${config.get('datasets.viirsDownloadDataset')} `
            + `WHERE alert__date > '${startDate}' AND alert__date <= '${endDate}'`;
    }

    /**
     * Returns the URL for the query for VIIRS alerts for the provided period (startDate to endDate). The params are
     * taken into account to decide which dataset will be used to fetch the alerts.
     *
     * @param startDate
     * @param endDate
     * @param params
     * @returns {Promise<*>}
     */
    static async getURLInPeriodForSubscription(startDate: string, endDate: string, params: Record<string, any>): Promise<string> {
        let areaIso: Record<string, any> = {};
        if (params?.area && params?.iso && params.iso?.country) {
            const area: Record<string, any> = await AreaService.getUserArea(params.area);
            areaIso = AreaService.getIsoParams(area);
        }

        const iso: Record<string, any> = Object.keys(areaIso).length && areaIso?.country ? areaIso : params.iso;
        
        const country: string = iso?.country;


        // At least country must be defined to use the ISO dataset
        if (country) {
            return ViirsPresenter.#getURLInPeriodForISO(startDate, endDate, { iso });
        }

        if (!!params && !!params.wdpaid) {
            return ViirsPresenter.#getURLInPeriodForWDPA(startDate, endDate, (params as { wdpaid: string }));
        }

        const geostoreId: string = await GeostoreService.getGeostoreIdFromSubscriptionParams(params);
        return ViirsPresenter.#getURLInPeriodForGeostore(startDate, endDate, geostoreId);
    }

    /**
     * Returns an array of GLAD alerts for the provided period (startDate to endDate). The params are
     * taken into account to decide which dataset will be used to fetch the alerts.
     *
     * @param startDate
     * @param endDate
     * @param params
     * @returns {Promise<*>}
     */
    async getAlertsForSubscription(startDate: string, endDate: string, params: Record<string, any>): Promise<ViirsActiveFiresAlertResultType[]> {
        logger.debug('[VIIRS] Entering analysis with params', startDate, endDate, params);
        const uri: string = await ViirsPresenter.getURLInPeriodForSubscription(startDate, endDate, params);
        logger.info(`[VIIRS] Preparing Data API request`);
        logger.debug(`[VIIRS] Preparing Data API request, with URL ${config.get('dataApi.url')}${uri}`);
        const response: AxiosResponse<Record<string, any>> = await axios.get(
            `${config.get('dataApi.url')}${uri}`,
            {
                headers: {
                    'x-api-key': config.get('dataApi.apiKey'),
                    origin: config.get('dataApi.origin'),
                }
            }
        );
        return response.data.data;
    }

    /**
     * Returns an array of GLAD alerts for the corresponding period of the last year for the dates provided (startDate to endDate).
     *
     * @param startDate
     * @param endDate
     * @param params
     * @returns {Promise<*>}
     */
    async getAnalysisSamePeriodLastYearForSubscription(startDate: Date, endDate: Date, params: Record<string, any>): Promise<ViirsActiveFiresAlertResultType[]> {
        const lastYearStartDate: Moment = moment(startDate).subtract('1', 'y');
        const lastYearEndDate: Moment = moment(endDate).subtract('1', 'y');
        return this.getAlertsForSubscription(
            lastYearStartDate.format('YYYY-MM-DD'),
            lastYearEndDate.format('YYYY-MM-DD'),
            params
        );
    }

    async getDownloadURLs(startDate: string, endDate: string, params: Record<string, any>): Promise<{ csv: string, json: string }> {
        let areaIso: Record<string, any> = {};
        let area: Record<string, any>;
        if (params?.area && params?.iso && params.iso?.country) {
            area = await AreaService.getUserArea(params.area);
           areaIso = AreaService.getIsoParams(area);
        }

        const iso: Record<string, any> = Object.keys(areaIso).length && areaIso?.country ? areaIso : params.iso;
        const updatedParams: Record<string, any> = {...params, iso};

        let uri: string;
        if (AreaService.areaIsAdminBoundary(area, { provider: 'gadm', version: '4.1' })) {
            uri = this.buildAdminURL(updatedParams, startDate, endDate);
        } else {
            uri = await this.buildGeostoreURL(area, updatedParams, startDate, endDate);
        }

        return {
            csv: `${config.get('dataApi.url')}${uri}`.replace('{format}', 'csv'),
            json: `${config.get('dataApi.url')}${uri}`.replace('{format}', 'json'),
        };
    }

    private async buildGeostoreURL(area: Record<string, any>, updatedParams: Record<string, any>, startDate: string, endDate: string): Promise<string> {
        const geostoreSource: 'gfw' | 'rw' = area ? AreaService.getGeostoreSource(area) : 'rw';
        const geostoreId: string = await GeostoreService.getGeostoreIdFromSubscriptionParams(updatedParams);
        return ViirsPresenter.getURLInPeriodForDownload(startDate, endDate, geostoreId, geostoreSource);
    }

    private buildAdminURL(params: Record<string, any>, startDate: string, endDate: string):string {
        return ViirsPresenter.#getAdminURLForDownload(startDate, endDate, params);
    }

    async transform(results: AlertResultWithCount<ViirsActiveFiresAlertResultType>, subscription: ISubscription, layer: ILayer, begin: Date, end: Date): Promise<ViirsPresenterResponse> {
        const resultObject: Partial<ViirsPresenterResponse> = { value: results.value };
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
            const alertCount: number = results.data.reduce((acc: number, curr: ViirsActiveFiresAlertResultType) => acc + curr.alert__count, 0);
            resultObject.viirs_count = alertCount;
            resultObject.alert_count = alertCount;

            // Add download URLs
            resultObject.downloadUrls = await this.getDownloadURLs(
                startDate.format('YYYY-MM-DD'),
                endDate.format('YYYY-MM-DD'),
                subscription.params
            );

            // Calculate alerts grouped by area types
            resultObject.priority_areas = EmailHelpersService.calculateVIIRSPriorityAreaValues(results.data, resultObject.alert_count);
            resultObject.formatted_alert_count = EmailHelpersService.formatAlertCount(resultObject.alert_count);
            resultObject.formatted_priority_areas = EmailHelpersService.formatPriorityAreas(resultObject.priority_areas);

            // Finding alerts for the same period last year and calculate frequency
            const lastYearAlerts: ViirsActiveFiresAlertResultType[] = await this.getAnalysisSamePeriodLastYearForSubscription(begin, end, subscription.params);
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
        return resultObject as ViirsPresenterResponse;
    }

}

export default new ViirsPresenter();
