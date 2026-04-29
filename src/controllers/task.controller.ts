import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/async-handler.js';
import * as taskService from '../services/task.service.js';

export const listTasks = asyncHandler(async (req: Request, res: Response) => {
  const tasks = await taskService.listTasks(req.user!.familyId!, req.user!.id, req.user!.role);
  res.status(StatusCodes.OK).json(tasks);
});

export const createTask = asyncHandler(async (req: Request, res: Response) => {
  const task = await taskService.createTask(req.user!.familyId!, req.user!.id, req.body);
  res.status(StatusCodes.CREATED).json(task);
});

export const updateTask = asyncHandler(async (req: Request, res: Response) => {
  const task = await taskService.updateTask(
    req.params.taskId,
    req.user!.familyId!,
    req.body,
    req.user!.role,
    req.user!.id,
  );
  res.status(StatusCodes.OK).json(task);
});

export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
  await taskService.deleteTask(req.params.taskId, req.user!.familyId!, req.user!.role, req.user!.id);
  res.status(StatusCodes.OK).json({ success: true });
});
