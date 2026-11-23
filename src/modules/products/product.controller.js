import { ProductService } from './product.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const queryProducts = asyncHandler(async (req, res) => {
  const result = await ProductService.queryPublicCatalog(req.query);
  return res.status(200).json(
    ApiResponse.success(result.products, 'Products retrieved successfully', 200, result.pagination)
  );
});

export const getAdminProducts = asyncHandler(async (req, res) => {
  const result = await ProductService.getAdminProducts(req.query);
  return res.status(200).json(ApiResponse.success(result.products, 'Admin catalog retrieved.', 200, result.pagination));
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await ProductService.getProductByIdOrSlug(req.params.id);
  return res.status(200).json(ApiResponse.success(product, 'Product details retrieved successfully'));
});

export const getMyDealerProducts = asyncHandler(async (req, res) => {
  const dealerId = req.dealer.id;
  const result = await ProductService.getDealerProducts(dealerId, req.query);
  return res.status(200).json(
    ApiResponse.success(result.products, 'Dealer catalog retrieved successfully', 200, result.pagination)
  );
});

export const createDealerProduct = asyncHandler(async (req, res) => {
  const dealerIdentity = req.dealer;
  const product = await ProductService.createProduct(dealerIdentity, req.body);
  return res.status(201).json(ApiResponse.created(product, 'Product created successfully'));
});

export const updateDealerProduct = asyncHandler(async (req, res) => {
  const dealerId = req.dealer.id;
  const product = await ProductService.updateDealerProduct(dealerId, req.params.id, req.body);
  return res.status(200).json(ApiResponse.success(product, 'Product updated successfully'));
});

export const deleteDealerProduct = asyncHandler(async (req, res) => {
  const dealerId = req.dealer.id;
  const result = await ProductService.deleteDealerProduct(dealerId, req.params.id);
  return res.status(200).json(ApiResponse.success(null, result.message));
});

export const adminUpdateProduct = asyncHandler(async (req, res) => {
  const safeUpdate = { ...req.body };
  delete safeUpdate.stock;
  const actor = { ...req.user, ipAddress: req.ip, userAgent: req.get('user-agent') };
  const product = await ProductService.adminUpdateProduct(req.params.id, safeUpdate, actor);
  return res.status(200).json(ApiResponse.success(product, 'Product updated by admin successfully'));
});

export const adminDeleteProduct = asyncHandler(async (req, res) => {
  const actor = { ...req.user, ipAddress: req.ip, userAgent: req.get('user-agent') };
  const result = await ProductService.adminDeleteProduct(req.params.id, actor);
  return res.status(200).json(ApiResponse.success(null, result.message));
});

