import { Router } from 'express';
import {
  createSection,
  updateSection,
  deleteSection,
  reorderSections,
} from '../controllers/section.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', createSection);
router.put('/reorder', reorderSections);
router.put('/:id', updateSection);
router.delete('/:id', deleteSection);

export default router;
