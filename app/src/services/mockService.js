const MOCK_DATA = {
    'viirs-active-fires': {
        layerSlug: 'viirs-active-fires',
        alert_name: 'Brazil Alerts',
        selected_area: 'ISO Code: BRA',
        unsubscribe_url: 'http://www.globalforestwatch.org/unsubscribe_url',
        subscriptions_url: 'http://www.globalforestwatch.org/my-gfw/subscriptions',
        alert_link: 'http://www.globalforestwatch.org/map/3/0/0/BRA/grayscale/viirs_fires_alerts?begin=2017-08-20&end=2017-08-21&fit_to_geom=true',
        alert_date_begin: '2017-08-20',
        alert_date_end: '2017-08-21',
        alert_count: 9035,
        alerts: [{
            acq_date: '2017-08-20',
            acq_time: '04:24',
            latitude: -22.50847,
            longitude: -44.10447
        }],
        map_image: 'https://gfw2stories.s3.amazonaws.com/map_preview/b5f2e3e52e1412c003c787aa0f2007ce%3A1500987953812_-74.9882431030273%2C-34.7470817565917%2C-27.8472194671629%2C6.2648777961731.png',
    },
    story: {
        layerSlug: 'story',
        alert_name: 'Brazil Alerts',
        selected_area: 'ISO Code: BRA',
        unsubscribe_url: 'http://www.globalforestwatch.org/unsubscribe_url',
        subscriptions_url: 'http://www.globalforestwatch.org/my-gfw/subscriptions',
        alert_link: 'http://www.globalforestwatch.org/map/3/15.00/27.00/ALL/grayscale/none/580?tab=basemaps-tab',
        alert_date_begin: '2017-08-20',
        alert_date_end: '2017-08-21',
        alert_count: 25,
        stories: [{
            title: 'Murder in the Forest',
            // eslint-disable-next-line max-len
            description: 'Last updated in July 19, 2016 Last night I received the revolting news that Eusébio Ka’apor was cowardly murdered by loggers at Centro do Guilherme, Maranhão State, as a retaliation to the Ka’apor monitoring and surveillance, which resulted in the closure of all invasion roads at Alto Turiaçú Indigenous Territory',
            url: 'http://www.globalforestwatch.org/stories/425',
            image: 'http://gfw2stories.s3.amazonaws.com/uploads/14690228334704e26fbed5044e02012cf33c267c6f9bekaapor1.jpeg'
        }]
    },
    'terrai-alerts': {
        layerSlug: 'terrai-alerts',
        alert_name: 'Brazil Alerts',
        selected_area: 'ISO Code: BRA',
        unsubscribe_url: 'http://www.globalforestwatch.org/unsubscribe_url',
        subscriptions_url: 'http://www.globalforestwatch.org/my-gfw/subscriptions',
        alert_link: 'http://www.globalforestwatch.org/map/3/15.00/27.00/ALL/grayscale/terrailoss?tab=analysis-tab&begin=2017-01-20&end=2017-08-21',
        alert_date_begin: '2017-01-20',
        alert_date_end: '2017-08-21',
        alert_count: 9035,
        alerts: [{
            acq_date: '2017-08-20',
            acq_time: '04:24',
            latitude: -22.50847,
            longitude: -44.10447
        }],
        downloadUrls: {
            csv: 'http://www.globalforestwatch.org/alerts.csv',
            json: 'http://www.globalforestwatch.org/alerts.json'
        }
    },
    'glad-alerts': {
        layerSlug: 'glad-alerts',
        alert_name: 'Brazil Alerts',
        selected_area: 'ISO Code: BRA',
        unsubscribe_url: 'http://www.globalforestwatch.org/unsubscribe_url',
        subscriptions_url: 'http://www.globalforestwatch.org/my-gfw/subscriptions',
        alert_link: 'http://www.globalforestwatch.org/map/3/15.00/27.00/ALL/grayscale/umd_as_it_happens?tab=analysis-tab&begin=2017-01-20&end=2017-08-21',
        alert_date_begin: '2017-01-20',
        alert_date_end: '2017-08-21',
        alert_count: 9035,
        alerts: [{
            acq_date: '2017-08-20',
            acq_time: '04:24',
            latitude: -22.50847,
            longitude: -44.10447
        }],
        downloadUrls: {
            csv: 'http://www.globalforestwatch.org/alerts.csv',
            json: 'http://www.globalforestwatch.org/alerts.json'
        }
    },
    'guira-loss': {
        layerSlug: 'guira-loss',
        alert_name: 'Brazil Alerts',
        selected_area: 'ISO Code: BRA',
        unsubscribe_url: 'http://www.globalforestwatch.org/unsubscribe_url',
        subscriptions_url: 'http://www.globalforestwatch.org/my-gfw/subscriptions',
        alert_link: 'http://www.globalforestwatch.org/map/3/15.00/27.00/ALL/grayscale/guyra?tab=analysis-tab&begin=2011-09-01&end=2017-08-21',
        alert_date_begin: '2011-09-01',
        alert_date_end: '2017-08-21',
    },
    'umd-loss-gain': {
        layerSlug: 'umd-loss-gain',
        alert_name: 'Brazil Alerts',
        selected_area: 'ISO Code: BRA',
        unsubscribe_url: 'http://www.globalforestwatch.org/unsubscribe_url',
        subscriptions_url: 'http://www.globalforestwatch.org/my-gfw/subscriptions',
        alert_link: 'http://www.globalforestwatch.org/map/3/15.00/27.00/ALL/grayscale/loss,forestgain?tab=analysis-tab&begin=2001-01-01&end=2017-08-21&threshold=30',
        alert_date_begin: '2001-01-01',
        alert_date_end: '2017-08-21',
    },
    'prodes-loss': {
        layerSlug: 'prodes-loss',
        alert_name: 'Brazil Alerts',
        selected_area: 'ISO Code: BRA',
        unsubscribe_url: 'http://www.globalforestwatch.org/unsubscribe_url',
        subscriptions_url: 'http://www.globalforestwatch.org/my-gfw/subscriptions',
        alert_link: 'http://www.globalforestwatch.org/map/3/15.00/27.00/ALL/grayscale/prodes?tab=analysis-tab&begin=2001-01-01&end=2016-12-31',
        alert_date_begin: '2001-01-01',
        alert_date_end: '2016-12-31',
    }
};

class MockService {

    // eslint-disable-next-line class-methods-use-this
    getMock(slug) {
        return MOCK_DATA[slug] ? MOCK_DATA[slug] : MOCK_DATA['viirs-active-fires'];
    }

}

module.exports = new MockService();
