import { Router } from 'express';
import { toggleVote } from '../controllers/vote.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/toggle', toggleVote);

export default router;
