import { InventoryService } from './inventory.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { Product } from '../products/product.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { InventoryTransaction } from './inventoryTransaction.model.js';

export const getMyInventory = asyncHandler(async (req, res) => {
  const dealerId = req.dealer.id;
  const result = await InventoryService.getDealerInventory(dealerId, req.query);
  return res.status(200).json(
    ApiResponse.success(
      {
        items: result.items,
        summary: result.summary
      },
      'Dealer inventory retrieved successfully',
      200,
      result.pagination
    )
  );
});

export const adjustStock = asyncHandler(async (req, res) => {
  const dealerId = req.dealer.id;
  const { quantityChange, reason, referenceId } = req.body;
  const result = await InventoryService.adjustStock({
    dealerId,
    productId: req.params.productId,
    quantityChange: Number(quantityChange),
    reason,
    referenceId,
    performedBy: req.user.id
  });

  return res.status(200).json(
    ApiResponse.success(result, 'Stock adjusted and ledger transaction recorded successfully')
  );
});

export const adjustGlobalStock = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId).select('dealer');
  if (!product) throw ApiError.notFound('Product not found.');
  const { quantityChange, reason, referenceId } = req.body;
  const result = await InventoryService.adjustStock({
    dealerId: product.dealer,
    productId: req.params.productId,
    quantityChange: Number(quantityChange),
    reason,
    referenceId,
    performedBy: req.user.id,
    transactionType: 'AUDIT_CORRECTION'
  });
  return res.status(200).json(ApiResponse.success(result, 'Admin stock adjustment saved to the immutable movement ledger.'));
});

export const getGlobalTransactions = asyncHandler(async (req, res) => {
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
  const transactions = await InventoryTransaction.find()
    .populate('product', 'name sku')
    .populate('dealer', 'businessName dealerCode')
    .populate('performedBy', 'name email role')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return res.status(200).json(ApiResponse.success(transactions, 'Global inventory movement history retrieved.'));
});

export const getTransactions = asyncHandler(async (req, res) => {
  const dealerId = req.dealer?.id;
  const transactions = await InventoryService.getProductTransactions(req.params.productId, dealerId);
  return res.status(200).json(
    ApiResponse.success(transactions, 'Stock movement audit trail retrieved successfully')
  );
});

export const getGlobalInventory = asyncHandler(async (req, res) => {
  const { lowStockOnly, page, limit } = req.query;
  const result = await InventoryService.getGlobalInventory({
    lowStockOnly: lowStockOnly === 'true',
    page,
    limit
  });
  return res.status(200).json(
    ApiResponse.success(result.items, 'Global inventory audit retrieved successfully', 200, result.pagination)
  );
});

