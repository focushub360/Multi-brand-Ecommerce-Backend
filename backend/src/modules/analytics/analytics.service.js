import { Order } from '../orders/order.model.js';
import { DealerOrder } from '../orders/dealerOrder.model.js';
import { Product } from '../products/product.model.js';
import { Dealer } from '../dealers/dealer.model.js';
import { User } from '../users/user.model.js';

export class AnalyticsService {
  /**
   * Super Admin Platform Sales & Revenue Analytics
   */
  static async getAdminAnalytics() {
    const [orders, dealerOrders, dealersCount, usersCount, topProducts] = await Promise.all([
      Order.find().lean(),
      DealerOrder.find().lean(),
      Dealer.countDocuments({ status: 'APPROVED' }),
      User.countDocuments({ role: 'USER' }),
      Product.find().sort({ totalSales: -1 }).limit(5).lean()
    ]);

    const totalOrdersCount = orders.length;
    const completedOrders = orders.filter((o) => o.orderStatus !== 'Cancelled');
    const grossGMV = completedOrders.reduce((acc, curr) => acc + (curr.pricing?.total || 0), 0);
    const avgOrderValue = totalOrdersCount > 0 ? Math.round(grossGMV / totalOrdersCount) : 0;

    // Category distribution
    const categoryVolumeMap = {};
    for (const order of completedOrders) {
      for (const item of order.items || []) {
        const cat = item.category || 'General';
        categoryVolumeMap[cat] = (categoryVolumeMap[cat] || 0) + (item.subtotal || 0);
      }
    }

    const categoryDistribution = Object.keys(categoryVolumeMap).map((cat) => ({
      category: cat,
      revenue: categoryVolumeMap[cat]
    }));

    return {
      kpis: {
        grossGMV,
        totalOrders: totalOrdersCount,
        avgOrderValue,
        activeDealers: dealersCount,
        registeredBuyers: usersCount
      },
      categoryDistribution,
      topProducts: topProducts.map((p) => ({
        id: p._id,
        name: p.name,
        sku: p.sku,
        totalSales: p.totalSales,
        category: p.categoryName
      }))
    };
  }

  /**
   * Dealer Specific Performance Analytics
   */
  static async getDealerAnalytics(dealerId) {
    const subOrders = await DealerOrder.find({ dealer: dealerId }).sort({ createdAt: -1 }).lean();

    const totalOrders = subOrders.length;
    const activeSubOrders = subOrders.filter((o) => o.orderStatus !== 'Cancelled');
    const grossRevenue = activeSubOrders.reduce((acc, curr) => acc + (curr.subtotal || 0), 0);
    const netPayout = activeSubOrders.reduce((acc, curr) => acc + (curr.netSettlementAmount || 0), 0);
    const avgTicketSize = totalOrders > 0 ? Math.round(grossRevenue / totalOrders) : 0;

    // Monthly aggregation
    const monthlyMap = {};
    subOrders.forEach((o) => {
      const month = new Date(o.createdAt).toLocaleString('default', { month: 'short' });
      if (!monthlyMap[month]) monthlyMap[month] = { month, revenue: 0, orders: 0 };
      monthlyMap[month].revenue += o.subtotal || 0;
      monthlyMap[month].orders += 1;
    });

    return {
      kpis: {
        grossRevenue,
        netPayout,
        totalOrders,
        avgTicketSize
      },
      monthlyRevenue: Object.values(monthlyMap)
    };
  }

  /**
   * Export Dealer Orders Ledger to RFC-4180 Compliant CSV
   */
  static async exportDealerOrdersCSV(dealerId) {
    const subOrders = await DealerOrder.find({ dealer: dealerId }).sort({ createdAt: -1 }).lean();

    const headers = [
      'Suborder ID',
      'Parent Order ID',
      'Placed Date',
      'Customer Name',
      'City',
      'State',
      'SKU',
      'Product Name',
      'Quantity',
      'Unit Price (INR)',
      'Subtotal (INR)',
      'Fulfillment Status',
      'Payment Status',
      'Tracking Number'
    ];

    const rows = [headers.join(',')];

    for (const order of subOrders) {
      const dateStr = new Date(order.createdAt).toISOString().split('T')[0];
      const cust = order.customerSnapshot || {};

      for (const item of order.items || []) {
        const row = [
          order.orderNumber,
          order.parentOrderNumber,
          dateStr,
          `"${(cust.name || '').replace(/"/g, '""')}"`,
          `"${(cust.city || '').replace(/"/g, '""')}"`,
          `"${(cust.state || '').replace(/"/g, '""')}"`,
          item.sku,
          `"${(item.name || '').replace(/"/g, '""')}"`,
          item.quantity,
          item.price,
          item.subtotal,
          order.orderStatus,
          order.paymentStatus,
          order.trackingNumber || '—'
        ];
        rows.push(row.join(','));
      }
    }

    return rows.join('\r\n');
  }
}

