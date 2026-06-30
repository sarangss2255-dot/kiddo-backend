import { Schema, model } from 'mongoose';

const avatarItemSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    category: {
      type: String,
      enum: [
        'hair', 'eyes', 'eyebrows', 'mouth', 'skin',
        'top', 'bottom', 'shoes',
        'hat', 'glasses', 'necklace', 'watch',
        'back', 'pet', 'hand', 'effect', 'pose',
      ],
      required: true,
    },
    subcategory: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    rarity: {
      type: String,
      enum: ['common', 'rare', 'epic', 'legendary', 'mythic'],
      default: 'common',
    },
    assetId: { type: String, required: true },
    thumbnail: { type: String, default: '' },
    colors: { type: Map, of: String, default: {} },
    animationEffect: { type: String, default: '' },
    premium: { type: Boolean, default: false },
    unlockLevel: { type: Number, default: 1 },
    gender: { type: String, enum: ['male', 'female', 'unisex'], default: 'unisex' },
    isAvailable: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

avatarItemSchema.index({ category: 1, isAvailable: 1 });
avatarItemSchema.index({ gender: 1, category: 1 });

export const AvatarItem = model('AvatarItem', avatarItemSchema);
