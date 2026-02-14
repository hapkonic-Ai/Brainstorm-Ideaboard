'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import {
  LayoutGrid,
  Plus,
  Users,
  Clock,
  Copy,
  Check,
  Star,
  Zap,
  Scale,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { workspaceApi, boardApi } from '@/lib/api';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { CreateBoardModal } from '@/components/board/CreateBoardModal';
import { Board } from '@/types';
import { formatDate, cn } from '@/lib/utils';

const TEMPLATE_ICONS: Record<string, React.ReactNode> = {
  starfish: <Star className="h-4 w-4" />,
  six_hats: <Zap className="h-4 w-4" />,
  pros_cons: <Scale className="h-4 w-4" />,
  custom: <Sparkles className="h-4 w-4" />,
};

const TEMPLATE_COLORS: Record<string, string> = {
  starfish: 'bg-yellow-100 text-yellow-700',
  six_hats: 'bg-violet-100 text-violet-700',
  pros_cons: 'bg-green-100 text-green-700',
  custom: 'bg-blue-100 text-blue-700',
};

export default function WorkspacePage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const router = useRouter();

  const { currentWorkspace, setCurrentWorkspace, workspaces, boards, setBoards } = useAppStore();
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ws = workspaces.find((w) => w.id === workspaceId);
    if (ws) setCurrentWorkspace(ws);

    boardApi.getByWorkspace(workspaceId).then((res) => {
      setBoards(res.data.boards);
    }).finally(() => setLoading(false));
  }, [workspaceId]);

  async function copyInviteLink() {
    const workspace = currentWorkspace || workspaces.find((w) => w.id === workspaceId);
    if (!workspace) return;
    const url = `${window.location.origin}/join?code=${workspace.inviteCode}`;
    await navigator.clipboard.writeText(url);
    setCopiedInvite(true);
    toast({ title: 'Invite link copied to clipboard!' });
    setTimeout(() => setCopiedInvite(false), 2000);
  }

  const workspace = currentWorkspace || workspaces.find((w) => w.id === workspaceId);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Workspace header */}
      <div className="border-b border-gray-200 bg-white px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{workspace?.name}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {workspace?.members?.length || 0} member{(workspace?.members?.length || 0) !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1.5">
                <LayoutGrid className="h-4 w-4" />
                {boards.length} board{boards.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={copyInviteLink} size="sm">
              {copiedInvite ? (
                <Check className="h-4 w-4 mr-2 text-green-600" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              {copiedInvite ? 'Copied!' : 'Copy invite link'}
            </Button>
            <Button onClick={() => setShowCreateBoard(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Board
            </Button>
          </div>
        </div>
      </div>

      {/* Boards grid */}
      <div className="px-8 py-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-44 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : boards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
              <LayoutGrid className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No boards yet</h3>
            <p className="text-gray-500 mb-6 max-w-sm">
              Create your first board to start brainstorming and collaborating with your team.
            </p>
            <Button onClick={() => setShowCreateBoard(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Board
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {boards.map((board: Board) => (
              <BoardCard
                key={board.id}
                board={board}
                onClick={() => router.push(`/board/${board.id}`)}
              />
            ))}
            <button
              onClick={() => setShowCreateBoard(true)}
              className="h-44 rounded-2xl border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/50 transition-all flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-blue-600 group"
            >
              <Plus className="h-8 w-8 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">New Board</span>
            </button>
          </div>
        )}
      </div>

      <CreateBoardModal
        workspaceId={workspaceId}
        open={showCreateBoard}
        onOpenChange={setShowCreateBoard}
      />
    </div>
  );
}

function BoardCard({ board, onClick }: { board: Board; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group h-44 rounded-2xl border border-gray-200 bg-white hover:border-blue-300 hover:shadow-md transition-all text-left flex flex-col p-5 relative overflow-hidden"
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-violet-50/0 group-hover:from-blue-50/40 group-hover:to-violet-50/40 transition-all" />

      <div className="relative flex flex-col h-full">
        {/* Template badge */}
        <div className="mb-3">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full',
              TEMPLATE_COLORS[board.templateType] || 'bg-gray-100 text-gray-600'
            )}
          >
            {TEMPLATE_ICONS[board.templateType]}
            {board.templateType.replace('_', ' ')}
          </span>
        </div>

        {/* Board name */}
        <h3 className="font-semibold text-gray-900 text-base mb-1 line-clamp-2 group-hover:text-blue-700 transition-colors">
          {board.name}
        </h3>

        <div className="mt-auto flex items-center justify-between text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <LayoutGrid className="h-3 w-3" />
            {board._count?.sections || 0} sections
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDate(board.updatedAt)}
          </span>
        </div>
      </div>
    </button>
  );
}
