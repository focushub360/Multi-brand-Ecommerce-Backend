import mongoose, { Schema } from 'mongoose';

const subcategorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active'
    }
  },
  { _id: true }
);

const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true
    },
    slug: {
      type: String,
      required: [true, 'Category slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    description: {
      type: String,
      default: ''
    },
    icon: {
      type: String,
      default: 'Package'
    },
    commissionRate: {
      type: Number,
      default: 5.0,
      min: 0,
      max: 100
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
      index: true
    },
    subcategories: [subcategorySchema]
  },
  {
    timestamps: true
  }
);

export const Category = mongoose.model('Category', categorySchema);

