import mongoose from 'mongoose';
import { AnalyticsService } from './analytics.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const getAdminAnalytics = asyncHandler(async (_req, res) => {
  if (mongoose.connection.readyState !== 1) {
    throw new ApiError(503, 'Sales analytics are unavailable because MongoDB is not connected.', [], 'DATABASE_UNAVAILABLE');
  }
  const data = await AnalyticsService.getAdminAnalytics();
  return res.status(200).json(ApiResponse.success(data, 'Platform analytics retrieved successfully'));
});

export const getDealerAnalytics = asyncHandler(async (req, res) => {
  const dealerId = req.dealer.id;
  const data = await AnalyticsService.getDealerAnalytics(dealerId);
  return res.status(200).json(ApiResponse.success(data, 'Dealer performance analytics retrieved'));
});

export const exportDealerSalesCSV = asyncHandler(async (req, res) => {
  const dealerId = req.dealer.id;
  const csvContent = await AnalyticsService.exportDealerOrdersCSV(dealerId);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="grove_dealer_sales_${Date.now()}.csv"`);

  return res.status(200).send(csvContent);
});

