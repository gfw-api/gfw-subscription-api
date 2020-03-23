class AnalysisClassifier {

    static pathFor(subscription, layerSlug) {
        const params = subscription.params || {};

        if (layerSlug === 'story') {
            if (params.iso && params.iso.country) {
                let url = `?iso=${params.iso.country}`;

                if (params.iso.region) {
                    url += `&id1=${params.iso.region}`;
                }

                return url;
            }

            if (params.use && params.useid) {
                return `?use=${params.use}&useid=${params.useid}`;
            }

            if (params.wdpaid) {
                return `?wdpaid=${params.wdpaid}`;
            }

            return '/';
        }
        if (params.iso && params.iso.country) {
            let url = `/admin/${params.iso.country}`;

            if (params.iso.region) {
                url += `/${params.iso.region}`;
            }

            return url;
        }

        if (params.use && params.useid) {
            return `/use/${params.use}/${params.useid}`;
        }

        if (params.wdpaid) {
            return `/wdpa/${params.wdpaid}`;
        }

        return '/';
    }


}

module.exports = AnalysisClassifier;
