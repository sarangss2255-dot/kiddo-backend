import { Router } from 'express';
import * as avatarController from '../controllers/avatar.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authenticate, avatarController.getAvatar);
router.patch('/', authenticate, avatarController.updateAvatar);
router.get('/store', authenticate, avatarController.getStore);
router.get('/inventory', authenticate, avatarController.getInventory);
router.post('/equip', authenticate, avatarController.equipItem);
router.post('/buy', authenticate, avatarController.buyItem);
router.get('/events', authenticate, avatarController.getEvents);
router.post('/animation', authenticate, avatarController.triggerAnimation);
router.post('/seed', avatarController.seedAvatarItems);

export default router;
