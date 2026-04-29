import { Router } from 'express';
import * as dataController from '../controllers/dataController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Public registration (still requires the header but handling check slightly differently)
router.post('/register', dataController.registerUser);

// All other routes require authentication
router.use(authenticate);

router.get('/profile', dataController.getProfile);
router.get('/kids', dataController.getKids);
router.get('/tasks', dataController.getTasks);
router.post('/tasks', requireRole(['parent', 'admin']), dataController.createTask);
router.patch('/tasks/:id', requireRole(['parent', 'admin', 'kid']), dataController.updateTask);
router.post('/tasks/:id/approve', requireRole(['parent', 'admin']), dataController.approveTask);
router.post('/games/chess/reward', requireRole(['kid']), dataController.rewardChessWin);

export default router;
