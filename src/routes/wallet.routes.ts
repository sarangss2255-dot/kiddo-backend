import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import * as walletCtrl from '../controllers/wallet.controller.js';

const router = Router();

router.use(authenticate);

router.get('/me', walletCtrl.getMyWallet);
router.get('/transactions', walletCtrl.getTransactions);
router.get('/conversions', walletCtrl.getConversions);
router.post('/convert', authorize('child'), walletCtrl.convertPoints);
router.post('/convert/request', authorize('child'), walletCtrl.requestConversion);
router.post('/conversions/:id/approve', authorize('parent', 'admin'), walletCtrl.approveConversion);
router.post('/conversions/:id/reject', authorize('parent', 'admin'), walletCtrl.rejectConversion);
router.get('/conversions/pending', authorize('parent', 'admin'), walletCtrl.getPendingConversions);
router.post('/gift/points', authorize('parent', 'teacher', 'admin'), walletCtrl.giftPoints);
router.post('/gift/coins', authorize('parent', 'admin'), walletCtrl.giftCoins);
router.get('/child/:childId', authorize('parent', 'admin'), walletCtrl.getChildWallet);

export default router;
