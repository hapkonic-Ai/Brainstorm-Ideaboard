import { Response } from 'express';
import { AuthRequest } from '../types';
import { Comment } from '../models/Comment';
import { verifyCardAccess, serialize, USER_SELECT } from '../lib/helpers';

export const createComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { cardId, content } = req.body;
    const userId = req.user!.userId;

    if (!cardId || !content) {
      res.status(400).json({ error: 'Card ID and content are required' });
      return;
    }

    const card = await verifyCardAccess(cardId, userId);
    if (!card) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const comment = await Comment.create({ cardId, userId, content });
    await comment.populate('userId', USER_SELECT);

    const commentObj = serialize(comment);
    res.status(201).json({
      comment: {
        ...commentObj,
        user: commentObj.userId,
        userId: undefined,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getComments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { cardId } = req.params;
    const userId = req.user!.userId;

    const card = await verifyCardAccess(cardId, userId);
    if (!card) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const comments = await Comment.find({ cardId })
      .populate('userId', USER_SELECT)
      .sort({ createdAt: 1 });

    const serialized = comments.map((c) => {
      const obj = serialize(c);
      return { ...obj, user: obj.userId, userId: undefined };
    });

    res.json({ comments: serialized });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const comment = await Comment.findById(id);
    if (!comment || comment.userId.toString() !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    await Comment.findByIdAndDelete(id);
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
