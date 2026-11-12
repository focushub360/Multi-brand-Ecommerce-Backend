import { AdminService } from './admin.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const getAuditLogs = asyncHandler(async (req, res) => {
  const result = await AdminService.getAuditLogs(req.query);
  return res.status(200).json(
    ApiResponse.success(result.logs, 'Audit logs retrieved successfully', 200, result.pagination)
  );
});

export const getSettings = asyncHandler(async (_req, res) => {
  const settings = await AdminService.getSettings();
  return res.status(200).json(ApiResponse.success(settings, 'Platform settings retrieved successfully'));
});

export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await AdminService.updateSettings(req.body, req.user);
  return res.status(200).json(ApiResponse.success(settings, 'Platform settings updated successfully'));
});

