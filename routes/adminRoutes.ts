import { Router } from 'express';
import * as adminController from '../controllers/adminController';
import { authenticateAdmin } from '../middleware/auth';

const router = Router();

// All routes here are prefixed with /api/admin
router.use(authenticateAdmin);

router.get('/stats', adminController.getStats);
router.get('/users', adminController.listUsers);
router.post('/set-role', adminController.setRole);
router.post('/broadcast', adminController.broadcast);

export default router;
