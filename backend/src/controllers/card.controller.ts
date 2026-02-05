import { Response } from 'express';
import { AuthRequest } from '../types';
import { Section } from '../models/Section';
import { Card } from '../models/Card';
import { Vote } from '../models/Vote';
import { Comment } from '../models/Comment';
import {
  verifyBoardAccess,
  verifyCardAccess,
  populateCard,
} from '../lib/helpers';

export const createCard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sectionId, content } = req.body;
    const userId = req.user!.userId;

    if (!sectionId || !content) {
      res.status(400).json({ error: 'Section ID and content are required' });
      return;
    }

    const section = await Section.findById(sectionId);
    if (!section) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const board = await verifyBoardAccess(section.boardId.toString(), userId);
    if (!board) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const lastCard = await Card.findOne({ sectionId }).sort({ position: -1 });
    const position = lastCard ? lastCard.position + 1 : 0;

    const card = await Card.create({ sectionId, content, authorId: userId, position });
    const populated = await populateCard(card);

    res.status(201).json({ card: populated });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateCard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user!.userId;

    const card = await verifyCardAccess(id, userId);
    if (!card) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const updated = await Card.findByIdAndUpdate(id, { content }, { new: true });
    const populated = await populateCard(updated);

    res.json({ card: populated });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteCard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const card = await verifyCardAccess(id, userId);
    if (!card) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    await Vote.deleteMany({ cardId: id });
    await Comment.deleteMany({ cardId: id });
    await Card.findByIdAndDelete(id);

    res.json({ message: 'Card deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const moveCard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { sectionId: newSectionId, position: newPosition } = req.body;
    const userId = req.user!.userId;

    const card = await verifyCardAccess(id, userId);
    if (!card) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    await Card.updateMany(
      { sectionId: newSectionId, position: { $gte: newPosition }, _id: { $ne: id } },
      { $inc: { position: 1 } }
    );

    const updated = await Card.findByIdAndUpdate(
      id,
      { sectionId: newSectionId, position: newPosition },
      { new: true }
    );
    const populated = await populateCard(updated);

    res.json({ card: populated });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const reorderCards = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sectionId, orderedIds } = req.body;
    const userId = req.user!.userId;

    const section = await Section.findById(sectionId);
    if (!section) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const board = await verifyBoardAccess(section.boardId.toString(), userId);
    if (!board) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    await Card.bulkWrite(
      (orderedIds as string[]).map((cardId, index) => ({
        updateOne: {
          filter: { _id: cardId },
          update: { $set: { position: index } },
        },
      }))
    );

    res.json({ message: 'Cards reordered' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
