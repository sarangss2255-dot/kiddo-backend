import { Activity } from '../models/activity.model.js';

export async function listFamilyActivity(familyId: string) {
  return Activity.find({ familyId }).sort({ createdAt: -1 }).limit(50).lean();
}
