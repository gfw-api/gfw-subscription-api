import { Moment } from 'moment';
import config from 'config';
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import logger from 'logger';

interface SparkpostMetricsResult {
    count_injected: number
    template_id: string
}

interface SparkpostMetricsResponse {
    results: SparkpostMetricsResult[]
}

class SparkpostService {

    static async requestMetricsForTemplate(date: Moment, regex: RegExp): Promise<number> {
        logger.debug(`Requesting metrics for regex "${regex}"`)
        const from: string = date.clone()
            .hours(0)
            .minutes(0)
            .seconds(0)
            .toISOString();

        const to: string = date.clone()
            .hours(23)
            .minutes(59)
            .seconds(59)
            .toISOString();

        const getUserDetailsRequestConfig: AxiosRequestConfig = {
            method: 'GET',
            baseURL: `https://api.sparkpost.com/api/v1`,
            url: `/metrics/deliverability/template?from=${from}&to=${to}&limit=10000&metrics=count_injected`,
            headers: {
                'authorization': config.get('sparkpost.apiKey')
            }
        };

        const response: AxiosResponse<SparkpostMetricsResponse> = await axios(getUserDetailsRequestConfig);
        const filtered: SparkpostMetricsResult[] = response.data.results.filter((result: SparkpostMetricsResult) => result.template_id.match(regex));
        const count: number = filtered.reduce((prev: number, acc: SparkpostMetricsResult) => prev + acc.count_injected, 0);
        logger.debug(`Sent email count for regex "${regex}": ${count}`);
        return count;
    }

}

export default SparkpostService;
