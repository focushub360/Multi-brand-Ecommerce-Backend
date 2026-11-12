import mongoose, { Schema } from 'mongoose';

const auditLogSchema = new Schema(
  {
    logId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    action: {
      type: String,
      required: true,
      index: true
    },
    actor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    actorRole: { type: String, required: true },
    targetEntity: { type: String, required: true }, // e.g. 'Dealer', 'Product', 'Settlement'
    targetId: { type: String, required: true },
    details: { type: String, required: true },
    ipAddress: { type: String, default: '' },
    userAgent: { type: String, default: '' }
  },
  {
    timestamps: { createdAt: true, updatedAt: false } // Immutable security log
  }
);

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);

