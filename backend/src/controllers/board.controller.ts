import { Response } from 'express';
import { AuthRequest } from '../types';
import { Board } from '../models/Board';
import { Section } from '../models/Section';
import { Card } from '../models/Card';
import { Vote } from '../models/Vote';
import { Comment } from '../models/Comment';
import {
  isWorkspaceMember,
  verifyBoardAccess,
  populateCards,
  serialize,
  USER_SELECT,
} from '../lib/helpers';

const TEMPLATE_SECTIONS: Record<string, { name: string; color: string }[]> = {
  starfish: [
    { name: 'Keep Doing', color: '#22C55E' },
    { name: 'Stop Doing', color: '#EF4444' },
    { name: 'Start Doing', color: '#3B82F6' },
    { name: 'More Of', color: '#F59E0B' },
    { name: 'Less Of', color: '#8B5CF6' },
  ],
  six_hats: [
    { name: 'White Hat (Facts)', color: '#94A3B8' },
    { name: 'Red Hat (Emotions)', color: '#EF4444' },
    { name: 'Black Hat (Caution)', color: '#1E293B' },
    { name: 'Yellow Hat (Optimism)', color: '#EAB308' },
    { name: 'Green Hat (Creativity)', color: '#22C55E' },
    { name: 'Blue Hat (Process)', color: '#3B82F6' },
  ],
  pros_cons: [
    { name: 'Pros', color: '#22C55E' },
    { name: 'Cons', color: '#EF4444' },
  ],
  custom: [],
};

export const createBoard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { workspaceId, name, templateType = 'custom', customSections } = req.body;
    const userId = req.user!.userId;

    if (!workspaceId || !name) {
      res.status(400).json({ error: 'Workspace ID and name are required' });
      return;
    }

    const isMember = await isWorkspaceMember(workspaceId, userId);
    if (!isMember) {
      res.status(403).json({ error: 'Not a member of this workspace' });
      return;
    }

    const sectionsToCreate =
      templateType === 'custom'
        ? (customSections || []).map((s: { name: string; color?: string }, i: number) => ({
          name: s.name,
          color: s.color || '#94A3B8',
          position: i,
        }))
        : (TEMPLATE_SECTIONS[templateType] || []).map((s, i) => ({
          name: s.name,
          color: s.color,
          position: i,
        }));

    const board = await Board.create({ workspaceId, name, templateType, createdBy: userId });

    const sections = sectionsToCreate.length
      ? await Section.insertMany(
        sectionsToCreate.map((s: any) => ({ ...s, boardId: board._id }))
      )
      : [];

    await board.populate('createdBy', USER_SELECT);

    res.status(201).json({
      board: {
        ...serialize(board),
        sections: sections.map(serialize),
      },
    });
  } catch (err) {
    console.error('Create board error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getBoards = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user!.userId;

    const isMember = await isWorkspaceMember(workspaceId, userId);
    if (!isMember) {
      res.status(403).json({ error: 'Not a member of this workspace' });
      return;
    }

    const boards = await Board.find({
      workspaceId,
      $or: [
        { members: { $size: 0 } }, // Public to workspace
        { createdBy: userId },     // Creator always sees it
        { members: userId }        // Explicitly invited user
      ]
    })
      .populate('createdBy', USER_SELECT)
      .sort({ updatedAt: -1 })
      .lean();

    const boardsWithCounts = await Promise.all(
      boards.map(async (b: any) => {
        const sectionsCount = await Section.countDocuments({ boardId: b._id });
        return {
          ...b,
          id: b._id.toString(),
          _id: undefined,
          __v: undefined,
          creator: b.createdBy
            ? { id: b.createdBy._id?.toString(), name: b.createdBy.name, email: b.createdBy.email, avatar: b.createdBy.avatar }
            : null,
          _count: { sections: sectionsCount },
        };
      })
    );

    res.json({ boards: boardsWithCounts });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getBoard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const board = await verifyBoardAccess(id, userId);
    if (!board) {
      res.status(404).json({ error: 'Board not found' });
      return;
    }

    await board.populate('createdBy', USER_SELECT);
    const boardObj = serialize(board);

    const sections = await Section.find({ boardId: id }).sort({ position: 1 }).lean();

    const sectionsWithCards = await Promise.all(
      sections.map(async (section: any) => {
        const cards = await Card.find({ sectionId: section._id }).sort({ position: 1 });
        const populatedCards = await populateCards(cards);
        return {
          ...section,
          id: section._id.toString(),
          _id: undefined,
          __v: undefined,
          cards: populatedCards,
        };
      })
    );

    res.json({
      board: {
        ...boardObj,
        sections: sectionsWithCards,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateBoard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const userId = req.user!.userId;

    const board = await verifyBoardAccess(id, userId);
    if (!board) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const updated = await Board.findByIdAndUpdate(id, { name }, { new: true });
    res.json({ board: serialize(updated) });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteBoard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const board = await verifyBoardAccess(id, userId);
    if (!board) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const sectionIds = await Section.find({ boardId: id }).distinct('_id');
    await Vote.deleteMany({ cardId: { $in: await Card.find({ sectionId: { $in: sectionIds } }).distinct('_id') } });
    await Comment.deleteMany({ cardId: { $in: await Card.find({ sectionId: { $in: sectionIds } }).distinct('_id') } });
    await Card.deleteMany({ sectionId: { $in: sectionIds } });
    await Section.deleteMany({ boardId: id });
    await Board.findByIdAndDelete(id);

    res.json({ message: 'Board deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const duplicateBoard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const board = await verifyBoardAccess(id, userId);
    if (!board) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const sections = await Section.find({ boardId: id }).sort({ position: 1 }).lean();

    const newBoard = await Board.create({
      workspaceId: board.workspaceId,
      name: `${board.name} (Copy)`,
      templateType: board.templateType,
      createdBy: userId,
    });

    const newSections = [];
    for (const section of sections) {
      const newSection = await Section.create({
        boardId: newBoard._id,
        name: section.name,
        position: section.position,
        color: section.color,
      });

      const cards = await Card.find({ sectionId: section._id }).sort({ position: 1 }).lean();
      if (cards.length) {
        await Card.insertMany(
          cards.map((card: any) => ({
            sectionId: newSection._id,
            content: card.content,
            authorId: userId,
            position: card.position,
          }))
        );
      }

      newSections.push(serialize(newSection));
    }

    res.status(201).json({
      board: {
        ...serialize(newBoard),
        sections: newSections,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
