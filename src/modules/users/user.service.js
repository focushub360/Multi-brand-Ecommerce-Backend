
import mongoose from 'mongoose';
import { User } from './user.model.js';
import { Order } from '../orders/order.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { ROLES } from '../../constants/roles.js';
import { AdminService } from '../admin/service/admin.service.js';

export class UserService {

  // 1. Get all buyers with order statistics
  static async getAllUsers({
    search = '',
    buyerType = '',
    status = '',
    page = 1,
    limit = 10
  }) {
    page = Math.max(1, Number(page) || 1);
    limit = Math.min(100, Math.max(1, Number(limit) || 10));

    const query = {
      role: ROLES.USER
    };

    if (status) {
      query.status = status.toUpperCase();
    }

    if (buyerType) {
      query.buyerType = buyerType.toUpperCase();
    }

    if (search.trim()) {
      const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      query.$or = [
        { name: { $regex: escapedSearch, $options: 'i' } },
        { email: { $regex: escapedSearch, $options: 'i' } },
        { phone: { $regex: escapedSearch, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      User.countDocuments(query)
    ]);

    const userIds = users.map(user => user._id);

    // Aggregate order information for the displayed buyers
    const orderStats = await Order.aggregate([
      {
        $match: {
          customer: { $in: userIds }
        }
      },
      {
        $group: {
          _id: '$customer',
          totalOrders: {
            $sum: {
              $cond: [
                { $ne: ['$orderStatus', 'Cancelled'] },
                1,
                0
              ]
            }
          },
          lifetimeSpend: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$payment.status', 'Completed'] },
                    { $ne: ['$orderStatus', 'Cancelled'] }
                  ]
                },
                '$pricing.total',
                0
              ]
            }
          }
        }
      }
    ]);

    const statsMap = new Map(
      orderStats.map(item => [
        item._id.toString(),
        item
      ])
    );

    const enrichedUsers = users.map(user => {
      const stats = statsMap.get(user._id.toString());

      return {
        ...user,
        totalOrders: stats?.totalOrders || 0,
        lifetimeSpend: stats?.lifetimeSpend || 0
      };
    });

    return {
      users: enrichedUsers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // 2. Dashboard statistics
  static async getUserStats() {
    const [totalBuyers, activeAccounts, inactiveAccounts, fpoCount] =
      await Promise.all([
        User.countDocuments({ role: ROLES.USER }),

        User.countDocuments({
          role: ROLES.USER,
          status: 'ACTIVE'
        }),

        User.countDocuments({
          role: ROLES.USER,
          status: { $in: ['INACTIVE', 'SUSPENDED'] }
        }),

        User.countDocuments({
          role: ROLES.USER,
          buyerType: 'FPO'
        })
      ]);

    return {
      totalBuyers,
      activeAccounts,
      fpoCount,
      inactiveAccounts
    };
  }

  // 3. Get individual buyer dossier
  static async getUserById(userId) {
    if (!mongoose.isValidObjectId(userId)) {
      throw ApiError.badRequest('Invalid buyer ID.');
    }

    const user = await User.findOne({
      _id: userId,
      role: ROLES.USER
    })
      .select('-password')
      .lean();

    if (!user) {
      throw ApiError.notFound('Buyer not found.');
    }

    const orders = await Order.find({
      customer: userId
    })
      .sort({ createdAt: -1 })
      .lean();

    const validOrders = orders.filter(
      order => order.orderStatus !== 'Cancelled'
    );

    const lifetimeSpend = orders.reduce((total, order) => {
      if (
        order.payment?.status === 'Completed' &&
        order.orderStatus !== 'Cancelled'
      ) {
        return total + (order.pricing?.total || 0);
      }

      return total;
    }, 0);

    const latestOrder = orders[0];

    return {
      ...user,
      totalOrders: validOrders.length,
      lifetimeSpend,
      address: latestOrder?.shippingAddress || null,
      orders
    };
  }

  // 4. Activate / Deactivate buyer account
  static async updateUserStatus(userId, status, adminUser) {
    if (!mongoose.isValidObjectId(userId)) {
      throw ApiError.badRequest('Invalid buyer ID.');
    }

    const allowedStatuses = [
      'ACTIVE',
      'INACTIVE',
      'SUSPENDED'
    ];

    const normalizedStatus = String(status || '').toUpperCase();

    if (!allowedStatuses.includes(normalizedStatus)) {
      throw ApiError.badRequest('Invalid account status.');
    }

    const user = await User.findOneAndUpdate(
      {
        _id: userId,
        role: ROLES.USER
      },
      {
        $set: { status: normalizedStatus }
      },
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    if (!user) {
      throw ApiError.notFound('Buyer not found.');
    }

    await AdminService.recordAuditLog({
      action: 'USER_STATUS_UPDATED', actor: adminUser.id, actorRole: adminUser.role,
      targetEntity: 'User', targetId: userId,
      details: `Buyer status changed to ${normalizedStatus}.`,
      ipAddress: adminUser.ipAddress || '', userAgent: adminUser.userAgent || ''
    });

    return {
      user,
      message: `Buyer account ${normalizedStatus.toLowerCase()} successfully.`
    };
  }

  // 5. Existing delete functionality - retained for compatibility
  static async deleteUser(userId, adminUser) {
    const user = await User.findOne({ _id: userId, role: ROLES.USER });

    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    await AdminService.recordAuditLog({
      action: 'USER_DELETED', actor: adminUser.id, actorRole: adminUser.role,
      targetEntity: 'User', targetId: userId,
      details: `Buyer account '${user.name}' deleted by Super Admin.`,
      ipAddress: adminUser.ipAddress || '', userAgent: adminUser.userAgent || ''
    });
    await User.deleteOne({ _id: userId, role: ROLES.USER });

    return {
      message: `User account '${user.name}' deleted successfully.`
    };
  }

  // 6. Existing customer profile update
  static async updateProfile(userId, updateData) {
    const user = await User.findById(userId);

    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    if (updateData.name !== undefined) {
      user.name = updateData.name.trim();
    }

    if (updateData.phone !== undefined) {
      user.phone = updateData.phone.trim();
    }

    if (updateData.avatar !== undefined) {
      user.avatar = updateData.avatar;
    }

    await user.save();

    return user;
  }
}
