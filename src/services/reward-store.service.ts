import { Types } from 'mongoose';
import { Wallet } from '../models/wallet.model.js';
import { RewardStoreItem } from '../models/reward-store-item.model.js';
import { RewardCategory } from '../models/reward-category.model.js';
import { PurchasedItem } from '../models/purchased-item.model.js';
import { RewardTransaction } from '../models/reward-transaction.model.js';
import { User } from '../models/user.model.js';
import { Activity } from '../models/activity.model.js';
import { NotificationService } from './notification.service.js';

export class RewardStoreService {
  static async listCategories(type?: string) {
    const filter: Record<string, unknown> = { isActive: true };
    if (type) filter.type = type;
    return RewardCategory.find(filter).sort({ sortOrder: 1, name: 1 }).lean();
  }

  static async listItems(userId: string, categorySlug?: string, rarity?: string, search?: string) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const filter: Record<string, unknown> = { isAvailable: true };

    if (categorySlug) {
      const category = await RewardCategory.findOne({ slug: categorySlug, isActive: true });
      if (category) filter.category = category._id;
    }
    if (rarity) filter.rarity = rarity;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    const now = new Date();
    filter.$and = [
      {
        $or: [
          { startDate: null },
          { startDate: { $lte: now } },
        ],
      },
      {
        $or: [
          { endDate: null },
          { endDate: { $gte: now } },
        ],
      },
      { unlockLevel: { $lte: user.level ?? 1 } },
    ];

    const items = await RewardStoreItem.find(filter)
      .populate('category', 'name slug type')
      .sort({ isFeatured: -1, sortOrder: 1, name: 1 })
      .lean();

    const purchasedItems = await PurchasedItem.find({ userId }).select('itemId').lean();
    const ownedItemIds = new Set(purchasedItems.map(p => p.itemId.toString()));

    return items.map(item => ({
      ...item,
      isOwned: ownedItemIds.has(item._id.toString()),
    }));
  }

  static async getFeaturedItems() {
    const now = new Date();
    return RewardStoreItem.find({
      isAvailable: true,
      isFeatured: true,
      $and: [
        { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
        { $or: [{ endDate: null }, { endDate: { $gte: now } }] },
      ],
    })
      .populate('category', 'name slug type')
      .sort({ sortOrder: 1 })
      .limit(10)
      .lean();
  }

  static async getRecentlyAdded(limit = 10) {
    const now = new Date();
    return RewardStoreItem.find({
      isAvailable: true,
      $and: [
        { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
        { $or: [{ endDate: null }, { endDate: { $gte: now } }] },
      ],
    })
      .populate('category', 'name slug type')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  static async getItemDetail(itemId: string, userId: string) {
    const [item, purchase] = await Promise.all([
      RewardStoreItem.findById(itemId).populate('category', 'name slug type').lean(),
      PurchasedItem.findOne({ userId, itemId }),
    ]);
    if (!item) throw new Error('Item not found');

    return {
      ...item,
      isOwned: !!purchase,
      purchase: purchase?.toObject() ?? null,
    };
  }

  static async purchaseItem(itemId: string, userId: string, parentApproval = false) {
    const [item, user] = await Promise.all([
      RewardStoreItem.findById(itemId),
      User.findById(userId),
    ]);

    if (!item) throw new Error('Item not found');
    if (!user) throw new Error('User not found');
    if (!item.isAvailable) throw new Error('Item is not available');

    if (user.level && user.level < item.unlockLevel) {
      throw new Error(`Level ${item.unlockLevel} required to purchase this item`);
    }

    const now = new Date();
    if (item.startDate && item.startDate > now) {
      throw new Error('Item is not yet available');
    }
    if (item.endDate && item.endDate < now) {
      throw new Error('Item is no longer available');
    }

    const existing = await PurchasedItem.findOne({ userId, itemId });
    if (existing) throw new Error('Item already owned');

    if (item.stock !== -1 && item.stock <= 0) {
      throw new Error('Item is out of stock');
    }

    const wallet = await Wallet.findOne({ childId: userId });
    if (!wallet) throw new Error('Wallet not found');
    if (wallet.isFrozen) throw new Error('Wallet is frozen');

    if (wallet.redeemCoins < item.coinCost) {
      throw new Error('Insufficient Redeem Coins');
    }

    const balanceBefore = { rewardPoints: user.points ?? 0, redeemCoins: wallet.redeemCoins };

    wallet.redeemCoins -= item.coinCost;
    wallet.lifetimeCoinsSpent += item.coinCost;
    if (item.stock !== -1) {
      item.stock -= 1;
    }

    const transaction = await RewardTransaction.create({
      userId,
      walletId: wallet._id,
      actionType: 'purchase',
      rewardPoints: 0,
      redeemCoins: -item.coinCost,
      balanceBefore,
      balanceAfter: { rewardPoints: user.points ?? 0, redeemCoins: wallet.redeemCoins },
      description: `Purchased: ${item.name}`,
      referenceId: item._id,
      referenceType: 'RewardStoreItem',
      createdBy: new Types.ObjectId(userId),
      source: 'child',
      metadata: { itemName: item.name, itemCategory: item.category.toString(), rarity: item.rarity },
    });

    const purchasedItem = await PurchasedItem.create({
      userId,
      itemId: item._id,
      itemName: item.name,
      itemCategory: item.category,
      coinCost: item.coinCost,
      rarity: item.rarity,
      purchasedAt: new Date(),
      isEquipped: false,
      transactionRef: transaction._id,
    });

    await Promise.all([wallet.save(), item.save()]);

    await Activity.create({
      familyId: user.familyId,
      actorId: userId,
      type: 'item_purchased',
      message: `Purchased ${item.name} from the Reward Store`,
      metadata: { itemId: item._id, itemName: item.name, coinCost: item.coinCost, rarity: item.rarity },
    });

    NotificationService.sendToUser(
      userId,
      'Purchase Successful!',
      `You bought ${item.name}! Check your inventory.`,
    );

    return {
      purchasedItem: purchasedItem.toObject(),
      redeemCoins: wallet.redeemCoins,
      transactionId: transaction._id,
    };
  }

  static async getInventory(userId: string, categoryType?: string) {
    const filter: Record<string, unknown> = { userId };

    if (categoryType) {
      const categories = await RewardCategory.find({ type: categoryType, isActive: true }).select('_id').lean();
      const categoryIds = categories.map(c => c._id);
      filter.itemCategory = { $in: categoryIds };
    }

    const items = await PurchasedItem.find(filter)
      .populate('itemId', 'name description imageUrl rarity category tags')
      .sort({ purchasedAt: -1 })
      .lean();

    return items.map(item => {
      const populatedItem = item.itemId as unknown as { category?: unknown } | null;
      return {
        ...item,
        category: populatedItem?.category ?? item.itemCategory,
      };
    });
  }

  static async equipItem(purchasedItemId: string, userId: string) {
    const purchasedItem = await PurchasedItem.findById(purchasedItemId);
    if (!purchasedItem) throw new Error('Purchased item not found');
    if (purchasedItem.userId.toString() !== userId) throw new Error('Item not owned by user');

    const storeItem = await RewardStoreItem.findById(purchasedItem.itemId);
    if (!storeItem) throw new Error('Store item not found');

    const category = await RewardCategory.findById(storeItem.category);
    const categoryType = category?.type;

    if (categoryType === 'avatar_customization') {
      await PurchasedItem.updateMany(
        { userId, _id: { $ne: purchasedItemId }, isEquipped: true, rarity: purchasedItem.rarity },
        { isEquipped: false },
      );
    }

    purchasedItem.isEquipped = !purchasedItem.isEquipped;
    await purchasedItem.save();

    return {
      isEquipped: purchasedItem.isEquipped,
      itemId: purchasedItem.itemId,
    };
  }

  static async createCategory(data: {
    name: string; slug: string; description?: string; icon?: string;
    type: 'avatar_customization' | 'goodies' | 'physical_rewards'; sortOrder?: number;
  }) {
    const existing = await RewardCategory.findOne({ slug: data.slug });
    if (existing) throw new Error('Category slug already exists');

    return RewardCategory.create({
      name: data.name,
      slug: data.slug,
      description: data.description ?? '',
      icon: data.icon ?? '',
      type: data.type,
      sortOrder: data.sortOrder ?? 0,
      isActive: true,
    });
  }

  static async updateCategory(categoryId: string, data: Partial<{
    name: string; description: string; icon: string; imageUrl: string;
    type: string; sortOrder: number; isActive: boolean;
  }>) {
    const category = await RewardCategory.findByIdAndUpdate(categoryId, data, { new: true });
    if (!category) throw new Error('Category not found');
    return category;
  }

  static async createItem(data: {
    name: string; description?: string; imageUrl?: string;
    category: string; coinCost: number; rarity?: string;
    stock?: number; unlockLevel?: number; isLimitedEdition?: boolean;
    tags?: string[]; createdBy: string;
  }) {
    const category = await RewardCategory.findById(data.category);
    if (!category) throw new Error('Category not found');

    return RewardStoreItem.create({
      name: data.name,
      description: data.description ?? '',
      imageUrl: data.imageUrl ?? '',
      category: data.category,
      coinCost: data.coinCost,
      rarity: data.rarity ?? 'common',
      stock: data.stock ?? -1,
      unlockLevel: data.unlockLevel ?? 1,
      isLimitedEdition: data.isLimitedEdition ?? false,
      tags: data.tags ?? [],
      createdBy: data.createdBy,
      isAvailable: true,
    });
  }

  static async updateItem(itemId: string, data: Partial<{
    name: string; description: string; imageUrl: string; category: string;
    coinCost: number; rarity: string; stock: number; isAvailable: boolean;
    isFeatured: boolean; unlockLevel: number; isLimitedEdition: boolean;
    sortOrder: number; tags: string[];
  }>) {
    const item = await RewardStoreItem.findByIdAndUpdate(itemId, data, { new: true });
    if (!item) throw new Error('Item not found');
    return item;
  }
}
