import { Schema, model, Types } from 'mongoose';

export interface IRewardStoreItem {
  name: string;
  description: string;
  imageUrl: string;
  category: Types.ObjectId;
  coinCost: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  stock: number;
  isAvailable: boolean;
  isFeatured: boolean;
  unlockLevel: number;
  isLimitedEdition: boolean;
  seasonalEvent: Types.ObjectId | null;
  parentApprovalRequired: boolean;
  sortOrder: number;
  tags: string[];
  startDate: Date | null;
  endDate: Date | null;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const rewardStoreItemSchema = new Schema<IRewardStoreItem>(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    category: { type: Schema.Types.ObjectId, ref: 'RewardCategory', required: true },
    coinCost: { type: Number, required: true, min: 1 },
    rarity: {
      type: String,
      enum: ['common', 'rare', 'epic', 'legendary', 'mythic'],
      default: 'common',
    },
    stock: { type: Number, default: -1 },
    isAvailable: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    unlockLevel: { type: Number, default: 1 },
    isLimitedEdition: { type: Boolean, default: false },
    seasonalEvent: { type: Schema.Types.ObjectId, ref: 'RewardCampaign', default: null },
    parentApprovalRequired: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    tags: { type: [String], default: [] },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

rewardStoreItemSchema.index({ category: 1, isAvailable: 1 });
rewardStoreItemSchema.index({ isFeatured: 1, isAvailable: 1 });
rewardStoreItemSchema.index({ rarity: 1 });

export const RewardStoreItem = model<IRewardStoreItem>('RewardStoreItem', rewardStoreItemSchema);
