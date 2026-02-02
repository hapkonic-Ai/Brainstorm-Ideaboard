import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Workspace } from '../models/Workspace';
import { signToken } from '../lib/jwt';
import { AuthRequest } from '../types';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) { res.status(400).json({ error: 'Name, email, and password are required' }); return; }
    if (password.length < 6) { res.status(400).json({ error: 'Password must be at least 6 characters' }); return; }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) { res.status(409).json({ error: 'Email already in use' }); return; }
    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hashed });
    const workspace = await Workspace.create({
      name: name + "'s Workspace",
      createdBy: user._id,
      members: [{ userId: user._id, role: 'OWNER' }],
    });
    const token = signToken({ userId: user._id.toString(), email: user.email });
    res.status(201).json({ user: user.toJSON(), token, defaultWorkspaceId: workspace._id.toString() });
  } catch (err) { console.error('Register error:', err); res.status(500).json({ error: 'Internal server error' }); }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) { res.status(400).json({ error: 'Email and password are required' }); return; }
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) { res.status(401).json({ error: 'Invalid credentials' }); return; }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) { res.status(401).json({ error: 'Invalid credentials' }); return; }
    const token = signToken({ userId: user._id.toString(), email: user.email });
    res.json({ user: user.toJSON(), token });
  } catch (err) { console.error('Login error:', err); res.status(500).json({ error: 'Internal server error' }); }
};

export const me = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!.userId);
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    res.json({ user: user.toJSON() });
  } catch { res.status(500).json({ error: 'Internal server error' }); }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, avatar } = req.body;
    const user = await User.findByIdAndUpdate(req.user!.userId, { ...(name && { name }), ...(avatar && { avatar }) }, { new: true });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    res.json({ user: user.toJSON() });
  } catch { res.status(500).json({ error: 'Internal server error' }); }
};
