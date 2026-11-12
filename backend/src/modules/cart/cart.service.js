import { Cart } from './cart.model.js';
import { Product } from '../products/product.model.js';
import { ApiError } from '../../utils/ApiError.js';

export class CartService {
  /**
   * Get or initialize customer cart with real-time database price recalculation
   */
  static async getCart(userId) {
    let cart = await Cart.findOne({ user: userId }).populate({
      path: 'items.product',
      populate: { path: 'dealer', select: 'businessName dealerCode status' }
    });

    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
      return {
        items: [],
        pricing: {
          itemsTotal: 0,
          mrpTotal: 0,
          discountTotal: 0,
          deliveryFee: 0,
          tax: 0,
          total: 0
        },
        itemsCount: 0
      };
    }

    // Process valid items and recalculate
    const validItems = [];
    let itemsTotal = 0;
    let mrpTotal = 0;

    for (const item of cart.items) {
      const prod = item.product;
      // Filter out deleted or archived products automatically
      if (prod && prod.status === 'Active') {
        const itemQty = Math.min(item.quantity, Math.max(1, prod.stock)); // Clamp to available stock
        const lineTotal = prod.price * itemQty;
        const lineMrp = (prod.mrp || prod.price) * itemQty;

        itemsTotal += lineTotal;
        mrpTotal += lineMrp;

        validItems.push({
          id: prod._id,
          productId: prod._id,
          name: prod.name,
          sku: prod.sku,
          category: prod.categoryName,
          dealerId: prod.dealer?._id || prod.dealerCode,
          dealerCode: prod.dealerCode,
          dealerName: prod.dealer?.businessName || prod.dealerName,
          price: prod.price,
          originalPrice: prod.mrp || prod.price,
          discount: prod.discount,
          quantity: itemQty,
          stock: prod.stock,
          inStock: prod.stock > 0,
          image: prod.image,
          subtotal: lineTotal
        });
      }
    }

    const discountTotal = Math.max(0, mrpTotal - itemsTotal);
    const deliveryFee = itemsTotal >= 5000 || itemsTotal === 0 ? 0 : 99; // Free shipping over ₹5000
    const total = itemsTotal + deliveryFee;

    return {
      items: validItems,
      pricing: {
        itemsTotal,
        mrpTotal,
        discountTotal,
        deliveryFee,
        tax: 0, // Included in GST rate
        total
      },
      itemsCount: validItems.reduce((acc, curr) => acc + curr.quantity, 0)
    };
  }

  /**
   * Add Item to Customer Cart
   */
  static async addItem(userId, { productId, quantity = 1 }) {
    const product = await Product.findById(productId);
    if (!product || product.status !== 'Active') {
      throw ApiError.notFound('Product is currently unavailable.');
    }

    if (product.stock < 1) {
      throw ApiError.badRequest('This product is currently out of stock.');
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    const existingIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId.toString()
    );

    const qtyToAdd = Math.max(1, parseInt(quantity, 10) || 1);

    if (existingIndex >= 0) {
      const newQty = cart.items[existingIndex].quantity + qtyToAdd;
      if (newQty > product.stock) {
        throw ApiError.badRequest(`Cannot add ${qtyToAdd} more. Maximum available stock is ${product.stock}.`);
      }
      cart.items[existingIndex].quantity = newQty;
    } else {
      if (qtyToAdd > product.stock) {
        throw ApiError.badRequest(`Cannot add ${qtyToAdd} items. Only ${product.stock} in stock.`);
      }
      cart.items.push({ product: product._id, quantity: qtyToAdd });
    }

    await cart.save();
    return await this.getCart(userId);
  }

  /**
   * Update Quantity
   */
  static async updateQuantity(userId, productId, quantity) {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) throw ApiError.notFound('Cart not found.');

    const item = cart.items.find((i) => i.product.toString() === productId.toString());
    if (!item) throw ApiError.notFound('Item not in cart.');

    const product = await Product.findById(productId);
    if (!product) throw ApiError.notFound('Product not found.');

    const newQty = Math.max(1, parseInt(quantity, 10));
    if (newQty > product.stock) {
      throw ApiError.badRequest(`Only ${product.stock} units available in stock.`);
    }

    item.quantity = newQty;
    await cart.save();

    return await this.getCart(userId);
  }

  /**
   * Remove Item from Cart
   */
  static async removeItem(userId, productId) {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) return;

    cart.items = cart.items.filter((i) => i.product.toString() !== productId.toString());
    await cart.save();

    return await this.getCart(userId);
  }

  /**
   * Clear Cart
   */
  static async clearCart(userId) {
    await Cart.findOneAndUpdate({ user: userId }, { items: [] });
    return { message: 'Cart cleared successfully.' };
  }
}

