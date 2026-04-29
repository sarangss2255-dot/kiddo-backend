import { StatusCodes } from 'http-status-codes';
import { Activity } from '../models/activity.model.js';
import { Task } from '../models/task.model.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/api-error.js';

export async function listTasks(familyId: string, userId?: string, role?: string) {
  const query: Record<string, unknown> = { familyId };
  if (role === 'child') {
    query.assignedTo = userId;
  }

  return Task.find(query).sort({ createdAt: -1 }).lean();
}

export async function createTask(
  familyId: string,
  createdBy: string,
  input: {
    assignedTo: string;
    title: string;
    description?: string;
    category?: string;
    points: number;
    dueDate?: string;
    rewardUnlockThreshold?: number;
  },
) {
  const task = await Task.create({
    familyId,
    createdBy,
    assignedTo: input.assignedTo,
    title: input.title,
    description: input.description ?? '',
    category: input.category ?? 'General',
    points: input.points,
    dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
    rewardUnlockThreshold: input.rewardUnlockThreshold ?? 0,
  });

  await Activity.create({
    familyId,
    actorId: createdBy,
    type: 'task_created',
    message: `Created task "${task.title}"`,
    metadata: { taskId: task.id },
  });

  return task;
}

export async function updateTask(
  taskId: string,
  familyId: string,
  input: Record<string, unknown>,
  actorRole: string,
  actorId: string,
) {
  const task = await Task.findOne({ _id: taskId, familyId });
  if (!task) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Task not found');
  }

  if (actorRole === 'child' && String(task.assignedTo) !== actorId) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'You can only update your own tasks');
  }

  if (input.status === 'completed') {
    task.completedAt = new Date();
    await updateStreak(String(task.assignedTo));
    await Activity.create({
      familyId,
      actorId,
      type: 'task_completed',
      message: `Completed task "${task.title}"`,
      metadata: { taskId: task.id },
    });
  }

  if (input.status === 'approved') {
    task.approvedAt = new Date();
    await User.findByIdAndUpdate(task.assignedTo, { $inc: { points: task.points } });
    await Activity.create({
      familyId,
      actorId,
      type: 'task_approved',
      message: `Approved task "${task.title}"`,
      metadata: { taskId: task.id },
    });
  }

  Object.assign(task, input, {
    dueDate: typeof input.dueDate === 'string' ? new Date(input.dueDate) : input.dueDate,
  });

  await task.save();
  return task;
}

export async function deleteTask(taskId: string, familyId: string, actorRole: string, actorId: string) {
  if (actorRole !== 'parent' && actorRole !== 'admin') {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Only parents and admins can delete tasks');
  }

  const task = await Task.findOneAndDelete({ _id: taskId, familyId });
  if (!task) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Task not found');
  }

  await Activity.create({
    familyId,
    actorId,
    type: 'task_deleted',
    message: `Deleted task "${task.title}"`,
    metadata: { taskId: task.id },
  });

  return { success: true };
}

async function updateStreak(userId: string) {
  const child = await User.findById(userId);
  if (!child) return;

  const lastCompleted = child.lastCompletedAt;
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (!lastCompleted) {
    child.streak = 1;
  } else {
    const sameDay = lastCompleted.toDateString() === now.toDateString();
    const continued = lastCompleted.toDateString() === yesterday.toDateString();
    child.streak = sameDay ? child.streak : continued ? child.streak + 1 : 1;
  }

  child.lastCompletedAt = now;
  await child.save();
}
