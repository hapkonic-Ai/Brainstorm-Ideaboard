import { Router } from 'express';
import {
  createWorkspace,
  getWorkspaces,
  getWorkspace,
  joinWorkspace,
  updateWorkspace,
} from '../controllers/workspace.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', createWorkspace);
router.get('/', getWorkspaces);
router.get('/:id', getWorkspace);
router.put('/:id', updateWorkspace);
router.post('/join', joinWorkspace);

export default router;
