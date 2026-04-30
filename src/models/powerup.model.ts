import { Schema, model } from 'mongoose';

const powerupLogSchema = new Schema(
  {
    familyId: { type: Schema.Types.ObjectId, ref: 'Family' },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['focus_timer', 'brain_break', 'knowledge_quest'],
      required: true,
    },
    durationSeconds: { type: Number, default: 0 },
    questionId: { type: Number },
    answer: { type: String },
    correct: { type: Boolean },
    pointsAwarded: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const PowerupLog = model('PowerupLog', powerupLogSchema);
