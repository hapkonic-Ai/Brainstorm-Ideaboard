import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { searchUsers, updateProfile } from '../controllers/user.controller';

const router = Router();

router.use(authenticate);

router.get('/search', searchUsers);
router.put('/me', updateProfile);

export default router;
