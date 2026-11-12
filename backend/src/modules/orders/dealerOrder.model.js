import mongoose, { Schema } from 'mongoose';
import { ALL_ORDER_STATUSES } from '../../constants/orderStatus.js';

const dealerOrderSchema = new Schema(
  {
    parentOrder: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true
    },
    parentOrderNumber: {
      type: String,
      required: true,
      index: true
    },
    orderNumber: {
      type: String,
      index: true
    },
    dealer: {
      type: Schema.Types.ObjectId,
      ref: 'Dealer',
      required: true,
      index: true
    },
    dealerCode: {
      type: String,
      required: true,
      index: true
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    customerSnapshot: {
      name: { type: String, required: true },
      email: { type: String, default: '' },
      city: { type: String, required: true },
      state: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true }
    },
    items: [
      {
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        name: { type: String, required: true },
        sku: { type: String, required: true },
        price: { type: Number, required: true },
        mrp: { type: Number },
        quantity: { type: Number, required: true },
        subtotal: { type: Number, required: true },
        category: { type: String, default: '' },
        subcategory: { type: String, default: '' },
        image: { type: String },
        grade: { type: String, default: 'Commercial Grade' }
      }
    ],
    subtotal: { type: Number, required: true },
    commissionRate: { type: Number, required: true, default: 5.0 },
    commissionAmount: { type: Number, required: true },
    netSettlementAmount: { type: Number, required: true },
    orderStatus: {
      type: String,
      enum: ALL_ORDER_STATUSES,
      default: 'Placed',
      index: true
    },
    paymentStatus: {
      type: String,
      enum: ['Paid', 'Pending', 'Refunded'],
      default: 'Paid'
    },
    fulfillmentPartner: {
      type: String,
      default: 'Delhivery Cargo Express'
    },
    trackingNumber: {
      type: String,
      default: ''
    },
    estimatedDelivery: {
      type: String,
      default: ''
    },
    payoutStatus: {
      type: String,
      enum: ['Pending Escrow', 'Escrow Held', 'Released', 'Settled'],
      default: 'Escrow Held'
    },
    timeline: [
      {
        status: { type: String, required: true },
        title: { type: String, required: true },
        note: { type: String, default: '' },
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  {
    timestamps: true
  }
);

// Compound index for dealer portal performance
dealerOrderSchema.index({ dealer: 1, orderStatus: 1 });

export const DealerOrder = mongoose.model('DealerOrder', dealerOrderSchema);

