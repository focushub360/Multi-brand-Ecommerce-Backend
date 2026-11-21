import mongoose, { Schema } from 'mongoose';

const messageSchema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    senderName: { type: String, required: true },
    senderRole: {
      type: String,
      enum: ['customer', 'dealer', 'admin'],
      required: true
    },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  },
  { _id: true }
);

const internalNoteSchema = new Schema(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    note: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  },
  { _id: true }
);

const complaintSchema = new Schema(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    ticketType: {
      type: String,
      enum: ['dealer', 'customer'],
      required: true,
      index: true
    },
    requester: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    requesterName: { type: String, required: true },
    requesterEmail: { type: String, required: true },
    requesterRole: { type: String, required: true },
    concernedDealer: {
      type: Schema.Types.ObjectId,
      ref: 'Dealer'
    },
    concernedDealerName: { type: String, default: '' },
    orderNumber: { type: String, default: '' },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      enum: ['Logistics & Courier', 'Billing & Tax', 'Product Defect', 'Account & KYC', 'General'],
      required: true
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium'
    },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Escalated', 'Resolved', 'Closed'],
      default: 'Open',
      index: true
    },
    messages: [messageSchema],
    internalNotes: [internalNoteSchema]
  },
  {
    timestamps: true
  }
);

export const Complaint = mongoose.model('Complaint', complaintSchema);

