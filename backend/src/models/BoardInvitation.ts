import mongoose, { Schema, Document } from 'mongoose';

export interface IBoardInvitation extends Document {
    boardId: mongoose.Types.ObjectId;
    inviterId: mongoose.Types.ObjectId;
    inviteeId: mongoose.Types.ObjectId;
    status: 'pending' | 'accepted' | 'declined';
    createdAt: Date;
    updatedAt: Date;
}

const BoardInvitationSchema = new Schema<IBoardInvitation>(
    {
        boardId: { type: Schema.Types.ObjectId, ref: 'Board', required: true },
        inviterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        inviteeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
    },
    {
        timestamps: true,
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

// Only allow one pending invitation per user per board
BoardInvitationSchema.index({ boardId: 1, inviteeId: 1 }, { unique: true, partialFilterExpression: { status: 'pending' } });
BoardInvitationSchema.index({ inviteeId: 1, status: 1 }); // For querying user's pending invites

export const BoardInvitation = mongoose.model<IBoardInvitation>('BoardInvitation', BoardInvitationSchema);
