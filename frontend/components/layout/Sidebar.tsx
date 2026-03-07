'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutGrid,
  Plus,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  Link2,
  Copy,
  Check,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { workspaceApi, boardApi } from '@/lib/api';
import { clearAuth } from '@/lib/auth';
import { disconnectSocket } from '@/lib/socket';
import { toast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials, getAvatarColor, cn } from '@/lib/utils';
import { CreateWorkspaceModal } from '@/components/workspace/CreateWorkspaceModal';
import { CreateBoardModal } from '@/components/board/CreateBoardModal';
import { NotificationsMenu } from '@/components/layout/NotificationsMenu';
import { Board } from '@/types';

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    user,
    workspaces,
    currentWorkspace,
    boards,
    setWorkspaces,
    setCurrentWorkspace,
    setBoards,
    setUser,
    setToken,
    removeWorkspace,
  } = useAppStore();

  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [workspaceExpanded, setWorkspaceExpanded] = useState(true);
  const [copiedInvite, setCopiedInvite] = useState(false);

  // Load workspaces on mount
  useEffect(() => {
    workspaceApi.getAll().then((res) => {
      setWorkspaces(res.data.workspaces);
      if (!currentWorkspace && res.data.workspaces.length > 0) {
        setCurrentWorkspace(res.data.workspaces[0]);
      }
    });
  }, []);

  // Load boards when workspace changes
  useEffect(() => {
    if (!currentWorkspace) return;
    boardApi.getByWorkspace(currentWorkspace.id).then((res) => {
      setBoards(res.data.boards);
    });
  }, [currentWorkspace?.id]);

  function handleLogout() {
    clearAuth();
    disconnectSocket();
    setUser(null);
    setToken(null);
    router.push('/login');
  }

  async function copyInviteLink() {
    if (!currentWorkspace) return;
    const url = `${window.location.origin}/join?code=${currentWorkspace.inviteCode}`;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback for non-HTTPS environments (especially on mobile)
        const textArea = document.createElement("textarea");
        textArea.value = url;
        // Make the textarea out of viewport
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          document.execCommand('copy');
        } catch (err) {
          console.error("Fallback: Oops, unable to copy", err);
          toast({ title: 'Failed to copy link. Please manually copy it: ' + url, variant: 'destructive' });
          document.body.removeChild(textArea);
          return;
        }
        document.body.removeChild(textArea);
      }

      setCopiedInvite(true);
      toast({ title: 'Invite link copied!' });
      setTimeout(() => setCopiedInvite(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
      toast({ title: 'Failed to copy link. Please try again.', variant: 'destructive' });
    }
  }

  async function handleDeleteWorkspace(wsId: string, wsName: string) {
    if (!window.confirm(`Are you sure you want to delete the workspace "${wsName}"? All boards, sections, and cards will be permanently destroyed. This cannot be undone.`)) {
      return;
    }

    try {
      await workspaceApi.delete(wsId);
      toast({ title: 'Workspace deleted.' });
      removeWorkspace(wsId);

      const remainingWorkspaces = workspaces.filter(w => w.id !== wsId);
      if (remainingWorkspaces.length > 0) {
        setCurrentWorkspace(remainingWorkspaces[0]);
        router.push(`/workspace/${remainingWorkspaces[0].id}`);
      } else {
        router.push('/');
      }
    } catch (err: any) {
      toast({ title: err.response?.data?.error || 'Failed to delete workspace', variant: 'destructive' });
    }
  }

  const activeBoardId = pathname.match(/\/board\/([^/]+)/)?.[1];

  return (
    <>
      <aside className="w-64 shrink-0 bg-white border-r border-gray-200 flex flex-col h-full">
        {/* App logo & Notifications */}
        <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">B</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900">BrainBoard</h1>
              <p className="text-xs text-gray-400">Collaborative ideation</p>
            </div>
          </div>
          <NotificationsMenu />
        </div>

        {/* Workspace selector */}
        <div className="px-3 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Workspace
            </span>
            <button
              onClick={() => setShowCreateWorkspace(true)}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              title="New workspace"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Workspace list */}
          <div className="space-y-1">
            {workspaces.map((ws) => {
              const isOwner = ws.members?.find((m: any) => m.userId === user?.id)?.role === 'OWNER';
              const isActive = currentWorkspace?.id === ws.id;

              return (
                <div key={ws.id} className={cn(
                  'group flex items-center justify-between px-2 py-2 rounded-lg text-sm transition-colors',
                  isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                )}>
                  <button
                    onClick={() => { setCurrentWorkspace(ws); router.push(`/workspace/${ws.id}`); }}
                    className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
                  >
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: getAvatarColor(ws.name) }}
                    >
                      {ws.name[0].toUpperCase()}
                    </div>
                    <span className={cn('truncate', isActive && 'font-medium')}>{ws.name}</span>
                  </button>

                  {isOwner && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteWorkspace(ws.id, ws.name); }}
                      className="p-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all shrink-0"
                      title="Delete workspace"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Boards list */}
        {currentWorkspace && (
          <div className="flex-1 overflow-y-auto px-3 py-3">
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => setWorkspaceExpanded(!workspaceExpanded)}
                className="flex items-center gap-1 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors"
              >
                {workspaceExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
                Boards
              </button>
              <button
                onClick={() => setShowCreateBoard(true)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="New board"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            {workspaceExpanded && (
              <div className="space-y-0.5">
                {boards.map((board: Board) => (
                  <button
                    key={board.id}
                    onClick={() => router.push(`/board/${board.id}`)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors text-left',
                      activeBoardId === board.id
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <LayoutGrid className="h-4 w-4 shrink-0 text-gray-400" />
                    <span className="truncate">{board.name}</span>
                  </button>
                ))}

                {boards.length === 0 && (
                  <div className="text-xs text-gray-400 px-2 py-3 text-center">
                    No boards yet.{' '}
                    <button
                      onClick={() => setShowCreateBoard(true)}
                      className="text-blue-600 hover:underline"
                    >
                      Create one
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Invite link */}
        {currentWorkspace && (
          <div className="px-3 py-2 border-t border-gray-100">
            <button
              onClick={copyInviteLink}
              className="w-full flex items-center gap-2 px-2.5 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {copiedInvite ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Link2 className="h-4 w-4" />
              )}
              {copiedInvite ? 'Copied!' : 'Copy invite link'}
            </button>
          </div>
        )}

        {/* User profile */}
        <div className="px-3 py-3 border-t border-gray-200">
          <div className="flex items-center gap-2.5">
            <Avatar className="h-8 w-8">
              {user?.avatar ? <AvatarImage src={user.avatar} /> : null}
              <AvatarFallback
                className="text-xs font-semibold text-white"
                style={{ backgroundColor: getAvatarColor(user?.name || '') }}
              >
                {getInitials(user?.name || '?')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      <CreateWorkspaceModal open={showCreateWorkspace} onOpenChange={setShowCreateWorkspace} />
      {currentWorkspace && (
        <CreateBoardModal
          workspaceId={currentWorkspace.id}
          open={showCreateBoard}
          onOpenChange={setShowCreateBoard}
        />
      )}
    </>
  );
}
