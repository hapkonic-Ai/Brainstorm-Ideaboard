'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ThumbsUp, MessageSquare, GripVertical } from 'lucide-react';
import { Card } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { getInitials, getAvatarColor, cn } from '@/lib/utils';
import { CardModal } from './CardModal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { voteApi } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { toast } from '@/components/ui/use-toast';

interface CardItemProps {
  card: Card;
  boardId: string;
  isDragOverlay?: boolean;
}

export function CardItem({ card, boardId, isDragOverlay = false }: CardItemProps) {
  const { user, updateCardVotes } = useAppStore();
  const [showModal, setShowModal] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: 'card', card, sectionId: card.sectionId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const hasVoted = card.votes?.some((v) => v.userId === user?.id);

  async function handleVote(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      const res = await voteApi.toggle(card.id);
      updateCardVotes(card.id, res.data.card.votesCount, res.data.card.votes);
      getSocket()?.emit('vote:update', {
        boardId,
        cardId: card.id,
        votesCount: res.data.card.votesCount,
        votes: res.data.card.votes,
      });
    } catch {
      toast({ title: 'Failed to vote', variant: 'destructive' });
    }
  }

  if (isDragging && !isDragOverlay) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="h-[72px] rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/50"
      />
    );
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer select-none',
          isDragOverlay && 'shadow-xl rotate-2 opacity-95 border-blue-300'
        )}
        onClick={() => setShowModal(true)}
      >
        <div className="p-3">
          {/* Drag handle + content */}
          <div className="flex gap-2">
            <div
              {...attributes}
              {...listeners}
              className="opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 cursor-grab active:cursor-grabbing shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>

            <p className="flex-1 text-sm text-gray-800 leading-relaxed break-words line-clamp-3">
              {card.content}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
            {/* Author avatar */}
            <div className="flex items-center gap-1.5">
              <Avatar className="h-5 w-5">
                {card.author?.avatar ? <AvatarImage src={card.author.avatar} /> : null}
                <AvatarFallback
                  className="text-[9px] font-bold text-white"
                  style={{ backgroundColor: getAvatarColor(card.author?.name || '') }}
                >
                  {getInitials(card.author?.name || '?')}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-gray-400 truncate max-w-[80px]">
                {card.author?.name}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {/* Comment count */}
              {(card._count?.comments ?? 0) > 0 && (
                <span className="flex items-center gap-0.5 text-xs text-gray-400 px-1.5 py-0.5 rounded-full">
                  <MessageSquare className="h-3 w-3" />
                  {card._count?.comments}
                </span>
              )}

              {/* Vote button */}
              <button
                onClick={handleVote}
                className={cn(
                  'flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-all',
                  hasVoted
                    ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold'
                    : 'border-gray-200 text-gray-500 hover:border-blue-200 hover:text-blue-600'
                )}
              >
                <ThumbsUp className={cn('h-3 w-3', hasVoted && 'fill-blue-600')} />
                {card.votesCount}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <CardModal card={card} boardId={boardId} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}
