import { Router } from 'express';
import * as taskController from '../controllers/task.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { taskCreateSchema, taskUpdateSchema } from '../schemas/task.schema.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.use(authenticate);
router.get('/', taskController.listTasks);
router.post('/', authorize(ROLES.PARENT, ROLES.ADMIN), validate(taskCreateSchema), taskController.createTask);
router.patch(
  '/:taskId',
  authorize(ROLES.PARENT, ROLES.ADMIN, ROLES.CHILD),
  validate(taskUpdateSchema),
  taskController.updateTask,
);
router.delete(
  '/:taskId',
  authorize(ROLES.PARENT, ROLES.ADMIN),
  taskController.deleteTask,
);

export default router;
