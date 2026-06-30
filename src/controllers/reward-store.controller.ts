import { Request, Response } from 'express';
import { RewardStoreService } from '../services/reward-store.service.js';
import { asyncHandler } from '../utils/async-handler.js';

export const listCategories = asyncHandler(async (req: Request, res: Response) => {
  const type = req.query.type as string | undefined;
  const categories = await RewardStoreService.listCategories(type);
  res.json(categories);
});

export const listItems = asyncHandler(async (req: Request, res: Response) => {
  const category = req.query.category as string | undefined;
  const rarity = req.query.rarity as string | undefined;
  const search = req.query.search as string | undefined;
  const items = await RewardStoreService.listItems(
    req.user!.id,
    category,
    rarity,
    search,
  );
  res.json(items);
});

export const getFeaturedItems = asyncHandler(async (_req: Request, res: Response) => {
  const items = await RewardStoreService.getFeaturedItems();
  res.json(items);
});

export const getRecentlyAdded = asyncHandler(async (req: Request, res: Response) => {
  const limit = Number(req.query.limit) || 10;
  const items = await RewardStoreService.getRecentlyAdded(limit);
  res.json(items);
});

export const getItemDetail = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const item = await RewardStoreService.getItemDetail(id, req.user!.id);
  res.json(item);
});

export const purchaseItem = asyncHandler(async (req: Request, res: Response) => {
  const { itemId } = req.body;
  const result = await RewardStoreService.purchaseItem(itemId, req.user!.id);
  res.json(result);
});

export const getInventory = asyncHandler(async (req: Request, res: Response) => {
  const categoryType = req.query.categoryType as string | undefined;
  const inventory = await RewardStoreService.getInventory(req.user!.id, categoryType);
  res.json(inventory);
});

export const equipItem = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await RewardStoreService.equipItem(id, req.user!.id);
  res.json(result);
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await RewardStoreService.createCategory(req.body);
  res.status(201).json(category);
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const category = await RewardStoreService.updateCategory(id, req.body);
  res.json(category);
});

export const createItem = asyncHandler(async (req: Request, res: Response) => {
  const item = await RewardStoreService.createItem({
    ...req.body,
    createdBy: req.user!.id,
  });
  res.status(201).json(item);
});

export const updateItem = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const item = await RewardStoreService.updateItem(id, req.body);
  res.json(item);
});
