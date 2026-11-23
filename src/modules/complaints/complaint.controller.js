import { ComplaintService } from './complaint.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const createTicket = asyncHandler(async (req, res) => {
  const ticket = await ComplaintService.createTicket(req.user, req.dealer, req.body);
  return res.status(201).json(ApiResponse.created(ticket, 'Support ticket created successfully'));
});

export const replyToTicket = asyncHandler(async (req, res) => {
  const ticket = await ComplaintService.replyToTicket(
    req.params.ticketId,
    req.user,
    req.dealer,
    req.body.text,
    req.body.attachments || []
  );
  return res.status(200).json(ApiResponse.success(ticket, 'Reply submitted successfully'));
});

export const getMyTickets = asyncHandler(async (req, res) => {
  const dealerId = req.dealer?.id || (req.user?.role === 'dealer' ? req.user.id : null);
  const tickets = await ComplaintService.getMyTickets(req.user.id, dealerId);
  return res.status(200).json(ApiResponse.success(tickets, 'Tickets retrieved successfully'));
});

export const getTicketById = asyncHandler(async (req, res) => {
  const ticket = await ComplaintService.getTicketById(req.params.ticketId, req.user, req.dealer);
  return res.status(200).json(ApiResponse.success(ticket, 'Ticket details retrieved successfully'));
});

export const getAllTickets = asyncHandler(async (req, res) => {
  const result = await ComplaintService.getAllTickets(req.query);
  return res.status(200).json(
    ApiResponse.success(result.tickets, 'All support tickets retrieved', 200, result.pagination)
  );
});

export const updateTicketStatus = asyncHandler(async (req, res) => {
  const { status, priority, note, reason } = req.body;
  const actor = { ...req.user, ipAddress: req.ip, userAgent: req.get('user-agent') };
  const ticket = await ComplaintService.updateTicketStatus(req.params.ticketId, actor, status, note, reason, priority);
  return res.status(200).json(ApiResponse.success(ticket, 'Ticket status updated successfully'));
});

export const addAdminReply = asyncHandler(async (req, res) => {
  const { text, internalNote, status, attachments } = req.body;
  const actor = { ...req.user, ipAddress: req.ip, userAgent: req.get('user-agent') };
  const ticket = await ComplaintService.addAdminReply(
    req.params.ticketId,
    actor,
    text,
    internalNote,
    status,
    attachments || []
  );
  return res.status(200).json(
    ApiResponse.success(ticket, internalNote ? 'Internal note saved.' : 'Admin reply sent.')
  );
});

export const reopenTicket = asyncHandler(async (req, res) => {
  const ticket = await ComplaintService.reopenTicket(
    req.params.ticketId,
    req.user,
    req.dealer,
    req.body.reason
  );
  return res.status(200).json(ApiResponse.success(ticket, 'Ticket reopened successfully'));
});

export const getDealerNotifications = asyncHandler(async (req, res) => {
  const dealerId = req.dealer?.id || req.user.id;
  const notifications = await ComplaintService.getDealerNotifications(dealerId);
  return res.status(200).json(ApiResponse.success(notifications, 'Dealer notifications retrieved successfully'));
});

export const markDealerNotificationRead = asyncHandler(async (req, res) => {
  const dealerId = req.dealer?.id || req.user.id;
  const notification = await ComplaintService.markDealerNotificationRead(req.params.id, dealerId);
  return res.status(200).json(ApiResponse.success(notification, 'Dealer notification marked as read'));
});

export const getCustomerNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const notifications = await ComplaintService.getCustomerNotifications(userId);
  return res.status(200).json(ApiResponse.success(notifications, 'Customer notifications retrieved successfully'));
});

export const markCustomerNotificationRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const notification = await ComplaintService.markCustomerNotificationRead(req.params.id, userId);
  return res.status(200).json(ApiResponse.success(notification, 'Customer notification marked as read'));
});
