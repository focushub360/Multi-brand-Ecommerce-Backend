import { AuditLog } from './auditLog.model.js';
import { AdminSettings } from './adminSettings.model.js';

export class AdminService {
  /**
   * Record Immutable Admin Action Audit Log
   */
  static async recordAuditLog({ action, actor, actorRole, targetEntity, targetId, details, ipAddress = '', userAgent = '' }) {
    try {
      const logId = `AUD_${Math.floor(1000 + Math.random() * 9000)}`;
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
      console.warn('Audit log write error:', e.message);
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

    if (data.general) Object.assign(settings.general, data.general);
    if (data.commission) Object.assign(settings.commission, data.commission);
    if (data.notifications) Object.assign(settings.notifications, data.notifications);
    settings.updatedBy = user.id;

    await settings.save();
    return settings;
  }
}

