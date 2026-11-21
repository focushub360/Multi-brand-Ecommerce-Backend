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
    req.body.text
  );
  return res.status(200).json(ApiResponse.success(ticket, 'Reply submitted successfully'));
});

export const getMyTickets = asyncHandler(async (req, res) => {
  const dealerId = req.dealer?.id;
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
  const { status, note } = req.body;
  const ticket = await ComplaintService.updateTicketStatus(req.params.ticketId, req.user, status, note);
  return res.status(200).json(ApiResponse.success(ticket, 'Ticket status updated successfully'));
});

