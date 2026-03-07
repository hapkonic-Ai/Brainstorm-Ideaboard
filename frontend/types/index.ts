export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  createdAt?: string;
}

export interface Workspace {
  id: string;
  name: string;
  createdBy: string;
  inviteCode: string;
  createdAt: string;
  members: WorkspaceMember[];
  _count?: { boards: number };
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';
  joinedAt: string;
  user: Pick<User, 'id' | 'name' | 'email' | 'avatar'>;
}

export interface Board {
  id: string;
  workspaceId: string;
  name: string;
  templateType: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator?: Pick<User, 'id' | 'name' | 'email' | 'avatar'>;
  sections?: Section[];
  _count?: { sections: number };
}

export interface Section {
  id: string;
  boardId: string;
  name: string;
  position: number;
  color?: string | null;
  createdAt: string;
  cards: Card[];
}

export interface Card {
  id: string;
  sectionId: string;
  content: string;
  authorId: string;
  position: number;
  votesCount: number;
  createdAt: string;
  updatedAt: string;
  author: Pick<User, 'id' | 'name' | 'email' | 'avatar'>;
  votes: { userId: string }[];
  _count?: { comments: number };
}

export interface Vote {
  id: string;
  cardId: string;
  userId: string;
}

export interface Comment {
  id: string;
  cardId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: Pick<User, 'id' | 'name' | 'email' | 'avatar'>;
}

export interface ActiveUser {
  userId: string;
  name: string;
  email: string;
  avatar?: string | null;
}

export type TemplateType = 'starfish' | 'six_hats' | 'pros_cons' | 'custom';

export interface Template {
  id: TemplateType;
  name: string;
  description: string;
  sections: { name: string; color: string }[];
  icon: string;
}

export interface ApiError {
  error: string;
}

export type CardDragData = {
  type: 'card';
  card: Card;
  sectionId: string;
};

export type SectionDragData = {
  type: 'section';
  section: Section;
};
