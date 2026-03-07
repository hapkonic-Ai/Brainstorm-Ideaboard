import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
  cardId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    cardId: { type: Schema.Types.ObjectId, ref: 'Card', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id?.toString();
        delete (ret as any)._id;
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

CommentSchema.index({ cardId: 1, createdAt: 1 });

export const Comment = mongoose.model<IComment>('Comment', CommentSchema);
