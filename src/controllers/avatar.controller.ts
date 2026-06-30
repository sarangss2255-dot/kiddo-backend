import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/async-handler.js';
import { Avatar } from '../models/avatar.model.js';
import { AvatarItem } from '../models/avatar-item.model.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/api-error.js';

export const getAvatar = asyncHandler(async (req: Request, res: Response) => {
  let avatar = await Avatar.findOne({ childId: req.user!.id }).lean();
  if (!avatar) {
    const user = await User.findById(req.user!.id).lean();
    avatar = await Avatar.create({
      childId: req.user!.id,
      baseAvatar: user?.avatar || 'zara',
      gender: user?.gender || 'female',
      equippedItems: {},
      inventory: [],
    });
  }
  res.status(StatusCodes.OK).json(avatar);
});

export const updateAvatar = asyncHandler(async (req: Request, res: Response) => {
  const { baseAvatar, equippedItems, currentPose } = req.body;
  const avatar = await Avatar.findOneAndUpdate(
    { childId: req.user!.id },
    { $set: { ...(baseAvatar && { baseAvatar }), ...(equippedItems && { equippedItems }), ...(currentPose && { currentPose }) } },
    { new: true, upsert: true },
  ).lean();
  res.status(StatusCodes.OK).json(avatar);
});

export const getStore = asyncHandler(async (_req: Request, res: Response) => {
  const items = await AvatarItem.find({ isAvailable: true })
    .sort({ category: 1, sortOrder: 1 })
    .lean();
  res.status(StatusCodes.OK).json(items);
});

export const getInventory = asyncHandler(async (req: Request, res: Response) => {
  const avatar = await Avatar.findOne({ childId: req.user!.id }).lean();
  if (!avatar) {
    res.status(StatusCodes.OK).json([]);
    return;
  }
  const items = await AvatarItem.find({ assetId: { $in: avatar.inventory } }).lean();
  res.status(StatusCodes.OK).json(items);
});

export const equipItem = asyncHandler(async (req: Request, res: Response) => {
  const { assetId } = req.body;
  if (!assetId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'assetId is required');
  }

  const avatar = await Avatar.findOne({ childId: req.user!.id });
  if (!avatar) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Avatar not found');
  }

  if (!avatar.inventory.includes(assetId)) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Item not owned');
  }

  const item = await AvatarItem.findOne({ assetId }).lean();
  if (!item) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Item not found');
  }

  const category = item.category as keyof typeof avatar.equippedItems;
  const currentEquipped = (avatar.equippedItems as any)[category];

  if (currentEquipped === assetId) {
    (avatar.equippedItems as any)[category] = '';
  } else {
    (avatar.equippedItems as any)[category] = assetId;
  }

  await avatar.save();
  const updated = await Avatar.findById(avatar._id).lean();
  res.status(StatusCodes.OK).json(updated);
});

export const buyItem = asyncHandler(async (req: Request, res: Response) => {
  const { assetId } = req.body;
  if (!assetId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'assetId is required');
  }

  const user = await User.findById(req.user!.id);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  const item = await AvatarItem.findOne({ assetId, isAvailable: true }).lean();
  if (!item) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Item not found or unavailable');
  }

  let avatar = await Avatar.findOne({ childId: req.user!.id });
  if (!avatar) {
    avatar = await Avatar.create({
      childId: req.user!.id,
      baseAvatar: user.avatar || 'zara',
      gender: user.gender || 'female',
      equippedItems: {},
      inventory: [],
    });
  }

  if (avatar.inventory.includes(assetId)) {
    throw new ApiError(StatusCodes.CONFLICT, 'Already owned');
  }

  if (user.points < item.price) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Not enough coins');
  }

  user.points -= item.price;
  avatar.inventory.push(assetId);
  avatar.coinsSpent += item.price;

  await user.save();
  await avatar.save();

  res.status(StatusCodes.OK).json({
    user: await User.findById(user.id).select('-passwordHash').lean(),
    avatar: await Avatar.findById(avatar._id).lean(),
  });
});

export const triggerAnimation = asyncHandler(async (req: Request, res: Response) => {
  const { animation } = req.body;
  const validAnimations = [
    'idle', 'blink', 'wave', 'dance', 'celebrate', 'jump', 'spin',
    'clap', 'laugh', 'happy', 'sad', 'thinking', 'excited', 'sleep',
    'walk', 'run', 'victory', 'confused', 'point', 'thumbsUp',
    'facePalm', 'stretch', 'sit', 'reading', 'highFive',
  ];

  if (!validAnimations.includes(animation)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid animation');
  }

  const avatar = await Avatar.findOneAndUpdate(
    { childId: req.user!.id },
    { currentPose: animation },
    { new: true },
  ).lean();

  res.status(StatusCodes.OK).json(avatar);
});

export const getEvents = asyncHandler(async (req: Request, res: Response) => {
  const avatar = await Avatar.findOne({ childId: req.user!.id }).lean();
  const user = await User.findById(req.user!.id).select('points xp level streak').lean();

  res.status(StatusCodes.OK).json({
    currentPose: avatar?.currentPose || 'idle',
    points: user?.points || 0,
    xp: user?.xp || 0,
    level: user?.level || 1,
    streak: user?.streak || 0,
  });
});

export const seedAvatarItems = asyncHandler(async (_req: Request, res: Response) => {
  const items = [
    // Hair
    { name: 'Short Bob', category: 'hair', price: 0, assetId: 'hair_short_bob', rarity: 'common', gender: 'female', unlockLevel: 1 },
    { name: 'Long Flowing', category: 'hair', price: 100, assetId: 'hair_long', rarity: 'common', gender: 'female', unlockLevel: 1 },
    { name: 'Curly Mop', category: 'hair', price: 150, assetId: 'hair_curly', rarity: 'rare', gender: 'female', unlockLevel: 2 },
    { name: 'Twin Ponytails', category: 'hair', price: 200, assetId: 'hair_twintail', rarity: 'rare', gender: 'female', unlockLevel: 2 },
    { name: 'Side Pony', category: 'hair', price: 120, assetId: 'hair_side_pony', rarity: 'common', gender: 'female', unlockLevel: 1 },
    { name: 'Braids', category: 'hair', price: 300, assetId: 'hair_braids', rarity: 'epic', gender: 'female', unlockLevel: 3 },
    { name: 'Afro Puff', category: 'hair', price: 250, assetId: 'hair_afro', rarity: 'rare', gender: 'unisex', unlockLevel: 2 },
    { name: 'Spiky', category: 'hair', price: 80, assetId: 'hair_spiky', rarity: 'common', gender: 'male', unlockLevel: 1 },
    { name: 'Pixie Cut', category: 'hair', price: 100, assetId: 'hair_pixie', rarity: 'common', gender: 'female', unlockLevel: 1 },
    { name: 'Messy Bedhead', category: 'hair', price: 50, assetId: 'hair_messy', rarity: 'common', gender: 'unisex', unlockLevel: 1 },
    { name: 'Side Part', category: 'hair', price: 0, assetId: 'hair_side_part', rarity: 'common', gender: 'male', unlockLevel: 1 },
    { name: 'Slick Back', category: 'hair', price: 120, assetId: 'hair_slick', rarity: 'common', gender: 'male', unlockLevel: 1 },
    { name: 'Faux Hawk', category: 'hair', price: 200, assetId: 'hair_faux_hawk', rarity: 'rare', gender: 'male', unlockLevel: 2 },
    { name: 'Bowl Cut', category: 'hair', price: 80, assetId: 'hair_bowl', rarity: 'common', gender: 'male', unlockLevel: 1 },

    // Eyes
    { name: 'Big Sparkle', category: 'eyes', price: 0, assetId: 'eyes_big_sparkle', rarity: 'common', gender: 'unisex', unlockLevel: 1 },
    { name: 'Happy Squint', category: 'eyes', price: 50, assetId: 'eyes_happy_squint', rarity: 'common', gender: 'unisex', unlockLevel: 1 },
    { name: 'Sleepy Half', category: 'eyes', price: 80, assetId: 'eyes_sleepy', rarity: 'common', gender: 'unisex', unlockLevel: 1 },
    { name: 'Star Struck', category: 'eyes', price: 200, assetId: 'eyes_star', rarity: 'epic', gender: 'unisex', unlockLevel: 3 },
    { name: 'Round & Wide', category: 'eyes', price: 50, assetId: 'eyes_round', rarity: 'common', gender: 'unisex', unlockLevel: 1 },
    { name: 'Cool Shades', category: 'eyes', price: 150, assetId: 'eyes_cool', rarity: 'rare', gender: 'unisex', unlockLevel: 2 },

    // Eyebrows
    { name: 'Arched', category: 'eyebrows', price: 0, assetId: 'brows_arched', rarity: 'common', gender: 'female', unlockLevel: 1 },
    { name: 'Straight', category: 'eyebrows', price: 0, assetId: 'brows_straight', rarity: 'common', gender: 'male', unlockLevel: 1 },
    { name: 'Angry', category: 'eyebrows', price: 50, assetId: 'brows_angry', rarity: 'common', gender: 'unisex', unlockLevel: 1 },
    { name: 'Surprised High', category: 'eyebrows', price: 50, assetId: 'brows_surprised', rarity: 'common', gender: 'unisex', unlockLevel: 1 },
    { name: 'Sad Tilt', category: 'eyebrows', price: 50, assetId: 'brows_sad', rarity: 'common', gender: 'unisex', unlockLevel: 1 },

    // Mouth
    { name: 'Big Smile', category: 'mouth', price: 0, assetId: 'mouth_big_smile', rarity: 'common', gender: 'unisex', unlockLevel: 1 },
    { name: 'Small Smile', category: 'mouth', price: 0, assetId: 'mouth_small_smile', rarity: 'common', gender: 'unisex', unlockLevel: 1 },
    { name: 'Open Laugh', category: 'mouth', price: 100, assetId: 'mouth_open_laugh', rarity: 'common', gender: 'unisex', unlockLevel: 1 },
    { name: 'Surprise O', category: 'mouth', price: 50, assetId: 'mouth_surprise', rarity: 'common', gender: 'unisex', unlockLevel: 1 },
    { name: 'Frown', category: 'mouth', price: 0, assetId: 'mouth_frown', rarity: 'common', gender: 'unisex', unlockLevel: 1 },
    { name: 'Tongue Out', category: 'mouth', price: 150, assetId: 'mouth_tongue', rarity: 'rare', gender: 'unisex', unlockLevel: 2 },

    // Skin Tones
    { name: 'Fair', category: 'skin', price: 0, assetId: 'skin_fair', rarity: 'common', gender: 'unisex', unlockLevel: 1 },
    { name: 'Tan', category: 'skin', price: 0, assetId: 'skin_tan', rarity: 'common', gender: 'unisex', unlockLevel: 1 },
    { name: 'Olive', category: 'skin', price: 0, assetId: 'skin_olive', rarity: 'common', gender: 'unisex', unlockLevel: 1 },
    { name: 'Brown', category: 'skin', price: 0, assetId: 'skin_brown', rarity: 'common', gender: 'unisex', unlockLevel: 1 },
    { name: 'Dark', category: 'skin', price: 0, assetId: 'skin_dark', rarity: 'common', gender: 'unisex', unlockLevel: 1 },

    // Tops
    { name: 'White Tee', category: 'top', price: 0, assetId: 'top_white_tee', rarity: 'common', gender: 'unisex', unlockLevel: 1 },
    { name: 'Purple Hoodie', category: 'top', price: 150, assetId: 'top_purple_hoodie', rarity: 'common', gender: 'unisex', unlockLevel: 1 },
    { name: 'Denim Jacket', category: 'top', price: 200, assetId: 'top_denim_jacket', rarity: 'rare', gender: 'unisex', unlockLevel: 2 },
    { name: 'School Uniform', category: 'top', price: 100, assetId: 'top_school', rarity: 'common', gender: 'unisex', unlockLevel: 1 },
    { name: 'Sports Jersey', category: 'top', price: 180, assetId: 'top_jersey', rarity: 'rare', gender: 'unisex', unlockLevel: 2 },
    { name: 'Superhero Suit', category: 'top', price: 500, assetId: 'top_superhero', rarity: 'epic', gender: 'unisex', unlockLevel: 4 },
    { name: 'Winter Coat', category: 'top', price: 250, assetId: 'top_winter_coat', rarity: 'rare', gender: 'unisex', unlockLevel: 2 },
    { name: 'Festival Dress', category: 'top', price: 300, assetId: 'top_festival_dress', rarity: 'epic', gender: 'female', unlockLevel: 3 },

    // Bottoms
    { name: 'Blue Jeans', category: 'bottom', price: 0, assetId: 'bottom_jeans', rarity: 'common', gender: 'unisex', unlockLevel: 1 },
    { name: 'Cargo Pants', category: 'bottom', price: 120, assetId: 'bottom_cargo', rarity: 'common', gender: 'unisex', unlockLevel: 1 },
    { name: 'Denim Skirt', category: 'bottom', price: 100, assetId: 'bottom_skirt', rarity: 'common', gender: 'female', unlockLevel: 1 },
    { name: 'Shorts', category: 'bottom', price: 80, assetId: 'bottom_shorts', rarity: 'common', gender: 'unisex', unlockLevel: 1 },
    { name: 'Joggers', category: 'bottom', price: 100, assetId: 'bottom_joggers', rarity: 'common', gender: 'unisex', unlockLevel: 1 },
    { name: 'Traditional Kurta', category: 'bottom', price: 200, assetId: 'bottom_kurta', rarity: 'rare', gender: 'unisex', unlockLevel: 2 },

    // Shoes
    { name: 'White Sneakers', category: 'shoes', price: 0, assetId: 'shoes_sneakers', rarity: 'common', gender: 'unisex', unlockLevel: 1 },
    { name: 'School Shoes', category: 'shoes', price: 80, assetId: 'shoes_school', rarity: 'common', gender: 'unisex', unlockLevel: 1 },
    { name: 'Pink Sandals', category: 'shoes', price: 60, assetId: 'shoes_sandals', rarity: 'common', gender: 'female', unlockLevel: 1 },
    { name: 'Running Shoes', category: 'shoes', price: 150, assetId: 'shoes_running', rarity: 'rare', gender: 'unisex', unlockLevel: 2 },
    { name: 'Cool Boots', category: 'shoes', price: 200, assetId: 'shoes_boots', rarity: 'rare', gender: 'unisex', unlockLevel: 2 },

    // Hats
    { name: 'Baseball Cap', category: 'hat', price: 100, assetId: 'hat_cap', rarity: 'common', gender: 'unisex', unlockLevel: 1 },
    { name: 'Beanie', category: 'hat', price: 120, assetId: 'hat_beanie', rarity: 'common', gender: 'unisex', unlockLevel: 1 },
    { name: 'Crown', category: 'hat', price: 500, assetId: 'hat_crown', rarity: 'legendary', gender: 'unisex', unlockLevel: 5 },
    { name: 'Flower Crown', category: 'hat', price: 200, assetId: 'hat_flower_crown', rarity: 'rare', gender: 'female', unlockLevel: 2 },
    { name: 'Birthday Hat', category: 'hat', price: 150, assetId: 'hat_birthday', rarity: 'rare', gender: 'unisex', unlockLevel: 2 },
    { name: 'Headphones', category: 'hat', price: 250, assetId: 'hat_headphones', rarity: 'epic', gender: 'unisex', unlockLevel: 3 },

    // Glasses
    { name: 'Round Glasses', category: 'glasses', price: 100, assetId: 'glasses_round', rarity: 'common', gender: 'unisex', unlockLevel: 1 },
    { name: 'Star Shades', category: 'glasses', price: 200, assetId: 'glasses_star', rarity: 'rare', gender: 'unisex', unlockLevel: 2 },
    { name: 'Heart Glasses', category: 'glasses', price: 250, assetId: 'glasses_heart', rarity: 'epic', gender: 'female', unlockLevel: 3 },
    { name: 'Cool Sunglasses', category: 'glasses', price: 150, assetId: 'glasses_cool', rarity: 'rare', gender: 'unisex', unlockLevel: 2 },

    // Necklace
    { name: 'Gold Chain', category: 'necklace', price: 200, assetId: 'necklace_gold', rarity: 'rare', gender: 'unisex', unlockLevel: 2 },
    { name: 'Pearl String', category: 'necklace', price: 300, assetId: 'necklace_pearl', rarity: 'epic', gender: 'female', unlockLevel: 3 },
    { name: 'Shell Necklace', category: 'necklace', price: 150, assetId: 'necklace_shell', rarity: 'common', gender: 'unisex', unlockLevel: 1 },
    { name: 'Medal', category: 'necklace', price: 400, assetId: 'necklace_medal', rarity: 'legendary', gender: 'unisex', unlockLevel: 4 },

    // Watch
    { name: 'Smart Watch', category: 'watch', price: 300, assetId: 'watch_smart', rarity: 'epic', gender: 'unisex', unlockLevel: 3 },
    { name: 'Silly Band', category: 'watch', price: 80, assetId: 'watch_band', rarity: 'common', gender: 'unisex', unlockLevel: 1 },

    // Back Accessories
    { name: 'Angel Wings', category: 'back', price: 500, assetId: 'back_wings', rarity: 'legendary', gender: 'unisex', unlockLevel: 5 },
    { name: 'Jetpack', category: 'back', price: 400, assetId: 'back_jetpack', rarity: 'epic', gender: 'unisex', unlockLevel: 4 },
    { name: 'Backpack', category: 'back', price: 150, assetId: 'back_backpack', rarity: 'common', gender: 'unisex', unlockLevel: 1 },
    { name: 'Bow & Arrow', category: 'back', price: 250, assetId: 'back_bow', rarity: 'rare', gender: 'unisex', unlockLevel: 2 },
    { name: 'Cape', category: 'back', price: 200, assetId: 'back_cape', rarity: 'rare', gender: 'unisex', unlockLevel: 2 },

    // Pets
    { name: 'Panda Cub', category: 'pet', price: 300, assetId: 'pet_panda', rarity: 'epic', gender: 'unisex', unlockLevel: 3 },
    { name: 'Puppy', category: 'pet', price: 200, assetId: 'pet_puppy', rarity: 'rare', gender: 'unisex', unlockLevel: 2 },
    { name: 'Kitten', category: 'pet', price: 150, assetId: 'pet_kitten', rarity: 'common', gender: 'unisex', unlockLevel: 1 },
    { name: 'Baby Dragon', category: 'pet', price: 500, assetId: 'pet_dragon', rarity: 'legendary', gender: 'unisex', unlockLevel: 5 },
    { name: 'Bunny', category: 'pet', price: 100, assetId: 'pet_bunny', rarity: 'common', gender: 'unisex', unlockLevel: 1 },
    { name: 'Turtle', category: 'pet', price: 120, assetId: 'pet_turtle', rarity: 'common', gender: 'unisex', unlockLevel: 1 },
    { name: 'Fox', category: 'pet', price: 350, assetId: 'pet_fox', rarity: 'epic', gender: 'unisex', unlockLevel: 3 },

    // Hand Accessories
    { name: 'Magic Wand', category: 'hand', price: 300, assetId: 'hand_wand', rarity: 'epic', gender: 'unisex', unlockLevel: 3 },
    { name: 'Sword', category: 'hand', price: 250, assetId: 'hand_sword', rarity: 'rare', gender: 'unisex', unlockLevel: 2 },
    { name: 'Flag', category: 'hand', price: 100, assetId: 'hand_flag', rarity: 'common', gender: 'unisex', unlockLevel: 1 },

    // Special Effects
    { name: 'Sparkle Trail', category: 'effect', price: 400, assetId: 'effect_sparkle', rarity: 'epic', gender: 'unisex', unlockLevel: 4 },
    { name: 'Fire Aura', category: 'effect', price: 500, assetId: 'effect_fire', rarity: 'legendary', gender: 'unisex', unlockLevel: 5 },
    { name: 'Rainbow Glow', category: 'effect', price: 300, assetId: 'effect_rainbow', rarity: 'rare', gender: 'unisex', unlockLevel: 3 },
    { name: 'Star Halo', category: 'effect', price: 350, assetId: 'effect_star_halo', rarity: 'epic', gender: 'unisex', unlockLevel: 4 },

    // Victory Poses
    { name: 'Hero Landing', category: 'pose', price: 200, assetId: 'pose_hero', rarity: 'rare', gender: 'unisex', unlockLevel: 2 },
    { name: 'Dance Move', category: 'pose', price: 300, assetId: 'pose_dance', rarity: 'epic', gender: 'unisex', unlockLevel: 3 },
    { name: 'Victory Arms', category: 'pose', price: 0, assetId: 'pose_victory', rarity: 'common', gender: 'unisex', unlockLevel: 1 },
    { name: 'Peace Sign', category: 'pose', price: 100, assetId: 'pose_peace', rarity: 'common', gender: 'unisex', unlockLevel: 1 },
  ];

  await AvatarItem.deleteMany({});
  const created = await AvatarItem.create(items);
  res.status(StatusCodes.CREATED).json(created);
});
