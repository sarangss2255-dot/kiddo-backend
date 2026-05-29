import { Router } from 'express';
import * as issueController from '../controllers/issue.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { ROLES } from '../constants/roles.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createIssueSchema } from '../schemas/issue.schema.js';

const router = Router();

router.use(authenticate);

// Any authenticated user (parent or child) can report an issue
router.post('/', validate(createIssueSchema), issueController.createIssue);

// Get my own submitted issues
router.get('/me', issueController.getMyIssues);

// Admin-only: view all reported issues
router.get('/', authorize(ROLES.ADMIN), issueController.getAllIssues);

export default router;
