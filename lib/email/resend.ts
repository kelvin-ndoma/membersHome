// lib/email/resend.ts
import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

export const emailConfig = {
  from: process.env.EMAIL_FROM || 'noreply@membershome.com',
  replyTo: process.env.EMAIL_REPLY_TO || 'support@membershome.com',
}

export type EmailTemplate = 
  | 'welcome'
  | 'verify-email'
  | 'reset-password'
  | 'invitation'
  | 'application-received'
  | 'application-approved'
  | 'application-rejected'
  | 'payment-receipt'
  | 'payment-success'
  | 'payment-failed'
  | 'event-reminder'
  | 'announcement'
  | 'card-collection'
  | 'staff-invitation'
  | 'member-invitation'
  | 'membership-cancellation-requested'
  | 'membership-cancelled'
  | 'membership-paused'
  | 'membership-resumed'
  | 'membership-cancellation-admin-notification'
  | 'form-submission'
  | 'purchase-confirmation'
  | 'purchase-failed'