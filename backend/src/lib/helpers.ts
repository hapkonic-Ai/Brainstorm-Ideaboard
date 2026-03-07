import mongoose from 'mongoose';
import { Workspace } from '../models/Workspace';
import { Board } from '../models/Board';
import { Section } from '../models/Section';
import { Card } from '../models/Card';
import { Vote } from '../models/Vote';
import { Comment } from '../models/Comment';
import { User } from '../models/User';

/** User fields to select when populating user references */
export const USER_SELECT = 'name email avatar';

/** Build a safe user projection (never return password) */
export const USER_PROJECTION = 'id name email avatar createdAt';

/** Check if a user is a member of a workspace */
export async function isWorkspaceMember(
  workspaceId: string,
  userId: string
): Promise<boolean> {
  if (!mongoose.isValidObjectId(workspaceId) || !mongoose.isValidObjectId(userId)) {
    return false;
  }
  const exists = await Workspace.exists({
    _id: workspaceId,
    'members.userId': new mongoose.Types.ObjectId(userId),
  });
  return !!exists;
}

/** Verify a user has access to a board via workspace membership or direct board invite. Returns the board or null. */
export async function verifyBoardAccess(boardId: string, userId: string) {
  if (!mongoose.isValidObjectId(boardId)) return null;
  const board = await Board.findById(boardId);
  if (!board) return null;

  // If the board has restricted members, check if user is in the list
  if (board.members && board.members.length > 0) {
    const isExplicitMember = board.members.some(m => m.toString() === userId);
    const isCreator = board.createdBy.toString() === userId;
    if (isExplicitMember || isCreator) {
      return board;
    }
    return null; // Restricted board, and user is not in it
  }

  // Fallback to standard workspace check for public workspace boards
  const isMember = await isWorkspaceMember(board.workspaceId.toString(), userId);
  return isMember ? board : null;
}

/** Verify a user has access to a section via board → workspace membership. Returns the section or null. */
export async function verifySectionAccess(sectionId: string, userId: string) {
  if (!mongoose.isValidObjectId(sectionId)) return null;
  const section = await Section.findById(sectionId);
  if (!section) return null;
  const board = await verifyBoardAccess(section.boardId.toString(), userId);
  return board ? section : null;
}

/** Verify a user has access to a card via section → board → workspace membership. Returns the card or null. */
export async function verifyCardAccess(cardId: string, userId: string) {
  if (!mongoose.isValidObjectId(cardId)) return null;
  const card = await Card.findById(cardId);
  if (!card) return null;
  const section = await verifySectionAccess(card.sectionId.toString(), userId);
  return section ? card : null;
}

/** Populate a single card with author, votes, and comment count */
export async function populateCard(card: any) {
  const cardObj = typeof card.toJSON === 'function' ? card.toJSON() : { ...card };
  const [author, votes, commentsCount] = await Promise.all([
    User.findById(cardObj.authorId).select(USER_SELECT).lean(),
    Vote.find({ cardId: cardObj.id }).select('userId').lean(),
    Comment.countDocuments({ cardId: cardObj.id }),
  ]);
  cardObj.author = author
    ? { id: (author._id as any).toString(), name: (author as any).name, email: (author as any).email, avatar: (author as any).avatar }
    : null;
  cardObj.votes = votes.map((v: any) => ({ userId: v.userId.toString() }));
  cardObj._count = { comments: commentsCount };
  return cardObj;
}

/** Populate multiple cards in parallel */
export async function populateCards(cards: any[]) {
  return Promise.all(cards.map(populateCard));
}

/** Serialize a Mongoose doc or plain object for API responses. */
export function serialize<T>(doc: T): T {
  if (!doc) return doc;
  if (typeof (doc as any).toJSON === 'function') {
    return (doc as any).toJSON();
  }
  return doc;
}

/** Serialize an array of Mongoose docs */
export function serializeAll<T>(docs: T[]): T[] {
  return docs.map(serialize);
}
