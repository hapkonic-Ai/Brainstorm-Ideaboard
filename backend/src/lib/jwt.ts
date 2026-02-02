import jwt from 'jsonwebtoken';
import { AuthPayload } from '../types';

const SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const signToken = (payload: AuthPayload): string => {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN } as jwt.SignOptions);
};

export const verifyToken = (token: string): AuthPayload => {
  return jwt.verify(token, SECRET) as AuthPayload;
};
