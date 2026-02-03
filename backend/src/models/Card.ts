import mongoose, { Schema, Document } from 'mongoose';

export interface ICard extends Document {
  sectionId: mongoose.Types.ObjectId;
  content: string;
  authorId: mongoose.Types.ObjectId;
  position: number;
  votesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const CardSchema = new Schema<ICard>(
  {
    sectionId: { type: Schema.Types.ObjectId, ref: 'Section', required: true },
    content: { type: String, required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    position: { type: Number, default: 0 },
    votesCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

CardSchema.index({ sectionId: 1, position: 1 });

export const Card = mongoose.model<ICard>('Card', CardSchema);
