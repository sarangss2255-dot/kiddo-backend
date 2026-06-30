import { Request, Response } from 'express';
import { WalletService } from '../services/wallet.service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { User } from '../models/user.model.js';

export const getMyWallet = asyncHandler(async (req: Request, res: Response) => {
  const wallet = await WalletService.getWallet(req.user!.id);
  res.json(wallet);
});

export const getTransactions = asyncHandler(async (req: Request, res: Response) => {
  const page = req.query.page as string;
  const limit = req.query.limit as string;
  const actionType = req.query.actionType as string | undefined;
  const result = await WalletService.getTransactions(
    req.user!.id,
    Number(page) || 1,
    Number(limit) || 20,
    actionType,
  );
  res.json(result);
});

export const convertPoints = asyncHandler(async (req: Request, res: Response) => {
  const { pointsToConvert } = req.body;
  const result = await WalletService.convertPoints(req.user!.id, pointsToConvert);
  res.json(result);
});

export const requestConversion = asyncHandler(async (req: Request, res: Response) => {
  const { pointsToConvert } = req.body;
  const parent = await User.findOne({ familyId: req.user!.familyId, role: 'parent' }).lean();

  if (!parent) {
    res.status(400).json({ message: 'No parent found for approval' });
    return;
  }

  const result = await WalletService.requestConversion(req.user!.id, pointsToConvert, parent._id.toString());
  res.json(result);
});

export const approveConversion = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await WalletService.approveConversion(id, req.user!.id);
  res.json(result);
});

export const rejectConversion = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { reason } = req.body;
  const result = await WalletService.rejectConversion(id, req.user!.id, reason);
  res.json(result);
});

export const getConversions = asyncHandler(async (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;
  const conversions = await WalletService.getConversions(req.user!.id, status);
  res.json(conversions);
});

export const getPendingConversions = asyncHandler(async (req: Request, res: Response) => {
  const conversions = await WalletService.getPendingConversionsForFamily(req.user!.familyId!);
  res.json(conversions);
});

export const giftPoints = asyncHandler(async (req: Request, res: Response) => {
  const { receiverId, amount, message } = req.body;
  const result = await WalletService.giftPoints(req.user!.id, receiverId, amount, message);
  res.json(result);
});

export const giftCoins = asyncHandler(async (req: Request, res: Response) => {
  const { childId, amount, message } = req.body;
  const result = await WalletService.giftCoins(req.user!.id, childId, amount, message);
  res.json(result);
});

export const getChildWallet = asyncHandler(async (req: Request, res: Response) => {
  const childId = req.params.childId as string;
  const wallet = await WalletService.getWallet(childId);
  res.json(wallet);
});
