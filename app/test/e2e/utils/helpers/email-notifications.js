const chai = require('chai');
const moment = require('moment');

const AlertUrlService = require('services/alertUrlService');
const Layer = require('models/layer');

const should = chai.should();

const bootstrapEmailNotificationTests = (amount = '1', unit = 'w') => {
    const beginDate = moment().subtract(amount, unit);
    const endDate = moment();
    process.on('unhandledRejection', (error) => should.fail(error));
    return { beginDate, endDate };
};

const validateCommonNotificationParams = (jsonMessage, beginDate, endDate, sub) => {
    jsonMessage.should.have.property('sender').and.equal('gfw');
    jsonMessage.should.have.property('data').and.be.a('object');
    jsonMessage.should.have.property('recipients').and.be.a('array').and.length(1);
    jsonMessage.recipients[0].should.be.an('object')
        .and.have.property('address')
        .and.have.property('email')
        .and.equal('subscription-recipient@vizzuality.com');

    jsonMessage.data.should.have.property('month').and.equal(beginDate.format('MMMM'));
    jsonMessage.data.should.have.property('year').and.equal(beginDate.format('YYYY'));
    jsonMessage.data.should.have.property('week_of').and.equal(`${beginDate.format('DD MMM')}`);
    jsonMessage.data.should.have.property('week_start').and.equal(beginDate.format('DD/MM/YYYY'));
    jsonMessage.data.should.have.property('week_end').and.equal(endDate.format('DD/MM/YYYY'));
    jsonMessage.data.should.have.property('alert_date_begin').and.equal(moment(beginDate).format('YYYY-MM-DD'));
    jsonMessage.data.should.have.property('alert_date_end').and.equal(moment(endDate).format('YYYY-MM-DD'));
    jsonMessage.data.should.have.property('alert_name').and.equal(sub.name);
    jsonMessage.data.should.have.property('subscriptions_url').and.equal(`http://staging.globalforestwatch.org/my-gfw?lang=${sub.language}`);
    jsonMessage.data.should.have.property('unsubscribe_url').and.equal(`${process.env.API_GATEWAY_EXTERNAL_URL}/subscriptions/${sub.id}/unsubscribe?redirect=true&lang=${sub.language}`);
};

const validateGLADAlertsAndPriorityAreas = (jsonMessage, beginDate, endDate, sub, priorityOverride = {}) => {
    jsonMessage.data.should.have.property('layerSlug').and.equal('glad-alerts');

    // Validate download URLs
    jsonMessage.data.should.have.property('downloadUrls').and.be.an('object');
    jsonMessage.data.downloadUrls.should.have.property('csv')
        .and.be.a('string')
        .and.match(/.*\/download\/csv.*$/);

    jsonMessage.data.downloadUrls.should.have.property('json')
        .and.be.a('string')
        .and.match(/.*\/download\/json.*$/);

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
        beginDate,
        endDate,
    ));

    jsonMessage.data.should.have.property('dashboard_link')
        .and.contain(`http://staging.globalforestwatch.org/dashboards/aoi/${sub.id}`)
        .and.contain(`lang=${sub.language}`)
        .and.contain(`category=forest-change`)
        .and.contain(`utm_campaign=ForestChangeAlert`);
};

const validateVIIRSAlertsAndPriorityAreas = (jsonMessage, beginDate, endDate, sub, priorityOverride = {}) => {
    jsonMessage.data.should.have.property('layerSlug').and.equal('viirs-active-fires');

    // Validate download URLs
    jsonMessage.data.should.have.property('downloadUrls').and.be.an('object');
    jsonMessage.data.downloadUrls.should.have.property('csv')
        .and.be.a('string')
        .and.match(/.*\/download\/csv.*$/);

    jsonMessage.data.downloadUrls.should.have.property('json')
        .and.be.a('string')
        .and.match(/.*\/download\/json.*$/);

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
        beginDate,
        endDate,
    ));

    jsonMessage.data.should.have.property('dashboard_link')
        .and.contain(`http://staging.globalforestwatch.org/dashboards/aoi/${sub.id}`)
        .and.contain(`lang=${sub.language}`)
        .and.contain(`category=fires`)
        .and.contain(`utm_campaign=FireAlert`);
};

const validateMonthlySummaryAlertsAndPriorityAreas = (jsonMessage, beginDate, endDate, sub, priorityOverride = {}) => {
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
    ], beginDate, endDate));

    jsonMessage.data.should.have.property('viirs_days_count').and.equal(endDate.diff(beginDate, 'days'));
    jsonMessage.data.should.have.property('viirs_day_start').and.equal(beginDate.format('DD/MM/YYYY'));
    jsonMessage.data.should.have.property('viirs_day_end').and.equal(endDate.format('DD/MM/YYYY'));
    jsonMessage.data.should.have.property('location').and.equal(sub.name);

    jsonMessage.data.should.have.property('dashboard_link')
        .and.contain(`http://staging.globalforestwatch.org/dashboards/aoi/${sub.id}`)
        .and.contain(`lang=${sub.language}`)
        .and.contain(`category=forest-change`)
        .and.contain(`utm_campaign=MonthlyAlertSummary`);
};

const validateGLADSpecificParams = (jsonMessage, beginDate, endDate, sub, frequency) => {
    jsonMessage.data.should.have.property('glad_frequency').and.equal(frequency);
    jsonMessage.data.should.have.property('glad_count').and.equal(100);
};

const validateVIIRSSpecificParams = (jsonMessage, beginDate, endDate, sub, frequency) => {
    jsonMessage.data.should.have.property('viirs_frequency').and.equal(frequency);
    jsonMessage.data.should.have.property('viirs_count').and.equal(100);
};

module.exports = {
    bootstrapEmailNotificationTests,
    validateCommonNotificationParams,
    validateGLADSpecificParams,
    validateGLADAlertsAndPriorityAreas,
    validateVIIRSSpecificParams,
    validateVIIRSAlertsAndPriorityAreas,
    validateMonthlySummaryAlertsAndPriorityAreas,
};
