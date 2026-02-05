import { Router } from 'express';
import {
  createCard,
  updateCard,
  deleteCard,
  moveCard,
  reorderCards,
} from '../controllers/card.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', createCard);
router.put('/reorder', reorderCards);
router.put('/:id', updateCard);
router.put('/:id/move', moveCard);
router.delete('/:id', deleteCard);

export default router;
