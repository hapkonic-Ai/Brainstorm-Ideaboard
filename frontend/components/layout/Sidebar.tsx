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
    await navigator.clipboard.writeText(url);
    setCopiedInvite(true);
    toast({ title: 'Invite link copied!' });
    setTimeout(() => setCopiedInvite(false), 2000);
  }

  const activeBoardId = pathname.match(/\/board\/([^/]+)/)?.[1];

  return (
    <>
      <aside className="w-64 shrink-0 bg-white border-r border-gray-200 flex flex-col h-full">
        {/* App logo */}
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">B</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900">BrainBoard</h1>
              <p className="text-xs text-gray-400">Collaborative ideation</p>
            </div>
          </div>
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
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => { setCurrentWorkspace(ws); router.push(`/workspace/${ws.id}`); }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-colors text-left',
                  currentWorkspace?.id === ws.id
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ backgroundColor: getAvatarColor(ws.name) }}
                >
                  {ws.name[0].toUpperCase()}
                </div>
                <span className="truncate">{ws.name}</span>
              </button>
            ))}
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
