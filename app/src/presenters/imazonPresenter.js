'use strict';

class ImazonPresenter {

    static * transform(results, layer, subscription) {

        results.alert_count_degradation = 0;
        results.alert_count_deforestation = 0;
        if (results.value) {
            for (let i = 0, length = results.value.length; i < length; i++) {
                if (results.value[i].dataType === 'degrad') {
                    results.alert_count_degradation = results.value[i].dataType.value;
                } else if (results.value[i].dataType === 'defor') {
                    results.alert_count_deforestation = results.value[i].dataType.value;
                }
            }
        }
        return results;
    }

}

module.exports = ImazonPresenter;
