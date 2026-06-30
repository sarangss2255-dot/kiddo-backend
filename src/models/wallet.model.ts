import { Schema, model, Types } from 'mongoose';

export interface IWallet {
  childId: Types.ObjectId;
  redeemCoins: number;
  lifetimeRewardPointsEarned: number;
  lifetimeRedeemCoinsEarned: number;
  lifetimeCoinsSpent: number;
  totalConversions: number;
  pendingConversions: number;
  isFrozen: boolean;
  dailyConversionUsed: number;
  weeklyConversionUsed: number;
  monthlyConversionUsed: number;
  lastConversionDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const walletSchema = new Schema<IWallet>(
  {
    childId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    redeemCoins: { type: Number, default: 0, min: 0 },
    lifetimeRewardPointsEarned: { type: Number, default: 0 },
    lifetimeRedeemCoinsEarned: { type: Number, default: 0 },
    lifetimeCoinsSpent: { type: Number, default: 0 },
    totalConversions: { type: Number, default: 0 },
    pendingConversions: { type: Number, default: 0 },
    isFrozen: { type: Boolean, default: false },
    dailyConversionUsed: { type: Number, default: 0 },
    weeklyConversionUsed: { type: Number, default: 0 },
    monthlyConversionUsed: { type: Number, default: 0 },
    lastConversionDate: { type: Date, default: null },
  },
  { timestamps: true },
);

export const Wallet = model<IWallet>('Wallet', walletSchema);
