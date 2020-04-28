const config = require('config');

const BASE_URL = config.get('gfw.flagshipUrl');

const qs = require('querystring');
const moment = require('moment');

class AlertUrlService {

    static generate(subscription, layer, begin, end) {
        let pathname = `aoi/${subscription.id}`;

        if (subscription.params.iso && subscription.params.iso.country) {
          const country = subscription.params.iso.country;
          const region = subscription.params.iso.region;
          const subregion = subscription.params.iso.subregion;
          pathname = `country/${country}${region ? `/${region}` : ''}${subregion ? `/${subregion}` : ''}`;
        }

        if (subscription.params.wdpaid) {
          pathname = `wdpa/${subscription.params.wdpaid}`;
        }

        if (subscription.params.use && subscription.params.useid) {
          pathname = `use/${subscription.params.use}/${subscription.params.useid}`;
        }

        const diffInDays = moment(begin).diff(moment(end), 'days');

        queryForUrl = {
          lang: subscription.language || 'en',
          map: {
            canBound: true,
            ...layer.datasetId && dataset.layerId && {
              datasets: [
                {
                  dataset: layer.datasetId,
                  layers: [dataset.layerId],
                  ...layer.slug === 'viirs-active-fires' && {
                    params: {
                      number_of_days: diffInDays <= 7 ? diffInDays : 7
                    }
                  },
                  ...layer.slug !== 'viirs-active-fires' && {
                    timelineParams: {
                      startDate: moment(begin).format('YYYY-MM-DD'),
                      endDate: moment(end).format('YYYY-MM-DD'),
                      trimEndDate: moment(end).format('YYYY-MM-DD')
                    }
                  }
                },
                {
                  dataset: '0b0208b6-b424-4b57-984f-caddfa25ba22',
                  layers: ['b45350e3-5a76-44cd-b0a9-5038a0d8bfae', 'cc35432d-38d7-4a03-872e-3a71a2f555fc']
                }
              ]
            }
          },
          mainMap: {
            showAnalysis: true
          }
        }

        return `${BASE_URL}/map/${pathname}?${qs.stringify(queryForUrl)}`;
    }

}

module.exports = AlertUrlService;
