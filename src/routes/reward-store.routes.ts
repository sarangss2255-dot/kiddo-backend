import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import * as storeCtrl from '../controllers/reward-store.controller.js';

const router = Router();

router.use(authenticate);

router.get('/categories', storeCtrl.listCategories);
router.get('/items', storeCtrl.listItems);
router.get('/items/featured', storeCtrl.getFeaturedItems);
router.get('/items/recent', storeCtrl.getRecentlyAdded);
router.get('/items/:id', storeCtrl.getItemDetail);
router.post('/purchase', authorize('child'), storeCtrl.purchaseItem);
router.get('/inventory', storeCtrl.getInventory);
router.post('/inventory/:id/equip', authorize('child'), storeCtrl.equipItem);

router.post('/categories', authorize('admin'), storeCtrl.createCategory);
router.patch('/categories/:id', authorize('admin'), storeCtrl.updateCategory);
router.post('/items', authorize('admin'), storeCtrl.createItem);
router.patch('/items/:id', authorize('admin'), storeCtrl.updateItem);

export default router;
