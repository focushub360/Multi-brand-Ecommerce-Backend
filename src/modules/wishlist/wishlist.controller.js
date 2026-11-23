import { WishlistService } from './wishlist.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const getWishlist = asyncHandler(async (req, res) => {
  const result = await WishlistService.getWishlist(req.user.id);
  return res.status(200).json(ApiResponse.success(result, 'Wishlist retrieved successfully'));
});

export const toggleWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const result = await WishlistService.toggleProduct(req.user.id, productId);
  return res.status(200).json(ApiResponse.success(result, result.message));
});

export const removeFromWishlist = asyncHandler(async (req, res) => {
  const result = await WishlistService.removeProduct(req.user.id, req.params.productId);
  return res.status(200).json(ApiResponse.success(null, result.message));
});

