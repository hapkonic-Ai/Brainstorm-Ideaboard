import { Response } from 'express';
import { AuthRequest } from '../types';
import { Card } from '../models/Card';
import { Vote } from '../models/Vote';
import { verifyCardAccess } from '../lib/helpers';

export const toggleVote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { cardId } = req.body;
    const userId = req.user!.userId;

    if (!cardId) {
      res.status(400).json({ error: 'Card ID is required' });
      return;
    }

    const card = await verifyCardAccess(cardId, userId);
    if (!card) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const existingVote = await Vote.findOne({ cardId, userId });
    let voted: boolean;

    if (existingVote) {
      await Vote.deleteOne({ _id: existingVote._id });
      await Card.findByIdAndUpdate(cardId, { $inc: { votesCount: -1 } });
      voted = false;
    } else {
      await Vote.create({ cardId, userId });
      await Card.findByIdAndUpdate(cardId, { $inc: { votesCount: 1 } });
      voted = true;
    }

    const updatedCard = await Card.findById(cardId).select('votesCount').lean();
    const votes = await Vote.find({ cardId }).select('userId').lean();

    res.json({
      card: {
        id: cardId,
        votesCount: updatedCard?.votesCount ?? 0,
        votes: votes.map((v: any) => ({ userId: v.userId.toString() })),
      },
      voted,
    });
  } catch (err) {
    console.error('Vote error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
