import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/async-handler.js';
import { ShopItem } from '../models/shop-item.model.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/api-error.js';
import { Activity } from '../models/activity.model.js';
import { Types } from 'mongoose';

export const listItems = asyncHandler(async (req: Request, res: Response) => {
  const items = await ShopItem.find({ isAvailable: true }).sort({ price: 1 }).lean();
  res.status(StatusCodes.OK).json(items);
});

export const purchaseItem = asyncHandler(async (req: Request, res: Response) => {
  const { itemId } = req.body;
  const user = await User.findById(req.user!.id);
  
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  const item = await ShopItem.findById(itemId);
  if (!item || !item.isAvailable) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Item not found or unavailable');
  }

  // Check if already owned
  if (user.inventory.includes(item._id as any)) {
    throw new ApiError(StatusCodes.CONFLICT, 'You already own this item');
  }

  // Check points
  if (user.points < item.price) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Not enough points');
  }

  // Deduct points and add to inventory
  user.points -= item.price;
  user.inventory.push(item._id as any);
  await user.save();

  await Activity.create({
    familyId: user.familyId,
    actorId: user.id,
    type: 'shop_purchase',
    message: `Purchased "${item.name}" for ${item.price} points`,
    metadata: { itemId: item.id, price: item.price },
  });

  const updatedUser = await User.findById(user.id).select('-passwordHash').populate('inventory').lean();
  res.status(StatusCodes.OK).json(updatedUser);
});

export const equipItem = asyncHandler(async (req: Request, res: Response) => {
  const { itemId } = req.body;
  const user = await User.findById(req.user!.id);

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  const item = await ShopItem.findById(itemId);
  if (!item) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Item not found');
  }

  // Check if owned
  if (!user.inventory.includes(item._id as any)) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'You do not own this item');
  }

  // Equip based on category
  const category = item.category as keyof typeof user.equipped;
  const currentEquipped = user.equipped ? (user.equipped as any)[category] : null;

  if (currentEquipped?.toString() === item._id.toString()) {
    // Unequip if already equipped
    if (user.equipped) (user.equipped as any)[category] = null;
  } else {
    if (!user.equipped) (user as any).equipped = {};
    (user.equipped as any)[category] = item._id;
  }

  await user.save();
  const updatedUser = await User.findById(user.id).select('-passwordHash').populate('equipped.hat equipped.cape equipped.glasses equipped.pet equipped.suit equipped.background').lean();
  res.status(StatusCodes.OK).json(updatedUser);
});

// Admin endpoint to seed items (for testing)
export const seedItems = asyncHandler(async (_req: Request, res: Response) => {
  const items = [
    { name: 'Red Cap', category: 'hat', price: 50, imageUrl: 'cap_red', assetId: 'cap_red', rarity: 'common' },
    { name: 'Blue Cap', category: 'hat', price: 50, imageUrl: 'cap_blue', assetId: 'cap_blue', rarity: 'common' },
    { name: 'Golden Crown', category: 'hat', price: 500, imageUrl: 'crown_gold', assetId: 'crown_gold', rarity: 'legendary' },
    { name: 'Cool Shades', category: 'glasses', price: 100, imageUrl: 'glasses_cool', assetId: 'glasses_cool', rarity: 'rare' },
    { name: 'Hero Cape', category: 'cape', price: 200, imageUrl: 'cape_hero', assetId: 'cape_hero', rarity: 'epic' },
    { name: 'Tiny Dragon', category: 'pet', price: 1000, imageUrl: 'pet_dragon', assetId: 'pet_dragon', rarity: 'legendary' },
    { name: 'Robot Suit', category: 'suit', price: 750, imageUrl: 'suit_robot', assetId: 'suit_robot', rarity: 'epic' },
    { name: 'Streak Shield', category: 'utility', price: 150, imageUrl: 'shield_streak', assetId: 'shield_streak', rarity: 'rare', description: 'Protects your streak for 1 missed day.' },
  ];

  await ShopItem.deleteMany({});
  const created = await ShopItem.create(items);
  res.status(StatusCodes.CREATED).json(created);
});
