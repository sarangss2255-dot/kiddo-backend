import { Schema, model, Types } from 'mongoose';

export interface IPurchasedItem {
  userId: Types.ObjectId;
  itemId: Types.ObjectId;
  itemName: string;
  itemCategory: Types.ObjectId;
  coinCost: number;
  rarity: string;
  purchasedAt: Date;
  isEquipped: boolean;
  transactionRef: Types.ObjectId;
  createdAt: Date;
}

const purchasedItemSchema = new Schema<IPurchasedItem>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    itemId: { type: Schema.Types.ObjectId, ref: 'RewardStoreItem', required: true },
    itemName: { type: String, required: true },
    itemCategory: { type: Schema.Types.ObjectId, ref: 'RewardCategory', required: true },
    coinCost: { type: Number, required: true },
    rarity: { type: String, required: true },
    purchasedAt: { type: Date, default: Date.now },
    isEquipped: { type: Boolean, default: false },
    transactionRef: { type: Schema.Types.ObjectId, ref: 'RewardTransaction', required: true },
  },
  { timestamps: true },
);

purchasedItemSchema.index({ userId: 1, itemId: 1 }, { unique: true });
purchasedItemSchema.index({ userId: 1, isEquipped: 1 });

export const PurchasedItem = model<IPurchasedItem>('PurchasedItem', purchasedItemSchema);
