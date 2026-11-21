import mongoose, { Schema } from 'mongoose';

const adminSettingsSchema = new Schema(
  {
    general: {
      marketplaceName: {
        type: String,
        default: 'GROVE Agritech & Commercial Marketplace'
      },
      supportEmail: { type: String, default: 'operations@grove.com' },
      supportPhone: { type: String, default: '+91 80000 12345' },
      defaultCurrency: { type: String, default: 'INR (₹)' },
      maintenanceMode: { type: Boolean, default: false }
    },
    commission: {
      defaultCommissionRate: { type: Number, default: 5.0 },
      minPayoutThreshold: { type: Number, default: 10000 },
      escrowHoldPeriodDays: { type: Number, default: 3 },
      taxTcsRate: { type: Number, default: 1.0 }
    },
    notifications: {
      emailOnNewKyc: { type: Boolean, default: true },
      emailOnLowStock: { type: Boolean, default: true },
      emailDailySummary: { type: Boolean, default: true }
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

export const AdminSettings = mongoose.model('AdminSettings', adminSettingsSchema);

