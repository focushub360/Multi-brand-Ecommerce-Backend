import { AnalyticsService } from './analytics.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const getAdminAnalytics = asyncHandler(async (_req, res) => {
  const data = await AnalyticsService.getAdminAnalytics();
  return res.status(200).json(ApiResponse.success(data, 'Platform analytics retrieved successfully'));
});

export const getDealerAnalytics = asyncHandler(async (req, res) => {
  const dealerId = req.dealer.id;
  const range = req.query.range || '30D';
  const data = await AnalyticsService.getDealerAnalytics(dealerId, range);
  return res.status(200).json(ApiResponse.success(data, 'Dealer performance analytics retrieved'));
});

export const exportDealerSalesCSV = asyncHandler(async (req, res) => {
  const dealerId = req.dealer.id;
  const csvContent = await AnalyticsService.exportDealerOrdersCSV(dealerId);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="grove_dealer_sales_${Date.now()}.csv"`);

  return res.status(200).send(csvContent);
});

