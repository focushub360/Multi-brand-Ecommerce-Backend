import mongoose, { Schema } from 'mongoose';
import { ALL_ORDER_STATUSES } from '../../constants/orderStatus.js';

const orderItemSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    price: { type: Number, required: true },
    mrp: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    category: { type: String, required: true },
    dealer: {
      type: Schema.Types.ObjectId,
      ref: 'Dealer',
      required: true
    },
    dealerCode: { type: String, required: true },
    dealerName: { type: String, required: true },
    image: { type: String, required: true },
    subtotal: { type: Number, required: true }
  },
  { _id: true }
);

const orderTimelineSchema = new Schema(
  {
    status: { type: String, required: true },
    title: { type: String, required: true },
    note: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now }
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    customerSnapshot: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true }
    },
    shippingAddress: {
      name: { type: String, required: true },
      mobile: { type: String, required: true },
      pincode: { type: String, required: true },
      house: { type: String, required: true },
      street: { type: String, required: true },
      landmark: { type: String, default: '' },
      city: { type: String, required: true },
      state: { type: String, required: true },
      type: { type: String, default: 'Home' }
    },
    items: [orderItemSchema],
    dealers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Dealer'
      }
    ],
    dealerOrders: [
      {
        type: Schema.Types.ObjectId,
        ref: 'DealerOrder'
      }
    ],
    pricing: {
      itemsTotal: { type: Number, required: true },
      discount: { type: Number, default: 0 },
      deliveryFee: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      total: { type: Number, required: true }
    },
    payment: {
      method: {
        type: String,
        enum: ['upi', 'card', 'netbanking', 'cod'],
        required: true
      },
      methodLabel: { type: String, default: 'Online Payment' },
      status: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
        default: 'Pending'
      },
      transactionId: { type: String, default: '' },
      paidAt: { type: Date }
    },
    orderStatus: {
      type: String,
      enum: ALL_ORDER_STATUSES,
      default: 'Placed',
      index: true
    },
    timeline: [orderTimelineSchema]
  },
  {
    timestamps: true
  }
);

export const Order = mongoose.model('Order', orderSchema);

