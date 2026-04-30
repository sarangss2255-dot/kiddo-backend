import { Schema, model } from 'mongoose';

const shopItemSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    category: { 
      type: String, 
      enum: ['hat', 'cape', 'glasses', 'pet', 'suit', 'background'], 
      required: true 
    },
    price: { type: Number, required: true, min: 0 },
    imageUrl: { type: String, required: true },
    assetId: { type: String, required: true }, // The ID used in the frontend to render the asset
    rarity: { 
      type: String, 
      enum: ['common', 'rare', 'epic', 'legendary'], 
      default: 'common' 
    },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const ShopItem = model('ShopItem', shopItemSchema);
