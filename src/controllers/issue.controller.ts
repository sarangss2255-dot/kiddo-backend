import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/async-handler.js';
import * as issueService from '../services/issue.service.js';

export const createIssue = asyncHandler(async (req: Request, res: Response) => {
  const issue = await issueService.createIssue(req.user!.id, req.body);
  res.status(StatusCodes.CREATED).json(issue);
});

export const getMyIssues = asyncHandler(async (req: Request, res: Response) => {
  const issues = await issueService.getIssuesByUser(req.user!.id);
  res.status(StatusCodes.OK).json(issues);
});

export const getAllIssues = asyncHandler(async (req: Request, res: Response) => {
  const issues = await issueService.getAllIssues();
  res.status(StatusCodes.OK).json(issues);
});
