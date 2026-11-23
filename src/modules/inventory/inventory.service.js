import { Inventory } from './inventory.model.js';
import { InventoryTransaction } from './inventoryTransaction.model.js';
import { Product } from '../products/product.model.js';
import { ApiError } from '../../utils/ApiError.js';

export class InventoryService {
  /**
   * Get Dealer Inventory List
   */
  static async getDealerInventory(dealerId, { status = '', search = '', page = 1, limit = 20 }) {
    const query = { dealer: dealerId };
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Inventory.find(query)
        .populate('product', 'name price mrp categoryName subcategory image')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Inventory.countDocuments(query)
    ]);

    // Calculate Summary Stats
    const allDealerStock = await Inventory.find({ dealer: dealerId }).select('currentStock threshold status').lean();
    const totalUnits = allDealerStock.reduce((acc, curr) => acc + curr.currentStock, 0);
    const lowStockCount = allDealerStock.filter((i) => i.currentStock > 0 && i.currentStock <= i.threshold).length;
    const outOfStockCount = allDealerStock.filter((i) => i.currentStock === 0).length;

    return {
      items,
      summary: {
        totalSkus: allDealerStock.length,
        totalUnits,
        lowStockCount,
        outOfStockCount
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Adjust Stock with Immutable Ledger Recording
   */
  static async adjustStock({ dealerId, productId, quantityChange, reason, referenceId = '', performedBy, transactionType }) {
    let inventory = await Inventory.findOne({ product: productId, dealer: dealerId });
    if (!inventory) {
      // Self-heal inventory entry from product if not already initialized
      const prod = await Product.findById(productId);
      if (!prod) throw ApiError.notFound('Product not found.');
      inventory = new Inventory({
        product: prod._id,
        dealer: prod.dealer,
        sku: prod.sku,
        currentStock: prod.stock,
        threshold: prod.threshold,
        locationBay: 'Bay 01'
      });
    }

    const newStock = inventory.currentStock + quantityChange;
    if (newStock < 0) {
      throw ApiError.badRequest(`Insufficient stock. Current: ${inventory.currentStock}, cannot reduce by ${Math.abs(quantityChange)}.`);
    }

    inventory.currentStock = newStock;
    inventory.status = newStock > inventory.threshold ? 'In Stock' : newStock > 0 ? 'Low Stock' : 'Out of Stock';
    await inventory.save();

    // Sync Product stock count
    await Product.findByIdAndUpdate(productId, { stock: newStock });

    // Record Immutable Transaction
    const transaction = await InventoryTransaction.create({
      product: productId,
      dealer: dealerId,
      type: transactionType || (quantityChange >= 0 ? 'PURCHASE_RESTOCK' : 'MANUAL_ADJUSTMENT'),
      quantityChange,
      balanceAfter: newStock,
      referenceId: referenceId || inventory.sku,
      reason,
      performedBy
    });

    return {
      inventory,
      transaction
    };
  }

  /**
   * Get Stock Movement Ledger
   */
  static async getProductTransactions(productId, dealerId) {
    const query = { product: productId };
    if (dealerId) query.dealer = dealerId;

    return await InventoryTransaction.find(query)
      .populate('performedBy', 'name email role')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
  }

  /**
   * Super Admin Global Inventory Audit
   */
  static async getGlobalInventory({ lowStockOnly = false, page = 1, limit = 20 }) {
    const query = {};
    if (lowStockOnly) {
      query.status = { $in: ['Low Stock', 'Out of Stock'] };
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Inventory.find(query)
        .populate('product', 'name price sku categoryName')
        .populate('dealer', 'businessName dealerCode officialEmail')
        .sort({ currentStock: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Inventory.countDocuments(query)
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
}

