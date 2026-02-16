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
  const { setCurrentBoard } = useAppStore();

  useEffect(() => {
    boardApi.getOne(boardId).then((res) => {
      setCurrentBoard(res.data.board);
    });
  }, [boardId]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <BoardHeader boardId={boardId} />
      <BoardView boardId={boardId} />
    </div>
  );
}
