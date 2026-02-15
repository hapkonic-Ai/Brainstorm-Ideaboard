'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit2, Check, X, MoreHorizontal, Copy, Trash2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { boardApi } from '@/lib/api';
import { toast } from '@/components/ui/use-toast';
import { getSocket } from '@/lib/socket';
import { UserPresence } from './UserPresence';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface BoardHeaderProps {
  boardId: string;
}

export function BoardHeader({ boardId }: BoardHeaderProps) {
  const router = useRouter();
  const { currentBoard, currentWorkspace, updateBoard, removeBoard } = useAppStore();
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(currentBoard?.name || '');

  async function handleRename() {
    if (!newName.trim() || newName === currentBoard?.name) {
      setIsRenaming(false);
      setNewName(currentBoard?.name || '');
      return;
    }
    try {
      const res = await boardApi.update(boardId, { name: newName.trim() });
      updateBoard(res.data.board);
      getSocket()?.emit('board:update', { boardId, board: res.data.board });
      setIsRenaming(false);
    } catch {
      toast({ title: 'Failed to rename board', variant: 'destructive' });
    }
  }

  async function handleDuplicate() {
    try {
      const res = await boardApi.duplicate(boardId);
      toast({ title: 'Board duplicated successfully' });
      router.push(`/board/${res.data.board.id}`);
    } catch {
      toast({ title: 'Failed to duplicate board', variant: 'destructive' });
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${currentBoard?.name}"? This cannot be undone.`)) return;
    try {
      await boardApi.delete(boardId);
      removeBoard(boardId);
      toast({ title: 'Board deleted' });
      router.push(currentWorkspace ? `/workspace/${currentWorkspace.id}` : '/');
    } catch {
      toast({ title: 'Failed to delete board', variant: 'destructive' });
    }
  }

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0">
      {/* Left: back button + board name */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            router.push(currentWorkspace ? `/workspace/${currentWorkspace.id}` : '/')
          }
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        {isRenaming ? (
          <div className="flex items-center gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="text-lg font-semibold bg-transparent border-b-2 border-blue-500 focus:outline-none px-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename();
                if (e.key === 'Escape') { setIsRenaming(false); setNewName(currentBoard?.name || ''); }
              }}
              autoFocus
            />
            <button onClick={handleRename} className="text-green-600 hover:text-green-700">
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={() => { setIsRenaming(false); setNewName(currentBoard?.name || ''); }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 group">
            <h1 className="text-lg font-semibold text-gray-900 truncate max-w-xs">
              {currentBoard?.name}
            </h1>
            <button
              onClick={() => setIsRenaming(true)}
              className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 rounded transition-all"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {currentBoard?.templateType && currentBoard.templateType !== 'custom' && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
            {currentBoard.templateType.replace('_', ' ')}
          </span>
        )}
      </div>

      {/* Right: presence + actions */}
      <div className="flex items-center gap-3">
        <UserPresence />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setIsRenaming(true)}>
              <Edit2 className="h-4 w-4 mr-2" />
              Rename Board
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDuplicate}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate Board
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Board
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
