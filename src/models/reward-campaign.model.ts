import { Schema, model, Types } from 'mongoose';

export interface IRewardCampaign {
  name: string;
  description: string;
  type: 'seasonal' | 'limited_time' | 'promotional';
  startDate: Date;
  endDate: Date;
  bonusPointsMultiplier: number;
  bonusCoinsMultiplier: number;
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const rewardCampaignSchema = new Schema<IRewardCampaign>(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    type: {
      type: String,
      enum: ['seasonal', 'limited_time', 'promotional'],
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    bonusPointsMultiplier: { type: Number, default: 1.0 },
    bonusCoinsMultiplier: { type: Number, default: 1.0 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

rewardCampaignSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

export const RewardCampaign = model<IRewardCampaign>('RewardCampaign', rewardCampaignSchema);
