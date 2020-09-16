const config = require('config');
const request = require('request-promise-native');

class SparkpostService {

    static async requestMetricsForTemplate(date, regex) {
        const from = date.clone()
            .hours(0)
            .minutes(0)
            .seconds(0)
            .toISOString();

        const to = date.clone()
            .hours(23)
            .minutes(59)
            .seconds(59)
            .toISOString();

        const response = await request({
            uri: `https://api.sparkpost.com/api/v1/metrics/deliverability/template?from=${from}&to=${to}&limit=10000&metrics=count_injected`,
            method: 'GET',
            json: true,
            headers: { Authorization: config.get('sparkpost.apiKey') },
        });

        const filtered = response.results.filter((tmp) => tmp.template_id.match(regex));
        return filtered.reduce((prev, acc) => prev + acc.count_injected, 0);
    }

    static async getGLADCountInjectedOnDate(date) {
        return SparkpostService.requestMetricsForTemplate(date, /forest-change-notification-glads/g);
    }

    static async getVIIRSCountInjectedOnDate(date) {
        return SparkpostService.requestMetricsForTemplate(date, /forest-fires-notification-viirs/g);
    }

    static async getMonthlyCountInjectedOnDate(date) {
        return SparkpostService.requestMetricsForTemplate(date, /monthly-summary/g);
    }

}

module.exports = SparkpostService;
