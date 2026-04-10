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
  | 'event-reminder'
  | 'announcement'
  | 'card-collection'      // NEW
  | 'payment-failed'