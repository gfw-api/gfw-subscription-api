import nock from 'nock';


export const mockSparkpostMetricsCalls = (expectedData: Record<string, any> = {}) => nock('https://api.sparkpost.com:443')
    .get('/api/v1/metrics/deliverability/template')
    .query((query: Record<string, any>) => {
        return query?.limit === "10000" && query?.metrics === "count_injected"
    })
    .times(7)
    .reply(200, () => {
        const data: Record<string, any> = {
            ...expectedData
        }

        return {
            results: Object.keys(data).map((key: string) => ({
                count_injected: data[key],
                template_id: key
            }))
        }
    });



