import { z } from 'zod';
import { TICKET_CATEGORIES, TICKET_STATUSES } from './complaint.model.js';

const attachmentSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  size: z.number().optional().default(0),
  url: z.string().min(1)
});

export const createTicketSchema = z.object({
  body: z.object({
    subject: z.string({ required_error: 'Subject is required' }).trim().min(3),
    category: z.enum(TICKET_CATEGORIES, {
      errorMap: () => ({ message: 'Please select a valid category from the list.' })
    }),
    description: z.string().trim().min(3).optional(),
    message: z.string().trim().min(3).optional(),
    concernedDealer: z.string().optional(),
    orderNumber: z.string().optional(),
    attachments: z.array(attachmentSchema).optional().default([])
  }).refine((data) => Boolean(data.description || data.message), {
    message: 'Detailed description is required',
    path: ['description']
  })
});

export const replyTicketSchema = z.object({
  body: z.object({
    text: z.string({ required_error: 'Message content is required' }).trim().min(1),
    attachments: z.array(attachmentSchema).optional().default([])
  })
});

export const updateTicketStatusSchema = z.object({
  body: z.object({
    status: z.enum(TICKET_STATUSES, {
      errorMap: () => ({ message: 'Please select a valid ticket status.' })
    }),
    note: z.string().trim().max(2000).optional(),
    reason: z.string().trim().max(1000).optional()
  }).strict()
});

export const adminReplySchema = z.object({
  body: z.object({
    text: z.string().trim().min(1).max(4000),
    internalNote: z.boolean().default(false),
    status: z.enum(TICKET_STATUSES).optional(),
    attachments: z.array(attachmentSchema).optional().default([])
  }).strict()
});

export const reopenTicketSchema = z.object({
  body: z.object({
    reason: z.string().trim().max(2000).optional().default('Issue persists, reopening ticket.')
  })
});
