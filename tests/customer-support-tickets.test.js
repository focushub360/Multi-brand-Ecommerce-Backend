import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComplaintService } from '../src/modules/complaints/complaint.service.js';
import {
  Complaint,
  CUSTOMER_TICKET_CATEGORIES,
  CUSTOMER_TICKET_STATUSES
} from '../src/modules/complaints/complaint.model.js';
import { User } from '../src/modules/users/user.model.js';
import { Order } from '../src/modules/orders/order.model.js';
import { Address } from '../src/modules/addresses/address.model.js';
import { CustomerNotification } from '../src/modules/complaints/customerNotification.model.js';
import { AdminService } from '../src/modules/admin/admin.service.js';
import { NotificationService } from '../src/modules/admin/service/notification.service.js';
import * as sendEmailModule from '../src/utils/sendEmail.js';
import { ROLES } from '../src/constants/roles.js';

describe('Customer Support Ticket System - Unit & Integration Verification', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(AdminService, 'recordAuditLog').mockResolvedValue(true);
  });

  describe('Validation & Constants Integrity', () => {
    it('should enforce exact 9 customer categories', () => {
      expect(CUSTOMER_TICKET_CATEGORIES).toEqual([
        'Account & Login Issues',
        'Product & Catalog Issues',
        'Cart & Wishlist Issues',
        'Order-Related Issues',
        'Payment & Refund Issues',
        'Delivery & Tracking Issues',
        'Address & Location Issues',
        'Technical Issues',
        'Other / General'
      ]);
    });

    it('should enforce exact 6 customer ticket statuses', () => {
      expect(CUSTOMER_TICKET_STATUSES).toEqual([
        'Open',
        'Under Review',
        'In Progress',
        'Waiting for Customer',
        'Resolved',
        'Closed'
      ]);
    });
  });

  describe('Customer Ticket Creation & Order Validation', () => {
    it('creates ticket with customer snapshot and validated order snapshot (no priority)', async () => {
      const mockUser = {
        _id: '6740a1b2c3d4e5f6a1b2c3d1',
        name: 'Ravi Kumar',
        email: 'ravi@example.com',
        phone: '+91 9123456789'
      };

      const mockOrder = {
        _id: '6740a1b2c3d4e5f6a1b2c3d9',
        orderNumber: 'GRV-987654',
        customer: '6740a1b2c3d4e5f6a1b2c3d1',
        totalAmount: 1499,
        pricing: { total: 1499 },
        orderStatus: 'Shipped',
        items: [{ product: 'prod_1', quantity: 1 }],
        createdAt: new Date('2026-11-15')
      };

      vi.spyOn(User, 'findById').mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockUser)
      });

      vi.spyOn(Address, 'findOne').mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          line1: '45 Green Avenue',
          city: 'Bangalore',
          state: 'Karnataka',
          postalCode: '560001'
        })
      });

      vi.spyOn(Order, 'findOne').mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockOrder)
      });

      vi.spyOn(Complaint.prototype, 'save').mockImplementation(function () {
        return Promise.resolve(this);
      });

      const createNotifSpy = vi.spyOn(NotificationService, 'createNotification').mockResolvedValue({});
      const emailSpy = vi.spyOn(sendEmailModule, 'sendTicketCreatedNotification').mockResolvedValue({ success: true });

      const customerUser = {
        id: '6740a1b2c3d4e5f6a1b2c3d1',
        name: 'Ravi Kumar',
        email: 'ravi@example.com',
        role: ROLES.USER
      };

      const payload = {
        subject: 'Shipment delayed for 4 days',
        category: 'Delivery & Tracking Issues',
        description: 'The tracking number has not updated since 15th Nov.',
        orderNumber: 'GRV-987654',
        attachments: [
          {
            name: 'tracking_screenshot.png',
            type: 'image/png',
            size: 2048,
            url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA'
          }
        ]
      };

      const ticket = await ComplaintService.createTicket(customerUser, null, payload);

      expect(ticket).toBeDefined();
      expect(ticket.ticketType).toBe('customer');
      expect(ticket.ticketId).toMatch(/^TCK-\d+$/);
      expect(ticket.status).toBe('Open');
      expect(ticket.category).toBe('Delivery & Tracking Issues');
      expect(ticket.priority).toBeUndefined(); // Priority must not exist
      expect(ticket.customerSnapshot).toBeDefined();
      expect(ticket.customerSnapshot.name).toBe('Ravi Kumar');
      expect(ticket.customerSnapshot.email).toBe('ravi@example.com');
      expect(ticket.orderSnapshot).toBeDefined();
      expect(ticket.orderSnapshot.orderNumber).toBe('GRV-987654');
      expect(ticket.orderSnapshot.totalAmount).toBe(1499);
      expect(ticket.orderSnapshot.orderStatus).toBe('Shipped');
      expect(ticket.attachments.length).toBe(1);
      expect(ticket.messages.length).toBe(1);

      expect(createNotifSpy).toHaveBeenCalled();
      expect(emailSpy).toHaveBeenCalled();
    });

    it('rejects ticket creation when Order ID does not belong to authenticated customer', async () => {
      vi.spyOn(User, 'findById').mockReturnValue({
        lean: vi.fn().mockResolvedValue({ name: 'Ravi Kumar', email: 'ravi@example.com' })
      });
      vi.spyOn(Address, 'findOne').mockReturnValue({
        lean: vi.fn().mockResolvedValue(null)
      });
      // Order not found for this customer
      vi.spyOn(Order, 'findOne').mockReturnValue({
        lean: vi.fn().mockResolvedValue(null)
      });

      const customerUser = {
        id: '6740a1b2c3d4e5f6a1b2c3d1',
        name: 'Ravi Kumar',
        role: ROLES.USER
      };

      const payload = {
        subject: 'Wrong item received',
        category: 'Order-Related Issues',
        description: 'Received wrong items.',
        orderNumber: 'GRV-UNKNOWN-999'
      };

      await expect(
        ComplaintService.createTicket(customerUser, null, payload)
      ).rejects.toThrow("Order 'GRV-UNKNOWN-999' was not found in your account.");
    });
  });

  describe('Customer Status Updates & In-App Notification', () => {
    it('updates customer ticket to Waiting for Customer and notifies customer in-app & email', async () => {
      const mockTicket = {
        _id: '6740a1b2c3d4e5f6a1b2c3d5',
        ticketId: 'TCK-8811',
        ticketType: 'customer',
        status: 'In Progress',
        subject: 'Payment deducted twice',
        requester: '6740a1b2c3d4e5f6a1b2c3d1',
        requesterModel: 'User',
        customerSnapshot: {
          name: 'Ravi Kumar',
          email: 'ravi@example.com'
        },
        internalNotes: [],
        statusHistory: [],
        save: vi.fn().mockResolvedValue(true)
      };

      vi.spyOn(Complaint, 'findOne').mockResolvedValue(mockTicket);
      const customerNotifSpy = vi.spyOn(CustomerNotification, 'create').mockResolvedValue({});
      const emailSpy = vi.spyOn(sendEmailModule, 'sendTicketStatusNotification').mockResolvedValue({ success: true });

      const adminUser = {
        id: '6740a1b2c3d4e5f6a1b2c3d9',
        name: 'Platform Operations Lead',
        role: ROLES.SUPER_ADMIN
      };

      const updated = await ComplaintService.updateTicketStatus(
        'TCK-8811',
        adminUser,
        'Waiting for Customer',
        'Please share bank UTR number for the second transaction',
        'Need bank statement / UTR'
      );

      expect(updated.status).toBe('Waiting for Customer');
      expect(customerNotifSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'TICKET_INFO_REQUESTED',
          ticketId: 'TCK-8811'
        })
      );
      expect(emailSpy).toHaveBeenCalled();
    });
  });

  describe('Customer Ticket Reopening', () => {
    it('allows customer to reopen Resolved ticket to Open with reason', async () => {
      const mockTicket = {
        _id: '6740a1b2c3d4e5f6a1b2c3d5',
        ticketId: 'TCK-8811',
        ticketType: 'customer',
        status: 'Resolved',
        subject: 'Product arrived with broken seal',
        requester: '6740a1b2c3d4e5f6a1b2c3d1',
        customerSnapshot: { name: 'Ravi Kumar' },
        statusHistory: [],
        messages: [],
        save: vi.fn().mockResolvedValue(true)
      };

      vi.spyOn(Complaint, 'findOne').mockResolvedValue(mockTicket);
      const adminNotifSpy = vi.spyOn(NotificationService, 'createNotification').mockResolvedValue({});
      const emailSpy = vi.spyOn(sendEmailModule, 'sendTicketReplyNotification').mockResolvedValue({ success: true });

      const customerUser = {
        id: '6740a1b2c3d4e5f6a1b2c3d1',
        name: 'Ravi Kumar',
        role: ROLES.USER
      };

      const reopened = await ComplaintService.reopenTicket(
        'TCK-8811',
        customerUser,
        null,
        'Replacement product also arrived damaged'
      );

      expect(reopened.status).toBe('Open');
      expect(reopened.statusHistory[0].status).toBe('Open');
      expect(reopened.statusHistory[0].changedByRole).toBe('customer');
      expect(reopened.messages[0].text).toContain('[TICKET REOPENED]');
      expect(adminNotifSpy).toHaveBeenCalled();
      expect(emailSpy).toHaveBeenCalled();
    });
  });
});
