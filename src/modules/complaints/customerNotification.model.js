import mongoose, { Schema } from 'mongoose';

const customerNotificationSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: [
        'TICKET_STATUS_CHANGED',
        'TICKET_REPLY_RECEIVED',
        'TICKET_INFO_REQUESTED',
        'TICKET_RESOLVED',
        'TICKET_CLOSED',
        'TICKET_REOPENED',
        'GENERAL'
      ],
      default: 'GENERAL',
      index: true
    },
    ticketId: {
      type: String,
      default: ''
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
    isRead: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

export const CustomerNotification = mongoose.model('CustomerNotification', customerNotificationSchema);
