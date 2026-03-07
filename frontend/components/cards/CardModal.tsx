'use client';

import { useState, useEffect, useCallback } from 'react';
import { MessageSquare, ThumbsUp, Trash2, X, Edit2, Check } from 'lucide-react';
import { Card, Comment } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { cardApi, voteApi, commentApi } from '@/lib/api';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials, getAvatarColor, formatRelativeTime } from '@/lib/utils';
import { getSocket } from '@/lib/socket';

interface CardModalProps {
  card: Card;
  boardId: string;
  onClose: () => void;
}

export function CardModal({ card, boardId, onClose }: CardModalProps) {
  const { user, comments, setComments, addComment, removeComment, updateCard, updateCardVotes, removeCard } =
    useAppStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(card.content);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  const cardComments = comments[card.id] || [];
  const hasVoted = card.votes?.some((v) => v.userId === user?.id);

  const loadComments = useCallback(async () => {
    setLoadingComments(true);
    try {
      const res = await commentApi.getByCard(card.id);
      setComments(card.id, res.data.comments);
    } catch {
      // silent
    } finally {
      setLoadingComments(false);
    }
  }, [card.id, setComments]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  async function handleSaveEdit() {
    if (!editContent.trim() || editContent === card.content) {
      setIsEditing(false);
      return;
    }
    setSavingEdit(true);
    try {
      const res = await cardApi.update(card.id, { content: editContent.trim() });
      updateCard(res.data.card);
      getSocket()?.emit('card:update', { boardId, card: res.data.card });
      setIsEditing(false);
    } catch {
      toast({ title: 'Failed to update card', variant: 'destructive' });
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleVote() {
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

  async function handleAddComment() {
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await commentApi.create({ cardId: card.id, content: newComment.trim() });
      addComment(card.id, res.data.comment);
      getSocket()?.emit('comment:create', {
        boardId,
        cardId: card.id,
        comment: res.data.comment,
      });
      setNewComment('');
    } catch {
      toast({ title: 'Failed to add comment', variant: 'destructive' });
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    try {
      await commentApi.delete(commentId);
      removeComment(card.id, commentId);
    } catch {
      toast({ title: 'Failed to delete comment', variant: 'destructive' });
    }
  }

  async function handleDeleteCard() {
    if (!confirm('Delete this card?')) return;
    try {
      await cardApi.delete(card.id);
      removeCard(card.id, card.sectionId);
      getSocket()?.emit('card:delete', {
        boardId,
        cardId: card.id,
        sectionId: card.sectionId,
      });
      onClose();
    } catch {
      toast({ title: 'Failed to delete card', variant: 'destructive' });
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b">
          <div className="flex-1 mr-4">
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="text-base resize-none"
                  rows={3}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.metaKey) handleSaveEdit();
                    if (e.key === 'Escape') setIsEditing(false);
                  }}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveEdit} disabled={savingEdit}>
                    <Check className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-base font-medium text-gray-900 leading-relaxed">{card.content}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Meta info */}
        <div className="px-6 py-3 bg-gray-50 flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              {card.author.avatar ? <AvatarImage src={card.author.avatar} /> : null}
              <AvatarFallback
                className="text-xs text-white"
                style={{ backgroundColor: getAvatarColor(card.author.name) }}
              >
                {getInitials(card.author.name)}
              </AvatarFallback>
            </Avatar>
            <span>by <strong>{card.author.name}</strong></span>
            <span>·</span>
            <span>{formatRelativeTime(card.createdAt)}</span>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing && user?.id === card.authorId && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 rounded-md hover:bg-gray-200 transition-colors"
                title="Edit card"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
            )}
            {user?.id === card.authorId && (
              <button
                onClick={handleDeleteCard}
                className="p-1.5 rounded-md hover:bg-red-100 hover:text-red-600 transition-colors"
                title="Delete card"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Voting */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Votes</h3>
            <button
              onClick={handleVote}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 text-sm font-medium transition-all ${hasVoted
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-blue-300 text-gray-600 hover:text-blue-600'
                }`}
            >
              <ThumbsUp className={`h-4 w-4 ${hasVoted ? 'fill-blue-500' : ''}`} />
              <span>{card.votesCount} vote{card.votesCount !== 1 ? 's' : ''}</span>
            </button>
          </div>

          {/* Comments */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Comments ({cardComments.length})
            </h3>

            <div className="space-y-3 mb-4">
              {loadingComments ? (
                <div className="text-sm text-gray-400">Loading comments...</div>
              ) : cardComments.length === 0 ? (
                <div className="text-sm text-gray-400">No comments yet. Be the first!</div>
              ) : (
                cardComments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    currentUserId={user?.id}
                    onDelete={handleDeleteComment}
                  />
                ))
              )}
            </div>

            {/* Add comment */}
            <div className="flex gap-2">
              <Avatar className="h-8 w-8 shrink-0">
                {user?.avatar ? <AvatarImage src={user.avatar} /> : null}
                <AvatarFallback
                  className="text-xs text-white"
                  style={{ backgroundColor: getAvatarColor(user?.name || '') }}
                >
                  {getInitials(user?.name || '?')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 flex gap-2">
                <Textarea
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="resize-none text-sm min-h-[60px]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.metaKey) handleAddComment();
                  }}
                />
                <Button
                  size="sm"
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || submittingComment}
                  className="self-end"
                >
                  Post
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  currentUserId,
  onDelete,
}: {
  comment: Comment;
  currentUserId?: string;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex gap-3 group">
      <Avatar className="h-7 w-7 shrink-0">
        {comment.user.avatar ? <AvatarImage src={comment.user.avatar} /> : null}
        <AvatarFallback
          className="text-xs text-white"
          style={{ backgroundColor: getAvatarColor(comment.user.name) }}
        >
          {getInitials(comment.user.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-gray-900">{comment.user.name}</span>
          <span className="text-xs text-gray-400">{formatRelativeTime(comment.createdAt)}</span>
        </div>
        <p className="text-sm text-gray-700 break-words">{comment.content}</p>
      </div>
      {currentUserId === comment.userId && (
        <button
          onClick={() => onDelete(comment.id)}
          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
