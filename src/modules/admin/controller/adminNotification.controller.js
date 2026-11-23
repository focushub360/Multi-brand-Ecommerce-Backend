import { AdminNotification } from '../models/adminNotification.model.js';
import { NotificationService } from '../service/notification.service.js';
import { ApiResponse } from '../../../utils/ApiResponse.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import mongoose from 'mongoose';

export const getNotifications = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const { sourceType, isRead, priority, category } = req.query;

  const filter = {};
  if (sourceType) filter.sourceType = sourceType;
  if (isRead !== undefined) filter.isRead = isRead === 'true';
  if (priority) filter.priority = priority;
  if (category) filter.category = category;

  const [notifications, total, unreadCount, urgentCount] = await Promise.all([
    AdminNotification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AdminNotification.countDocuments(filter),
    AdminNotification.countDocuments({ isRead: false }),
    AdminNotification.countDocuments({ isRead: false, priority: 'URGENT' })
  ]);

  return res.status(200).json(
    ApiResponse.success(
      notifications,
      'Notifications retrieved successfully',
      200,
      {
        total,
        page,
        pages: Math.ceil(total / limit),
        unreadCount,
        urgentCount
      }
    )
  );
});

export const getUnreadCounts = asyncHandler(async (_req, res) => {
  const [totalUnread, urgentUnread, dealerUnread, customerUnread] = await Promise.all([
    AdminNotification.countDocuments({ isRead: false }),
    AdminNotification.countDocuments({ isRead: false, priority: 'URGENT' }),
    AdminNotification.countDocuments({ isRead: false, sourceType: 'DEALER' }),
    AdminNotification.countDocuments({ isRead: false, sourceType: 'CUSTOMER' })
  ]);

  return res.status(200).json(
    ApiResponse.success(
      {
        total: totalUnread,
        urgent: urgentUnread,
        fromDealers: dealerUnread,
        fromCustomers: customerUnread
      },
      'Notification counts retrieved successfully'
    )
  );
});

export const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const notification = await AdminNotification.findByIdAndUpdate(
    id,
    { isRead: true, readAt: new Date() },
    { new: true }
  );

  if (!notification) {
    return res.status(404).json(ApiResponse.error('Notification not found', 404));
  }

  return res.status(200).json(
    ApiResponse.success(notification, 'Notification marked as read')
  );
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  const { sourceType } = req.query;
  const filter = { isRead: false };
  if (sourceType) filter.sourceType = sourceType;

  await AdminNotification.updateMany(filter, {
    isRead: true,
    readAt: new Date()
  });

  return res.status(200).json(
    ApiResponse.success(null, 'All notifications marked as read')
  );
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await AdminNotification.findByIdAndDelete(id);
  return res.status(200).json(
    ApiResponse.success(null, 'Notification dismissed')
  );
});

export const simulateNotification = asyncHandler(async (req, res) => {
  const { type } = req.body;

  if (type === 'dealer_apply') {
    const notif = await NotificationService.createNotification({
      sourceType: 'DEALER',
      sourceId: new mongoose.Types.ObjectId(),
      sourceName: 'Kisan Agro Supplies',
      category: 'DEALER_ONBOARDING',
      priority: 'NORMAL',
      title: 'New Dealer Application Submitted',
      message: 'Kisan Agro Supplies submitted KYC documents for review.',
      entityType: 'dealer',
      entityId: 'dealer_101',
      actionUrl: '/admin/dealers',
      metadata: { gstin: '27AABCU9603R1ZX', category: 'Agri Tech' }
    });
    return res.status(201).json(ApiResponse.success(notif, 'Dealer notification simulated successfully'));
  }

  if (type === 'customer_dispute') {
    const notif = await NotificationService.createNotification({
      sourceType: 'CUSTOMER',
      sourceId: new mongoose.Types.ObjectId(),
      sourceName: 'Rajesh Kumar',
      category: 'CUSTOMER_DISPUTE',
      priority: 'URGENT',
      title: 'Urgent Logistics Dispute Raised',
      message: 'Customer reported item damaged in transit for Order #642.',
      entityType: 'complaint',
      entityId: 'dispute_202',
      actionUrl: '/admin/support',
      metadata: { orderId: '642', issue: 'DAMAGED_ITEM' }
    });
    return res.status(201).json(ApiResponse.success(notif, 'Customer dispute simulated successfully'));
  }

  return res.status(400).json(ApiResponse.error("Pass { type: 'dealer_apply' } or { type: 'customer_dispute' }", 400));
});
