import { Schema, model } from 'mongoose';

const rewardSchema = new Schema(
  {
    familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    pointsCost: { type: Number, required: true, min: 0 },
    unlockedAtStreak: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Reward = model('Reward', rewardSchema);
