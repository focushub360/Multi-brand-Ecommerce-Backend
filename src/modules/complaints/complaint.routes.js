import { Router } from 'express';
import * as complaintController from './complaint.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { ROLES } from '../../constants/roles.js';
import {
  createTicketSchema,
  replyTicketSchema,
  updateTicketStatusSchema,
  adminReplySchema,
  reopenTicketSchema
} from './complaint.validation.js';

const router = Router();

router.use(authenticate);

/**
 * Universal Tickets Listing (Role-based)
 */
router.get('/', (req, res, next) => {
  if (req.user?.role === ROLES.SUPER_ADMIN) {
    return complaintController.getAllTickets(req, res, next);
  }
  return complaintController.getMyTickets(req, res, next);
});

/**
 * In-App Notifications (MUST BE REGISTERED BEFORE /:ticketId)
 */
router.get('/dealer/notifications', complaintController.getDealerNotifications);
router.patch('/dealer/notifications/:id/read', complaintController.markDealerNotificationRead);

router.get('/customer/notifications', complaintController.getCustomerNotifications);
router.patch('/customer/notifications/:id/read', complaintController.markCustomerNotificationRead);

/**
 * Customer & Dealer Ticket Operations
 */
router.post('/', validate(createTicketSchema), complaintController.createTicket);
router.get('/my-tickets', complaintController.getMyTickets);
router.post('/:ticketId/reopen', validate(reopenTicketSchema), complaintController.reopenTicket);
router.post('/:ticketId/messages', validate(replyTicketSchema), complaintController.replyToTicket);
router.get('/:ticketId', complaintController.getTicketById);

/**
 * Super Admin Ticket Governance Endpoints
 */
router.get(
  '/admin/all',
  authorize(ROLES.SUPER_ADMIN),
  complaintController.getAllTickets
);

router.patch(
  '/admin/:ticketId/status',
  authorize(ROLES.SUPER_ADMIN),
  validate(updateTicketStatusSchema),
  complaintController.updateTicketStatus
);

router.post(
  '/admin/:ticketId/replies',
  authorize(ROLES.SUPER_ADMIN),
  validate(adminReplySchema),
  complaintController.addAdminReply
);

export default router;
