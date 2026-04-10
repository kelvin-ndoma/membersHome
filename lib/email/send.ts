// lib/email/send.ts
import { resend, emailConfig, EmailTemplate } from './resend'
import { WelcomeEmail } from './templates/welcome'
import { InvitationEmail } from './templates/invitation'
import { AnnouncementEmail } from './templates/announcement'
import { ApplicationRejectedEmail } from './templates/application-rejected'
import { CardCollectionEmail } from './templates/card-collection'
import { PaymentFailedEmail } from './templates/payment-failed'
import { createElement } from 'react'

interface SendEmailOptions {
  to: string
  template: EmailTemplate
  data: Record<string, any>
}

export async function sendEmail({ to, template, data }: SendEmailOptions) {
  // Map templates to components - COMPLETE WITH ALL TEMPLATES
  const templates: Record<EmailTemplate, React.ComponentType<any>> = {
    welcome: WelcomeEmail,
    'verify-email': WelcomeEmail,
    'reset-password': WelcomeEmail,
    invitation: InvitationEmail,
    'application-received': WelcomeEmail,
    'application-approved': WelcomeEmail,
    'application-rejected': ApplicationRejectedEmail,
    'payment-receipt': WelcomeEmail,
    'event-reminder': WelcomeEmail,
    announcement: AnnouncementEmail,
    'card-collection': CardCollectionEmail,
    'payment-failed': PaymentFailedEmail,
  }

  const EmailComponent = templates[template]
  
  if (!EmailComponent) {
    throw new Error(`Template ${template} not found`)
  }

  // Complete subjects object with ALL templates
  const subjects: Record<EmailTemplate, string> = {
    welcome: 'Welcome to MembersHome - Verify Your Email',
    'verify-email': 'Verify Your Email Address',
    'reset-password': 'Reset Your Password',
    invitation: `You've been invited to join ${data.organizationName || 'MembersHome'}`,
    'application-received': 'Your Membership Application Has Been Received',
    'application-approved': 'Welcome! Your Membership Has Been Approved',
    'application-rejected': 'Update on Your Membership Application',
    'payment-receipt': 'Payment Receipt - MembersHome',
    'event-reminder': `Reminder: ${data.eventName || 'Upcoming Event'}`,
    announcement: data.subject || 'Announcement from MembersHome',
    'card-collection': `Add Your Payment Method - ${data.organizationName || 'Membership Application'}`,
    'payment-failed': `Payment Failed - Action Required for ${data.organizationName || 'Your Membership'}`,
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