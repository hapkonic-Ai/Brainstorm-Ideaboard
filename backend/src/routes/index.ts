import { Router } from 'express';
import authRoutes from './auth.routes';
import workspaceRoutes from './workspace.routes';
import boardRoutes from './board.routes';
import sectionRoutes from './section.routes';
import cardRoutes from './card.routes';
import voteRoutes from './vote.routes';
import commentRoutes from './comment.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/workspaces', workspaceRoutes);
router.use('/boards', boardRoutes);
router.use('/sections', sectionRoutes);
router.use('/cards', cardRoutes);
router.use('/votes', voteRoutes);
router.use('/comments', commentRoutes);

export default router;
