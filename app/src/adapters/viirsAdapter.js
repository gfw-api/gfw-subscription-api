class ViirsAdapter {

    constructor(results) {
        this.results = results;
    }

    transform() {
        const value = this.results.reduce((acc, curr) => acc + curr.alert__count, 0);
        return { value, data: this.results };
    }

}

module.exports = ViirsAdapter;
