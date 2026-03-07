import { Router } from 'express';
import {
  createBoard,
  getBoards,
  getBoard,
  updateBoard,
  deleteBoard,
  duplicateBoard,
} from '../controllers/board.controller';
import {
  createInvite,
  getMyInvites,
  acceptInvite,
  declineInvite,
} from '../controllers/invitation.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// Invitation endpoints
router.get('/invites/me', getMyInvites);
router.post('/invites/:inviteId/accept', acceptInvite);
router.post('/invites/:inviteId/decline', declineInvite);
router.post('/:id/invites', createInvite);

router.post('/', createBoard);
router.get('/workspace/:workspaceId', getBoards);
router.get('/:id', getBoard);
router.put('/:id', updateBoard);
router.delete('/:id', deleteBoard);
router.post('/:id/duplicate', duplicateBoard);

export default router;
