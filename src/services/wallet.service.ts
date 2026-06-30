import { Types } from 'mongoose';
import { Wallet } from '../models/wallet.model.js';
import { RewardTransaction, TRANSACTION_ACTION_TYPES, TransactionActionType } from '../models/reward-transaction.model.js';
import { RewardConversion } from '../models/reward-conversion.model.js';
import { GiftReward } from '../models/gift-reward.model.js';
import { RewardRule } from '../models/reward-rule.model.js';
import { User } from '../models/user.model.js';
import { Activity } from '../models/activity.model.js';
import { NotificationService } from './notification.service.js';

const DEFAULT_CONVERSION_RATIO = 1000;
const MIN_CONVERSION_POINTS = 1000;

export class WalletService {
  static async getOrCreateWallet(childId: string): Promise<{ wallet: ReturnType<typeof Wallet.prototype.toObject>; rewardPoints: number }> {
    const user = await User.findById(childId);
    if (!user) throw new Error('User not found');

    let wallet = await Wallet.findOne({ childId });
    if (!wallet) {
      wallet = await Wallet.create({ childId });
    }

    const rewardPoints = user.points ?? 0;

    if (wallet.isFrozen) {
      throw new Error('Wallet is frozen. Contact a parent or admin.');
    }

    return { wallet: wallet.toObject(), rewardPoints };
  }

  static async getWallet(childId: string) {
    const user = await User.findById(childId);
    if (!user) throw new Error('User not found');

    let wallet = await Wallet.findOne({ childId });
    if (!wallet) {
      wallet = await Wallet.create({ childId });
    }

    return {
      ...wallet.toObject(),
      rewardPoints: user.points ?? 0,
    };
  }

  static async getTransactions(
    userId: string,
    page = 1,
    limit = 20,
    actionType?: string,
  ) {
    const filter: Record<string, unknown> = { userId };
    if (actionType && TRANSACTION_ACTION_TYPES.includes(actionType as TransactionActionType)) {
      filter.actionType = actionType;
    }

    const total = await RewardTransaction.countDocuments(filter);
    const transactions = await RewardTransaction.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return { transactions, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async convertPoints(
    childId: string,
    pointsToConvert: number,
    ratioOverride?: number,
  ) {
    if (pointsToConvert < MIN_CONVERSION_POINTS) {
      throw new Error(`Minimum conversion is ${MIN_CONVERSION_POINTS} Reward Points`);
    }
    if (pointsToConvert % MIN_CONVERSION_POINTS !== 0) {
      throw new Error(`Points must be in multiples of ${MIN_CONVERSION_POINTS}`);
    }

    const user = await User.findById(childId);
    if (!user) throw new Error('User not found');

    const ratio = ratioOverride ?? DEFAULT_CONVERSION_RATIO;
    const coinsAwarded = Math.floor(pointsToConvert / ratio);

    if (coinsAwarded < 1) {
      throw new Error(`Need at least ${ratio} points for 1 coin`);
    }

    if ((user.points ?? 0) < pointsToConvert) {
      throw new Error('Insufficient Reward Points');
    }

    const wallet = await Wallet.findOne({ childId });
    if (!wallet) throw new Error('Wallet not found');
    if (wallet.isFrozen) throw new Error('Wallet is frozen');

    const rule = await RewardRule.findOne({ actionType: 'conversion_to_coins' });
    if (rule?.isActive) {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      if (wallet.lastConversionDate && wallet.lastConversionDate < todayStart) {
        wallet.dailyConversionUsed = 0;
      }
      if (wallet.lastConversionDate && wallet.lastConversionDate < weekStart) {
        wallet.weeklyConversionUsed = 0;
      }
      if (wallet.lastConversionDate && wallet.lastConversionDate < monthStart) {
        wallet.monthlyConversionUsed = 0;
      }

      const conversionsCount = Math.floor(pointsToConvert / MIN_CONVERSION_POINTS);

      if (rule.maxPerDay > 0 && wallet.dailyConversionUsed + conversionsCount > rule.maxPerDay) {
        throw new Error(`Daily conversion limit exceeded (max ${rule.maxPerDay})`);
      }
      if (rule.maxPerWeek > 0 && wallet.weeklyConversionUsed + conversionsCount > rule.maxPerWeek) {
        throw new Error(`Weekly conversion limit exceeded (max ${rule.maxPerWeek})`);
      }
      if (rule.maxPerMonth > 0 && wallet.monthlyConversionUsed + conversionsCount > rule.maxPerMonth) {
        throw new Error(`Monthly conversion limit exceeded (max ${rule.maxPerMonth})`);
      }

      wallet.dailyConversionUsed += conversionsCount;
      wallet.weeklyConversionUsed += conversionsCount;
      wallet.monthlyConversionUsed += conversionsCount;
    }

    const balanceBefore = { rewardPoints: user.points ?? 0, redeemCoins: wallet.redeemCoins };

    user.points = (user.points ?? 0) - pointsToConvert;
    wallet.redeemCoins += coinsAwarded;
    wallet.lifetimeRedeemCoinsEarned += coinsAwarded;
    wallet.totalConversions += 1;
    wallet.lastConversionDate = new Date();

    const conversion = await RewardConversion.create({
      userId: childId,
      walletId: wallet._id,
      rewardPointsUsed: pointsToConvert,
      redeemCoinsAwarded: coinsAwarded,
      conversionRatio: ratio,
      status: 'approved',
      parentApprovalRequired: false,
    });

    const balanceAfter = { rewardPoints: user.points, redeemCoins: wallet.redeemCoins };

    await Promise.all([
      user.save(),
      wallet.save(),
      RewardTransaction.create({
        userId: childId,
        walletId: wallet._id,
        actionType: 'conversion_to_coins',
        rewardPoints: -pointsToConvert,
        redeemCoins: coinsAwarded,
        balanceBefore,
        balanceAfter,
        description: `Converted ${pointsToConvert} RP to ${coinsAwarded} RC`,
        referenceId: conversion._id,
        referenceType: 'RewardConversion',
        createdBy: new Types.ObjectId(childId),
        source: 'child',
        metadata: { conversionRatio: ratio },
      }),
    ]);

    NotificationService.sendToUser(childId, 'Coins Earned!', `You earned ${coinsAwarded} Redeem Coins!`);

    return {
      rewardPoints: user.points,
      redeemCoins: wallet.redeemCoins,
      coinsAwarded,
      conversionId: conversion._id,
    };
  }

  static async requestConversion(
    childId: string,
    pointsToConvert: number,
    parentId: string,
    ratioOverride?: number,
  ) {
    if (pointsToConvert < MIN_CONVERSION_POINTS) {
      throw new Error(`Minimum conversion is ${MIN_CONVERSION_POINTS} Reward Points`);
    }
    if (pointsToConvert % MIN_CONVERSION_POINTS !== 0) {
      throw new Error(`Points must be in multiples of ${MIN_CONVERSION_POINTS}`);
    }

    const user = await User.findById(childId);
    if (!user) throw new Error('User not found');

    if ((user.points ?? 0) < pointsToConvert) {
      throw new Error('Insufficient Reward Points');
    }

    const wallet = await Wallet.findOne({ childId });
    if (!wallet) throw new Error('Wallet not found');
    if (wallet.isFrozen) throw new Error('Wallet is frozen');

    const ratio = ratioOverride ?? DEFAULT_CONVERSION_RATIO;
    const coinsAwarded = Math.floor(pointsToConvert / ratio);

    user.points = (user.points ?? 0) - pointsToConvert;
    wallet.pendingConversions += 1;

    const conversion = await RewardConversion.create({
      userId: childId,
      walletId: wallet._id,
      rewardPointsUsed: pointsToConvert,
      redeemCoinsAwarded: coinsAwarded,
      conversionRatio: ratio,
      status: 'pending',
      parentApprovalRequired: true,
    });

    await Promise.all([user.save(), wallet.save()]);

    NotificationService.sendToUser(
      parentId,
      'Conversion Request',
      `${user.firstName} wants to convert ${pointsToConvert} RP to ${coinsAwarded} RC`,
    );

    return {
      conversionId: conversion._id,
      status: 'pending',
      rewardPoints: user.points,
      coinsPending: coinsAwarded,
    };
  }

  static async approveConversion(conversionId: string, parentId: string) {
    const conversion = await RewardConversion.findById(conversionId);
    if (!conversion) throw new Error('Conversion not found');
    if (conversion.status !== 'pending') throw new Error('Conversion is not pending');

    const wallet = await Wallet.findById(conversion.walletId);
    if (!wallet) throw new Error('Wallet not found');

    conversion.status = 'approved';
    conversion.approvedBy = new Types.ObjectId(parentId);
    conversion.approvedAt = new Date();

    wallet.redeemCoins += conversion.redeemCoinsAwarded;
    wallet.lifetimeRedeemCoinsEarned += conversion.redeemCoinsAwarded;
    wallet.totalConversions += 1;
    wallet.pendingConversions = Math.max(0, wallet.pendingConversions - 1);

    const balanceBefore = { rewardPoints: 0, redeemCoins: wallet.redeemCoins - conversion.redeemCoinsAwarded };
    const balanceAfter = { rewardPoints: 0, redeemCoins: wallet.redeemCoins };

    await Promise.all([
      conversion.save(),
      wallet.save(),
      RewardTransaction.create({
        userId: conversion.userId,
        walletId: wallet._id,
        actionType: 'conversion_to_coins',
        rewardPoints: -conversion.rewardPointsUsed,
        redeemCoins: conversion.redeemCoinsAwarded,
        balanceBefore,
        balanceAfter,
        description: `Conversion approved: ${conversion.rewardPointsUsed} RP → ${conversion.redeemCoinsAwarded} RC`,
        referenceId: conversion._id,
        referenceType: 'RewardConversion',
        createdBy: new Types.ObjectId(parentId),
        source: 'parent',
        metadata: { conversionRatio: conversion.conversionRatio },
      }),
    ]);

    NotificationService.sendToUser(
      conversion.userId.toString(),
      'Conversion Approved!',
      `Your conversion of ${conversion.rewardPointsUsed} RP to ${conversion.redeemCoinsAwarded} RC was approved!`,
    );

    return { status: 'approved', redeemCoins: wallet.redeemCoins };
  }

  static async rejectConversion(conversionId: string, parentId: string, reason?: string) {
    const conversion = await RewardConversion.findById(conversionId);
    if (!conversion) throw new Error('Conversion not found');
    if (conversion.status !== 'pending') throw new Error('Conversion is not pending');

    const wallet = await Wallet.findById(conversion.walletId);
    if (!wallet) throw new Error('Wallet not found');

    const user = await User.findById(conversion.userId);
    if (!user) throw new Error('User not found');

    conversion.status = 'rejected';
    conversion.rejectedAt = new Date();
    conversion.rejectionReason = reason ?? '';

    user.points = (user.points ?? 0) + conversion.rewardPointsUsed;
    wallet.pendingConversions = Math.max(0, wallet.pendingConversions - 1);

    await Promise.all([conversion.save(), user.save(), wallet.save()]);

    NotificationService.sendToUser(
      conversion.userId.toString(),
      'Conversion Rejected',
      reason
        ? `Your conversion was rejected: ${reason}`
        : 'Your conversion request was rejected by a parent',
    );

    return { status: 'rejected', rewardPoints: user.points };
  }

  static async getConversions(userId: string, status?: string) {
    const filter: Record<string, unknown> = { userId };
    if (status) filter.status = status;
    return RewardConversion.find(filter).sort({ createdAt: -1 }).lean();
  }

  static async getPendingConversionsForFamily(familyId: string) {
    const children = await User.find({ familyId, role: 'child' }).select('_id firstName').lean();
    const childIds = children.map(c => c._id);
    const conversions = await RewardConversion.find({
      userId: { $in: childIds },
      status: 'pending',
    }).sort({ createdAt: -1 }).populate('userId', 'firstName lastName').lean();
    return conversions;
  }

  static async giftPoints(
    senderId: string,
    receiverId: string,
    amount: number,
    message?: string,
  ) {
    if (amount <= 0) throw new Error('Amount must be positive');

    const [sender, receiver] = await Promise.all([
      User.findById(senderId),
      User.findById(receiverId),
    ]);
    if (!sender) throw new Error('Sender not found');
    if (!receiver) throw new Error('Receiver not found');

    if ((sender.points ?? 0) < amount && sender.role !== 'admin') {
      throw new Error('Insufficient points');
    }

    if (sender.role !== 'admin') {
      sender.points = (sender.points ?? 0) - amount;
    }
    receiver.points = (receiver.points ?? 0) + amount;

    const senderWallet = await Wallet.findOne({ childId: receiverId });
    const receiverWallet = senderWallet ?? (await Wallet.create({ childId: receiverId }));

    const senderBalBefore = { rewardPoints: sender.points + (sender.role !== 'admin' ? amount : 0), redeemCoins: 0 };
    const senderBalAfter = { rewardPoints: sender.points, redeemCoins: 0 };
    const receiverBalBefore = { rewardPoints: receiver.points - amount, redeemCoins: receiverWallet.redeemCoins };
    const receiverBalAfter = { rewardPoints: receiver.points, redeemCoins: receiverWallet.redeemCoins };

    const gift = await GiftReward.create({
      senderId: new Types.ObjectId(senderId),
      receiverId: new Types.ObjectId(receiverId),
      type: 'reward_points',
      amount,
      message: message ?? '',
      status: 'sent',
    });

    await Promise.all([
      sender.save(),
      receiver.save(),
      RewardTransaction.create({
        userId: senderId,
        walletId: receiverWallet._id,
        actionType: 'gift_sent',
        rewardPoints: -amount,
        redeemCoins: 0,
        balanceBefore: senderBalBefore,
        balanceAfter: senderBalAfter,
        description: `Gifted ${amount} RP to ${receiver.firstName}`,
        referenceId: gift._id,
        referenceType: 'GiftReward',
        createdBy: new Types.ObjectId(senderId),
        source: sender.role === 'teacher' ? 'teacher' : sender.role === 'admin' ? 'admin' : 'parent',
        metadata: { receiverName: receiver.firstName },
      }),
      RewardTransaction.create({
        userId: receiverId,
        walletId: receiverWallet._id,
        actionType: 'gift_received',
        rewardPoints: amount,
        redeemCoins: 0,
        balanceBefore: receiverBalBefore,
        balanceAfter: receiverBalAfter,
        description: `Received ${amount} RP from ${sender.firstName}`,
        referenceId: gift._id,
        referenceType: 'GiftReward',
        createdBy: new Types.ObjectId(senderId),
        source: sender.role === 'teacher' ? 'teacher' : sender.role === 'admin' ? 'admin' : 'parent',
        metadata: { senderName: sender.firstName },
      }),
    ]);

    NotificationService.sendToUser(
      receiverId,
      'Points Received!',
      `${sender.firstName} sent you ${amount} Reward Points!`,
    );

    return { giftId: gift._id, receiverPoints: receiver.points };
  }

  static async giftCoins(
    parentId: string,
    childId: string,
    amount: number,
    message?: string,
  ) {
    if (amount <= 0) throw new Error('Amount must be positive');

    const [parent, child] = await Promise.all([
      User.findById(parentId),
      User.findById(childId),
    ]);
    if (!parent) throw new Error('Parent not found');
    if (!child) throw new Error('Child not found');

    let wallet = await Wallet.findOne({ childId });
    if (!wallet) {
      wallet = await Wallet.create({ childId });
    }
    if (wallet.isFrozen) throw new Error('Child wallet is frozen');

    const balanceBefore = { rewardPoints: child.points ?? 0, redeemCoins: wallet.redeemCoins };
    wallet.redeemCoins += amount;
    wallet.lifetimeRedeemCoinsEarned += amount;
    const balanceAfter = { rewardPoints: child.points ?? 0, redeemCoins: wallet.redeemCoins };

    const gift = await GiftReward.create({
      senderId: new Types.ObjectId(parentId),
      receiverId: new Types.ObjectId(childId),
      type: 'redeem_coins',
      amount,
      message: message ?? '',
      status: 'sent',
    });

    await Promise.all([
      wallet.save(),
      RewardTransaction.create({
        userId: childId,
        walletId: wallet._id,
        actionType: 'gift_received',
        rewardPoints: 0,
        redeemCoins: amount,
        balanceBefore,
        balanceAfter,
        description: message
          ? `Received ${amount} RC from ${parent.firstName}: ${message}`
          : `Received ${amount} RC from ${parent.firstName}`,
        referenceId: gift._id,
        referenceType: 'GiftReward',
        createdBy: new Types.ObjectId(parentId),
        source: 'parent',
        metadata: { senderName: parent.firstName },
      }),
    ]);

    NotificationService.sendToUser(
      childId,
      'Coins Received!',
      `${parent.firstName} sent you ${amount} Redeem Coins!`,
    );

    return { giftId: gift._id, redeemCoins: wallet.redeemCoins };
  }

  static async freezeWallet(userId: string) {
    const wallet = await Wallet.findOne({ childId: userId });
    if (!wallet) throw new Error('Wallet not found');
    wallet.isFrozen = true;
    await wallet.save();
    return { isFrozen: true };
  }

  static async unfreezeWallet(userId: string) {
    const wallet = await Wallet.findOne({ childId: userId });
    if (!wallet) throw new Error('Wallet not found');
    wallet.isFrozen = false;
    await wallet.save();
    return { isFrozen: false };
  }

  static async adjustBalance(
    userId: string,
    adminId: string,
    pointsDelta: number,
    coinsDelta: number,
    reason: string,
  ) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    let wallet = await Wallet.findOne({ childId: userId });
    if (!wallet) {
      wallet = await Wallet.create({ childId: userId });
    }

    const balanceBefore = { rewardPoints: user.points ?? 0, redeemCoins: wallet.redeemCoins };

    user.points = Math.max(0, (user.points ?? 0) + pointsDelta);
    wallet.redeemCoins = Math.max(0, wallet.redeemCoins + coinsDelta);
    if (coinsDelta > 0) wallet.lifetimeRedeemCoinsEarned += coinsDelta;

    const balanceAfter = { rewardPoints: user.points, redeemCoins: wallet.redeemCoins };

    await Promise.all([
      user.save(),
      wallet.save(),
      RewardTransaction.create({
        userId,
        walletId: wallet._id,
        actionType: 'admin_adjustment',
        rewardPoints: pointsDelta,
        redeemCoins: coinsDelta,
        balanceBefore,
        balanceAfter,
        description: reason,
        referenceId: null,
        referenceType: null,
        createdBy: new Types.ObjectId(adminId),
        source: 'admin',
        metadata: { adminNote: reason },
      }),
      Activity.create({
        familyId: user.familyId,
        actorId: adminId,
        type: 'reward_adjusted',
        message: `Admin adjusted ${user.firstName}'s balance: ${pointsDelta} RP, ${coinsDelta} RC — ${reason}`,
        metadata: { pointsDelta, coinsDelta, reason, targetUserId: userId },
      }),
    ]);

    return {
      rewardPoints: user.points,
      redeemCoins: wallet.redeemCoins,
      pointsDelta,
      coinsDelta,
    };
  }

  static async getEconomyStats() {
    const [
      totalWallets,
      totalTransactions,
      totalConversions,
      topEarners,
      totalCoinsSpent,
    ] = await Promise.all([
      Wallet.countDocuments(),
      RewardTransaction.countDocuments(),
      RewardConversion.countDocuments({ status: 'approved' }),
      RewardTransaction.aggregate([
        { $match: { rewardPoints: { $gt: 0 }, actionType: { $ne: 'conversion_to_coins' } } },
        { $group: { _id: '$userId', totalEarned: { $sum: '$rewardPoints' } } },
        { $sort: { totalEarned: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            totalEarned: 1,
            firstName: '$user.firstName',
            lastName: '$user.lastName',
          },
        },
      ]),
      Wallet.aggregate([
        { $group: { _id: null, total: { $sum: '$lifetimeCoinsSpent' } } },
      ]),
    ]);

    const totalSpent = totalCoinsSpent[0]?.total ?? 0;

    const [
      mostPurchased,
      earningByAction,
    ] = await Promise.all([
      RewardTransaction.aggregate([
        { $match: { actionType: 'purchase' } },
        { $group: { _id: '$metadata.itemName', count: { $sum: 1 }, totalCoins: { $sum: { $abs: '$redeemCoins' } } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      RewardTransaction.aggregate([
        { $match: { rewardPoints: { $gt: 0 } } },
        { $group: { _id: '$actionType', total: { $sum: '$rewardPoints' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
    ]);

    return {
      totalWallets,
      totalTransactions,
      totalConversions,
      topEarners,
      mostPurchased,
      earningByAction,
      totalCoinsSpent: totalSpent,
    };
  }
}
