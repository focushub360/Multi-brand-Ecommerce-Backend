import mongoose, { Schema } from 'mongoose';
import { DEALER_STATUS, ALL_DEALER_STATUSES } from '../../constants/dealerStatus.js';

const kycDocumentSchema = new Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    status: {
      type: String,
      enum: ['Verified', 'Under Review', 'Pending Upload', 'Rejected'],
      default: 'Under Review'
    },
    uploadedAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

const approvalHistorySchema = new Schema(
  {
    action: {
      type: String,
      enum: ['APPROVED', 'REJECTED', 'SUSPENDED', 'REACTIVATED'],
      required: true
    },
    actionBy: { type: Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
    reason: { type: String, default: '' }
  },
  { _id: false }
);

const dealerSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    dealerCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    businessName: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true
    },
    businessType: {
      type: String,
      enum: ['Manufacturer', 'Distributor', 'Wholesaler', 'Retailer', 'Authorized Dealer'],
      required: [true, 'Business type is required']
    },
    primaryCategory: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Primary category is required'],
      index: true
    },
    primaryCategoryName: {
      type: String,
      required: true,
      trim: true
    },
    ownerName: {
      type: String,
      required: [true, 'Owner name is required'],
      trim: true
    },
    officialEmail: {
      type: String,
      required: [true, 'Official email is required'],
      lowercase: true,
      trim: true,
      index: true
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true
    },
    gstin: {
      type: String,
      required: [true, 'GSTIN is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    pan: {
      type: String,
      uppercase: true,
      trim: true,
      default: ''
    },
    businessAddress: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true }
    },
    warehouseAddress: {
      type: String,
      required: [true, 'Warehouse address is required']
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [73.8567, 18.5204]
      }
    },
    status: {
      type: String,
      enum: ALL_DEALER_STATUSES,
      default: DEALER_STATUS.PENDING,
      index: true
    },
    tier: {
      type: String,
      enum: ['Bronze Tier', 'Silver Tier', 'Gold Tier'],
      default: 'Bronze Tier'
    },
    commissionRate: {
      type: Number,
      default: 5.0,
      min: 0,
      max: 100
    },
    payoutHold: {
      type: Boolean,
      default: false
    },
    bankDetails: {
      accountName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      ifsc: { type: String, default: '' },
      bankName: { type: String, default: 'State Bank of India' },
      upiId: { type: String, default: '' }
    },
    kycDocuments: [kycDocumentSchema],
    storeSettings: {
      tagline: { type: String, default: '' },
      description: { type: String, default: '' },
      operatingHours: { type: String, default: 'Mon - Sat: 08:30 AM - 07:30 PM' },
      isOpen: { type: Boolean, default: true },
      fulfillmentSLA: { type: Number, default: 99.0 }
    },
    temporaryPassword: {
      hash: { type: String, select: false },
      expiresAt: { type: Date },
      isUsed: { type: Boolean, default: false },
      mustChange: { type: Boolean, default: false }
    },
    approvalHistory: [approvalHistorySchema]
  },
  {
    timestamps: true
  }
);

// 2dsphere index for location queries
dealerSchema.index({ location: '2dsphere' });

export const Dealer = mongoose.model('Dealer', dealerSchema);

