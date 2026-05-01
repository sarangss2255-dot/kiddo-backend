import { Schema, model } from 'mongoose';

const moodSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true },
    emoji: { type: String, required: true },
    label: { type: String, required: true },
    note: { type: String, default: '' },
  },
  { timestamps: true },
);

export const Mood = model('Mood', moodSchema);
