import { ISubscription } from 'models/subscription';
import { ILayer } from 'models/layer';
import { SubscriptionEmailDataType } from 'types/email.type';
import { PresenterResponseDataType } from 'types/presenterResponse.type';

export interface PublisherInterface {

    publish(subscription: ISubscription, results: PresenterResponseDataType | SubscriptionEmailDataType, layer?: ILayer): Promise<any>
}
