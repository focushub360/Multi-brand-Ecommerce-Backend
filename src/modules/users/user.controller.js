
import { UserService } from './user.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

// GET all buyers
export const getAllUsers = asyncHandler(async (req, res) => {
  const {
    search,
    buyerType,
    status,
    page,
    limit
  } = req.query;

  const result = await UserService.getAllUsers({
    search,
    buyerType,
    status,
    page,
    limit
  });

  return res.status(200).json(
    ApiResponse.success(
      result.users,
      'Buyers retrieved successfully',
      200,
      result.pagination
    )
  );
});

// GET dashboard statistics
export const getUserStats = asyncHandler(async (req, res) => {
  const stats = await UserService.getUserStats();

  return res.status(200).json(
    ApiResponse.success(
      stats,
      'Buyer statistics retrieved successfully'
    )
  );
});

// GET buyer dossier
export const getUserById = asyncHandler(async (req, res) => {
  const user = await UserService.getUserById(req.params.id);

  return res.status(200).json(
    ApiResponse.success(
      user,
      'Buyer details retrieved successfully'
    )
  );
});

// PATCH buyer status
export const updateUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const result = await UserService.updateUserStatus(
    req.params.id,
    status,
    { ...req.user, ipAddress: req.ip, userAgent: req.get('user-agent') }
  );

  return res.status(200).json(
    ApiResponse.success(
      result.user,
      result.message
    )
  );
});

// Existing delete controller
export const deleteUser = asyncHandler(async (req, res) => {
  const result = await UserService.deleteUser(req.params.id, {
    ...req.user, ipAddress: req.ip, userAgent: req.get('user-agent')
  });

  return res.status(200).json(
    ApiResponse.success(null, result.message)
  );
});

// Existing profile controller
export const updateProfile = asyncHandler(async (req, res) => {
  const user = await UserService.updateProfile(
    req.user.id,
    req.body
  );

  return res.status(200).json(
    ApiResponse.success(
      user,
      'Profile updated successfully'
    )
  );
});
