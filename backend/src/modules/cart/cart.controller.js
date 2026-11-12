import { CartService } from './cart.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const getCart = asyncHandler(async (req, res) => {
  const cart = await CartService.getCart(req.user.id);
  return res.status(200).json(ApiResponse.success(cart, 'Cart retrieved successfully'));
});

export const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  const cart = await CartService.addItem(req.user.id, { productId, quantity });
  return res.status(200).json(ApiResponse.success(cart, 'Item added to cart successfully'));
});

export const updateQuantity = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const cart = await CartService.updateQuantity(req.user.id, req.params.productId, quantity);
  return res.status(200).json(ApiResponse.success(cart, 'Cart quantity updated successfully'));
});

export const removeItem = asyncHandler(async (req, res) => {
  const cart = await CartService.removeItem(req.user.id, req.params.productId);
  return res.status(200).json(ApiResponse.success(cart, 'Item removed from cart'));
});

export const clearCart = asyncHandler(async (req, res) => {
  const result = await CartService.clearCart(req.user.id);
  return res.status(200).json(ApiResponse.success(null, result.message));
});

