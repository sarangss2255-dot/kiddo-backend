import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/async-handler.js';
import { Teacher } from '../models/teacher.model.js';
import { Class } from '../models/class.model.js';
import { ClassStudent } from '../models/class-student.model.js';
import { User } from '../models/user.model.js';
import { Task } from '../models/task.model.js';
import * as teacherService from '../services/teacher.service.js';

export const adminCreateTeacher = asyncHandler(async (req: Request, res: Response) => {
  const teacher = await teacherService.createTeacher(req.user!.id, req.body);
  res.status(StatusCodes.CREATED).json(teacher);
});

export const adminListTeachers = asyncHandler(async (_req: Request, res: Response) => {
  const teachers = await Teacher.find().select('-passwordHash').sort({ createdAt: -1 }).lean();
  res.status(StatusCodes.OK).json(teachers);
});

export const adminGetTeacher = asyncHandler(async (req: Request, res: Response) => {
  const teacher = await Teacher.findById(req.params.teacherId).select('-passwordHash').lean();
  if (!teacher) {
    return res.status(StatusCodes.NOT_FOUND).json({ error: 'Teacher not found' });
  }
  res.status(StatusCodes.OK).json(teacher);
});

export const adminDisableTeacher = asyncHandler(async (req: Request, res: Response) => {
  const teacher = await Teacher.findById(req.params.teacherId);
  if (!teacher) {
    return res.status(StatusCodes.NOT_FOUND).json({ error: 'Teacher not found' });
  }
  teacher.status = 'disabled';
  await teacher.save();
  res.status(StatusCodes.OK).json({ success: true, message: 'Teacher disabled' });
});

export const adminEnableTeacher = asyncHandler(async (req: Request, res: Response) => {
  const teacher = await Teacher.findById(req.params.teacherId);
  if (!teacher) {
    return res.status(StatusCodes.NOT_FOUND).json({ error: 'Teacher not found' });
  }
  teacher.status = 'active';
  await teacher.save();
  res.status(StatusCodes.OK).json({ success: true, message: 'Teacher enabled' });
});

export const adminResetTeacherPassword = asyncHandler(async (req: Request, res: Response) => {
  const teacher = await Teacher.findById(req.params.teacherId);
  if (!teacher) {
    return res.status(StatusCodes.NOT_FOUND).json({ error: 'Teacher not found' });
  }
  teacher.passwordHash = '';
  teacher.status = 'pending';
  await teacher.save();
  res.status(StatusCodes.OK).json({ success: true, message: 'Teacher password reset. Account set to pending activation.' });
});

export const adminGetTeacherClasses = asyncHandler(async (req: Request, res: Response) => {
  const classes = await Class.find({ teacherId: req.params.teacherId }).lean();
  res.status(StatusCodes.OK).json(classes);
});

export const adminGetTeacherStudents = asyncHandler(async (req: Request, res: Response) => {
  const classes = await Class.find({ teacherId: req.params.teacherId }).lean();
  const classIds = classes.map(c => c._id);
  const mappings = await ClassStudent.find({ classId: { $in: classIds }, status: 'active' }).lean();
  const childIds = mappings.map(m => m.childId);
  const children = await User.find({ _id: { $in: childIds }, role: 'child' })
    .select('firstName lastName email schoolName points streak level')
    .lean();
  res.status(StatusCodes.OK).json(children);
});

export const adminGetTeacherStats = asyncHandler(async (req: Request, res: Response) => {
  const teacher = await Teacher.findById(req.params.teacherId).select('-passwordHash').lean();
  if (!teacher) {
    return res.status(StatusCodes.NOT_FOUND).json({ error: 'Teacher not found' });
  }

  const classes = await Class.find({ teacherId: req.params.teacherId }).lean();
  const classIds = classes.map(c => c._id);
  const totalStudents = await ClassStudent.countDocuments({ classId: { $in: classIds }, status: 'active' });
  const totalTasks = await Task.countDocuments({ createdBy: req.params.teacherId });

  res.status(StatusCodes.OK).json({
    teacher,
    totalClasses: classes.length,
    totalStudents,
    totalTasks,
  });
});
