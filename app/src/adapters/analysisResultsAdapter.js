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

}

module.exports = AnalysisResultsAdapter;
