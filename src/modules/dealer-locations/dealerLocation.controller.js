import { DealerLocationService } from './dealerLocation.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const findNearbyHubs = asyncHandler(async (req, res) => {
  const { lng, lat, maxDistanceKm } = req.query;
  const hubs = await DealerLocationService.findNearbyHubs({
    lng: parseFloat(lng),
    lat: parseFloat(lat),
    maxDistanceKm: maxDistanceKm ? parseFloat(maxDistanceKm) : 150
  });

  return res.status(200).json(ApiResponse.success(hubs, 'Nearby dealer hubs retrieved successfully'));
});

export const checkServiceability = asyncHandler(async (req, res) => {
  const result = await DealerLocationService.checkServiceability(req.body);
  return res.status(200).json(ApiResponse.success(result, 'Delivery serviceability evaluated successfully'));
});

export const getAllLocations = asyncHandler(async (req, res) => {
  const locations = await DealerLocationService.getAllLocations();
  return res.status(200).json(ApiResponse.success(locations, 'Dealer hubs retrieved successfully'));
});

export const createLocation = asyncHandler(async (req, res) => {
  const actor = { ...req.user, ipAddress: req.ip, userAgent: req.get('user-agent') };
  const location = await DealerLocationService.createLocation(req.body, actor);
  return res.status(201).json(ApiResponse.created(location, 'Hub location registered successfully'));
});

export const updateLocation = asyncHandler(async (req, res) => {
  const actor = { ...req.user, ipAddress: req.ip, userAgent: req.get('user-agent') };
  const location = await DealerLocationService.updateLocation(req.params.id, req.body, actor);
  return res.status(200).json(ApiResponse.success(location, 'Hub location updated successfully'));
});

export const deleteLocation = asyncHandler(async (req, res) => {
  const actor = { ...req.user, ipAddress: req.ip, userAgent: req.get('user-agent') };
  const result = await DealerLocationService.deleteLocation(req.params.id, actor);
  return res.status(200).json(ApiResponse.success(null, result.message));
});

