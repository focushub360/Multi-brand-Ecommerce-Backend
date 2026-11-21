import mongoose, { Schema } from 'mongoose';

const dealerLocationSchema = new Schema(
  {
    hubCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
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
    hubType: {
      type: String,
      required: true,
      default: 'Regional Depot'
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    pincode: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    contactPhone: {
      type: String,
      required: true
    },
    capacityTons: {
      type: Number,
      default: 100
    },
    serviceRadiusKm: {
      type: Number,
      required: true,
      default: 100
    },
    activePincodes: [{ type: String }],
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    },
    status: {
      type: String,
      enum: ['Operational', 'Maintenance', 'Closed'],
      default: 'Operational',
      index: true
    }
  },
  {
    timestamps: true
  }
);

dealerLocationSchema.index({ location: '2dsphere' });

export const DealerLocation = mongoose.model('DealerLocation', dealerLocationSchema);

