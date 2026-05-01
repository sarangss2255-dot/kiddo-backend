import { Mood } from '../models/mood.model.js';

export async function logMood(userId: string, familyId: string, input: { emoji: string; label: string; note?: string }) {
  return Mood.create({
    userId,
    familyId,
    ...input,
  });
}

export async function getMoodHistory(userId: string) {
  return Mood.find({ userId }).sort({ createdAt: -1 }).limit(30);
}

export async function getFamilyMoods(familyId: string) {
  return Mood.find({ familyId }).sort({ createdAt: -1 }).limit(50).populate('userId', 'firstName avatar');
}
