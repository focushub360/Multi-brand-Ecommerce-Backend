import mongoose, { Schema } from 'mongoose';

const refreshTokenSchema = new Schema(
  {
    tokenHash: {
      type: String,
      required: true,
      index: true
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    expiresAt: {
      type: Date,
      required: true,
      expires: 0 // Automatically deleted by MongoDB TTL index when expired
    },
    revokedAt: {
      type: Date,
      default: null
    },
    replacedByTokenHash: {
      type: String,
      default: null
    },
    ipAddress: {
      type: String,
      default: ''
    },
    userAgent: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

refreshTokenSchema.virtual('isExpired').get(function () {
  return Date.now() >= this.expiresAt.getTime();
});

refreshTokenSchema.virtual('isActive').get(function () {
  return !this.revokedAt && !this.isExpired;
});

export const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

