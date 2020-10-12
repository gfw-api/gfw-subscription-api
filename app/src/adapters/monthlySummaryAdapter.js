class MonthlySummaryAdapter {

    constructor(results) {
        this.results = [];
        results.gladAlerts.forEach((alert) => this.results.push({ ...alert, type: 'GLAD' }));
        results.viirsAlerts.forEach((alert) => this.results.push({ ...alert, type: 'VIIRS' }));
    }

    transform() {
        const value = this.results.reduce((acc, curr) => acc + curr.alert__count, 0);
        return { value, data: this.results };
    }

}

module.exports = MonthlySummaryAdapter;
