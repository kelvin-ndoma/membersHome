// lib/email/send.ts
import { resend, emailConfig, EmailTemplate } from './resend'
import { WelcomeEmail } from './templates/welcome'
import { InvitationEmail } from './templates/invitation'
import { AnnouncementEmail } from './templates/announcement'
import { ApplicationRejectedEmail } from './templates/application-rejected'
import { CardCollectionEmail } from './templates/card-collection'
import { PaymentFailedEmail } from './templates/payment-failed'
import { StaffInvitationEmail } from './templates/staff-invitation'
import { MemberInvitationEmail } from './templates/member-invitation'
import { ResetPasswordEmail } from './templates/reset-password'
import { VerifyEmail } from './templates/verify-email'
import { MembershipCancellationRequestedEmail } from './templates/membership-cancellation-requested'
import { MembershipCancellationAdminNotificationEmail } from './templates/membership-cancellation-admin-notification'
import { PaymentSuccessEmail } from './templates/payment-success'
import { PurchaseConfirmationEmail } from './templates/purchase-confirmation'
import { PurchaseFailedEmail } from './templates/purchase-failed'
import { createElement } from 'react'

interface SendEmailOptions {
  to: string
  template: EmailTemplate
  data: Record<string, any>
}

export async function sendEmail({ to, template, data }: SendEmailOptions) {
  // Map templates to components
  const templates: Record<EmailTemplate, React.ComponentType<any>> = {
    welcome: WelcomeEmail,
    'verify-email': VerifyEmail,
    'reset-password': ResetPasswordEmail,
    invitation: InvitationEmail,
    'application-received': WelcomeEmail,
    'application-approved': WelcomeEmail,
    'application-rejected': ApplicationRejectedEmail,
    'payment-receipt': WelcomeEmail,
    'payment-success': PaymentSuccessEmail,
    'payment-failed': PaymentFailedEmail,
    'event-reminder': WelcomeEmail,
    announcement: AnnouncementEmail,
    'card-collection': CardCollectionEmail,
    'staff-invitation': StaffInvitationEmail,
    'member-invitation': MemberInvitationEmail,
    'membership-cancellation-requested': MembershipCancellationRequestedEmail,
    'membership-cancelled': MembershipCancellationRequestedEmail,
    'membership-paused': MembershipCancellationRequestedEmail,
    'membership-resumed': MembershipCancellationRequestedEmail,
    'membership-cancellation-admin-notification': MembershipCancellationAdminNotificationEmail,
    'form-submission': AnnouncementEmail,
    'purchase-confirmation': PurchaseConfirmationEmail,
    'purchase-failed': PurchaseFailedEmail,
  }

  const EmailComponent = templates[template]
  
  if (!EmailComponent) {
    throw new Error(`Template ${template} not found`)
  }

  // Subjects
  const subjects: Record<EmailTemplate, string> = {
    welcome: 'Welcome to MembersHome - Verify Your Email',
    'verify-email': 'Verify Your Email Address',
    'reset-password': 'Reset Your Password',
    invitation: `You've been invited to join ${data.organizationName || 'MembersHome'}`,
    'application-received': 'Your Membership Application Has Been Received',
    'application-approved': 'Welcome! Your Membership Has Been Approved',
    'application-rejected': 'Update on Your Membership Application',
    'payment-receipt': 'Payment Receipt - MembersHome',
    'payment-success': 'Payment Successful - MembersHome',
    'payment-failed': `Payment Failed - Action Required for ${data.organizationName || 'Your Membership'}`,
    'event-reminder': `Reminder: ${data.eventName || 'Upcoming Event'}`,
    announcement: data.subject || 'Announcement from MembersHome',
    'card-collection': `Add Your Payment Method - ${data.organizationName || 'Membership Application'}`,
    'staff-invitation': `You've been invited to join ${data.organizationName || 'MembersHome'} as ${data.role || 'Staff'}`,
    'member-invitation': `You've been invited to join ${data.organizationName || 'MembersHome'}`,
    'membership-cancellation-requested': `Cancellation Request Received - ${data.organizationName || 'MembersHome'}`,
    'membership-cancelled': `Membership Cancelled - ${data.organizationName || 'MembersHome'}`,
    'membership-paused': `Membership Paused - ${data.organizationName || 'MembersHome'}`,
    'membership-resumed': `Membership Resumed - ${data.organizationName || 'MembersHome'}`,
    'membership-cancellation-admin-notification': `🚨 Cancellation Request: ${data.memberName || 'Member'} - ${data.organizationName || 'MembersHome'}`,
    'form-submission': `New Form Submission: ${data.formTitle || 'Form'}`,
    'purchase-confirmation': `Purchase Confirmation - ${data.productName || 'Your Order'}`,
    'purchase-failed': `Purchase Failed - ${data.productName || 'Your Order'}`,
  }

  try {
    const { data: response, error } = await resend.emails.send({
      from: emailConfig.from,
      to: [to],
      subject: subjects[template],
      reply_to: emailConfig.replyTo,
      react: createElement(EmailComponent, data),
    })

    if (error) {
      console.error('Failed to send email:', error)
      throw error
    }

    console.log(`Email sent successfully to ${to} with template ${template}`)
    return response
  } catch (error) {
    console.error('Email sending failed:', error)
    throw error
  }
}