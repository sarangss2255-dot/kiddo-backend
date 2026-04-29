import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { loginSchema, parentRegisterSchema, childCreateSchema, childCodeLoginSchema, googleMobileLoginSchema, firebaseAuthSchema } from '../schemas/auth.schema.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.post('/parent/register', validate(parentRegisterSchema), authController.registerParent);
router.post('/login', validate(loginSchema), authController.login);
router.post('/children/login', validate(childCodeLoginSchema), authController.childCodeLogin);
router.post('/google/mobile', validate(googleMobileLoginSchema), authController.googleMobileLogin);
router.post('/firebase', validate(firebaseAuthSchema), authController.firebaseLogin);
router.get('/me', authenticate, authController.me);
router.post(
  '/children',
  authenticate,
  authorize(ROLES.PARENT),
  validate(childCreateSchema),
  authController.createChild,
);

export default router;
