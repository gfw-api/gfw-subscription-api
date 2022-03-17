import chai from 'chai';
import config from 'config';
import moment, { DurationInputArg1, DurationInputArg2, Moment } from 'moment';

import AlertUrlService from 'services/alertUrlService';
import EmailHelpersService from 'services/emailHelpersService';
import Layer from 'models/layer';
import { ISubscription } from 'models/subscription';

const should = chai.should();

export const bootstrapEmailNotificationTests = (amount: DurationInputArg1 = '1', unit: DurationInputArg2 = 'w') => {
    const beginDate: Moment = moment().subtract(amount, unit);
    const endDate = moment();
    process.on('unhandledRejection', (error) => should.fail(error.toString()));
    return { beginDate, endDate };
};

export const validateCommonNotificationParams = (jsonMessage: Record<string, any>, beginDate: Moment, endDate: Moment, sub: ISubscription) => {
    jsonMessage.should.have.property('sender').and.equal('gfw');
    jsonMessage.should.have.property('data').and.be.a('object');
    jsonMessage.should.have.property('recipients').and.be.a('array').and.length(1);
    jsonMessage.recipients[0].should.be.an('object')
        .and.have.property('address')
        .and.equal('subscription-recipient@vizzuality.com');

    jsonMessage.data.should.have.property('month').and.equal(beginDate.format('MMMM'));
    jsonMessage.data.should.have.property('year').and.equal(beginDate.format('YYYY'));
    jsonMessage.data.should.have.property('week_of').and.equal(`${beginDate.format('DD MMM')}`);
    jsonMessage.data.should.have.property('week_start').and.equal(beginDate.format('DD/MM/YYYY'));
    jsonMessage.data.should.have.property('week_end').and.equal(endDate.format('DD/MM/YYYY'));
    jsonMessage.data.should.have.property('alert_date_begin').and.equal(moment(beginDate).format('YYYY-MM-DD'));
    jsonMessage.data.should.have.property('alert_date_end').and.equal(moment(endDate).format('YYYY-MM-DD'));
    jsonMessage.data.should.have.property('alert_name').and.equal(sub.name);
    jsonMessage.data.should.have.property('subscriptions_url', `${config.get('gfw.flagshipUrl')}/my-gfw?lang=${sub.language}`);
    jsonMessage.data.should.have.property('unsubscribe_url', `${process.env.API_GATEWAY_EXTERNAL_URL}/subscriptions/${sub.id}/unsubscribe?redirect=true&lang=${sub.language}`);

    // New Help Center URLs, including language
    jsonMessage.data.should.have.property('help_center_url_manage_areas', `${config.get('gfw.flagshipUrl')}/help/map/guides/manage-saved-areas?lang=${sub.language}`);
    jsonMessage.data.should.have.property('help_center_url_save_more_areas', `${config.get('gfw.flagshipUrl')}/help/map/guides/save-area-subscribe-forest-change-notifications?lang=${sub.language}`);
    jsonMessage.data.should.have.property('help_center_url_investigate_alerts', `${config.get('gfw.flagshipUrl')}/help/map/guides/investigate-forest-change-satellite-imagery?lang=${sub.language}`);
};

export const validateGLADAlertsAndPriorityAreas = (jsonMessage: Record<string, any>, beginDate: Moment, endDate: Moment, sub: ISubscription, priorityOverride = {}) => {
    jsonMessage.data.should.have.property('layerSlug').and.equal('glad-alerts');

    // Validate download URLs
    jsonMessage.data.should.have.property('downloadUrls').and.be.an('object');
    jsonMessage.data.downloadUrls.should.have.property('csv')
        .and.be.a('string')
        .and.contain(config.get('dataApi.url'))
        .and.contain(config.get('datasets.gladDownloadDataset'))
        .and.contain('download/csv')
        .and.contain('SELECT latitude, longitude, umd_glad_landsat_alerts__date, umd_glad_landsat_alerts__confidence')
        .and.contain(', is__ifl_intact_forest_landscapes as in_intact_forest, is__umd_regional_primary_forest_2001 as in_primary_forest')
        .and.contain(', is__gfw_peatlands as in_peat, is__wdpa_protected_areas as in_protected_areas')
        .and.contain(`FROM ${config.get('datasets.gladDownloadDataset')}`)
        .and.contain('&geostore_id=')
        .and.contain('&geostore_origin=rw');

    jsonMessage.data.downloadUrls.should.have.property('json')
        .and.be.a('string')
        .and.contain(config.get('dataApi.url'))
        .and.contain(config.get('datasets.gladDownloadDataset'))
        .and.contain('download/json')
        .and.contain('SELECT latitude, longitude, umd_glad_landsat_alerts__date, umd_glad_landsat_alerts__confidence')
        .and.contain(', is__ifl_intact_forest_landscapes as in_intact_forest, is__umd_regional_primary_forest_2001 as in_primary_forest')
        .and.contain(', is__gfw_peatlands as in_peat, is__wdpa_protected_areas as in_protected_areas')
        .and.contain(`FROM ${config.get('datasets.gladDownloadDataset')}`)
        .and.contain('&geostore_id=')
        .and.contain('&geostore_origin=rw');

    const priorityAreas = {
        intact_forest: 0,
        primary_forest: 0,
        peat: 0,
        protected_areas: 50,
        plantations: 0,
        other: 50,
        ...priorityOverride,
    };

    jsonMessage.data.should.have.property('priority_areas').and.deep.equal(priorityAreas);
    jsonMessage.data.should.have.property('alert_count').and.equal(100);
    jsonMessage.data.should.have.property('value').and.equal(100);
    jsonMessage.data.should.have.property('alert_link').and.equal(AlertUrlService.generate(
        sub,
        {
            name: 'umd_as_it_happens',
            slug: 'glad-alerts',
            subscription: true,
            datasetId: 'bfd1d211-8106-4393-86c3-9e1ab2ee1b9b',
            layerId: '8e4a527d-1bcd-4a12-82b0-5a108ffec452'
        },
        beginDate.toDate(),
        endDate.toDate(),
    ));

    jsonMessage.data.should.have.property('dashboard_link')
        .and.contain(`${config.get('gfw.flagshipUrl')}/dashboards/aoi/${sub.id}`)
        .and.contain(`lang=${sub.language}`)
        .and.contain(`category=forest-change`)
        .and.contain(`utm_campaign=ForestChangeAlert`);
};

export const validateVIIRSAlertsAndPriorityAreas = (jsonMessage: Record<string, any>, beginDate: Moment, endDate: Moment, sub: ISubscription, priorityOverride = {}) => {
    jsonMessage.data.should.have.property('layerSlug').and.equal('viirs-active-fires');

    // Validate download URLs
    jsonMessage.data.should.have.property('downloadUrls').and.be.an('object');
    jsonMessage.data.downloadUrls.should.have.property('csv')
        .and.be.a('string')
        .and.contain(config.get('dataApi.url'))
        .and.contain(config.get('datasets.viirsDownloadDataset'))
        .and.contain('download/csv')
        .and.contain('SELECT latitude, longitude, alert__date, confidence__cat')
        .and.contain(', is__ifl_intact_forest_landscape_2016 as in_intact_forest, is__umd_regional_primary_forest_2001 as in_primary_forest')
        .and.contain(', is__peatland as in_peat, CASE WHEN wdpa_protected_area__iucn_cat <> \'\' THEN \'True\' ELSE \'False\' END as in_protected_areas')
        .and.contain(`FROM ${config.get('datasets.viirsDownloadDataset')}`)
        .and.contain('&geostore_id=')
        .and.contain('&geostore_origin=rw');

    jsonMessage.data.downloadUrls.should.have.property('json')
        .and.be.a('string')
        .and.contain(config.get('dataApi.url'))
        .and.contain(config.get('datasets.viirsDownloadDataset'))
        .and.contain('download/json')
        .and.contain('SELECT latitude, longitude, alert__date, confidence__cat')
        .and.contain(', is__ifl_intact_forest_landscape_2016 as in_intact_forest, is__umd_regional_primary_forest_2001 as in_primary_forest')
        .and.contain(', is__peatland as in_peat, CASE WHEN wdpa_protected_area__iucn_cat <> \'\' THEN \'True\' ELSE \'False\' END as in_protected_areas')
        .and.contain(`FROM ${config.get('datasets.viirsDownloadDataset')}`)
        .and.contain('&geostore_id=')
        .and.contain('&geostore_origin=rw');

    const priorityAreas = {
        intact_forest: 0,
        primary_forest: 0,
        peat: 0,
        protected_areas: 50,
        plantations: 0,
        other: 50,
        ...priorityOverride,
    };

    jsonMessage.data.should.have.property('priority_areas').and.deep.equal(priorityAreas);
    jsonMessage.data.should.have.property('value').and.equal(100);
    jsonMessage.data.should.have.property('alert_count').and.equal(100);
    jsonMessage.data.should.have.property('alert_link').and.equal(AlertUrlService.generate(
        sub,
        {
            name: 'viirs_fires_alerts',
            slug: 'viirs-active-fires',
            subscription: true,
            datasetId: 'fire-alerts-viirs',
            layerId: 'fire-alerts-viirs'
        },
        beginDate.toDate(),
        endDate.toDate(),
    ));

    jsonMessage.data.should.have.property('dashboard_link')
        .and.contain(`${config.get('gfw.flagshipUrl')}/dashboards/aoi/${sub.id}`)
        .and.contain(`lang=${sub.language}`)
        .and.contain(`category=fires`)
        .and.contain(`utm_campaign=FireAlert`);
};

export const validateMonthlySummaryAlertsAndPriorityAreas = (jsonMessage: Record<string, any>, beginDate: Moment, endDate: Moment, sub: ISubscription, priorityOverride = {}) => {
    const priorityAreas = {
        intact_forest: 0,
        primary_forest: 0,
        peat: 0,
        protected_areas: 50,
        plantations: 0,
        other: 50,
        ...priorityOverride,
    };

    jsonMessage.data.should.have.property('layerSlug').and.equal('monthly-summary');
    jsonMessage.data.should.have.property('priority_areas').and.deep.equal(priorityAreas);
    jsonMessage.data.should.have.property('alert_count').and.equal(200);
    jsonMessage.data.should.have.property('value').and.equal(200);

    jsonMessage.data.should.have.property('alert_link').and.equal(AlertUrlService.generateForManyLayers(sub, [
        Layer.findBySlug('glad-alerts'),
        Layer.findBySlug('viirs-active-fires'),
    ], beginDate.toDate(), endDate.toDate()));

    jsonMessage.data.should.have.property('viirs_days_count').and.equal(endDate.diff(beginDate, 'days'));
    jsonMessage.data.should.have.property('viirs_day_start').and.equal(beginDate.format('DD/MM/YYYY'));
    jsonMessage.data.should.have.property('viirs_day_end').and.equal(endDate.format('DD/MM/YYYY'));
    jsonMessage.data.should.have.property('location').and.equal(sub.name);

    jsonMessage.data.should.have.property('dashboard_link')
        .and.contain(`${config.get('gfw.flagshipUrl')}/dashboards/aoi/${sub.id}`)
        .and.contain(`lang=${sub.language}`)
        .and.contain(`category=forest-change`)
        .and.contain(`utm_campaign=MonthlyAlertSummary`);
};

export const validateGLADSpecificParams = (jsonMessage: Record<string, any>, beginDate: Moment, endDate: Moment, sub: ISubscription, frequency: string) => {
    jsonMessage.data.should.have.property('glad_frequency').and.equal(frequency);
    jsonMessage.data.should.have.property('glad_count').and.equal(100);
};

export const validateVIIRSSpecificParams = (jsonMessage: Record<string, any>, beginDate: Moment, endDate: Moment, sub: ISubscription, frequency: string) => {
    jsonMessage.data.should.have.property('viirs_frequency').and.equal(frequency);
    jsonMessage.data.should.have.property('viirs_count').and.equal(100);
};

export const validateCustomMapURLs = (jsonMessage: Record<string, any>) => {
    // Validate custom map URLs are present
    jsonMessage.data.should.have.property('map_url_intact_forest');
    jsonMessage.data.should.have.property('map_url_primary_forest');
    jsonMessage.data.should.have.property('map_url_peat');
    jsonMessage.data.should.have.property('map_url_wdpa');

    const validateBasemap = (mapData: Record<string, any>) => {
        mapData.should.have.property('basemap').and.be.an('object');
        mapData.basemap.should.have.property('value', 'planet');
        mapData.basemap.should.have.property('color', '');
        mapData.basemap.should.have.property('name', 'latest');
        mapData.basemap.should.have.property('imageType', 'analytic');
    };

    // Validate intact forest URL
    const ifURL = new URL(jsonMessage.data.map_url_intact_forest);
    const ifMapData = JSON.parse(Buffer.from(ifURL.searchParams.get('map'), 'base64').toString());
    ifMapData.datasets.find((el: { dataset: string }) => el.dataset === 'intact-forest-landscapes').should.deep.equal(AlertUrlService.getIntactForestDataset());
    validateBasemap(ifMapData);

    // Validate primary forest URL
    const pfURL = new URL(jsonMessage.data.map_url_primary_forest);
    const pfMapData = JSON.parse(Buffer.from(pfURL.searchParams.get('map'), 'base64').toString());
    pfMapData.datasets.find((el: { dataset: string }) => el.dataset === 'primary-forests').should.deep.equal(AlertUrlService.getPrimaryForestDataset());
    validateBasemap(pfMapData);

    // Validate peatlands URL
    const peatlandsURL = new URL(jsonMessage.data.map_url_peat);
    const peatMapData = JSON.parse(Buffer.from(peatlandsURL.searchParams.get('map'), 'base64').toString());
    peatMapData.datasets.find((el: { dataset: string }) => el.dataset === 'malaysia-peat-lands').should.deep.equal(AlertUrlService.getPeatlandsDatasets()[0]);
    peatMapData.datasets.find((el: { dataset: string }) => el.dataset === 'indonesia-forest-moratorium').should.deep.equal(AlertUrlService.getPeatlandsDatasets()[1]);
    peatMapData.datasets.find((el: { dataset: string }) => el.dataset === 'indonesia-peat-lands').should.deep.equal(AlertUrlService.getPeatlandsDatasets()[2]);
    validateBasemap(peatMapData);

    // Validate WDPA URL
    const wdpaQuery = new URL(jsonMessage.data.map_url_wdpa);
    const wdpaMapData = JSON.parse(Buffer.from(wdpaQuery.searchParams.get('map'), 'base64').toString());
    wdpaMapData.datasets.find((el: { dataset: string }) => el.dataset === 'wdpa-protected-areas').should.deep.equal(AlertUrlService.getWDPADataset());
    validateBasemap(wdpaMapData);
};

export const validateGladAll = (
    jsonMessage: Record<string, any>,
    sub: ISubscription,
    beginDate: Moment,
    endDate: Moment,
    {
        total, area, intactForestArea, primaryForestArea, peatArea, wdpaArea, lang = 'en'
    }: {
        total: number, area: string, intactForestArea: string, primaryForestArea: string, peatArea: string, wdpaArea: string, lang: string
    }
) => {
    jsonMessage.data.should.have.property('glad_count', total);

    // Validate download URLs
    jsonMessage.data.should.have.property('downloadUrls').and.be.an('object');
    jsonMessage.data.downloadUrls.should.have.property('csv')
        .and.be.a('string')
        .and.contain(config.get('dataApi.url'))
        .and.contain('/dataset/gfw_integrated_alerts/latest/download/csv')
        .and.contain('SELECT latitude, longitude, gfw_integrated_alerts__date, umd_glad_landsat_alerts__confidence, umd_glad_sentinel2_alerts__confidence, wur_radd_alerts__confidence, gfw_integrated_alerts__confidence')
        .and.contain('&geostore_id=')
        .and.contain('&geostore_origin=rw');

    jsonMessage.data.downloadUrls.should.have.property('json')
        .and.be.a('string')
        .and.contain(config.get('dataApi.url'))
        .and.contain('/dataset/gfw_integrated_alerts/latest/download/json')
        .and.contain('SELECT latitude, longitude, gfw_integrated_alerts__date, umd_glad_landsat_alerts__confidence, umd_glad_sentinel2_alerts__confidence, wur_radd_alerts__confidence, gfw_integrated_alerts__confidence')
        .and.contain('&geostore_id=')
        .and.contain('&geostore_origin=rw');

    jsonMessage.data.should.have.property('alert_count').and.equal(total);
    jsonMessage.data.should.have.property('value').and.equal(total);
    jsonMessage.data.should.have.property('alert_link').and.equal(AlertUrlService.generate(
        sub,
        {
            name: 'umd_as_it_happens',
            slug: 'glad-alerts',
            subscription: true,
            datasetId: 'bfd1d211-8106-4393-86c3-9e1ab2ee1b9b',
            layerId: '8e4a527d-1bcd-4a12-82b0-5a108ffec452'
        },
        beginDate.toDate(),
        endDate.toDate(),
    ));

    jsonMessage.data.should.have.property('dashboard_link')
        .and.contain(`${config.get('gfw.flagshipUrl')}/dashboards/aoi/${sub.id}`)
        .and.contain(`lang=${lang}`)
        .and.contain(`category=forest-change`)
        .and.contain(`utm_campaign=ForestChangeAlert`);

    jsonMessage.data.should.have.property('area_ha_sum', area);
    jsonMessage.data.should.have.property('intact_forest_ha_sum', intactForestArea);
    jsonMessage.data.should.have.property('primary_forest_ha_sum', primaryForestArea);
    jsonMessage.data.should.have.property('peat_ha_sum', peatArea);
    jsonMessage.data.should.have.property('wdpa_ha_sum', wdpaArea);
    jsonMessage.data.should.have.property('glad_alert_type', EmailHelpersService.translateAlertType('glad-all', lang));
};

export const validateGladL = (
    jsonMessage: Record<string, any>,
    sub: ISubscription,
    beginDate: Moment,
    endDate: Moment,
    {
        total, area, intactForestArea, primaryForestArea, peatArea, wdpaArea, lang = 'en'
    }: {
        total: number, area: string, intactForestArea: string, primaryForestArea: string, peatArea: string, wdpaArea: string, lang: string
    }
) => {
    jsonMessage.data.should.have.property('glad_count', total);

    // Validate download URLs
    jsonMessage.data.should.have.property('downloadUrls').and.be.an('object');
    jsonMessage.data.downloadUrls.should.have.property('csv')
        .and.be.a('string')
        .and.contain(config.get('dataApi.url'))
        .and.contain('/dataset/umd_glad_landsat_alerts/latest/download/csv')
        .and.contain('SELECT latitude, longitude, umd_glad_landsat_alerts__date, umd_glad_landsat_alerts__confidence')
        .and.contain('&geostore_id=')
        .and.contain('&geostore_origin=rw');

    jsonMessage.data.downloadUrls.should.have.property('json')
        .and.be.a('string')
        .and.contain(config.get('dataApi.url'))
        .and.contain('/dataset/umd_glad_landsat_alerts/latest/download/json')
        .and.contain('SELECT latitude, longitude, umd_glad_landsat_alerts__date, umd_glad_landsat_alerts__confidence')
        .and.contain('&geostore_id=')
        .and.contain('&geostore_origin=rw');

    jsonMessage.data.should.have.property('alert_count').and.equal(total);
    jsonMessage.data.should.have.property('value').and.equal(total);
    jsonMessage.data.should.have.property('alert_link').and.equal(AlertUrlService.generate(
        sub,
        {
            name: 'umd_as_it_happens',
            slug: 'glad-alerts',
            subscription: true,
            datasetId: 'bfd1d211-8106-4393-86c3-9e1ab2ee1b9b',
            layerId: '8e4a527d-1bcd-4a12-82b0-5a108ffec452'
        },
        beginDate.toDate(),
        endDate.toDate(),
    ));

    jsonMessage.data.should.have.property('dashboard_link')
        .and.contain(`${config.get('gfw.flagshipUrl')}/dashboards/aoi/${sub.id}`)
        .and.contain(`lang=${sub.language}`)
        .and.contain(`category=forest-change`)
        .and.contain(`utm_campaign=ForestChangeAlert`);

    jsonMessage.data.should.have.property('area_ha_sum', area);
    jsonMessage.data.should.have.property('intact_forest_ha_sum', intactForestArea);
    jsonMessage.data.should.have.property('primary_forest_ha_sum', primaryForestArea);
    jsonMessage.data.should.have.property('peat_ha_sum', peatArea);
    jsonMessage.data.should.have.property('wdpa_ha_sum', wdpaArea);
    jsonMessage.data.should.have.property('glad_alert_type', EmailHelpersService.translateAlertType('glad-l', lang));
};

export const validateGladS2 = (
    jsonMessage: Record<string, any>,
    sub: ISubscription,
    beginDate: Moment,
    endDate: Moment,
    {
        total, area, intactForestArea, primaryForestArea, peatArea, wdpaArea, lang = 'en'
    }: {
        total: number, area: string, intactForestArea: string, primaryForestArea: string, peatArea: string, wdpaArea: string, lang: string
    }
) => {
    jsonMessage.data.should.have.property('glad_count', total);

    // Validate download URLs
    jsonMessage.data.should.have.property('downloadUrls').and.be.an('object');
    jsonMessage.data.downloadUrls.should.have.property('csv')
        .and.be.a('string')
        .and.contain(config.get('dataApi.url'))
        .and.contain('/dataset/gfw_integrated_alerts/latest/download/csv')
        .and.contain('SELECT latitude, longitude, umd_glad_sentinel2_alerts__date, umd_glad_sentinel2_alerts__confidence')
        .and.contain('&geostore_id=')
        .and.contain('&geostore_origin=rw');

    jsonMessage.data.downloadUrls.should.have.property('json')
        .and.be.a('string')
        .and.contain(config.get('dataApi.url'))
        .and.contain('/dataset/gfw_integrated_alerts/latest/download/json')
        .and.contain('SELECT latitude, longitude, umd_glad_sentinel2_alerts__date, umd_glad_sentinel2_alerts__confidence')
        .and.contain('&geostore_id=')
        .and.contain('&geostore_origin=rw');

    jsonMessage.data.should.have.property('alert_count').and.equal(total);
    jsonMessage.data.should.have.property('value').and.equal(total);
    jsonMessage.data.should.have.property('alert_link').and.equal(AlertUrlService.generate(
        sub,
        {
            name: 'umd_as_it_happens',
            slug: 'glad-alerts',
            subscription: true,
            datasetId: 'bfd1d211-8106-4393-86c3-9e1ab2ee1b9b',
            layerId: '8e4a527d-1bcd-4a12-82b0-5a108ffec452'
        },
        beginDate.toDate(),
        endDate.toDate(),
    ));

    jsonMessage.data.should.have.property('dashboard_link')
        .and.contain(`${config.get('gfw.flagshipUrl')}/dashboards/aoi/${sub.id}`)
        .and.contain(`lang=en`)
        .and.contain(`category=forest-change`)
        .and.contain(`utm_campaign=ForestChangeAlert`);

    jsonMessage.data.should.have.property('area_ha_sum', area);
    jsonMessage.data.should.have.property('intact_forest_ha_sum', intactForestArea);
    jsonMessage.data.should.have.property('primary_forest_ha_sum', primaryForestArea);
    jsonMessage.data.should.have.property('peat_ha_sum', peatArea);
    jsonMessage.data.should.have.property('wdpa_ha_sum', wdpaArea);
    jsonMessage.data.should.have.property('glad_alert_type', EmailHelpersService.translateAlertType('glad-s2', lang));
};

export const validateGladRadd = (
    jsonMessage: Record<string, any>,
    sub: ISubscription,
    beginDate: Moment,
    endDate: Moment,
    {
        total, area, intactForestArea, primaryForestArea, peatArea, wdpaArea, lang = 'en'
    }: {
        total: number, area: string, intactForestArea: string, primaryForestArea: string, peatArea: string, wdpaArea: string, lang: string
    }
) => {
    jsonMessage.data.should.have.property('glad_count', total);

    // Validate download URLs
    jsonMessage.data.should.have.property('downloadUrls').and.be.an('object');
    jsonMessage.data.downloadUrls.should.have.property('csv')
        .and.be.a('string')
        .and.contain(config.get('dataApi.url'))
        .and.contain('/dataset/gfw_integrated_alerts/latest/download/csv')
        .and.contain('SELECT latitude, longitude, wur_radd_alerts__date, wur_radd_alerts__confidence')
        .and.contain('&geostore_id=')
        .and.contain('&geostore_origin=rw');

    jsonMessage.data.downloadUrls.should.have.property('json')
        .and.be.a('string')
        .and.contain(config.get('dataApi.url'))
        .and.contain('/dataset/gfw_integrated_alerts/latest/download/json')
        .and.contain('SELECT latitude, longitude, wur_radd_alerts__date, wur_radd_alerts__confidence')
        .and.contain('&geostore_id=')
        .and.contain('&geostore_origin=rw');

    jsonMessage.data.should.have.property('alert_count').and.equal(total);
    jsonMessage.data.should.have.property('value').and.equal(total);
    jsonMessage.data.should.have.property('alert_link').and.equal(AlertUrlService.generate(
        sub,
        {
            name: 'umd_as_it_happens',
            slug: 'glad-alerts',
            subscription: true,
            datasetId: 'bfd1d211-8106-4393-86c3-9e1ab2ee1b9b',
            layerId: '8e4a527d-1bcd-4a12-82b0-5a108ffec452'
        },
        beginDate.toDate(),
        endDate.toDate(),
    ));

    jsonMessage.data.should.have.property('dashboard_link')
        .and.contain(`${config.get('gfw.flagshipUrl')}/dashboards/aoi/${sub.id}`)
        .and.contain(`lang=en`)
        .and.contain(`category=forest-change`)
        .and.contain(`utm_campaign=ForestChangeAlert`);

    jsonMessage.data.should.have.property('area_ha_sum', area);
    jsonMessage.data.should.have.property('intact_forest_ha_sum', intactForestArea);
    jsonMessage.data.should.have.property('primary_forest_ha_sum', primaryForestArea);
    jsonMessage.data.should.have.property('peat_ha_sum', peatArea);
    jsonMessage.data.should.have.property('wdpa_ha_sum', wdpaArea);
    jsonMessage.data.should.have.property('glad_alert_type', EmailHelpersService.translateAlertType('glad-radd', lang));
};
