import { Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { Workspace } from '../models/Workspace';
import { AuthRequest } from '../types';

async function populateMembers(workspace: any) {
  const userIds = workspace.members.map((m: any) => m.userId);
  const users = await User.find({ _id: { $in: userIds } });
  const userMap = new Map(users.map((u) => [u._id.toString(), u.toJSON()]));
  const ws = workspace.toJSON ? workspace.toJSON() : { ...workspace };
  ws.members = workspace.members.map((m: any) => ({
    userId: m.userId.toString(),
    role: m.role,
    joinedAt: m.joinedAt,
    user: userMap.get(m.userId.toString()) ?? null,
  }));
  return ws;
}

export const createWorkspace = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name } = req.body;
    const userId = req.user!.userId;
    if (!name) { res.status(400).json({ error: 'Workspace name is required' }); return; }
    const workspace = await Workspace.create({
      name,
      createdBy: new mongoose.Types.ObjectId(userId),
      members: [{ userId: new mongoose.Types.ObjectId(userId), role: 'OWNER' }],
    });
    res.status(201).json({ workspace: await populateMembers(workspace) });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
};

export const getWorkspaces = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const workspaces = await Workspace.find({ 'members.userId': new mongoose.Types.ObjectId(userId) }).sort({ createdAt: 1 });
    const populated = await Promise.all(workspaces.map(populateMembers));
    res.json({ workspaces: populated });
  } catch { res.status(500).json({ error: 'Internal server error' }); }
};

export const getWorkspace = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    if (!mongoose.isValidObjectId(id)) { res.status(404).json({ error: 'Not found' }); return; }
    const workspace = await Workspace.findOne({ _id: id, 'members.userId': new mongoose.Types.ObjectId(userId) });
    if (!workspace) { res.status(404).json({ error: 'Workspace not found' }); return; }
    res.json({ workspace: await populateMembers(workspace) });
  } catch { res.status(500).json({ error: 'Internal server error' }); }
};

export const joinWorkspace = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { inviteCode } = req.body;
    const userId = req.user!.userId;
    if (!inviteCode) { res.status(400).json({ error: 'Invite code is required' }); return; }
    const workspace = await Workspace.findOne({ inviteCode });
    if (!workspace) { res.status(404).json({ error: 'Invalid invite code' }); return; }
    const already = workspace.members.some((m) => m.userId.toString() === userId);
    if (already) { res.status(409).json({ error: 'Already a member' }); return; }
    workspace.members.push({ userId: new mongoose.Types.ObjectId(userId), role: 'MEMBER', joinedAt: new Date() });
    await workspace.save();
    res.json({ workspace: await populateMembers(workspace) });
  } catch { res.status(500).json({ error: 'Internal server error' }); }
};

export const updateWorkspace = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const userId = req.user!.userId;
    if (!mongoose.isValidObjectId(id)) { res.status(404).json({ error: 'Not found' }); return; }
    const workspace = await Workspace.findOne({ _id: id, 'members.userId': new mongoose.Types.ObjectId(userId) });
    if (!workspace) { res.status(403).json({ error: 'Access denied' }); return; }
    const member = workspace.members.find((m) => m.userId.toString() === userId);
    if (!member || !['OWNER', 'ADMIN'].includes(member.role)) { res.status(403).json({ error: 'Insufficient permissions' }); return; }
    workspace.name = name;
    await workspace.save();
    res.json({ workspace: await populateMembers(workspace) });
  } catch { res.status(500).json({ error: 'Internal server error' }); }
};
