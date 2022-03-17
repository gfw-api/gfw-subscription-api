import type { Document, Model, Schema as ISchema } from 'mongoose';
import { model, Schema } from 'mongoose';

export interface IStatistic extends Document {
    slug: string;
    application: string;
    createdAt: Date;
}

export const Statistic: ISchema<IStatistic> = new Schema<IStatistic>({
    slug: { type: String, required: true, trim: true },
    application: { type: String, trim: true },
    createdAt: { type: Date, required: true, default: Date.now }
});

const StatisticModel: Model<IStatistic> = model<IStatistic>('Statistic', Statistic);

export default StatisticModel;
