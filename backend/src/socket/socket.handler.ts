import { Server, Socket } from 'socket.io';
import { verifyToken } from '../lib/jwt';
import { User } from '../models/User';
import { Board } from '../models/Board';
import { isWorkspaceMember, USER_SELECT } from '../lib/helpers';
import { SocketUser } from '../types';

// boardId -> Map<socketId, SocketUser>
const boardRooms = new Map<string, Map<string, SocketUser>>();

function getBoardUsers(boardId: string): SocketUser[] {
  const room = boardRooms.get(boardId);
  if (!room) return [];
  return Array.from(room.values());
}

export function setupSocketHandlers(io: Server): void {
  // JWT authentication middleware for sockets
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication error: No token'));
      }

      const payload = verifyToken(token);
      const user = await User.findById(payload.userId).select(USER_SELECT);

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      const userObj = user.toJSON();
      socket.data.user = {
        userId: userObj.id,
        name: userObj.name,
        email: userObj.email,
        avatar: userObj.avatar,
      } as SocketUser;

      next();
    } catch {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const socketUser = socket.data.user as SocketUser;
    console.log(`Socket connected: ${socket.id} — ${socketUser.name}`);

    // ─── Board Room Management ──────────────────────────────────────────────

    socket.on('board:join', async ({ boardId }: { boardId: string }) => {
      try {
        // Verify membership
        const board = await Board.findById(boardId);
        if (!board) {
          socket.emit('error', { message: 'Access denied to this board' });
          return;
        }

        const isMember = await isWorkspaceMember(board.workspaceId.toString(), socketUser.userId);
        if (!isMember) {
          socket.emit('error', { message: 'Access denied to this board' });
          return;
        }

        // Leave previous board rooms first
        for (const room of socket.rooms) {
          if (room.startsWith('board:')) {
            const prevBoardId = room.replace('board:', '');
            socket.leave(room);
            const prevRoom = boardRooms.get(prevBoardId);
            if (prevRoom) {
              prevRoom.delete(socket.id);
              io.to(room).emit('user:leave', {
                user: socketUser,
                activeUsers: getBoardUsers(prevBoardId),
              });
            }
          }
        }

        const roomName = `board:${boardId}`;
        socket.join(roomName);

        if (!boardRooms.has(boardId)) {
          boardRooms.set(boardId, new Map());
        }
        boardRooms.get(boardId)!.set(socket.id, socketUser);

        const activeUsers = getBoardUsers(boardId);

        // Notify everyone in the room about the new user
        io.to(roomName).emit('user:join', { user: socketUser, activeUsers });

        // Send current active users back to the joining user
        socket.emit('board:joined', { boardId, activeUsers });

        console.log(`${socketUser.name} joined board ${boardId}`);
      } catch (err) {
        console.error('board:join error', err);
        socket.emit('error', { message: 'Failed to join board' });
      }
    });

    socket.on('board:leave', ({ boardId }: { boardId: string }) => {
      const roomName = `board:${boardId}`;
      socket.leave(roomName);
      const room = boardRooms.get(boardId);
      if (room) {
        room.delete(socket.id);
        const activeUsers = getBoardUsers(boardId);
        io.to(roomName).emit('user:leave', { user: socketUser, activeUsers });
      }
    });

    // ─── Board Events ───────────────────────────────────────────────────────

    socket.on('board:update', ({ boardId, board }: { boardId: string; board: unknown }) => {
      socket.to(`board:${boardId}`).emit('board:updated', { board });
    });

    // ─── Section Events ─────────────────────────────────────────────────────

    socket.on(
      'section:create',
      ({ boardId, section }: { boardId: string; section: unknown }) => {
        socket.to(`board:${boardId}`).emit('section:created', { section });
      }
    );

    socket.on(
      'section:update',
      ({ boardId, section }: { boardId: string; section: unknown }) => {
        socket.to(`board:${boardId}`).emit('section:updated', { section });
      }
    );

    socket.on(
      'section:delete',
      ({ boardId, sectionId }: { boardId: string; sectionId: string }) => {
        socket.to(`board:${boardId}`).emit('section:deleted', { sectionId });
      }
    );

    socket.on(
      'section:reorder',
      ({ boardId, orderedIds }: { boardId: string; orderedIds: string[] }) => {
        socket.to(`board:${boardId}`).emit('section:reordered', { orderedIds });
      }
    );

    // ─── Card Events ────────────────────────────────────────────────────────

    socket.on(
      'card:create',
      ({ boardId, card }: { boardId: string; card: unknown }) => {
        socket.to(`board:${boardId}`).emit('card:created', { card });
      }
    );

    socket.on(
      'card:update',
      ({ boardId, card }: { boardId: string; card: unknown }) => {
        socket.to(`board:${boardId}`).emit('card:updated', { card });
      }
    );

    socket.on(
      'card:delete',
      ({ boardId, cardId, sectionId }: { boardId: string; cardId: string; sectionId: string }) => {
        socket.to(`board:${boardId}`).emit('card:deleted', { cardId, sectionId });
      }
    );

    socket.on(
      'card:move',
      ({
        boardId,
        card,
        fromSectionId,
        toSectionId,
      }: {
        boardId: string;
        card: unknown;
        fromSectionId: string;
        toSectionId: string;
      }) => {
        socket
          .to(`board:${boardId}`)
          .emit('card:moved', { card, fromSectionId, toSectionId });
      }
    );

    socket.on(
      'card:reorder',
      ({
        boardId,
        sectionId,
        orderedIds,
      }: {
        boardId: string;
        sectionId: string;
        orderedIds: string[];
      }) => {
        socket.to(`board:${boardId}`).emit('card:reordered', { sectionId, orderedIds });
      }
    );

    // ─── Vote Events ────────────────────────────────────────────────────────

    socket.on(
      'vote:update',
      ({
        boardId,
        cardId,
        votesCount,
        votes,
      }: {
        boardId: string;
        cardId: string;
        votesCount: number;
        votes: { userId: string }[];
      }) => {
        socket.to(`board:${boardId}`).emit('vote:updated', { cardId, votesCount, votes });
      }
    );

    // ─── Comment Events ─────────────────────────────────────────────────────

    socket.on(
      'comment:create',
      ({ boardId, cardId, comment }: { boardId: string; cardId: string; comment: unknown }) => {
        socket.to(`board:${boardId}`).emit('comment:created', { cardId, comment });
      }
    );

    // ─── Disconnect ─────────────────────────────────────────────────────────

    socket.on('disconnect', () => {
      // Remove user from all board rooms they were in
      for (const [boardId, room] of boardRooms.entries()) {
        if (room.has(socket.id)) {
          room.delete(socket.id);
          const activeUsers = getBoardUsers(boardId);
          io.to(`board:${boardId}`).emit('user:leave', {
            user: socketUser,
            activeUsers,
          });
        }
      }
      console.log(`Socket disconnected: ${socket.id} — ${socketUser.name}`);
    });
  });
}
