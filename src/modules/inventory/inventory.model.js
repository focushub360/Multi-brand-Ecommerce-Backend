import mongoose, { Schema } from 'mongoose';

const inventorySchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
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
    sku: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },
    currentStock: {
      type: Number,
      required: true,
      min: [0, 'Current stock cannot be negative'],
      default: 0
    },
    reservedStock: {
      type: Number,
      default: 0,
      min: [0, 'Reserved stock cannot be negative']
    },
    threshold: {
      type: Number,
      default: 10,
      min: 0
    },
    locationBay: {
      type: String,
      default: 'Bay 01'
    },
    status: {
      type: String,
      enum: ['In Stock', 'Low Stock', 'Out of Stock'],
      default: 'In Stock',
      index: true
    }
  },
  {
    timestamps: true
  }
);

inventorySchema.virtual('availableStock').get(function () {
  return Math.max(0, this.currentStock - this.reservedStock);
});

export const Inventory = mongoose.model('Inventory', inventorySchema);

