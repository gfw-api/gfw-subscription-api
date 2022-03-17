import type { Document, Model, Schema as ISchema } from 'mongoose';
import { model, Schema } from 'mongoose';

export interface ILastUpdate extends Document {
    dataset: string;
    date: Date,
}

export const LastUpdate: ISchema<ILastUpdate> = new Schema<ILastUpdate>({
    dataset: { type: String, required: true, trim: true },
    date: { type: Date, required: true, trim: true },
});

const LastUpdateModel: Model<ILastUpdate> = model<ILastUpdate>('LastUpdate', LastUpdate);

export default LastUpdateModel;
