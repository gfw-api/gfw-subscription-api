
class Forma250GFWPresenter {

    static async transform(results) {
        results.alert_count = results.value;

        return results;
    }

}

module.exports = Forma250GFWPresenter;
