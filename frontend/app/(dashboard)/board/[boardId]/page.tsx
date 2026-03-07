'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { boardApi } from '@/lib/api';
import { BoardHeader } from '@/components/board/BoardHeader';
import { BoardView } from '@/components/board/BoardView';

export default function BoardPage() {
  const params = useParams();
  const boardId = params.boardId as string;
  const { setCurrentBoard, workspaces, currentWorkspace, setCurrentWorkspace } = useAppStore();

  useEffect(() => {
    boardApi.getOne(boardId).then((res) => {
      const board = res.data.board;
      setCurrentBoard(board);

      // If the board belongs to a different workspace, update currentWorkspace
      if (currentWorkspace?.id !== board.workspaceId) {
        const matchingWorkspace = workspaces.find(w => w.id === board.workspaceId);
        if (matchingWorkspace) {
          setCurrentWorkspace(matchingWorkspace);
        }
      }
    });
  }, [boardId, currentWorkspace?.id, workspaces, setCurrentBoard, setCurrentWorkspace]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <BoardHeader boardId={boardId} />
      <BoardView boardId={boardId} />
    </div>
  );
}
