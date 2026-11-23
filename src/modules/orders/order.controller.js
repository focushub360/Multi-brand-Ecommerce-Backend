import mongoose from 'mongoose';
import { OrderService } from './order.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const requireDatabaseConnection = () => {
  if (mongoose.connection.readyState !== 1) {
    throw new ApiError(503, 'Order data is temporarily unavailable because MongoDB is not connected.', [], 'DATABASE_UNAVAILABLE');
  }
};

export const checkout = asyncHandler(async (req, res) => {
  const order = await OrderService.checkout(req.user.id, req.body);
  return res.status(201).json(ApiResponse.created(order, 'Order placed successfully'));
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const result = await OrderService.getCustomerOrders(req.user.id, req.query);
  return res.status(200).json(
    ApiResponse.success(result.orders, 'Customer orders retrieved successfully', 200, result.pagination)
  );
});

export const getMyOrderById = asyncHandler(async (req, res) => {
  const order = await OrderService.getCustomerOrderById(req.user.id, req.params.orderId);
  return res.status(200).json(ApiResponse.success(order, 'Order details retrieved successfully'));
});

export const cancelMyOrder = asyncHandler(async (req, res) => {
  const order = await OrderService.cancelCustomerOrder(req.user.id, req.params.orderId, req.body.reason);
  return res.status(200).json(ApiResponse.success(order, 'Order cancelled successfully'));
});

export const getDealerOrders = asyncHandler(async (req, res) => {
  const result = await OrderService.getDealerSubOrders(
    { dealerId: req.dealer.id, dealerCode: req.dealer.dealerCode },
    req.query
  );
  return res.status(200).json(
    ApiResponse.success(result.orders, 'Dealer fulfillment orders retrieved successfully', 200, result.pagination)
  );
});

export const getDealerOrderById = asyncHandler(async (req, res) => {
  const order = await OrderService.getDealerSubOrderById(
    { dealerId: req.dealer.id, dealerCode: req.dealer.dealerCode },
    req.params.id
  );
  return res.status(200).json(ApiResponse.success(order, 'Dealer suborder details retrieved successfully'));
});

export const updateFulfillmentStatus = asyncHandler(async (req, res) => {
  const order = await OrderService.updateDealerFulfillmentStatus(
    { dealerId: req.dealer.id, dealerCode: req.dealer.dealerCode },
    req.params.id,
    req.body
  );
  return res.status(200).json(ApiResponse.success(order, 'Fulfillment status updated successfully'));
});

export const getGlobalOrders = asyncHandler(async (req, res) => {
  requireDatabaseConnection();
  const result = await OrderService.getGlobalOrders(req.query);
  return res.status(200).json(
    ApiResponse.success(result.orders, 'Global order audit retrieved successfully', 200, result.pagination)
  );
});

export const getAdminOrderById = asyncHandler(async (req, res) => {
  requireDatabaseConnection();
  const order = await OrderService.getAdminOrderById(req.params.id);
  return res.status(200).json(ApiResponse.success(order, 'Order details retrieved for inspection'));
});

