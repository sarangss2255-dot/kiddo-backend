import { Schema, model } from 'mongoose';

const familySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    inviteCode: { type: String, required: true, unique: true },
  },
  { timestamps: true },
);

export const Family = model('Family', familySchema);
