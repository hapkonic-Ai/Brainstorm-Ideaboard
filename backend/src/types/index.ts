import { Request } from 'express';

export interface AuthPayload {
  userId: string;
  email: string;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

export interface SocketUser {
  userId: string;
  name: string;
  email: string;
  avatar?: string | null;
}

export interface BoardRoom {
  boardId: string;
  users: Map<string, SocketUser>;
}
