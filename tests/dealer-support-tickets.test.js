import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComplaintService } from '../src/modules/complaints/complaint.service.js';
import {
  Complaint,
  DEALER_TICKET_CATEGORIES,
  DEALER_TICKET_STATUSES
} from '../src/modules/complaints/complaint.model.js';
import { Dealer } from '../src/modules/dealers/dealer.model.js';
import { DealerNotification } from '../src/modules/complaints/dealerNotification.model.js';
import { AdminService } from '../src/modules/admin/admin.service.js';
import { NotificationService } from '../src/modules/admin/service/notification.service.js';
import * as sendEmailModule from '../src/utils/sendEmail.js';
import { ROLES } from '../src/constants/roles.js';

describe('Dealer Support Ticket System - Unit & Integration Verification', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(AdminService, 'recordAuditLog').mockResolvedValue(true);
  });

  describe('Validation & Constants Integrity', () => {
    it('should enforce exact 8 categories', () => {
      expect(DEALER_TICKET_CATEGORIES).toEqual([
        'Account & Verification',
        'Product & Catalog',
        'Inventory & Stock',
        'Orders & Delivery',
        'Payments & Settlements',
        'Store Settings',
        'Technical Issues',
        'Other / General'
      ]);
    });

    it('should enforce exact 6 ticket statuses', () => {
      expect(DEALER_TICKET_STATUSES).toEqual([
        'Open',
        'Under Review',
        'In Progress',
        'Waiting for Dealer',
        'Resolved',
        'Closed'
      ]);
    });
  });

  describe('Ticket Creation & Dealer Snapshot', () => {
    it('creates ticket with dealer snapshot and initial status Open (no priority)', async () => {
      const mockDealer = {
        _id: '6740a1b2c3d4e5f6a1b2c3d4',
        dealerCode: 'DEALER_001',
        businessName: 'Apex Machinery & Spares',
        ownerName: 'Harish Chandra',
        officialEmail: 'harish@apex.com',
        phone: '+91 9876543210',
        address: {
          line1: '12 Industrial Area',
          line2: 'Phase 2',
          city: 'Pune',
          state: 'Maharashtra',
          postalCode: '411001'
        }
      };

      vi.spyOn(Dealer, 'findById').mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockDealer)
      });

      let savedDoc = null;
      vi.spyOn(Complaint.prototype, 'save').mockImplementation(function () {
        savedDoc = this;
        return Promise.resolve(this);
      });

      const createNotifSpy = vi.spyOn(NotificationService, 'createNotification').mockResolvedValue({});
      const emailSpy = vi.spyOn(sendEmailModule, 'sendTicketCreatedNotification').mockResolvedValue({ success: true });

      const dealerUser = {
        id: '6740a1b2c3d4e5f6a1b2c3d4',
        name: 'Harish Chandra',
        email: 'harish@apex.com',
        role: ROLES.DEALER
      };

      const dealerIdentity = {
        id: '6740a1b2c3d4e5f6a1b2c3d4',
        dealerCode: 'DEALER_001',
        businessName: 'Apex Machinery & Spares'
      };

      const payload = {
        subject: 'Discrepancy in warehouse stock handover',
        category: 'Inventory & Stock',
        description: '5 units of SKU-AU-TEST-4230 missing from batch.',
        attachments: [
          {
            name: 'manifest.pdf',
            type: 'application/pdf',
            size: 1024,
            url: 'data:application/pdf;base64,JVBERi0xLjc='
          }
        ]
      };

      const ticket = await ComplaintService.createTicket(dealerUser, dealerIdentity, payload);

      expect(ticket).toBeDefined();
      expect(ticket.ticketId).toMatch(/^TCK-\d+$/);
      expect(ticket.status).toBe('Open');
      expect(ticket.category).toBe('Inventory & Stock');
      expect(ticket.priority).toBeUndefined(); // Priority must not exist
      expect(ticket.dealerSnapshot).toBeDefined();
      expect(ticket.dealerSnapshot.businessName).toBe('Apex Machinery & Spares');
      expect(ticket.dealerSnapshot.ownerName).toBe('Harish Chandra');
      expect(ticket.dealerSnapshot.dealerCode).toBe('DEALER_001');
      expect(ticket.dealerSnapshot.phone).toBe('+91 9876543210');
      expect(ticket.attachments.length).toBe(1);
      expect(ticket.attachments[0].name).toBe('manifest.pdf');
      expect(ticket.messages.length).toBe(1);
      expect(ticket.messages[0].text).toBe(payload.description);
      expect(ticket.messages[0].attachments.length).toBe(1);

      // Verify Admin Notification & Email dispatched
      expect(createNotifSpy).toHaveBeenCalled();
      expect(emailSpy).toHaveBeenCalled();
    });
  });

  describe('Ticket Status Updates & History Tracking', () => {
    it('updates ticket to Waiting for Dealer and notifies dealer in-app & email', async () => {
      const mockTicket = {
        _id: '6740a1b2c3d4e5f6a1b2c3d5',
        ticketId: 'TCK-5544',
        status: 'In Progress',
        subject: 'Invoice settlement mismatch',
        concernedDealer: '6740a1b2c3d4e5f6a1b2c3d4',
        requester: '6740a1b2c3d4e5f6a1b2c3d4',
        requesterModel: 'Dealer',
        dealerSnapshot: {
          dealerCode: 'DEALER_001',
          email: 'dealer@apex.com',
          businessName: 'Apex Machinery'
        },
        internalNotes: [],
        statusHistory: [],
        save: vi.fn().mockResolvedValue(true)
      };

      vi.spyOn(Complaint, 'findOne').mockResolvedValue(mockTicket);
      const dealerNotifSpy = vi.spyOn(DealerNotification, 'create').mockResolvedValue({});
      const emailSpy = vi.spyOn(sendEmailModule, 'sendTicketStatusNotification').mockResolvedValue({ success: true });

      const adminUser = {
        id: '6740a1b2c3d4e5f6a1b2c3d9',
        name: 'GROVE Admin',
        role: ROLES.SUPER_ADMIN
      };

      const updated = await ComplaintService.updateTicketStatus(
        'TCK-5544',
        adminUser,
        'Waiting for Dealer',
        'Need bank statement for verification',
        'Need bank statement for verification'
      );

      expect(updated.status).toBe('Waiting for Dealer');
      expect(updated.statusHistory.length).toBe(1);
      expect(updated.statusHistory[0].status).toBe('Waiting for Dealer');
      expect(updated.statusHistory[0].changedByRole).toBe('admin');
      expect(dealerNotifSpy).toHaveBeenCalled();
      expect(emailSpy).toHaveBeenCalled();
    });
  });

  describe('Ticket Reopening by Dealer', () => {
    it('reopens Resolved ticket to Open and notifies Admin', async () => {
      const mockTicket = {
        _id: '6740a1b2c3d4e5f6a1b2c3d5',
        ticketId: 'TCK-5544',
        status: 'Resolved',
        subject: 'Stock delivery issue',
        concernedDealer: '6740a1b2c3d4e5f6a1b2c3d4',
        requester: '6740a1b2c3d4e5f6a1b2c3d4',
        statusHistory: [],
        messages: [],
        save: vi.fn().mockResolvedValue(true)
      };

      vi.spyOn(Complaint, 'findOne').mockResolvedValue(mockTicket);
      const adminNotifSpy = vi.spyOn(NotificationService, 'createNotification').mockResolvedValue({});
      const emailSpy = vi.spyOn(sendEmailModule, 'sendTicketReplyNotification').mockResolvedValue({ success: true });

      const dealerUser = {
        id: '6740a1b2c3d4e5f6a1b2c3d4',
        name: 'Harish Chandra',
        role: ROLES.DEALER
      };

      const dealerIdentity = {
        id: '6740a1b2c3d4e5f6a1b2c3d4',
        businessName: 'Apex Machinery'
      };

      const reopened = await ComplaintService.reopenTicket(
        'TCK-5544',
        dealerUser,
        dealerIdentity,
        'Driver never delivered the remaining boxes'
      );

      expect(reopened.status).toBe('Open');
      expect(reopened.statusHistory.length).toBe(1);
      expect(reopened.statusHistory[0].status).toBe('Open');
      expect(reopened.statusHistory[0].changedByRole).toBe('dealer');
      expect(reopened.messages.length).toBe(1);
      expect(reopened.messages[0].text).toContain('[TICKET REOPENED]');
      expect(adminNotifSpy).toHaveBeenCalled();
      expect(emailSpy).toHaveBeenCalled();
    });

    it('rejects reopening if ticket is Open or In Progress', async () => {
      const mockTicket = {
        _id: '6740a1b2c3d4e5f6a1b2c3d5',
        ticketId: 'TCK-5544',
        status: 'In Progress',
        requester: '6740a1b2c3d4e5f6a1b2c3d4'
      };

      vi.spyOn(Complaint, 'findOne').mockResolvedValue(mockTicket);

      const dealerUser = {
        id: '6740a1b2c3d4e5f6a1b2c3d4',
        name: 'Harish Chandra',
        role: ROLES.DEALER
      };

      await expect(
        ComplaintService.reopenTicket('TCK-5544', dealerUser, null, 'Test reason')
      ).rejects.toThrow('Only Resolved or Closed tickets can be reopened');
    });
  });
});
