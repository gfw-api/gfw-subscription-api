
const imageService = require('services/imageService');

class ImazonPresenter {

    static async transform(results, layer, subscription, begin, end) {

        results.alert_count_degradation = 0;
        results.alert_count_deforestation = 0;
        if (results.value) {
            for (let i = 0, { length } = results.value; i < length; i++) {
                if (results.value[i].dataType === 'degrad') {
                    results.alert_count_degradation = results.value[i].value;
                } else if (results.value[i].dataType === 'defor') {
                    results.alert_count_deforestation = results.value[i].value;
                }
            }
        }
        results.map_image = await imageService.overviewImage(subscription, layer.slug, begin, end);

        return results;
    }

}

module.exports = ImazonPresenter;
