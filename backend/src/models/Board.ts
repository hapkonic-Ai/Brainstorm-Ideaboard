import mongoose, { Schema, Document } from 'mongoose';

export interface IBoard extends Document {
  workspaceId: mongoose.Types.ObjectId;
  name: string;
  templateType: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BoardSchema = new Schema<IBoard>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    name: { type: String, required: true, trim: true },
    templateType: { type: String, default: 'custom' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
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

BoardSchema.index({ workspaceId: 1, updatedAt: -1 });

export const Board = mongoose.model<IBoard>('Board', BoardSchema);
