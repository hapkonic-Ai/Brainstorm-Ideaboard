import { Router } from 'express';
import { createComment, getComments, deleteComment } from '../controllers/comment.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', createComment);
router.get('/:cardId', getComments);
router.delete('/:id', deleteComment);

export default router;
