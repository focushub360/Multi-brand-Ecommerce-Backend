import mongoose, { Schema } from 'mongoose';
import { ROLES, ALL_ROLES } from '../../constants/roles.js';
import { hashPassword, comparePassword } from '../../utils/passwordHash.js';

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false // Never return password hash in queries by default
    },
    role: {
      type: String,
      enum: ALL_ROLES,
      default: ROLES.USER,
      required: true,
      index: true
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    buyerType: {
  type: String,
  enum: [
    'INDIVIDUAL_FARMER',
    'FPO',
    'COMMERCIAL_AGRITECH'
  ],
  default: 'INDIVIDUAL_FARMER',
  index: true
},
  
    avatar: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
      default: 'ACTIVE',
      index: true
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    mustChangePassword: {
      type: Boolean,
      default: false
    },
    lastLogin: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Pre-save hook: Hash password if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await hashPassword(this.password);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await comparePassword(candidatePassword, this.password);
};

export const User = mongoose.model('User', userSchema);

