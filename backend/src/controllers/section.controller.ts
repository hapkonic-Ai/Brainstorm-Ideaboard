import { Response } from 'express';
import { AuthRequest } from '../types';
import { Section } from '../models/Section';
import { Card } from '../models/Card';
import { Vote } from '../models/Vote';
import { Comment } from '../models/Comment';
import { verifyBoardAccess, serialize } from '../lib/helpers';

export const createSection = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { boardId, name, color } = req.body;
    const userId = req.user!.userId;

    if (!boardId || !name) {
      res.status(400).json({ error: 'Board ID and name are required' });
      return;
    }

    const board = await verifyBoardAccess(boardId, userId);
    if (!board) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const lastSection = await Section.findOne({ boardId }).sort({ position: -1 });
    const position = lastSection ? lastSection.position + 1 : 0;

    const section = await Section.create({ boardId, name, position, color: color || '#94A3B8' });

    res.status(201).json({ section: { ...serialize(section), cards: [] } });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateSection = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;
    const userId = req.user!.userId;

    const section = await Section.findById(id);
    if (!section) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const board = await verifyBoardAccess(section.boardId.toString(), userId);
    if (!board) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const updated = await Section.findByIdAndUpdate(
      id,
      { ...(name && { name }), ...(color && { color }) },
      { new: true }
    );

    res.json({ section: serialize(updated) });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteSection = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const section = await Section.findById(id);
    if (!section) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const board = await verifyBoardAccess(section.boardId.toString(), userId);
    if (!board) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const cardIds = await Card.find({ sectionId: id }).distinct('_id');
    await Vote.deleteMany({ cardId: { $in: cardIds } });
    await Comment.deleteMany({ cardId: { $in: cardIds } });
    await Card.deleteMany({ sectionId: id });
    await Section.findByIdAndDelete(id);

    res.json({ message: 'Section deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const reorderSections = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { boardId, orderedIds } = req.body;
    const userId = req.user!.userId;

    const board = await verifyBoardAccess(boardId, userId);
    if (!board) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    await Section.bulkWrite(
      (orderedIds as string[]).map((sectionId, index) => ({
        updateOne: {
          filter: { _id: sectionId },
          update: { $set: { position: index } },
        },
      }))
    );

    res.json({ message: 'Sections reordered' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
