import { AddressService } from './address.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const getMyAddresses = asyncHandler(async (req, res) => {
  const addresses = await AddressService.getUserAddresses(req.user.id);
  return res.status(200).json(ApiResponse.success(addresses, 'Saved addresses retrieved successfully'));
});

export const addAddress = asyncHandler(async (req, res) => {
  const address = await AddressService.addAddress(req.user.id, req.body);
  return res.status(201).json(ApiResponse.created(address, 'Address saved successfully'));
});

export const updateAddress = asyncHandler(async (req, res) => {
  const address = await AddressService.updateAddress(req.user.id, req.params.id, req.body);
  return res.status(200).json(ApiResponse.success(address, 'Address updated successfully'));
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const result = await AddressService.deleteAddress(req.user.id, req.params.id);
  return res.status(200).json(ApiResponse.success(null, result.message));
});

export const setDefaultAddress = asyncHandler(async (req, res) => {
  const address = await AddressService.setDefaultAddress(req.user.id, req.params.id);
  return res.status(200).json(ApiResponse.success(address, 'Default address updated successfully'));
});

