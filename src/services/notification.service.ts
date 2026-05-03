import { firebaseAdmin } from '../config/firebase-admin.js';
import { User } from '../models/user.model.js';

export class NotificationService {
  /**
   * Send a push notification to a specific user
   */
  static async sendToUser(userId: string, title: string, body: string, data?: Record<string, string>) {
    try {
      const user = await User.findById(userId).select('notificationToken').lean();
      if (!user || !user.notificationToken) {
        console.log(`User ${userId} has no notification token, skipping push.`);
        return;
      }

      const message = {
        notification: {
          title,
          body,
        },
        data: data || {},
        token: user.notificationToken,
      };

      const response = await firebaseAdmin.messaging().send(message);
      console.log('Successfully sent message:', response);
      return response;
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  /**
   * Send a push notification to all parents in a family
   */
  static async sendToFamilyParents(familyId: string, title: string, body: string, data?: Record<string, string>) {
    try {
      const parents = await User.find({ familyId, role: 'parent' }).select('notificationToken').lean();
      const tokens = parents.map(p => p.notificationToken).filter((t): t is string => !!t);

      if (tokens.length === 0) return;

      const message = {
        notification: {
          title,
          body,
        },
        data: data || {},
        tokens: tokens,
      };

      const response = await firebaseAdmin.messaging().sendEachForMulticast(message);
      console.log(`${response.successCount} messages were sent successfully`);
      return response;
    } catch (error) {
      console.error('Error sending multicast push notification:', error);
    }
  }
}
