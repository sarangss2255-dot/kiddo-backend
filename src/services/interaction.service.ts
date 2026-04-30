import { Interaction } from '../models/interaction.model.js';
import { Activity } from '../models/activity.model.js';
import { User } from '../models/user.model.js';

export async function sendInteraction(
  familyId: string,
  senderId: string,
  receiverId: string,
  type: 'high_five' | 'cheer' | 'well_done',
  activityId?: string,
) {
  const sender = await User.findById(senderId);
  const receiver = await User.findById(receiverId);

  if (!sender || !receiver) throw new Error('User not found');

  const interaction = await Interaction.create({
    familyId,
    senderId,
    receiverId,
    type,
    activityId,
  });

  const messages = {
    high_five: 'sent a high-five ✋',
    cheer: 'cheered for you 📣',
    well_done: 'said well done! 🌟',
  };

  await Activity.create({
    familyId,
    actorId: senderId,
    type: 'child_updated', // Reuse an existing enum type or add a new one if possible
    message: `${sender.firstName} ${messages[type]} to ${receiver.firstName}`,
    metadata: { interactionId: interaction.id, type, receiverId },
  });

  return interaction;
}

export async function getInteractions(userId: string) {
  return Interaction.find({ receiverId: userId })
    .populate('senderId', 'firstName lastName avatar')
    .sort({ createdAt: -1 })
    .limit(20);
}
