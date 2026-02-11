import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  User,
  Workspace,
  Board,
  Section,
  Card,
  ActiveUser,
  Comment,
} from '@/types';

interface AppState {
  // ─── Auth ──────────────────────────────────────────────────────────────────
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;

  // ─── Workspaces ────────────────────────────────────────────────────────────
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  setWorkspaces: (workspaces: Workspace[]) => void;
  addWorkspace: (workspace: Workspace) => void;
  updateWorkspace: (workspace: Workspace) => void;
  setCurrentWorkspace: (workspace: Workspace | null) => void;

  // ─── Boards ────────────────────────────────────────────────────────────────
  boards: Board[];
  currentBoard: Board | null;
  setBoards: (boards: Board[]) => void;
  addBoard: (board: Board) => void;
  updateBoard: (board: Board) => void;
  removeBoard: (boardId: string) => void;
  setCurrentBoard: (board: Board | null) => void;

  // ─── Sections ──────────────────────────────────────────────────────────────
  sections: Section[];
  setSections: (sections: Section[]) => void;
  addSection: (section: Section) => void;
  updateSection: (section: Section) => void;
  removeSection: (sectionId: string) => void;
  reorderSections: (orderedIds: string[]) => void;

  // ─── Cards ─────────────────────────────────────────────────────────────────
  addCard: (card: Card) => void;
  updateCard: (card: Card) => void;
  removeCard: (cardId: string, sectionId: string) => void;
  moveCard: (card: Card, fromSectionId: string, toSectionId: string) => void;
  reorderCards: (sectionId: string, orderedIds: string[]) => void;
  updateCardVotes: (cardId: string, votesCount: number, votes: { userId: string }[]) => void;

  // ─── Comments ──────────────────────────────────────────────────────────────
  comments: Record<string, Comment[]>;
  setComments: (cardId: string, comments: Comment[]) => void;
  addComment: (cardId: string, comment: Comment) => void;
  removeComment: (cardId: string, commentId: string) => void;

  // ─── Presence ──────────────────────────────────────────────────────────────
  activeUsers: ActiveUser[];
  setActiveUsers: (users: ActiveUser[]) => void;

  // ─── Socket ────────────────────────────────────────────────────────────────
  isConnected: boolean;
  setIsConnected: (connected: boolean) => void;

  // ─── UI State ──────────────────────────────────────────────────────────────
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      // ─── Auth ──────────────────────────────────────────────────────────────
      user: null,
      token: null,
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),

      // ─── Workspaces ────────────────────────────────────────────────────────
      workspaces: [],
      currentWorkspace: null,
      setWorkspaces: (workspaces) => set({ workspaces }),
      addWorkspace: (workspace) =>
        set((s) => ({ workspaces: [...s.workspaces, workspace] })),
      updateWorkspace: (workspace) =>
        set((s) => ({
          workspaces: s.workspaces.map((w) =>
            w.id === workspace.id ? workspace : w
          ),
          currentWorkspace:
            s.currentWorkspace?.id === workspace.id ? workspace : s.currentWorkspace,
        })),
      setCurrentWorkspace: (currentWorkspace) => set({ currentWorkspace }),

      // ─── Boards ────────────────────────────────────────────────────────────
      boards: [],
      currentBoard: null,
      setBoards: (boards) => set({ boards }),
      addBoard: (board) => set((s) => ({ boards: [board, ...s.boards] })),
      updateBoard: (board) =>
        set((s) => ({
          boards: s.boards.map((b) => (b.id === board.id ? board : b)),
          currentBoard: s.currentBoard?.id === board.id ? board : s.currentBoard,
        })),
      removeBoard: (boardId) =>
        set((s) => ({
          boards: s.boards.filter((b) => b.id !== boardId),
          currentBoard: s.currentBoard?.id === boardId ? null : s.currentBoard,
        })),
      setCurrentBoard: (currentBoard) => set({ currentBoard }),

      // ─── Sections ──────────────────────────────────────────────────────────
      sections: [],
      setSections: (sections) => set({ sections }),
      addSection: (section) =>
        set((s) => ({ sections: [...s.sections, { ...section, cards: [] }] })),
      updateSection: (section) =>
        set((s) => ({
          sections: s.sections.map((sec) =>
            sec.id === section.id ? { ...sec, ...section } : sec
          ),
        })),
      removeSection: (sectionId) =>
        set((s) => ({
          sections: s.sections.filter((sec) => sec.id !== sectionId),
        })),
      reorderSections: (orderedIds) =>
        set((s) => {
          const sectionMap = new Map(s.sections.map((sec) => [sec.id, sec]));
          const reordered = orderedIds
            .map((id, index) => {
              const sec = sectionMap.get(id);
              return sec ? { ...sec, position: index } : null;
            })
            .filter(Boolean) as Section[];
          return { sections: reordered };
        }),

      // ─── Cards ─────────────────────────────────────────────────────────────
      addCard: (card) =>
        set((s) => ({
          sections: s.sections.map((sec) =>
            sec.id === card.sectionId
              ? { ...sec, cards: [...sec.cards, card] }
              : sec
          ),
        })),
      updateCard: (card) =>
        set((s) => ({
          sections: s.sections.map((sec) =>
            sec.id === card.sectionId
              ? {
                  ...sec,
                  cards: sec.cards.map((c) => (c.id === card.id ? card : c)),
                }
              : sec
          ),
        })),
      removeCard: (cardId, sectionId) =>
        set((s) => ({
          sections: s.sections.map((sec) =>
            sec.id === sectionId
              ? { ...sec, cards: sec.cards.filter((c) => c.id !== cardId) }
              : sec
          ),
        })),
      moveCard: (card, fromSectionId, toSectionId) =>
        set((s) => ({
          sections: s.sections.map((sec) => {
            if (sec.id === fromSectionId) {
              return { ...sec, cards: sec.cards.filter((c) => c.id !== card.id) };
            }
            if (sec.id === toSectionId) {
              const exists = sec.cards.find((c) => c.id === card.id);
              if (exists) {
                return { ...sec, cards: sec.cards.map((c) => (c.id === card.id ? card : c)) };
              }
              const newCards = [...sec.cards, card].sort((a, b) => a.position - b.position);
              return { ...sec, cards: newCards };
            }
            return sec;
          }),
        })),
      reorderCards: (sectionId, orderedIds) =>
        set((s) => ({
          sections: s.sections.map((sec) => {
            if (sec.id !== sectionId) return sec;
            const cardMap = new Map(sec.cards.map((c) => [c.id, c]));
            const reordered = orderedIds
              .map((id, i) => {
                const c = cardMap.get(id);
                return c ? { ...c, position: i } : null;
              })
              .filter(Boolean) as Card[];
            return { ...sec, cards: reordered };
          }),
        })),
      updateCardVotes: (cardId, votesCount, votes) =>
        set((s) => ({
          sections: s.sections.map((sec) => ({
            ...sec,
            cards: sec.cards.map((c) =>
              c.id === cardId ? { ...c, votesCount, votes } : c
            ),
          })),
        })),

      // ─── Comments ──────────────────────────────────────────────────────────
      comments: {},
      setComments: (cardId, comments) =>
        set((s) => ({ comments: { ...s.comments, [cardId]: comments } })),
      addComment: (cardId, comment) =>
        set((s) => ({
          comments: {
            ...s.comments,
            [cardId]: [...(s.comments[cardId] || []), comment],
          },
        })),
      removeComment: (cardId, commentId) =>
        set((s) => ({
          comments: {
            ...s.comments,
            [cardId]: (s.comments[cardId] || []).filter((c) => c.id !== commentId),
          },
        })),

      // ─── Presence ──────────────────────────────────────────────────────────
      activeUsers: [],
      setActiveUsers: (activeUsers) => set({ activeUsers }),

      // ─── Socket ────────────────────────────────────────────────────────────
      isConnected: false,
      setIsConnected: (isConnected) => set({ isConnected }),

      // ─── UI ────────────────────────────────────────────────────────────────
      sidebarOpen: true,
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
    }),
    { name: 'BrainstormStore' }
  )
);
