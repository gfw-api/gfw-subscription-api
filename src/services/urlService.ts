import config from 'config';
import logger from 'logger';
import { ISubscription } from 'models/subscription';

const BASE_URL: string = config.get('apiGateway.externalUrl');

class UrlService {

    static flagshipUrl(path: string = '', lang: string = null): string {
        const uri: string = `${config.get('gfw.flagshipUrl')}${path}`;
        return lang ? `${uri}?lang=${lang}` : uri;
    }

    static flagshipUrlRW(path: string = '', env: string = 'production'): string {
        logger.info('config', config.get('rw.flagshipUrl'));

        if (!['production', 'staging', 'preproduction'].includes(env)) {
            logger.warn(`invalid env requested: ${env}. Overriding with staging`);

            env = 'staging';
        }

        return config.get(`rw.flagshipUrl.${env}`) + path;
    }

    static confirmationUrl(subscription: ISubscription): string {
        return `${BASE_URL}/v1/subscriptions/${subscription._id}/confirm?application=${subscription.application}`;
    }

    static unsubscribeUrl(subscription: ISubscription): string {
        return `${BASE_URL}/v1/subscriptions/${subscription._id}/unsubscribe?redirect=true&lang=${subscription.language || 'en'}`;
    }

    static dashboardUrl(id: string, lang: string, type: string): string {
        let category: string;
        let campaign: string;

        switch (type) {

            case 'monthly':
                category = 'forest-change';
                campaign = 'MonthlyAlertSummary';
                break;
            case 'fires':
                category = 'fires';
                campaign = 'FireAlert';
                break;
            case 'glad':
            default:
                category = 'forest-change';
                campaign = 'ForestChangeAlert';
                break;

        }
        return `${config.get('gfw.flagshipUrl')}/dashboards/aoi/${id}?lang=${lang}&category=${category}&utm_source=hyperlink&utm_medium=email&utm_campaign=${campaign}`;
    }

}

export default UrlService;
