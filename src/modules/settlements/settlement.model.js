import mongoose, { Schema } from 'mongoose';

const settlementSchema = new Schema(
  {
    settlementId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    dealer: {
      type: Schema.Types.ObjectId,
      ref: 'Dealer',
      required: true,
      index: true
    },
    dealerName: {
      type: String,
      required: true
    },
    cycle: {
      type: String,
      required: true
    },
    grossAmount: {
      type: Number,
      required: true
    },
    commissionDeducted: {
      type: Number,
      required: true
    },
    taxDeducted: {
      type: Number,
      default: 0
    },
    netPayout: {
      type: Number,
      required: true
    },
    bankRef: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['HELD', 'PROCESSING', 'SETTLED', 'FAILED'],
      default: 'HELD',
      index: true
    },
    dealerOrders: [
      {
        type: Schema.Types.ObjectId,
        ref: 'DealerOrder'
      }
    ],
    settledAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

export const Settlement = mongoose.model('Settlement', settlementSchema);

