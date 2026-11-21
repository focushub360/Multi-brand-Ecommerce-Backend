import { DealerService } from './dealer.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const apply = asyncHandler(async (req, res) => {
  const result = await DealerService.submitApplication(req.body);
  return res.status(201).json(ApiResponse.created(result, result.message));
});

export const getProfile = asyncHandler(async (req, res) => {
  const dealerId = req.dealer.id;
  const profile = await DealerService.getProfile(dealerId);
  return res.status(200).json(ApiResponse.success(profile, 'Dealer profile retrieved successfully'));
});

export const updateStoreSettings = asyncHandler(async (req, res) => {
  const dealerId = req.dealer.id;
  const result = await DealerService.updateStoreSettings(dealerId, req.body);
  return res.status(200).json(ApiResponse.success(result.storeSettings, result.message));
});

export const verifyBankDetails = asyncHandler(async (req, res) => {
  const dealerId = req.dealer.id;
  const result = await DealerService.verifyBankDetails(dealerId, req.body);
  return res.status(200).json(ApiResponse.success(result, result.message));
});

export const submitOnboardingBankDetails = asyncHandler(async (req, res) => {
  const dealerId = req.dealer.id;
  const result = await DealerService.submitOnboardingBankDetails(dealerId, req.body);
  return res.status(200).json(ApiResponse.success(result, result.message));
});

export const verifyKyc = asyncHandler(async (req, res) => {
  const dealerId = req.params.id;
  const result = await DealerService.verifyKyc(dealerId, req.user, req.body);
  return res.status(200).json(ApiResponse.success(result.dealer, result.message));
});

export const getAllDealers = asyncHandler(async (req, res) => {
  const { status, category, search, page, limit } = req.query;
  const result = await DealerService.getAllDealers(
    { status, category, search },
    { page, limit }
  );
  return res.status(200).json(
    ApiResponse.success(result.dealers, 'Dealers retrieved successfully', 200, result.pagination)
  );
});

export const getDealerById = asyncHandler(async (req, res) => {
  const dealer = await DealerService.getProfile(req.params.id);
  return res.status(200).json(ApiResponse.success(dealer, 'Dealer details retrieved successfully'));
});

export const approveDealer = asyncHandler(async (req, res) => {
  const result = await DealerService.approveDealer(req.params.id, req.user, req.body);
  return res.status(200).json(ApiResponse.success(result.dealer, result.message));
});

export const rejectDealer = asyncHandler(async (req, res) => {
  const result = await DealerService.rejectDealer(req.params.id, req.user, req.body.reason);
  return res.status(200).json(ApiResponse.success(null, result.message));
});

export const toggleDealerStatus = asyncHandler(async (req, res) => {
  const { status, reason } = req.body;
  const result = await DealerService.toggleStatus(req.params.id, req.user, status, reason);
  return res.status(200).json(ApiResponse.success(result.dealer, result.message));
});

