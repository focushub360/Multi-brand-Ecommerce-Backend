import { SettlementService } from './settlement.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const getSettlements = asyncHandler(async (req, res) => {
  const result = await SettlementService.getSettlements(req.query);
  return res.status(200).json(
    ApiResponse.success(result.settlements, 'Settlements retrieved successfully', 200, result.pagination)
  );
});

export const getMySettlements = asyncHandler(async (req, res) => {
  const dealerId = req.dealer.id;
  const settlements = await SettlementService.getDealerSettlements(dealerId);
  return res.status(200).json(ApiResponse.success(settlements, 'Dealer payouts retrieved successfully'));
});


