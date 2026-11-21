import mongoose, { Schema } from 'mongoose';

const dealerNotificationSchema = new Schema(
  {
    dealer: {
      type: Schema.Types.ObjectId,
      ref: 'Dealer',
      required: true,
      index: true
    },
    dealerCode: {
      type: String,
      default: ''
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

export const DealerNotification = mongoose.model('DealerNotification', dealerNotificationSchema);
