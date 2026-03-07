import { Response } from 'express';
import { AuthRequest } from '../types';
import { User } from '../models/User';
import { USER_PROJECTION } from '../lib/helpers';

export const searchUsers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const emailQuery = req.query.email as string;

        if (!emailQuery || emailQuery.trim().length === 0) {
            res.json({ users: [] });
            return;
        }

        // Escape regex characters
        const safeQuery = emailQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Find users by partial email (limit to 10 for safety), excluding the requesting user
        const users = await User.find({
            email: { $regex: safeQuery, $options: 'i' },
            _id: { $ne: req.user!.userId }
        })
            .select(USER_PROJECTION)
            .limit(10)
            .lean();

        // Map `_id` to `id` explicitly for API serialization
        const serializedUsers = users.map(user => ({
            ...user,
            id: (user._id as any).toString(),
            _id: undefined
        }));

        res.json({ users: serializedUsers });
    } catch (err) {
        console.error('Search users error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name, avatar } = req.body;
        const user = await User.findById(req.user!.userId);

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        if (name && name.trim().length > 0) user.name = name.trim();
        if (avatar !== undefined) user.avatar = avatar;

        await user.save();

        res.json({
            user: {
                id: (user._id as any).toString(),
                email: user.email,
                name: user.name,
                avatar: user.avatar,
                createdAt: user.createdAt,
            }
        });
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};
