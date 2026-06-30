import { Types } from 'mongoose';
import { RewardRule } from '../models/reward-rule.model.js';
import { RewardCampaign } from '../models/reward-campaign.model.js';
import { RewardConversion } from '../models/reward-conversion.model.js';
import { RewardTransaction } from '../models/reward-transaction.model.js';
import { WalletService } from './wallet.service.js';

export class RewardAdminService {
  static async listRules() {
    return RewardRule.find().sort({ actionType: 1 }).lean();
  }

  static async createRule(data: {
    actionType: string; name: string; description?: string;
    basePoints: number; frequency?: string; maxPerDay?: number;
    maxPerWeek?: number; maxPerMonth?: number; adminId: string;
  }) {
    const existing = await RewardRule.findOne({ actionType: data.actionType });
    if (existing) throw new Error(`Rule for action '${data.actionType}' already exists`);

    return RewardRule.create({
      actionType: data.actionType,
      name: data.name,
      description: data.description ?? '',
      basePoints: data.basePoints,
      isActive: true,
      frequency: data.frequency ?? 'unlimited',
      maxPerDay: data.maxPerDay ?? 0,
      maxPerWeek: data.maxPerWeek ?? 0,
      maxPerMonth: data.maxPerMonth ?? 0,
      applicableRoles: ['child'],
      createdBy: new Types.ObjectId(data.adminId),
      updatedBy: new Types.ObjectId(data.adminId),
    });
  }

  static async updateRule(ruleId: string, data: Partial<{
    name: string; description: string; basePoints: number;
    isActive: boolean; frequency: string; maxPerDay: number;
    maxPerWeek: number; maxPerMonth: number; adminId: string;
  }>) {
    const rule = await RewardRule.findById(ruleId);
    if (!rule) throw new Error('Rule not found');

    const updateData: Record<string, unknown> = { ...data };
    if (data.adminId) {
      updateData.updatedBy = new Types.ObjectId(data.adminId);
      delete updateData.adminId;
    }

    Object.assign(rule, updateData);
    return rule.save();
  }

  static async listCampaigns() {
    return RewardCampaign.find().sort({ startDate: -1 }).lean();
  }

  static async createCampaign(data: {
    name: string; description?: string; type: string;
    startDate: Date; endDate: Date; bonusPointsMultiplier?: number;
    bonusCoinsMultiplier?: number; adminId: string;
  }) {
    return RewardCampaign.create({
      name: data.name,
      description: data.description ?? '',
      type: data.type,
      startDate: data.startDate,
      endDate: data.endDate,
      bonusPointsMultiplier: data.bonusPointsMultiplier ?? 1.0,
      bonusCoinsMultiplier: data.bonusCoinsMultiplier ?? 1.0,
      isActive: true,
      createdBy: new Types.ObjectId(data.adminId),
    });
  }

  static async updateCampaign(campaignId: string, data: Partial<{
    name: string; description: string; type: string;
    startDate: Date; endDate: Date; bonusPointsMultiplier: number;
    bonusCoinsMultiplier: number; isActive: boolean;
  }>) {
    const campaign = await RewardCampaign.findByIdAndUpdate(campaignId, data, { new: true });
    if (!campaign) throw new Error('Campaign not found');
    return campaign;
  }

  static async getTransactionLogs(
    page = 1,
    limit = 50,
    actionType?: string,
    userId?: string,
  ) {
    const filter: Record<string, unknown> = {};
    if (actionType) filter.actionType = actionType;
    if (userId) filter.userId = userId;

    const total = await RewardTransaction.countDocuments(filter);
    const transactions = await RewardTransaction.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('userId', 'firstName lastName role email')
      .populate('createdBy', 'firstName lastName role')
      .lean();

    return { transactions, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async getEconomyStats() {
    return WalletService.getEconomyStats();
  }

  static async getConversionAnalytics() {
    const pipeline = [
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalPoints: { $sum: '$rewardPointsUsed' },
          totalCoins: { $sum: '$redeemCoinsAwarded' },
        },
      },
    ];

    const byStatus = await RewardConversion.aggregate(pipeline);

    const daily = await RewardConversion.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          totalPoints: { $sum: '$rewardPointsUsed' },
          totalCoins: { $sum: '$redeemCoinsAwarded' },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 30 },
    ]);

    return { byStatus, daily };
  }
}
