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
