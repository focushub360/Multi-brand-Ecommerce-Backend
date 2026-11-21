import { Wishlist } from './wishlist.model.js';
import { Product } from '../products/product.model.js';
import { ApiError } from '../../utils/ApiError.js';

export class WishlistService {
  /**
   * Get User Wishlist with Populated Products
   */
  static async getWishlist(userId) {
    let wishlist = await Wishlist.findOne({ user: userId }).populate({
      path: 'products',
      populate: { path: 'dealer', select: 'businessName dealerCode status' }
    });

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: userId, products: [] });
    }

    // Filter out any non-existent / deleted products
    const validProducts = wishlist.products.filter((p) => p && p.status === 'Active');

    return {
      products: validProducts,
      count: validProducts.length
    };
  }

  /**
   * Helper to resolve a product by ObjectId, slug, or SKU
   */
  static async resolveProduct(productId) {
    if (!productId) return null;
    let product = null;
    const pidStr = String(productId).trim();
    if (pidStr.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(pidStr);
    }
    if (!product) {
      product = await Product.findOne({
        $or: [{ slug: pidStr }, { sku: pidStr.toUpperCase() }]
      });
    }
    return product;
  }

  /**
   * Toggle Product in Wishlist (Add or Remove)
   */
  static async toggleProduct(userId, productId) {
    const product = await this.resolveProduct(productId);
    if (!product) throw ApiError.notFound('Product not found.');

    let wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      wishlist = new Wishlist({ user: userId, products: [] });
    }

    const prodIdStr = product._id.toString();
    const exists = wishlist.products.some((p) => p.toString() === prodIdStr);

    let action;
    if (exists) {
      wishlist.products = wishlist.products.filter((p) => p.toString() !== prodIdStr);
      action = 'removed';
    } else {
      wishlist.products.push(product._id);
      action = 'added';
    }

    await wishlist.save();
    return {
      action,
      productId: product._id,
      message: action === 'added' ? 'Product saved to wishlist.' : 'Product removed from wishlist.'
    };
  }

  /**
   * Remove Product from Wishlist
   */
  static async removeProduct(userId, productId) {
    const product = await this.resolveProduct(productId);
    const targetProdId = product ? product._id : productId;

    await Wishlist.findOneAndUpdate(
      { user: userId },
      { $pull: { products: targetProdId } }
    );
    return { message: 'Product removed from wishlist.' };
  }
}

