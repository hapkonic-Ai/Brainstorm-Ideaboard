import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { searchUsers } from '../controllers/user.controller';

const router = Router();

router.use(authenticate);

router.get('/search', searchUsers);

export default router;
