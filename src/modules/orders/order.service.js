import { Order } from './order.model.js';
import { DealerOrder } from './dealerOrder.model.js';
import { Product } from '../products/product.model.js';
import { Address } from '../addresses/address.model.js';
import { User } from '../users/user.model.js';
import { Inventory } from '../inventory/inventory.model.js';
import { InventoryTransaction } from '../inventory/inventoryTransaction.model.js';
import { Payment } from '../payments/payment.model.js';
import { CartService } from '../cart/cart.service.js';
import { ApiError } from '../../utils/ApiError.js';

export class OrderService {
  /**
   * Complete Multi-Dealer Checkout
   * Partitions single customer order into independent dealer fulfillment suborders.
   */
  static async checkout(userId, { shippingAddressId, shippingAddress, paymentMethod, items }) {
    // 1. Resolve Customer Profile
    const customer = await User.findById(userId);
    if (!customer) throw ApiError.notFound('Customer not found.');

    // 2. Resolve Shipping Address
    let resolvedAddress = null;
    if (shippingAddressId) {
      resolvedAddress = await Address.findOne({ _id: shippingAddressId, user: userId }).lean();
    } else if (shippingAddress) {
      resolvedAddress = shippingAddress;
    }

    if (!resolvedAddress) {
      throw ApiError.badRequest('Valid delivery shipping address is required for checkout.');
    }

    // 3. Resolve Items (from explicit Buy Now payload or Customer Cart)
    let rawItems = items;
    if (!rawItems || rawItems.length === 0) {
      const cartData = await CartService.getCart(userId);
      if (!cartData.items || cartData.items.length === 0) {
        throw ApiError.badRequest('Cannot proceed to checkout with an empty cart.');
      }
      rawItems = cartData.items.map((i) => ({
        productId: i.productId || i.id,
        quantity: i.quantity
      }));
    }

    // 4. Validate Line Items from Database & Snapshots
    const validatedItems = [];
    const dealerItemMap = new Map(); // dealerId -> items[]
    let itemsTotal = 0;
    let mrpTotal = 0;

    for (const raw of rawItems) {
      const product = await Product.findById(raw.productId).populate('dealer');
      if (!product || product.status !== 'Active') {
        throw ApiError.badRequest(`Product '${product?.name || raw.productId}' is no longer available.`);
      }

      const qty = Math.max(1, parseInt(raw.quantity, 10));
      if (product.stock < qty) {
        throw ApiError.badRequest(
          `Insufficient stock for '${product.name}'. Requested: ${qty}, Available: ${product.stock}.`
        );
      }

      const lineSubtotal = product.price * qty;
      const lineMrp = (product.mrp || product.price) * qty;

      itemsTotal += lineSubtotal;
      mrpTotal += lineMrp;

      const itemSnapshot = {
        product: product._id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        mrp: product.mrp || product.price,
        quantity: qty,
        category: product.categoryName || 'General',
        subcategory: product.subcategory || '',
        grade: 'Commercial Grade',
        dealer: product.dealer._id,
        dealerCode: product.dealerCode,
        dealerName: product.dealer.businessName || product.dealerName,
        image: product.image,
        subtotal: lineSubtotal
      };

      validatedItems.push(itemSnapshot);

      // Group by Dealer
      const dealerIdStr = product.dealer._id.toString();
      if (!dealerItemMap.has(dealerIdStr)) {
        dealerItemMap.set(dealerIdStr, {
          dealer: product.dealer,
          items: []
        });
      }
      dealerItemMap.get(dealerIdStr).items.push(itemSnapshot);
    }

    // 5. Calculate Final Pricing
    const discount = Math.max(0, mrpTotal - itemsTotal);
    const deliveryFee = itemsTotal >= 5000 ? 0 : 99;
    const finalTotal = itemsTotal + deliveryFee;

    // 6. Generate Unique Order Number (GRV-XXXXXX)
    const orderNumber = `GRV-${Math.floor(100000 + Math.random() * 900000)}`;

    // 7. Create Master Customer Order
    const masterOrder = new Order({
      orderNumber,
      customer: customer._id,
      customerSnapshot: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone || resolvedAddress.mobile
      },
      shippingAddress: {
        name: resolvedAddress.name,
        mobile: resolvedAddress.mobile,
        pincode: resolvedAddress.pincode,
        house: resolvedAddress.house,
        street: resolvedAddress.street,
        landmark: resolvedAddress.landmark || '',
        city: resolvedAddress.city,
        state: resolvedAddress.state,
        type: resolvedAddress.type || 'Home'
      },
      items: validatedItems,
      dealers: Array.from(dealerItemMap.values()).map((d) => d.dealer._id),
      dealerOrders: [],
      pricing: {
        itemsTotal,
        discount,
        deliveryFee,
        tax: 0,
        total: finalTotal
      },
      payment: {
        method: paymentMethod,
        methodLabel: paymentMethod.toUpperCase(),
        status: paymentMethod === 'cod' ? 'Pending' : 'Completed',
        transactionId: `TXN_${Date.now()}`,
        paidAt: paymentMethod === 'cod' ? null : new Date()
      },
      orderStatus: 'Placed',
      timeline: [
        {
          status: 'Placed',
          title: 'Order Placed & Verified',
          note: 'Your order was placed successfully on GROVE marketplace.',
          timestamp: new Date()
        }
      ]
    });

    await masterOrder.save();

    // 8. Create Discrete Dealer Fulfillment Suborders
    const createdDealerOrderIds = [];
    let dealerIndex = 1;

    for (const [dealerId, entry] of dealerItemMap.entries()) {
      const dealer = entry.dealer;
      const dealerItems = entry.items;
      const dealerSubtotal = dealerItems.reduce((acc, curr) => acc + curr.subtotal, 0);
      const commissionRate = dealer.commissionRate || 5.0;
      const commissionAmount = Math.round((dealerSubtotal * commissionRate) / 100);
      const netSettlementAmount = dealerSubtotal - commissionAmount;

      const subOrderNumber = `${orderNumber}-D${dealerIndex++}`;

      const dealerOrder = new DealerOrder({
        parentOrder: masterOrder._id,
        parentOrderNumber: orderNumber,
        orderNumber: subOrderNumber,
        dealer: dealer._id,
        dealerCode: dealer.dealerCode,
        customer: customer._id,
        customerSnapshot: {
          name: customer.name,
          email: customer.email || '',
          city: resolvedAddress.city,
          state: resolvedAddress.state,
          phone: resolvedAddress.mobile,
          address: `${resolvedAddress.house}, ${resolvedAddress.street}, ${resolvedAddress.city} ${resolvedAddress.pincode}`
        },
        items: dealerItems,
        subtotal: dealerSubtotal,
        commissionRate,
        commissionAmount,
        netSettlementAmount,
        orderStatus: 'Placed',
        paymentStatus: masterOrder.payment.status === 'Completed' ? 'Paid' : 'Pending',
        fulfillmentPartner: 'Delhivery Express Cargo',
        estimatedDelivery: '3 - 5 Business Days',
        payoutStatus: 'Escrow Held',
        timeline: [
          {
            status: 'Placed',
            title: 'Order Item Confirmed',
            note: 'Order assigned to warehouse for preparation.',
            timestamp: new Date()
          }
        ]
      });

      await dealerOrder.save();
      createdDealerOrderIds.push(dealerOrder._id);
    }

    // Attach suborders to master order
    masterOrder.dealerOrders = createdDealerOrderIds;
    await masterOrder.save();

    // 9. Deduct Stock & Record Inventory Transactions
    for (const item of validatedItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity, totalSales: item.quantity }
      });

      const inv = await Inventory.findOneAndUpdate(
        { product: item.product },
        { $inc: { currentStock: -item.quantity } },
        { new: true }
      );

      await InventoryTransaction.create({
        product: item.product,
        dealer: item.dealer,
        type: 'ORDER_DEDUCTED',
        quantityChange: -item.quantity,
        balanceAfter: inv?.currentStock || 0,
        referenceId: orderNumber,
        reason: `Customer order ${orderNumber} placed`,
        performedBy: customer._id
      });
    }

    // 10. Record Payment Transaction
    await Payment.create({
      transactionId: masterOrder.payment.transactionId,
      order: masterOrder._id,
      orderNumber,
      customer: customer._id,
      customerName: customer.name,
      amount: finalTotal,
      paymentMethod,
      status: masterOrder.payment.status === 'Completed' ? 'COMPLETED' : 'PENDING',
      escrowStatus: 'Escrow Held',
      paidAt: masterOrder.payment.paidAt
    });

    // 11. Clear Customer Cart
    try {
      await CartService.clearCart(userId);
    } catch {}

    return masterOrder;
  }

  /**
   * Get Customer Orders
   */
  static async getCustomerOrders(userId, { page = 1, limit = 20 }) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({ customer: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments({ customer: userId })
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get Customer Order Details by ID or Order Number
   */
  static async getCustomerOrderById(userId, orderIdOrNumber) {
    const query = { customer: userId };
    if (orderIdOrNumber.match(/^[0-9a-fA-F]{24}$/)) {
      query._id = orderIdOrNumber;
    } else {
      query.orderNumber = orderIdOrNumber;
    }

    const order = await Order.findOne(query)
      .populate('dealerOrders')
      .lean();

    if (!order) throw ApiError.notFound('Order not found.');
    return order;
  }

  /**
   * Customer Cancel Order (Stock Restoration)
   */
  static async cancelCustomerOrder(userId, orderIdOrNumber, reason = 'Buyer request') {
    const query = { customer: userId };
    if (orderIdOrNumber.match(/^[0-9a-fA-F]{24}$/)) {
      query._id = orderIdOrNumber;
    } else {
      query.orderNumber = orderIdOrNumber;
    }

    const order = await Order.findOne(query);
    if (!order) throw ApiError.notFound('Order not found.');

    if (order.orderStatus === 'Shipped' || order.orderStatus === 'Out for Delivery' || order.orderStatus === 'Delivered') {
      throw ApiError.badRequest('Orders that have already been dispatched or delivered cannot be cancelled online.');
    }

    if (order.orderStatus === 'Cancelled') {
      throw ApiError.badRequest('Order is already cancelled.');
    }

    order.orderStatus = 'Cancelled';
    order.timeline.push({
      status: 'Cancelled',
      title: 'Order Cancelled',
      note: reason,
      timestamp: new Date()
    });
    await order.save();

    // Update all dealer suborders
    await DealerOrder.updateMany(
      { parentOrder: order._id },
      { 
        orderStatus: 'Cancelled',
        payoutStatus: 'Pending Escrow',
        $push: {
          timeline: {
            status: 'Cancelled',
            title: 'Order Cancelled by Buyer',
            note: reason,
            timestamp: new Date()
          }
        }
      }
    );

    // Restore Inventory
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
      const inv = await Inventory.findOneAndUpdate(
        { product: item.product },
        { $inc: { currentStock: item.quantity } },
        { new: true }
      );

      await InventoryTransaction.create({
        product: item.product,
        dealer: item.dealer,
        type: 'ORDER_CANCELLED_RESTORE',
        quantityChange: item.quantity,
        balanceAfter: inv?.currentStock || 0,
        referenceId: order.orderNumber,
        reason: `Stock restored upon cancellation of order ${order.orderNumber}`,
        performedBy: userId
      });
    }

    return order;
  }

  /**
   * Helper to safely build dealer ownership query preventing Mongoose CastError on string dealer codes
   */
  static _buildDealerFilter(dealerIdent) {
    const dealerId = typeof dealerIdent === 'object' && dealerIdent !== null ? dealerIdent.dealerId : dealerIdent;
    const dealerCode = typeof dealerIdent === 'object' && dealerIdent !== null ? dealerIdent.dealerCode : undefined;

    const conditions = [];
    if (dealerId && String(dealerId).match(/^[0-9a-fA-F]{24}$/)) {
      conditions.push({ dealer: dealerId });
    }
    if (dealerCode) {
      conditions.push({ dealerCode });
    } else if (dealerId && !String(dealerId).match(/^[0-9a-fA-F]{24}$/)) {
      conditions.push({ dealerCode: String(dealerId) });
    }

    if (conditions.length === 0) {
      throw ApiError.unauthorized('Invalid dealer credentials provided.');
    }

    return conditions.length === 1 ? conditions[0] : { $or: conditions };
  }

  /**
   * Get Dealer Suborders
   */
  static async getDealerSubOrders(dealerIdent, { status = '', page = 1, limit = 20 }) {
    const dealerFilter = OrderService._buildDealerFilter(dealerIdent);
    const query = { ...dealerFilter };
    if (status) query.orderStatus = status;

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      DealerOrder.find(query)
        .populate('items.product', 'name sku category categoryName subcategory images primaryImage mrp price')
        .populate('parentOrder')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      DealerOrder.countDocuments(query)
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get Dealer Suborder Details
   */
  static async getDealerSubOrderById(dealerIdent, subOrderId) {
    const dealerFilter = OrderService._buildDealerFilter(dealerIdent);
    const cleanId = String(subOrderId || '').replace(/^#/, '').trim();
    const isHex = String(cleanId).match(/^[0-9a-fA-F]{24}$/);

    const conditions = [];
    if (isHex) conditions.push({ _id: cleanId });
    conditions.push(
      { orderNumber: cleanId },
      { parentOrderNumber: cleanId },
      { orderNumber: new RegExp(`^${cleanId}`, 'i') },
      { parentOrderNumber: new RegExp(`^${cleanId}`, 'i') }
    );

    const query = {
      $and: [
        dealerFilter,
        { $or: conditions }
      ]
    };

    const order = await DealerOrder.findOne(query)
      .populate('items.product', 'name sku category categoryName subcategory images primaryImage mrp price')
      .populate('parentOrder')
      .lean();

    if (!order) throw ApiError.notFound('Suborder not found for your dealership.');
    return order;
  }

  /**
   * Update Dealer Fulfillment Status
   */
  static async updateDealerFulfillmentStatus(dealerIdent, subOrderId, data) {
    const dealerFilter = OrderService._buildDealerFilter(dealerIdent);
    const cleanId = String(subOrderId || '').replace(/^#/, '').trim();
    const isHex = String(cleanId).match(/^[0-9a-fA-F]{24}$/);
    const conditions = [];
    if (isHex) conditions.push({ _id: cleanId });
    conditions.push({ orderNumber: cleanId }, { parentOrderNumber: cleanId });

    const query = {
      $and: [
        dealerFilter,
        { $or: conditions }
      ]
    };

    const subOrder = await DealerOrder.findOne(query);
    if (!subOrder) throw ApiError.notFound('Suborder not found for your dealership.');

    const oldStatus = subOrder.orderStatus;
    const newStatus = data.orderStatus;

    subOrder.orderStatus = newStatus;
    if (data.trackingNumber) subOrder.trackingNumber = data.trackingNumber;
    if (data.fulfillmentPartner) subOrder.fulfillmentPartner = data.fulfillmentPartner;
    if (data.estimatedDelivery) subOrder.estimatedDelivery = data.estimatedDelivery;

    subOrder.timeline.push({
      status: newStatus,
      title: `Status updated to ${newStatus}`,
      note: data.note || `Fulfillment progressed by merchant (${subOrder.dealerCode})`,
      timestamp: new Date()
    });

    await subOrder.save();

    // Check if Parent Order should reflect progress
    const allSiblings = await DealerOrder.find({ parentOrder: subOrder.parentOrder });
    const allDelivered = allSiblings.every((s) => s.orderStatus === 'Delivered');
    const anyOutForDelivery = allSiblings.some((s) => s.orderStatus === 'Out for Delivery');
    const anyShipped = allSiblings.some((s) => s.orderStatus === 'Shipped' || s.orderStatus === 'In Transit');

    if (allDelivered) {
      await Order.findByIdAndUpdate(subOrder.parentOrder, {
        orderStatus: 'Delivered',
        $push: { timeline: { status: 'Delivered', title: 'Delivered', note: 'All items delivered successfully.', timestamp: new Date() } }
      });
    } else if (anyOutForDelivery) {
      await Order.findByIdAndUpdate(subOrder.parentOrder, {
        orderStatus: 'Out for Delivery',
        $push: { timeline: { status: 'Out for Delivery', title: 'Out for Delivery', note: 'Items are out for delivery to destination.', timestamp: new Date() } }
      });
    } else if (anyShipped) {
      await Order.findByIdAndUpdate(subOrder.parentOrder, {
        orderStatus: 'Shipped',
        $push: { timeline: { status: 'Shipped', title: 'Dispatched', note: 'Items in transit with logistics partners.', timestamp: new Date() } }
      });
    }

    return subOrder;
  }

  /**
   * Super Admin Global Order Inspection (Read-Only)
   */
  static async getGlobalOrders({ status = '', search = '', page = 1, limit = 20 }) {
    const query = {};
    if (status) query.orderStatus = status;
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customerSnapshot.name': { $regex: search, $options: 'i' } },
        { 'customerSnapshot.email': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('customer', 'name email')
        .populate('dealers', 'businessName dealerCode')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(query)
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Super Admin Get Order Details (Read-Only)
   */
  static async getAdminOrderById(orderId) {
    const order = await Order.findById(orderId)
      .populate('dealerOrders')
      .populate('customer', 'name email phone')
      .populate('dealers', 'businessName dealerCode officialEmail phone')
      .lean();

    if (!order) throw ApiError.notFound('Order not found.');
    return order;
  }
}

