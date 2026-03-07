import { Response } from 'express';
import { AuthRequest } from '../types';
import { BoardInvitation } from '../models/BoardInvitation';
import { Board } from '../models/Board';
import { Workspace } from '../models/Workspace';
import { User } from '../models/User';
import mongoose from 'mongoose';
import { serialize, serializeAll, USER_PROJECTION } from '../lib/helpers';

export const createInvite = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const boardId = req.params.id;
        const { inviteeId } = req.body;
        const inviterId = req.user!.userId;

        if (!mongoose.isValidObjectId(boardId) || !mongoose.isValidObjectId(inviteeId)) {
            res.status(400).json({ error: 'Invalid board or user ID' });
            return;
        }

        // Verify board exists and user is creator
        const board = await Board.findById(boardId);
        if (!board) {
            res.status(404).json({ error: 'Board not found' });
            return;
        }

        if (board.createdBy.toString() !== inviterId) {
            res.status(403).json({ error: 'Only the board creator can invite users' });
            return;
        }

        // Check if user is already a member
        if (board.members.some(memberId => memberId.toString() === inviteeId)) {
            res.status(400).json({ error: 'User is already a member of this board' });
            return;
        }

        // Check for existing pending invite
        const existingInvite = await BoardInvitation.findOne({
            boardId,
            inviteeId,
            status: 'pending'
        });

        if (existingInvite) {
            res.status(400).json({ error: 'An invitation is already pending for this user' });
            return;
        }

        const invite = await BoardInvitation.create({
            boardId,
            inviterId,
            inviteeId,
            status: 'pending'
        });

        res.status(201).json({ invite: serialize(invite) });
    } catch (err) {
        console.error('Create invite error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getMyInvites = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;

        const invites = await BoardInvitation.find({
            inviteeId: userId,
            status: 'pending'
        })
            .populate('boardId', 'name')
            .populate('inviterId', USER_PROJECTION)
            .sort({ createdAt: -1 })
            .lean();

        // Clean up populated fields for the frontend
        const serializedInvites = invites.map(invite => {
            const i = serialize(invite) as any;
            if (i._id) {
                i.id = i._id.toString();
                delete i._id;
            }
            if (i.boardId) {
                i.board = { id: i.boardId._id.toString(), name: i.boardId.name };
                delete i.boardId;
            }
            if (i.inviterId) {
                i.inviter = { id: i.inviterId._id.toString(), name: i.inviterId.name, email: i.inviterId.email, avatar: i.inviterId.avatar };
                delete i.inviterId;
            }
            return i;
        });

        res.json({ invites: serializedInvites });
    } catch (err) {
        console.error('Get invites error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const acceptInvite = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { inviteId } = req.params;
        const userId = req.user!.userId;

        if (!mongoose.isValidObjectId(inviteId)) {
            res.status(400).json({ error: 'Invalid invitation ID' });
            return;
        }

        const invite = await BoardInvitation.findOne({
            _id: inviteId,
            inviteeId: userId,
            status: 'pending'
        });

        if (!invite) {
            res.status(404).json({ error: 'Invitation not found or already processed' });
            return;
        }

        const board = await Board.findById(invite.boardId);
        if (!board) {
            res.status(404).json({ error: 'Associated board no longer exists' });
            return;
        }

        // Update invite status
        invite.status = 'accepted';
        await invite.save();

        // Add user to board members if not already present
        if (!board.members.includes(new mongoose.Types.ObjectId(userId))) {
            board.members.push(new mongoose.Types.ObjectId(userId));
            await board.save();
        }

        // Add user to workspace if not already present (as a MEMBER)
        const workspace = await Workspace.findById(board.workspaceId);
        if (workspace) {
            const isWorkspaceMember = workspace.members.some(
                m => m.userId.toString() === userId
            );

            if (!isWorkspaceMember) {
                workspace.members.push({
                    userId: new mongoose.Types.ObjectId(userId),
                    role: 'MEMBER',
                    joinedAt: new Date()
                });
                await workspace.save();
            }
        }

        res.json({ success: true, message: 'Invitation accepted. You now have access to the board.' });
    } catch (err) {
        console.error('Accept invite error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const declineInvite = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { inviteId } = req.params;
        const userId = req.user!.userId;

        if (!mongoose.isValidObjectId(inviteId)) {
            res.status(400).json({ error: 'Invalid invitation ID' });
            return;
        }

        const invite = await BoardInvitation.findOne({
            _id: inviteId,
            inviteeId: userId,
            status: 'pending'
        });

        if (!invite) {
            res.status(404).json({ error: 'Invitation not found or already processed' });
            return;
        }

        invite.status = 'declined';
        await invite.save();

        res.json({ success: true, message: 'Invitation declined' });
    } catch (err) {
        console.error('Decline invite error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};
