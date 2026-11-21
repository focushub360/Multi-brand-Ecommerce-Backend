import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email address is required' })
      .trim()
      .email('Please enter a valid email address'),
    password: z
      .string({ required_error: 'Password is required' })
      .min(1, 'Password cannot be blank')
  })
});

export const registerSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Full name is required' })
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name cannot exceed 100 characters'),
    email: z
      .string({ required_error: 'Email address is required' })
      .trim()
      .email('Please enter a valid email address'),
    phone: z
      .string()
      .trim()
      .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number')
      .optional()
      .or(z.literal('')),
    password: z
      .string({ required_error: 'Password is required' })
      .min(6, 'Password must be at least 6 characters long')
  })
});

export const passwordStrengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?`~]).{8,}$/;

export const passwordRule = z
  .string({ required_error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter (A-Z)')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter (a-z)')
  .regex(/\d/, 'Password must contain at least one digit (0-9)')
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?`~]/, 'Password must contain at least one special character');

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string({ required_error: 'Current password is required' }),
    newPassword: passwordRule,
    confirmPassword: z.string().optional()
  }).refine((data) => !data.confirmPassword || data.newPassword === data.confirmPassword, {
    message: 'New password and confirm password must match',
    path: ['confirmPassword']
  }).refine((data) => data.newPassword !== data.currentPassword, {
    message: 'New password cannot be identical to your current password',
    path: ['newPassword']
  })
});

export const firstTimePasswordSchema = z.object({
  body: z.object({
    newPassword: passwordRule,
    confirmPassword: z.string({ required_error: 'Please confirm your new password' })
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New password and confirm password must match',
    path: ['confirmPassword']
  })
});

export const initialSetupPasswordSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .email('Please enter a valid email address'),
    temporaryPassword: z
      .string({ required_error: 'Temporary password is required' })
      .length(12, 'Temporary password must be exactly 12 characters'),
    newPassword: z
      .string({ required_error: 'New password is required' })
      .min(8, 'New password must be at least 8 characters long')
  })
});

