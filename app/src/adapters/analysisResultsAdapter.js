const _ = require('lodash');

const GENERIC_ADAPTER = require('adapters/genericAdapter');
const MonthlySummaryAdapter = require('adapters/monthlySummaryAdapter');

const ADAPTER_OVERRIDE_MAP = {
    'monthly-summary': MonthlySummaryAdapter,
};

class AnalysisResultsAdapter {

    static transform(results, layer) {
        const Adapter = ADAPTER_OVERRIDE_MAP[layer.slug] || GENERIC_ADAPTER;
        const adapter = new Adapter(results);

        return adapter.transform();
    }

    static isZero(results) {
        if (_.isArray(results.value)) {
            return _.filter(
                results.value,
                (n) => {
                    if (_.isObject(n)) {
                        return n.value > 0;
                    }
                    return n > 0;
                }
            ).length === 0;
        }
        return !results.value;

    }

}

module.exports = AnalysisResultsAdapter;
