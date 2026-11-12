import { z } from 'zod';

export const createTicketSchema = z.object({
  body: z.object({
    subject: z.string({ required_error: 'Subject is required' }).trim().min(5),
    category: z.enum(['Logistics & Courier', 'Billing & Tax', 'Product Defect', 'Account & KYC', 'General']),
    priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).optional(),
    message: z.string({ required_error: 'Initial message is required' }).trim().min(5),
    concernedDealer: z.string().optional(),
    orderNumber: z.string().optional()
  })
});

export const replyTicketSchema = z.object({
  body: z.object({
    text: z.string({ required_error: 'Message content is required' }).trim().min(1)
  })
});

export const updateTicketStatusSchema = z.object({
  body: z.object({
    status: z.enum(['Open', 'In Progress', 'Escalated', 'Resolved', 'Closed']),
    note: z.string().optional()
  })
});

