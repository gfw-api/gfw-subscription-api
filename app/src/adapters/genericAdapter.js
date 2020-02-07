class GenericAdapter {

    constructor(results) {
        this.results = results;
    }

    transform() {
        return {
            value: this.results.value
        };
    }

}

module.exports = GenericAdapter;
