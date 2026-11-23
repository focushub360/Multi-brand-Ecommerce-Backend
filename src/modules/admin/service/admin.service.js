import { AuditLog } from '../models/auditLog.model.js';
import { AdminSettings } from '../models/adminSettings.model.js';
import { ApiError } from '../../../utils/ApiError.js';

export class AdminService {
  /**
   * Record Immutable Admin Action Audit Log
   */
  static async recordAuditLog({ action, actor, actorRole, targetEntity, targetId, details, ipAddress = '', userAgent = '' }) {
    try {
      const logId = `AUD_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      await AuditLog.create({
        logId,
        action,
        actor,
        actorRole,
        targetEntity,
        targetId,
        details,
        ipAddress,
        userAgent
      });
    } catch (e) {
      console.error('Audit log write error:', e.message);
      throw e;
    }
  }

  /**
   * Get Audit Logs
   */
  static async getAuditLogs({ action = '', page = 1, limit = 20 }) {
    const query = {};
    if (action) query.action = action;

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find(query).populate('actor', 'name email role').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AuditLog.countDocuments(query)
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get Platform Settings
   */
  static async getSettings() {
    let settings = await AdminSettings.findOne().lean();
    if (!settings) {
      settings = await AdminSettings.create({});
    }
    return settings;
  }

  /**
   * Update Platform Settings
   */
  static async updateSettings(data, user) {
    let settings = await AdminSettings.findOne();
    if (!settings) {
      settings = new AdminSettings({});
    }

    const allowed = {
      general: ['marketplaceName', 'supportEmail', 'supportPhone', 'defaultCurrency', 'maintenanceMode'],
      commission: ['defaultCommissionRate', 'minPayoutThreshold', 'escrowHoldPeriodDays', 'taxTcsRate'],
      notifications: ['emailOnNewKyc', 'emailOnLowStock', 'emailDailySummary', 'emailOnEscalatedDispute']
    };
    for (const [group, fields] of Object.entries(allowed)) {
      if (data[group] === undefined) continue;
      if (!data[group] || typeof data[group] !== 'object' || Array.isArray(data[group])) {
        throw ApiError.badRequest(`Invalid settings group: ${group}`);
      }
      for (const [key, value] of Object.entries(data[group])) {
        if (!fields.includes(key)) throw ApiError.badRequest(`Unsupported settings field: ${group}.${key}`);
        const current = settings[group][key];
        if (typeof current === 'boolean' && typeof value !== 'boolean') throw ApiError.badRequest(`${group}.${key} must be boolean.`);
        if (typeof current === 'number' && (!Number.isFinite(Number(value)) || Number(value) < 0)) throw ApiError.badRequest(`${group}.${key} must be a non-negative number.`);
        if (typeof current === 'string' && typeof value !== 'string') throw ApiError.badRequest(`${group}.${key} must be text.`);
        settings[group][key] = typeof current === 'number' ? Number(value) : value;
      }
    }
    settings.updatedBy = user.id;

    await settings.save();
    await AdminService.recordAuditLog({
      action: 'PLATFORM_SETTINGS_UPDATED', actor: user.id, actorRole: user.role,
      targetEntity: 'AdminSettings', targetId: String(settings._id),
      details: `Sensitive platform settings updated: ${JSON.stringify(data)}`,
      ipAddress: user.ipAddress || '', userAgent: user.userAgent || ''
    });
    return settings;
  }
}

