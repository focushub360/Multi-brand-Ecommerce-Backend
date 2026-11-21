import mongoose, { Schema } from 'mongoose';

const adminNotificationSchema = new Schema(
  {
    sourceType: {
      type: String,
      enum: ['DEALER', 'CUSTOMER', 'SYSTEM'],
      required: true,
      index: true
    },
    sourceId: {
      type: Schema.Types.ObjectId,
      required: true
    },
    sourceName: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      enum: [
        'DEALER_ONBOARDING',
        'DEALER_COMPLAINT',
        'INVENTORY_ALERT',
        'CUSTOMER_DISPUTE',
        'ORDER_ANOMALY',
        'PAYMENT_SETTLEMENT'
      ],
      required: true,
      index: true
    },
    priority: {
      type: String,
      enum: ['LOW', 'NORMAL', 'URGENT', 'CRITICAL'],
      default: 'NORMAL',
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    entityType: {
      type: String,
      required: true
    },
    entityId: {
      type: String,
      required: true
    },
    actionUrl: {
      type: String,
      required: true
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    readAt: {
      type: Date,
      default: null
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

adminNotificationSchema.index({ isRead: 1, createdAt: -1 });
adminNotificationSchema.index({ sourceType: 1, isRead: 1 });

export const AdminNotification = mongoose.model('AdminNotification', adminNotificationSchema);
