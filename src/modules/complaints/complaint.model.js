import mongoose, { Schema } from 'mongoose';

export const DEALER_TICKET_CATEGORIES = [
  'Account & Verification',
  'Product & Catalog',
  'Inventory & Stock',
  'Orders & Delivery',
  'Payments & Settlements',
  'Store Settings',
  'Technical Issues',
  'Other / General'
];

export const CUSTOMER_TICKET_CATEGORIES = [
  'Account & Login Issues',
  'Product & Catalog Issues',
  'Cart & Wishlist Issues',
  'Order-Related Issues',
  'Payment & Refund Issues',
  'Delivery & Tracking Issues',
  'Address & Location Issues',
  'Technical Issues',
  'Other / General'
];

export const LEGACY_TICKET_CATEGORIES = [
  'Logistics & Courier',
  'Billing & Tax',
  'Product Defect',
  'Account & KYC',
  'General'
];

export const ALL_TICKET_CATEGORIES = Array.from(
  new Set([...DEALER_TICKET_CATEGORIES, ...CUSTOMER_TICKET_CATEGORIES, ...LEGACY_TICKET_CATEGORIES])
);

// Backward-compatible alias
export const TICKET_CATEGORIES = ALL_TICKET_CATEGORIES;

export const DEALER_TICKET_STATUSES = [
  'Open',
  'Under Review',
  'In Progress',
  'Waiting for Dealer',
  'Resolved',
  'Closed'
];

export const CUSTOMER_TICKET_STATUSES = [
  'Open',
  'Under Review',
  'In Progress',
  'Waiting for Customer',
  'Resolved',
  'Closed'
];

export const TICKET_STATUSES = [
  'Open',
  'Under Review',
  'In Progress',
  'Waiting for Dealer',
  'Waiting for Customer',
  'Escalated',
  'Resolved',
  'Closed'
];

const attachmentSchema = new Schema(
  {
    name: { type: String, required: true },
    type: { type: String, required: true },
    size: { type: Number, default: 0 },
    url: { type: String, required: true }
  },
  { _id: false }
);

const messageSchema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      required: true
    },
    senderModel: {
      type: String,
      enum: ['User', 'Dealer'],
      default: 'User'
    },
    senderName: { type: String, required: true },
    senderRole: {
      type: String,
      enum: ['customer', 'dealer', 'admin'],
      required: true
    },
    text: { type: String, required: true },
    attachments: [attachmentSchema],
    timestamp: { type: Date, default: Date.now }
  },
  { _id: true }
);

const internalNoteSchema = new Schema(
  {
    author: {
      type: Schema.Types.ObjectId,
      required: true
    },
    note: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  },
  { _id: true }
);

const statusHistorySchema = new Schema(
  {
    status: {
      type: String,
      enum: TICKET_STATUSES,
      required: true
    },
    changedBy: {
      type: Schema.Types.ObjectId
    },
    changedByName: {
      type: String,
      default: ''
    },
    changedByRole: {
      type: String,
      enum: ['admin', 'dealer', 'customer', 'system'],
      default: 'admin'
    },
    reason: {
      type: String,
      default: ''
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
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
      required: true,
      index: true
    },
    requesterModel: {
      type: String,
      enum: ['User', 'Dealer'],
      default: 'User'
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
      enum: ALL_TICKET_CATEGORIES,
      required: true,
      default: 'Other / General'
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium'
    },
    status: {
      type: String,
      enum: TICKET_STATUSES,
      default: 'Open',
      index: true
    },
    attachments: [attachmentSchema],
    messages: [messageSchema],
    internalNotes: [internalNoteSchema],
    statusHistory: [statusHistorySchema],
    dealerSnapshot: {
      dealerId: { type: Schema.Types.ObjectId, ref: 'Dealer' },
      dealerCode: { type: String, default: '' },
      businessName: { type: String, default: '' },
      ownerName: { type: String, default: '' },
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
      storeAddress: { type: String, default: '' }
    },
    customerSnapshot: {
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      defaultAddress: { type: String, default: '' }
    },
    orderSnapshot: {
      orderId: { type: String, default: '' },
      orderNumber: { type: String, default: '' },
      totalAmount: { type: Number, default: 0 },
      orderStatus: { type: String, default: '' },
      itemsCount: { type: Number, default: 0 },
      placedAt: { type: Date }
    }
  },
  {
    timestamps: true
  }
);

export const Complaint = mongoose.model('Complaint', complaintSchema);
