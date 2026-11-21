import { Complaint } from './complaint.model.js';
import { DealerNotification } from './dealerNotification.model.js';
import { CustomerNotification } from './customerNotification.model.js';
import { Dealer } from '../dealers/dealer.model.js';
import { User } from '../users/user.model.js';
import { Order } from '../orders/order.model.js';
import { Address } from '../addresses/address.model.js';
import { ROLES } from '../../constants/roles.js';
import { ApiError } from '../../utils/ApiError.js';
<<<<<<< Updated upstream:backend/src/modules/complaints/complaint.service.js
=======
import { AdminService } from '../admin/service/admin.service.js';
import { NotificationService } from '../admin/service/notification.service.js';
import {
  sendTicketCreatedNotification,
  sendTicketReplyNotification,
  sendTicketStatusNotification
} from '../../utils/sendEmail.js';
>>>>>>> Stashed changes:src/modules/complaints/complaint.service.js

export class ComplaintService {
  /**
   * Create Support Ticket (Dealer or Customer)
   */
  static async createTicket(user, dealerIdentity, data) {
    const isDealer = user.role === ROLES.DEALER;
    const ticketId = `TCK-${Date.now().toString().slice(-4)}${Math.floor(100 + Math.random() * 900)}`;

    let concernedDealerId = null;
    let concernedDealerName = '';
    let dealerSnapshot = null;
    let customerSnapshot = null;
    let orderSnapshot = null;
    let validatedOrderNumber = '';

    if (isDealer) {
      const dealerDoc = await Dealer.findById(user.id).lean();
      concernedDealerId = dealerDoc?._id || user.id;
      concernedDealerName = dealerDoc?.businessName || dealerIdentity?.businessName || user.name;

      dealerSnapshot = {
        dealerId: concernedDealerId,
        dealerCode: dealerDoc?.dealerCode || dealerIdentity?.dealerCode || '',
        businessName: dealerDoc?.businessName || dealerIdentity?.businessName || user.name,
        ownerName: dealerDoc?.ownerName || user.name,
        phone: dealerDoc?.phone || '',
        email: dealerDoc?.officialEmail || user.email,
        storeAddress: dealerDoc?.address
          ? [
              dealerDoc.address.line1,
              dealerDoc.address.line2,
              dealerDoc.address.city,
              dealerDoc.address.state,
              dealerDoc.address.postalCode
            ]
              .filter(Boolean)
              .join(', ')
          : ''
      };
      validatedOrderNumber = data.orderNumber || '';
    } else {
      // Customer Ticket Creation
      const userDoc = await User.findById(user.id).lean();
      let defaultAddressStr = '';
      try {
        const addr = await Address.findOne({ user: user.id, isDefault: true }).lean();
        if (addr) {
          defaultAddressStr = [addr.line1, addr.line2, addr.city, addr.state, addr.postalCode].filter(Boolean).join(', ');
        }
      } catch {}

      customerSnapshot = {
        userId: user.id,
        name: userDoc?.name || user.name,
        email: userDoc?.email || user.email,
        phone: userDoc?.phone || '',
        defaultAddress: defaultAddressStr
      };

      // Validate Order ID against customer's authentic orders
      if (data.orderNumber && data.orderNumber.trim()) {
        const orderNumClean = data.orderNumber.trim();
        const orderDoc = await Order.findOne({
          $or: [
            { orderNumber: orderNumClean },
            { _id: orderNumClean.match(/^[0-9a-fA-F]{24}$/) ? orderNumClean : null }
          ],
          customer: user.id
        }).lean();

        if (!orderDoc) {
          throw ApiError.badRequest(`Order '${orderNumClean}' was not found in your account.`);
        }

        orderSnapshot = {
          orderId: orderDoc._id.toString(),
          orderNumber: orderDoc.orderNumber,
          totalAmount: Number(orderDoc.pricing?.total || orderDoc.totalAmount || 0),
          orderStatus: orderDoc.orderStatus || 'Processing',
          itemsCount: Array.isArray(orderDoc.items) ? orderDoc.items.length : 1,
          placedAt: orderDoc.createdAt
        };
        validatedOrderNumber = orderDoc.orderNumber;
      }
    }

    const descriptionText = (data.description || data.message || '').trim();
    const attachments = Array.isArray(data.attachments) ? data.attachments : [];
    const requesterName = isDealer
      ? (dealerSnapshot?.businessName || user.name)
      : (customerSnapshot?.name || user.name);
    const requesterEmail = isDealer
      ? (dealerSnapshot?.email || user.email)
      : (customerSnapshot?.email || user.email);

    const complaint = new Complaint({
      ticketId,
      ticketType: isDealer ? 'dealer' : 'customer',
      requester: user.id,
      requesterModel: isDealer ? 'Dealer' : 'User',
      requesterName,
      requesterEmail,
      requesterRole: isDealer ? 'Dealer' : 'Customer',
      concernedDealer: concernedDealerId,
      concernedDealerName,
      dealerSnapshot: dealerSnapshot || undefined,
      customerSnapshot: customerSnapshot || undefined,
      orderSnapshot: orderSnapshot || undefined,
      orderNumber: validatedOrderNumber,
      subject: data.subject.trim(),
      category: data.category,
      status: 'Open',
      attachments,
      messages: [
        {
          sender: user.id,
          senderModel: isDealer ? 'Dealer' : 'User',
          senderName: requesterName,
          senderRole: isDealer ? 'dealer' : 'customer',
          text: descriptionText,
          attachments,
          timestamp: new Date()
        }
      ],
      statusHistory: [
        {
          status: 'Open',
          changedBy: user.id,
          changedByName: requesterName,
          changedByRole: isDealer ? 'dealer' : 'customer',
          reason: 'Initial ticket submission',
          timestamp: new Date()
        }
      ]
    });

    await complaint.save();

    // 1. Notify Admin In-App
    NotificationService.createNotification({
      sourceType: isDealer ? 'DEALER' : 'CUSTOMER',
      sourceId: user.id,
      sourceName: requesterName,
      category: isDealer ? 'DEALER_COMPLAINT' : 'CUSTOMER_DISPUTE',
      priority: 'NORMAL',
      title: `New ${isDealer ? 'Dealer' : 'Customer'} Support Ticket: #${ticketId}`,
      message: `${requesterName} submitted ticket: "${data.subject.trim()}" (${data.category})`,
      entityType: 'Complaint',
      entityId: complaint.ticketId,
      actionUrl: isDealer ? '/admin/support' : '/admin/customer-support'
    }).catch((err) => console.error('Admin in-app notification error:', err.message));

    // 2. Notify Admin via Email
    sendTicketCreatedNotification({
      ticketId,
      subject: complaint.subject,
      category: complaint.category,
      requesterName,
      requesterEmail,
      description: descriptionText
    }).catch((err) => console.error('Admin ticket created email error:', err.message));

    return complaint;
  }

  /**
   * Post Reply Message to Ticket
   */
  static async replyToTicket(ticketId, user, dealerIdentity, text, attachments = []) {
    const ticket = await Complaint.findOne({
      $or: [{ _id: ticketId.match(/^[0-9a-fA-F]{24}$/) ? ticketId : null }, { ticketId }]
    });

    if (!ticket) throw ApiError.notFound('Support ticket not found.');

    const isAdmin = user.role === ROLES.SUPER_ADMIN;
    const isDealer = user.role === ROLES.DEALER;
    const isRequester = ticket.requester.toString() === user.id.toString();
    const isConcernedDealer = dealerIdentity && ticket.concernedDealer?.toString() === dealerIdentity.id.toString();

    if (!isAdmin && !isRequester && !isConcernedDealer) {
      throw ApiError.forbidden('You do not have permission to view or participate in this ticket.');
    }

    const roleString = isAdmin ? 'admin' : isDealer ? 'dealer' : 'customer';
    const senderName = isAdmin
      ? 'GROVE Platform Operations'
      : isDealer && dealerIdentity
        ? (dealerIdentity.businessName || user.name)
        : (ticket.customerSnapshot?.name || user.name);

    const formattedAttachments = Array.isArray(attachments) ? attachments : [];

    ticket.messages.push({
      sender: user.id,
      senderModel: isDealer ? 'Dealer' : 'User',
      senderName,
      senderRole: roleString,
      text: text.trim(),
      attachments: formattedAttachments,
      timestamp: new Date()
    });

    // If ticket was waiting for response, transition to In Progress
    if (isDealer && ticket.status === 'Waiting for Dealer') {
      ticket.status = 'In Progress';
      ticket.statusHistory.push({
        status: 'In Progress',
        changedBy: user.id,
        changedByName: senderName,
        changedByRole: 'dealer',
        reason: 'Dealer provided response',
        timestamp: new Date()
      });
    } else if (!isDealer && !isAdmin && ticket.status === 'Waiting for Customer') {
      ticket.status = 'In Progress';
      ticket.statusHistory.push({
        status: 'In Progress',
        changedBy: user.id,
        changedByName: senderName,
        changedByRole: 'customer',
        reason: 'Customer provided requested information',
        timestamp: new Date()
      });
    } else if (isAdmin && ticket.status === 'Open') {
      ticket.status = 'In Progress';
      ticket.statusHistory.push({
        status: 'In Progress',
        changedBy: user.id,
        changedByName: senderName,
        changedByRole: 'admin',
        reason: 'Admin assigned & replied',
        timestamp: new Date()
      });
    }

    await ticket.save();

    // In-App & Email Notifications
    if (!isAdmin) {
      // 1. Participant (Dealer or Customer) replied -> Notify Admin
      const isCustomer = ticket.ticketType === 'customer';
      NotificationService.createNotification({
        sourceType: isDealer ? 'DEALER' : 'CUSTOMER',
        sourceId: user.id,
        sourceName: senderName,
        category: isDealer ? 'DEALER_COMPLAINT' : 'CUSTOMER_DISPUTE',
        priority: 'NORMAL',
        title: `${isCustomer ? 'Customer' : 'Dealer'} Replied: Ticket #${ticket.ticketId}`,
        message: `${senderName} replied to: "${ticket.subject}"`,
        entityType: 'Complaint',
        entityId: ticket.ticketId,
        actionUrl: isCustomer ? '/admin/customer-support' : '/admin/support'
      }).catch((err) => console.error('Admin in-app notification error:', err.message));

      sendTicketReplyNotification({
        to: '', // default to ADMIN_EMAIL
        recipientName: 'Platform Operations Admin',
        ticketId: ticket.ticketId,
        ticketSubject: ticket.subject,
        replySenderName: senderName,
        messageText: text.trim(),
        isRecipientAdmin: true
      }).catch((err) => console.error('Admin reply email error:', err.message));
    } else {
      // 2. Admin replied -> Notify Requester (Dealer or Customer)
      if (ticket.ticketType === 'customer') {
        CustomerNotification.create({
          user: ticket.requester,
          type: 'TICKET_REPLY_RECEIVED',
          ticketId: ticket.ticketId,
          title: `Reply on Ticket #${ticket.ticketId}`,
          message: `GROVE Operations has posted a reply on your ticket: "${ticket.subject}"`
        }).catch((err) => console.error('Customer in-app notification error:', err.message));

        const customerEmail = ticket.customerSnapshot?.email || ticket.requesterEmail;
        const customerName = ticket.customerSnapshot?.name || ticket.requesterName;
        if (customerEmail) {
          sendTicketReplyNotification({
            to: customerEmail,
            recipientName: customerName,
            ticketId: ticket.ticketId,
            ticketSubject: ticket.subject,
            replySenderName: 'GROVE Operations Support',
            messageText: text.trim(),
            isRecipientAdmin: false
          }).catch((err) => console.error('Customer reply email error:', err.message));
        }
      } else {
        const targetDealerId = ticket.concernedDealer || (ticket.requesterModel === 'Dealer' ? ticket.requester : null);
        if (targetDealerId) {
          DealerNotification.create({
            dealer: targetDealerId,
            dealerCode: ticket.dealerSnapshot?.dealerCode || '',
            type: 'TICKET_REPLY_RECEIVED',
            ticketId: ticket.ticketId,
            title: `Reply on Ticket #${ticket.ticketId}`,
            message: `GROVE Operations has posted a reply on your ticket: "${ticket.subject}"`
          }).catch((err) => console.error('Dealer in-app notification error:', err.message));
        }

        const dealerEmail = ticket.dealerSnapshot?.email || ticket.requesterEmail;
        const dealerRecipientName = ticket.dealerSnapshot?.businessName || ticket.requesterName;
        if (dealerEmail) {
          sendTicketReplyNotification({
            to: dealerEmail,
            recipientName: dealerRecipientName,
            ticketId: ticket.ticketId,
            ticketSubject: ticket.subject,
            replySenderName: 'GROVE Operations Support',
            messageText: text.trim(),
            isRecipientAdmin: false
          }).catch((err) => console.error('Dealer reply email error:', err.message));
        }
      }
    }

    return ticket;
  }

  /**
   * Reopen a Resolved or Closed Ticket by Customer or Dealer
   */
  static async reopenTicket(ticketId, user, dealerIdentity, reason = '') {
    const ticket = await Complaint.findOne({
      $or: [{ _id: ticketId.match(/^[0-9a-fA-F]{24}$/) ? ticketId : null }, { ticketId }]
    });

    if (!ticket) throw ApiError.notFound('Support ticket not found.');

    const isRequester = ticket.requester.toString() === user.id.toString();
    const isConcernedDealer = dealerIdentity && ticket.concernedDealer?.toString() === dealerIdentity.id.toString();

    if (!isRequester && !isConcernedDealer) {
      throw ApiError.forbidden('You do not have permission to reopen this ticket.');
    }

    if (ticket.status !== 'Resolved' && ticket.status !== 'Closed') {
      throw ApiError.badRequest(`Only Resolved or Closed tickets can be reopened. Current status: ${ticket.status}`);
    }

    const isDealer = user.role === ROLES.DEALER;
    const senderName = isDealer
      ? (dealerIdentity?.businessName || user.name)
      : (ticket.customerSnapshot?.name || user.name);
    const reopenReason = (reason || 'Issue persists, reopening ticket.').trim();

    ticket.status = 'Open';
    ticket.statusHistory.push({
      status: 'Open',
      changedBy: user.id,
      changedByName: senderName,
      changedByRole: isDealer ? 'dealer' : 'customer',
      reason: reopenReason,
      timestamp: new Date()
    });

    ticket.messages.push({
      sender: user.id,
      senderModel: isDealer ? 'Dealer' : 'User',
      senderName,
      senderRole: isDealer ? 'dealer' : 'customer',
      text: `[TICKET REOPENED] Reason: ${reopenReason}`,
      attachments: [],
      timestamp: new Date()
    });

    await ticket.save();

    // 1. Notify Admin In-App
    const isCustomer = ticket.ticketType === 'customer';
    NotificationService.createNotification({
      sourceType: isDealer ? 'DEALER' : 'CUSTOMER',
      sourceId: user.id,
      sourceName: senderName,
      category: isDealer ? 'DEALER_COMPLAINT' : 'CUSTOMER_DISPUTE',
      priority: 'NORMAL',
      title: `Ticket #${ticket.ticketId} Reopened`,
      message: `${senderName} reopened ticket: "${ticket.subject}". Reason: ${reopenReason}`,
      entityType: 'Complaint',
      entityId: ticket.ticketId,
      actionUrl: isCustomer ? '/admin/customer-support' : '/admin/support'
    }).catch((err) => console.error('Admin in-app notification error:', err.message));

    // 2. Notify Admin via Email
    sendTicketReplyNotification({
      to: '',
      recipientName: 'Platform Operations Admin',
      ticketId: ticket.ticketId,
      ticketSubject: ticket.subject,
      replySenderName: senderName,
      messageText: `[TICKET REOPENED] Reason: ${reopenReason}`,
      isRecipientAdmin: true
    }).catch((err) => console.error('Admin email error:', err.message));

    return ticket;
  }

  /**
   * Super Admin Update Ticket Status & Add Internal Note
   */
<<<<<<< Updated upstream:backend/src/modules/complaints/complaint.service.js
  static async updateTicketStatus(ticketId, adminUser, status, note = '') {
=======
  static async updateTicketStatus(ticketId, adminUser, status, note = '', reason = '') {
>>>>>>> Stashed changes:src/modules/complaints/complaint.service.js
    const ticket = await Complaint.findOne({
      $or: [{ _id: ticketId.match(/^[0-9a-fA-F]{24}$/) ? ticketId : null }, { ticketId }]
    });

    if (!ticket) throw ApiError.notFound('Ticket not found.');

    const oldStatus = ticket.status;
    ticket.status = status;
<<<<<<< Updated upstream:backend/src/modules/complaints/complaint.service.js
    if (note) {
=======

    if (note && note.trim()) {
>>>>>>> Stashed changes:src/modules/complaints/complaint.service.js
      ticket.internalNotes.push({
        author: adminUser.id,
        note: note.trim(),
        timestamp: new Date()
      });
    }

<<<<<<< Updated upstream:backend/src/modules/complaints/complaint.service.js
    await ticket.save();
=======
    const statusNote = (reason || note || `Status updated to ${status}`).trim();
    ticket.statusHistory.push({
      status,
      changedBy: adminUser.id,
      changedByName: adminUser.name || 'Platform Admin',
      changedByRole: 'admin',
      reason: statusNote,
      timestamp: new Date()
    });

    await ticket.save();

    await AdminService.recordAuditLog({
      action: 'COMPLAINT_UPDATED',
      actor: adminUser.id,
      actorRole: adminUser.role,
      targetEntity: 'Complaint',
      targetId: ticket.ticketId,
      details: `Complaint status updated from ${oldStatus} to ${status}. Reason: ${statusNote}`,
      ipAddress: adminUser.ipAddress || '',
      userAgent: adminUser.userAgent || ''
    });

    // In-app & Email Notification to Requester (Customer or Dealer)
    if (ticket.ticketType === 'customer') {
      let notifType = 'TICKET_STATUS_CHANGED';
      if (status === 'Waiting for Customer') notifType = 'TICKET_INFO_REQUESTED';
      else if (status === 'Resolved') notifType = 'TICKET_RESOLVED';
      else if (status === 'Closed') notifType = 'TICKET_CLOSED';

      CustomerNotification.create({
        user: ticket.requester,
        type: notifType,
        ticketId: ticket.ticketId,
        title: `Ticket #${ticket.ticketId}: ${status}`,
        message: status === 'Waiting for Customer'
          ? `Admin requested additional details: "${statusNote}"`
          : `Status changed to ${status}. ${statusNote}`
      }).catch((err) => console.error('Customer notification error:', err.message));

      const customerEmail = ticket.customerSnapshot?.email || ticket.requesterEmail;
      const customerName = ticket.customerSnapshot?.name || ticket.requesterName;
      if (customerEmail) {
        sendTicketStatusNotification({
          to: customerEmail,
          dealerName: customerName,
          ticketId: ticket.ticketId,
          ticketSubject: ticket.subject,
          oldStatus,
          newStatus: status,
          reason: statusNote,
          note: note || ''
        }).catch((err) => console.error('Customer status email error:', err.message));
      }
    } else {
      const targetDealerId = ticket.concernedDealer || (ticket.requesterModel === 'Dealer' ? ticket.requester : null);
      if (targetDealerId) {
        let notifType = 'TICKET_STATUS_CHANGED';
        if (status === 'Waiting for Dealer') notifType = 'TICKET_INFO_REQUESTED';
        else if (status === 'Resolved') notifType = 'TICKET_RESOLVED';
        else if (status === 'Closed') notifType = 'TICKET_CLOSED';

        DealerNotification.create({
          dealer: targetDealerId,
          dealerCode: ticket.dealerSnapshot?.dealerCode || '',
          type: notifType,
          ticketId: ticket.ticketId,
          title: `Ticket #${ticket.ticketId}: ${status}`,
          message: status === 'Waiting for Dealer'
            ? `Admin requested additional details: "${statusNote}"`
            : `Status changed to ${status}. ${statusNote}`
        }).catch((err) => console.error('Dealer notification error:', err.message));
      }

      const dealerEmail = ticket.dealerSnapshot?.email || ticket.requesterEmail;
      const dealerName = ticket.dealerSnapshot?.businessName || ticket.requesterName;
      if (dealerEmail) {
        sendTicketStatusNotification({
          to: dealerEmail,
          dealerName,
          ticketId: ticket.ticketId,
          ticketSubject: ticket.subject,
          oldStatus,
          newStatus: status,
          reason: statusNote,
          note: note || ''
        }).catch((err) => console.error('Dealer status email error:', err.message));
      }
    }

    return ticket;
  }

  /**
   * Super Admin Post Reply / Request Info with optional status update & attachments
   */
  static async addAdminReply(ticketId, adminUser, text, internalNote = false, status = null, attachments = []) {
    const ticket = await Complaint.findOne({
      $or: [{ _id: ticketId.match(/^[0-9a-fA-F]{24}$/) ? ticketId : null }, { ticketId }]
    });
    if (!ticket) throw ApiError.notFound('Support ticket not found.');

    const formattedAttachments = Array.isArray(attachments) ? attachments : [];

    if (internalNote) {
      ticket.internalNotes.push({
        author: adminUser.id,
        note: text.trim(),
        timestamp: new Date()
      });
    } else {
      ticket.messages.push({
        sender: adminUser.id,
        senderModel: 'User',
        senderName: adminUser.name || 'GROVE Platform Operations',
        senderRole: 'admin',
        text: text.trim(),
        attachments: formattedAttachments,
        timestamp: new Date()
      });

      const oldStatus = ticket.status;
      if (status) {
        ticket.status = status;
        ticket.statusHistory.push({
          status,
          changedBy: adminUser.id,
          changedByName: adminUser.name || 'Platform Admin',
          changedByRole: 'admin',
          reason: `Admin reply with status update to ${status}`,
          timestamp: new Date()
        });
      } else if (ticket.status === 'Open') {
        ticket.status = 'In Progress';
        ticket.statusHistory.push({
          status: 'In Progress',
          changedBy: adminUser.id,
          changedByName: adminUser.name || 'Platform Admin',
          changedByRole: 'admin',
          reason: 'Admin replied to open ticket',
          timestamp: new Date()
        });
      }

      // In-app & Email Notification to Requester (Customer or Dealer)
      if (ticket.ticketType === 'customer') {
        CustomerNotification.create({
          user: ticket.requester,
          type: status === 'Waiting for Customer' ? 'TICKET_INFO_REQUESTED' : 'TICKET_REPLY_RECEIVED',
          ticketId: ticket.ticketId,
          title: `Reply on Ticket #${ticket.ticketId}`,
          message: `GROVE Operations has posted a reply on your ticket: "${ticket.subject}"`
        }).catch((err) => console.error('Customer notification error:', err.message));

        const customerEmail = ticket.customerSnapshot?.email || ticket.requesterEmail;
        const customerName = ticket.customerSnapshot?.name || ticket.requesterName;
        if (customerEmail) {
          sendTicketReplyNotification({
            to: customerEmail,
            recipientName: customerName,
            ticketId: ticket.ticketId,
            ticketSubject: ticket.subject,
            replySenderName: 'GROVE Platform Operations',
            messageText: text.trim(),
            isRecipientAdmin: false
          }).catch((err) => console.error('Customer email error:', err.message));

          if (status && status !== oldStatus) {
            sendTicketStatusNotification({
              to: customerEmail,
              dealerName: customerName,
              ticketId: ticket.ticketId,
              ticketSubject: ticket.subject,
              oldStatus,
              newStatus: status,
              reason: `Admin reply: ${text.trim().slice(0, 100)}...`
            }).catch((err) => console.error('Customer status change email error:', err.message));
          }
        }
      } else {
        const targetDealerId = ticket.concernedDealer || (ticket.requesterModel === 'Dealer' ? ticket.requester : null);
        if (targetDealerId) {
          DealerNotification.create({
            dealer: targetDealerId,
            dealerCode: ticket.dealerSnapshot?.dealerCode || '',
            type: status === 'Waiting for Dealer' ? 'TICKET_INFO_REQUESTED' : 'TICKET_REPLY_RECEIVED',
            ticketId: ticket.ticketId,
            title: `Reply on Ticket #${ticket.ticketId}`,
            message: `GROVE Operations has posted a reply on your ticket: "${ticket.subject}"`
          }).catch((err) => console.error('Dealer notification error:', err.message));
        }

        const dealerEmail = ticket.dealerSnapshot?.email || ticket.requesterEmail;
        const dealerName = ticket.dealerSnapshot?.businessName || ticket.requesterName;
        if (dealerEmail) {
          sendTicketReplyNotification({
            to: dealerEmail,
            recipientName: dealerName,
            ticketId: ticket.ticketId,
            ticketSubject: ticket.subject,
            replySenderName: 'GROVE Platform Operations',
            messageText: text.trim(),
            isRecipientAdmin: false
          }).catch((err) => console.error('Dealer email error:', err.message));

          if (status && status !== oldStatus) {
            sendTicketStatusNotification({
              to: dealerEmail,
              dealerName,
              ticketId: ticket.ticketId,
              ticketSubject: ticket.subject,
              oldStatus,
              newStatus: status,
              reason: `Admin reply: ${text.trim().slice(0, 100)}...`
            }).catch((err) => console.error('Dealer status change email error:', err.message));
          }
        }
      }
    }

    await ticket.save();

    await AdminService.recordAuditLog({
      action: internalNote ? 'COMPLAINT_INTERNAL_NOTE_ADDED' : 'COMPLAINT_REPLIED',
      actor: adminUser.id,
      actorRole: adminUser.role,
      targetEntity: 'Complaint',
      targetId: ticket.ticketId,
      details: internalNote
        ? 'Added an internal complaint note.'
        : `Sent a complaint response${status ? ` and updated status to ${status}` : ''}.`,
      ipAddress: adminUser.ipAddress || '',
      userAgent: adminUser.userAgent || ''
    });

>>>>>>> Stashed changes:src/modules/complaints/complaint.service.js
    return ticket;
  }

  /**
   * Get Current User/Dealer Tickets
   */
  static async getMyTickets(userId, dealerId = null) {
    const conditions = [{ requester: userId }];
    if (dealerId) {
      conditions.push({ concernedDealer: dealerId });
      conditions.push({ requester: dealerId });
      conditions.push({ 'dealerSnapshot.dealerId': dealerId });
    }

    return await Complaint.find({ $or: conditions }).sort({ updatedAt: -1 }).lean();
  }

  /**
   * Super Admin Get All Tickets with Search & Category/Status Filtering
   */
  static async getAllTickets({ status = '', category = '', search = '', type = '', page = 1, limit = 50 }) {
    const query = {};
    if (status && status !== 'All') query.status = status;
    if (category && category !== 'All') query.category = category;
    if (type && type !== 'All') query.ticketType = type;

    if (search && search.trim()) {
      const term = search.trim();
      const regex = new RegExp(term, 'i');
      query.$or = [
        { ticketId: regex },
        { subject: regex },
        { requesterName: regex },
        { requesterEmail: regex },
        { orderNumber: regex },
        { 'dealerSnapshot.businessName': regex },
        { 'dealerSnapshot.ownerName': regex },
        { 'dealerSnapshot.dealerCode': regex },
        { 'customerSnapshot.name': regex },
        { 'customerSnapshot.email': regex },
        { 'customerSnapshot.phone': regex },
        { 'orderSnapshot.orderNumber': regex }
      ];
    }

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 50));
    const skip = (parsedPage - 1) * parsedLimit;

    const [tickets, total] = await Promise.all([
      Complaint.find(query).sort({ updatedAt: -1 }).skip(skip).limit(parsedLimit).lean(),
      Complaint.countDocuments(query)
    ]);

    return {
      tickets,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        pages: Math.ceil(total / parsedLimit)
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

    const isAdmin = user.role === ROLES.SUPER_ADMIN;
    const isRequester = ticket.requester.toString() === user.id.toString();
    const isConcernedDealer =
      dealerIdentity &&
      (ticket.concernedDealer?.toString() === dealerIdentity.id.toString() ||
        ticket.dealerSnapshot?.dealerId?.toString() === dealerIdentity.id.toString());

    if (!isAdmin && !isRequester && !isConcernedDealer) {
      throw ApiError.forbidden('You do not have access to this ticket.');
    }

    // Hide internal notes from non-admin users
    if (!isAdmin) {
      delete ticket.internalNotes;
    }

    return ticket;
  }

  /**
   * Get In-App Notifications for Dealer
   */
  static async getDealerNotifications(dealerId) {
    if (!dealerId) return [];
    return await DealerNotification.find({ dealer: dealerId })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();
  }

  /**
   * Mark Dealer In-App Notification as Read
   */
  static async markDealerNotificationRead(notificationId, dealerId) {
    return await DealerNotification.findOneAndUpdate(
      { _id: notificationId, dealer: dealerId },
      { isRead: true },
      { new: true }
    ).lean();
  }

  /**
   * Get In-App Notifications for Customer
   */
  static async getCustomerNotifications(userId) {
    if (!userId) return [];
    return await CustomerNotification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();
  }

  /**
   * Mark Customer In-App Notification as Read
   */
  static async markCustomerNotificationRead(notificationId, userId) {
    return await CustomerNotification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { isRead: true },
      { new: true }
    ).lean();
  }
}
