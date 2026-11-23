import mongoose, { Schema } from 'mongoose';

const productSchema = new Schema(
  {
    dealer: {
      type: Schema.Types.ObjectId,
      ref: 'Dealer',
      required: [true, 'Product dealer reference is required'],
      index: true
    },
    dealerCode: {
      type: String,
      required: true,
      index: true
    },
    dealerName: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
      index: true
    },
    categoryName: {
      type: String,
      required: true
    },
    subcategory: {
      type: String,
      required: [true, 'Subcategory is required'],
      trim: true,
      index: true
    },
    brand: {
      type: String,
      trim: true,
      default: 'Generic'
    },
    description: {
      type: String,
      required: [true, 'Product description is required']
    },
    price: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Price cannot be negative']
    },
    mrp: {
      type: Number,
      required: [true, 'MRP price is required'],
      min: [0, 'MRP cannot be negative']
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    gstRate: {
      type: Number,
      default: 18,
      min: 0
    },
    stock: {
      type: Number,
      required: [true, 'Stock count is required'],
      default: 0,
      min: [0, 'Stock cannot be negative']
    },
    threshold: {
      type: Number,
      default: 10,
      min: 0
    },
    status: {
      type: String,
      enum: ['Active', 'Draft', 'Archived', 'Pending Approval', 'Rejected'],
      default: 'Active',
      index: true
    },
    image: {
      type: String,
      required: [true, 'Primary product image is required']
    },
    images: [{ type: String }],
    specs: {
      type: Map,
      of: String,
      default: {}
    },
    highlights: [{ type: String }],
    warranty: {
      type: String,
      default: '1 Year Manufacturer Warranty'
    },
    rating: {
      type: Number,
      default: 4.5,
      min: 0,
      max: 5
    },
    reviewCount: {
      type: Number,
      default: 0
    },
    totalSales: {
      type: Number,
      default: 0
    },
    deliveryInfo: {
      standardDays: { type: String, default: '3 - 5 Business Days' },
      shippingFee: { type: String, default: 'FREE Express Delivery' },
      dispatchTime: { type: String, default: 'Dispatched within 24 Hours' }
    }
  },
  {
    timestamps: true
  }
);

// Compound Indexes for fast catalog browsing & dealer queries
productSchema.index({ category: 1, status: 1 });
productSchema.index({ dealer: 1, status: 1 });
productSchema.index({ category: 1, subcategory: 1, status: 1 });

// Full-text search index for search bar queries
productSchema.index({
  name: 'text',
  description: 'text',
  brand: 'text',
  subcategory: 'text'
});

export const Product = mongoose.model('Product', productSchema);

