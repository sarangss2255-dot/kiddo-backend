import { Schema, model } from 'mongoose';

const interactionSchema = new Schema(
  {
    familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['high_five', 'cheer', 'well_done'],
      required: true,
    },
    activityId: { type: Schema.Types.ObjectId, ref: 'Activity' },
    message: { type: String, default: '' },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Interaction = model('Interaction', interactionSchema);
