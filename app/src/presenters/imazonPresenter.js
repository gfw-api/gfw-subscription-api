'use strict';

class ImazonPresenter {

    static * transform(results, layer, subscription) {
        result.alert_count_degradation = 0;
        result.alert_count_deforestation = 0;
        if (results.value) {
            for (let i = 0, length = results.value.length; i < length; i++) {
                if (results.value[i].dataType === 'degrad') {
                    result.alert_count_degradation = results.value[i].dataType.value;
                } else if (results.value[i].dataType === 'defor') {
                    result.alert_count_deforestation = results.value[i].dataType.value;
                }
            }
        }
        return results;
    }

}

module.exports = ImazonPresenter;
