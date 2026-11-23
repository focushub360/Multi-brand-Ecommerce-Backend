import mongoose, { Schema } from 'mongoose';

const inventoryTransactionSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true
    },
    dealer: {
      type: Schema.Types.ObjectId,
      ref: 'Dealer',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: [
        'PURCHASE_RESTOCK',
        'ORDER_RESERVED',
        'ORDER_DEDUCTED',
        'ORDER_CANCELLED_RESTORE',
        'MANUAL_ADJUSTMENT',
        'AUDIT_CORRECTION'
      ],
      required: true,
      index: true
    },
    quantityChange: {
      type: Number,
      required: true
    },
    balanceAfter: {
      type: Number,
      required: true
    },
    referenceId: {
      type: String,
      default: ''
    },
    reason: {
      type: String,
      required: true
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false } // Immutable audit ledger
  }
);

export const InventoryTransaction = mongoose.model('InventoryTransaction', inventoryTransactionSchema);

