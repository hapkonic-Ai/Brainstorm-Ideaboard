import mongoose, { Schema, Document } from 'mongoose';

export interface ISection extends Document {
  boardId: mongoose.Types.ObjectId;
  name: string;
  position: number;
  color: string;
  createdAt: Date;
}

const SectionSchema = new Schema<ISection>(
  {
    boardId: { type: Schema.Types.ObjectId, ref: 'Board', required: true },
    name: { type: String, required: true, trim: true },
    position: { type: Number, default: 0 },
    color: { type: String, default: '#94A3B8' },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
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

SectionSchema.index({ boardId: 1, position: 1 });

export const Section = mongoose.model<ISection>('Section', SectionSchema);
