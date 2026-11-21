import mongoose, { Schema } from 'mongoose';

const paymentSchema = new Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true
    },
    orderNumber: {
      type: String,
      required: true,
      index: true
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    customerName: { type: String, required: true },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'INR'
    },
    paymentMethod: {
      type: String,
      enum: ['upi', 'card', 'netbanking', 'cod'],
      required: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
      index: true
    },
    escrowStatus: {
      type: String,
      enum: ['Escrow Held', 'Released', 'Refunded'],
      default: 'Escrow Held',
      index: true
    },
    gatewayDetails: {
      type: Schema.Types.Mixed,
      default: {}
    },
    paidAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

export const Payment = mongoose.model('Payment', paymentSchema);

