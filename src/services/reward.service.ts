import { StatusCodes } from 'http-status-codes';
import { Activity } from '../models/activity.model.js';
import { Reward } from '../models/reward.model.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/api-error.js';

export async function listRewards(familyId: string, userId?: string, role?: string) {
  const rewards = await Reward.find(role === 'child' ? { familyId, isActive: true } : { familyId })
    .sort({ pointsCost: 1 })
    .lean();

  if (userId) {
    const user = await User.findById(userId);
    if (user) {
      return rewards.map((reward) => ({
        ...reward,
        canRedeem: user.points >= reward.pointsCost && (!reward.unlockedAtStreak || (user.streak ?? 0) >= reward.unlockedAtStreak),
        userPoints: user.points,
      }));
    }
  }

  return rewards.map((reward) => ({ ...reward, canRedeem: false }));
}

export async function createReward(
  familyId: string,
  actorId: string,
  input: { title: string; description?: string; pointsCost: number; unlockedAtStreak?: number },
) {
  const reward = await Reward.create({
    familyId,
    title: input.title,
    description: input.description ?? '',
    pointsCost: input.pointsCost,
    unlockedAtStreak: input.unlockedAtStreak ?? 0,
  });

  await Activity.create({
    familyId,
    actorId,
    type: 'reward_created',
    message: `Created reward "${reward.title}"`,
    metadata: { rewardId: reward.id },
  });

  return reward;
}

export async function updateReward(
  rewardId: string,
  familyId: string,
  actorId: string,
  input: {
    title?: string;
    description?: string;
    pointsCost?: number;
    unlockedAtStreak?: number;
    isActive?: boolean;
  },
) {
  const reward = await Reward.findOne({ _id: rewardId, familyId });
  if (!reward) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Reward not found');
  }

  Object.assign(reward, input);
  await reward.save();

  await Activity.create({
    familyId,
    actorId,
    type: 'reward_updated',
    message: `Updated reward "${reward.title}"`,
    metadata: { rewardId: reward.id },
  });

  return reward;
}

export async function deleteReward(rewardId: string, familyId: string, actorId: string) {
  const reward = await Reward.findOneAndDelete({ _id: rewardId, familyId });
  if (!reward) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Reward not found');
  }

  await Activity.create({
    familyId,
    actorId,
    type: 'reward_updated',
    message: `Deleted reward "${reward.title}"`,
    metadata: { rewardId },
  });

  return { success: true };
}

export async function redeemReward(rewardId: string, userId: string, familyId: string) {
  const reward = await Reward.findOne({ _id: rewardId, familyId, isActive: true });
  if (!reward) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Reward not found');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  if (user.points < reward.pointsCost) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Not enough points to redeem this reward');
  }

  if (reward.unlockedAtStreak && (user.streak ?? 0) < reward.unlockedAtStreak) {
    throw new ApiError(StatusCodes.BAD_REQUEST, `You need a ${reward.unlockedAtStreak}-day streak to unlock this reward`);
  }

  user.points -= reward.pointsCost;
  await user.save();

  await Activity.create({
    familyId,
    actorId: userId,
    type: 'reward_redeemed',
    message: `${user.firstName} redeemed "${reward.title}" for ${reward.pointsCost} points`,
    metadata: { rewardId, pointsSpent: reward.pointsCost },
  });

  return {
    success: true,
    reward: { title: reward.title, pointsCost: reward.pointsCost },
    remainingPoints: user.points,
  };
}
