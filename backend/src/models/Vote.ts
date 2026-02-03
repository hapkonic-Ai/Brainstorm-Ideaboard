import mongoose, { Schema, Document } from 'mongoose';

export interface IVote extends Document {
  cardId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
}

const VoteSchema = new Schema<IVote>(
  {
    cardId: { type: Schema.Types.ObjectId, ref: 'Card', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
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

// Unique vote per user per card
VoteSchema.index({ cardId: 1, userId: 1 }, { unique: true });
VoteSchema.index({ cardId: 1 });

export const Vote = mongoose.model<IVote>('Vote', VoteSchema);
