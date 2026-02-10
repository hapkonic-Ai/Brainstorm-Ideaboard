'use client';

import { useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import { useAppStore } from '@/store/useAppStore';
import { Card, Section, ActiveUser, Comment } from '@/types';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const {
    token,
    setIsConnected,
    addSection,
    updateSection,
    removeSection,
    reorderSections,
    addCard,
    updateCard,
    removeCard,
    moveCard,
    reorderCards,
    updateCardVotes,
    setActiveUsers,
    addComment,
    updateBoard,
  } = useAppStore();

  useEffect(() => {
    if (!token) return;

    const socket = connectSocket(token);
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // ─── Board Events ───────────────────────────────────────────────────────
    socket.on('board:updated', ({ board }: { board: { id: string; name: string } }) => {
      updateBoard(board as Parameters<typeof updateBoard>[0]);
    });

    // ─── Section Events ─────────────────────────────────────────────────────
    socket.on('section:created', ({ section }: { section: Section }) => {
      addSection(section);
    });

    socket.on('section:updated', ({ section }: { section: Section }) => {
      updateSection(section);
    });

    socket.on('section:deleted', ({ sectionId }: { sectionId: string }) => {
      removeSection(sectionId);
    });

    socket.on('section:reordered', ({ orderedIds }: { orderedIds: string[] }) => {
      reorderSections(orderedIds);
    });

    // ─── Card Events ────────────────────────────────────────────────────────
    socket.on('card:created', ({ card }: { card: Card }) => {
      addCard(card);
    });

    socket.on('card:updated', ({ card }: { card: Card }) => {
      updateCard(card);
    });

    socket.on(
      'card:deleted',
      ({ cardId, sectionId }: { cardId: string; sectionId: string }) => {
        removeCard(cardId, sectionId);
      }
    );

    socket.on(
      'card:moved',
      ({
        card,
        fromSectionId,
        toSectionId,
      }: {
        card: Card;
        fromSectionId: string;
        toSectionId: string;
      }) => {
        moveCard(card, fromSectionId, toSectionId);
      }
    );

    socket.on(
      'card:reordered',
      ({ sectionId, orderedIds }: { sectionId: string; orderedIds: string[] }) => {
        reorderCards(sectionId, orderedIds);
      }
    );

    // ─── Vote Events ────────────────────────────────────────────────────────
    socket.on(
      'vote:updated',
      ({
        cardId,
        votesCount,
        votes,
      }: {
        cardId: string;
        votesCount: number;
        votes: { userId: string }[];
      }) => {
        updateCardVotes(cardId, votesCount, votes);
      }
    );

    // ─── Comment Events ─────────────────────────────────────────────────────
    socket.on(
      'comment:created',
      ({ cardId, comment }: { cardId: string; comment: Comment }) => {
        addComment(cardId, comment);
      }
    );

    // ─── Presence Events ────────────────────────────────────────────────────
    socket.on('user:join', ({ activeUsers }: { activeUsers: ActiveUser[] }) => {
      setActiveUsers(activeUsers);
    });

    socket.on('user:leave', ({ activeUsers }: { activeUsers: ActiveUser[] }) => {
      setActiveUsers(activeUsers);
    });

    socket.on('board:joined', ({ activeUsers }: { activeUsers: ActiveUser[] }) => {
      setActiveUsers(activeUsers);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('board:updated');
      socket.off('section:created');
      socket.off('section:updated');
      socket.off('section:deleted');
      socket.off('section:reordered');
      socket.off('card:created');
      socket.off('card:updated');
      socket.off('card:deleted');
      socket.off('card:moved');
      socket.off('card:reordered');
      socket.off('vote:updated');
      socket.off('comment:created');
      socket.off('user:join');
      socket.off('user:leave');
      socket.off('board:joined');
    };
  }, [token]);

  const joinBoard = (boardId: string) => {
    socketRef.current?.emit('board:join', { boardId });
  };

  const leaveBoard = (boardId: string) => {
    socketRef.current?.emit('board:leave', { boardId });
  };

  const emit = (event: string, data: unknown) => {
    socketRef.current?.emit(event, data);
  };

  return { socket: socketRef.current, joinBoard, leaveBoard, emit };
}
