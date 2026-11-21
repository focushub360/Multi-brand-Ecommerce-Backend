import mongoose, { Schema } from 'mongoose';

const addressSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      trim: true
    },
    house: {
      type: String,
      required: [true, 'Flat / House number is required'],
      trim: true
    },
    street: {
      type: String,
      required: [true, 'Street / Area is required'],
      trim: true
    },
    landmark: {
      type: String,
      trim: true,
      default: ''
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true
    },
    type: {
      type: String,
      enum: ['Home', 'Work', 'Other'],
      default: 'Home'
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },
  {
    timestamps: true
  }
);

// Enforce maximum 5 addresses per user at schema validation level
addressSchema.pre('save', async function (next) {
  if (this.isNew) {
    const count = await mongoose.model('Address').countDocuments({ user: this.user });
    if (count >= 5) {
      const err = new Error('Address limit exceeded: A maximum of 5 delivery addresses can be saved.');
      err.statusCode = 400;
      return next(err);
    }
  }
  next();
});

export const Address = mongoose.model('Address', addressSchema);

