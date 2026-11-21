import { AdminNotification } from '../models/adminNotification.model.js';

export class NotificationService {
  /**
   * Create an Admin Notification from any dealer, customer, or system event
   */
  static async createNotification({
    sourceType,
    sourceId,
    sourceName,
    category,
    priority = 'NORMAL',
    title,
    message,
    entityType,
    entityId,
    actionUrl,
    metadata = {}
  }) {
    try {
      const notification = await AdminNotification.create({
        sourceType,
        sourceId,
        sourceName,
        category,
        priority,
        title,
        message,
        entityType,
        entityId,
        actionUrl,
        metadata
      });

      return notification;
    } catch (error) {
      console.error('Failed to create admin notification:', error.message);
      return null;
    }
  }
}
