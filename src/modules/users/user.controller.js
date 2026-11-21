import { UserService } from './user.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const getAllUsers = asyncHandler(async (req, res) => {
  const { search, role, page, limit } = req.query;
  const result = await UserService.getAllUsers({ search, role, page, limit });
  return res.status(200).json(
    ApiResponse.success(result.users, 'Users retrieved successfully', 200, result.pagination)
  );
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await UserService.getUserById(req.params.id);
  return res.status(200).json(ApiResponse.success(user, 'User details retrieved successfully'));
});

export const deleteUser = asyncHandler(async (req, res) => {
  const result = await UserService.deleteUser(req.params.id);
  return res.status(200).json(ApiResponse.success(null, result.message));
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await UserService.updateProfile(req.user.id, req.body);
  return res.status(200).json(ApiResponse.success(user, 'Profile updated successfully'));
});

