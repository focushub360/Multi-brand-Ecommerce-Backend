import { Router } from 'express';
import * as complaintController from './complaint.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { ROLES } from '../../constants/roles.js';
import {
  createTicketSchema,
  replyTicketSchema,
  updateTicketStatusSchema
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
 * Customer & Dealer Ticket Operations
 */
router.post('/', validate(createTicketSchema), complaintController.createTicket);
router.get('/my-tickets', complaintController.getMyTickets);
router.get('/:ticketId', complaintController.getTicketById);
router.post('/:ticketId/messages', validate(replyTicketSchema), complaintController.replyToTicket);

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

export default router;

