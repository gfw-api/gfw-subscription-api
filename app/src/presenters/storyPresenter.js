
class StoryPresenter {

    static async transform(results) {
        results.alert_count = results.list.length;


        return results;
    }

}

module.exports = StoryPresenter;
