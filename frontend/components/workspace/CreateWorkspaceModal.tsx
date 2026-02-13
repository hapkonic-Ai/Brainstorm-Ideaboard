'use client';

import { useState } from 'react';
import { workspaceApi } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';

interface CreateWorkspaceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateWorkspaceModal({ open, onOpenChange }: CreateWorkspaceModalProps) {
  const { addWorkspace, setCurrentWorkspace } = useAppStore();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [joinMode, setJoinMode] = useState(false);
  const [inviteCode, setInviteCode] = useState('');

  async function handleCreate() {
    if (!name.trim()) {
      toast({ title: 'Workspace name is required', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await workspaceApi.create({ name: name.trim() });
      addWorkspace(res.data.workspace);
      setCurrentWorkspace(res.data.workspace);
      toast({ title: 'Workspace created!' });
      onOpenChange(false);
      setName('');
    } catch {
      toast({ title: 'Failed to create workspace', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (!inviteCode.trim()) {
      toast({ title: 'Invite code is required', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await workspaceApi.join(inviteCode.trim());
      addWorkspace(res.data.workspace);
      setCurrentWorkspace(res.data.workspace);
      toast({ title: 'Joined workspace!' });
      onOpenChange(false);
      setInviteCode('');
    } catch {
      toast({ title: 'Invalid invite code', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{joinMode ? 'Join Workspace' : 'Create Workspace'}</DialogTitle>
          <DialogDescription>
            {joinMode
              ? 'Enter an invite code to join an existing workspace.'
              : 'Create a new workspace for your team.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {joinMode ? (
            <div className="space-y-2">
              <Label htmlFor="invite-code">Invite Code</Label>
              <Input
                id="invite-code"
                placeholder="Paste invite code here"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                autoFocus
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="ws-name">Workspace Name</Label>
              <Input
                id="ws-name"
                placeholder="e.g. My Team"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
            </div>
          )}

          <button
            onClick={() => setJoinMode(!joinMode)}
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
          >
            {joinMode ? '→ Create a new workspace instead' : '→ Join with invite code instead'}
          </button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={joinMode ? handleJoin : handleCreate} disabled={loading}>
            {loading ? 'Loading...' : joinMode ? 'Join Workspace' : 'Create Workspace'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
