import { Complaint } from './complaint.model.js';
import { Dealer } from '../dealers/dealer.model.js';
import { ROLES } from '../../constants/roles.js';
import { ApiError } from '../../utils/ApiError.js';

export class ComplaintService {
  /**
   * Create Support Ticket (Dealer or Customer)
   */
  static async createTicket(user, dealerIdentity, data) {
    const isDealer = user.role === ROLES.DEALER;
    const ticketId = `TCK-${Math.floor(1000 + Math.random() * 9000)}`;

    let concernedDealerId = null;
    let concernedDealerName = '';

    if (isDealer && dealerIdentity) {
      concernedDealerId = dealerIdentity.id;
      concernedDealerName = dealerIdentity.businessName;
    } else if (data.concernedDealer) {
      const dealer = await Dealer.findById(data.concernedDealer);
      if (dealer) {
        concernedDealerId = dealer._id;
        concernedDealerName = dealer.businessName;
      }
    }

    const complaint = new Complaint({
      ticketId,
      ticketType: isDealer ? 'dealer' : 'customer',
      requester: user.id,
      requesterName: isDealer && dealerIdentity ? dealerIdentity.businessName : user.name,
      requesterEmail: user.email,
      requesterRole: isDealer ? 'Dealer' : 'Customer',
      concernedDealer: concernedDealerId,
      concernedDealerName,
      orderNumber: data.orderNumber || '',
      subject: data.subject.trim(),
      category: data.category,
      priority: data.priority || 'Medium',
      status: 'Open',
      messages: [
        {
          sender: user.id,
          senderName: isDealer && dealerIdentity ? dealerIdentity.businessName : user.name,
          senderRole: isDealer ? 'dealer' : 'customer',
          text: data.message.trim(),
          timestamp: new Date()
        }
      ]
    });

    await complaint.save();
    return complaint;
  }

  /**
   * Post Reply Message to Ticket
   */
  static async replyToTicket(ticketId, user, dealerIdentity, text) {
    const ticket = await Complaint.findOne({
      $or: [{ _id: ticketId.match(/^[0-9a-fA-F]{24}$/) ? ticketId : null }, { ticketId }]
    });

    if (!ticket) throw ApiError.notFound('Support ticket not found.');

    // Verify participant permission (Requester, Admin, or Concerned Dealer)
    const isAdmin = user.role === ROLES.SUPER_ADMIN;
    const isRequester = ticket.requester.toString() === user.id.toString();
    const isConcernedDealer = dealerIdentity && ticket.concernedDealer?.toString() === dealerIdentity.id.toString();

    if (!isAdmin && !isRequester && !isConcernedDealer) {
      throw ApiError.forbidden('You do not have permission to view or participate in this ticket.');
    }

    const roleString = isAdmin ? 'admin' : user.role === ROLES.DEALER ? 'dealer' : 'customer';
    const senderName = isAdmin ? 'GROVE Platform Operations' : (user.role === ROLES.DEALER && dealerIdentity ? dealerIdentity.businessName : user.name);

    ticket.messages.push({
      sender: user.id,
      senderName,
      senderRole: roleString,
      text: text.trim(),
      timestamp: new Date()
    });

    if (isAdmin && ticket.status === 'Open') {
      ticket.status = 'In Progress';
    }

    await ticket.save();
    return ticket;
  }

  /**
   * Super Admin Update Ticket Status & Add Internal Note
   */
  static async updateTicketStatus(ticketId, adminUser, status, note = '') {
    const ticket = await Complaint.findOne({
      $or: [{ _id: ticketId.match(/^[0-9a-fA-F]{24}$/) ? ticketId : null }, { ticketId }]
    });

    if (!ticket) throw ApiError.notFound('Ticket not found.');

    ticket.status = status;
    if (note) {
      ticket.internalNotes.push({
        author: adminUser.id,
        note: note.trim(),
        timestamp: new Date()
      });
    }

    await ticket.save();
    return ticket;
  }

  /**
   * Get Current User/Dealer Tickets
   */
  static async getMyTickets(userId, dealerId = null) {
    const query = { $or: [{ requester: userId }] };
    if (dealerId) {
      query.$or.push({ concernedDealer: dealerId });
    }

    return await Complaint.find(query).sort({ updatedAt: -1 }).lean();
  }

  /**
   * Super Admin Get All Tickets
   */
  static async getAllTickets({ status = '', priority = '', type = '', page = 1, limit = 20 }) {
    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (type) query.ticketType = type;

    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      Complaint.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
      Complaint.countDocuments(query)
    ]);

    return {
      tickets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get Single Ticket Details
   */
  static async getTicketById(ticketId, user, dealerIdentity) {
    const ticket = await Complaint.findOne({
      $or: [{ _id: ticketId.match(/^[0-9a-fA-F]{24}$/) ? ticketId : null }, { ticketId }]
    }).lean();

    if (!ticket) throw ApiError.notFound('Ticket not found.');

    // Security check
    const isAdmin = user.role === ROLES.SUPER_ADMIN;
    const isRequester = ticket.requester.toString() === user.id.toString();
    const isConcernedDealer = dealerIdentity && ticket.concernedDealer?.toString() === dealerIdentity.id.toString();

    if (!isAdmin && !isRequester && !isConcernedDealer) {
      throw ApiError.forbidden('You do not have access to this ticket.');
    }

    // Hide internal notes from non-admin users
    if (!isAdmin) {
      delete ticket.internalNotes;
    }

    return ticket;
  }
}

