import { Resend } from "resend"
import { render } from "@react-email/render"

import { VerificationEmail } from "./templates/verification"
import { PasswordResetEmail } from "./templates/password-reset"
import { InviteEmail } from "./templates/invite"
import { OrgOwnerInvitationEmail } from "./templates/org-owner-invitation"
import { MemberInvitationEmail } from "./templates/member-invitation"
import { MembershipApprovedEmail } from "./templates/membership-approved"
import { MembershipRejectedEmail } from "./templates/membership-rejected"
import { EventReminderEmail } from "./templates/event-reminder"
import { PaymentReceiptEmail } from "./templates/payment-receipt"
import { CancellationConfirmationEmail } from "./templates/cancellation-confirmation"
import { AnnouncementEmail } from "./templates/announcement"

const resend = new Resend(process.env.RESEND_API_KEY)
const isDev = process.env.NODE_ENV === "development"
const forceSendEmails = process.env.FORCE_SEND_EMAILS === "true"

// Get email configuration from environment variables
const FROM_EMAIL = process.env.EMAIL_FROM || "membersHome <noreply@membershome.com>"
const REPLY_TO_EMAIL = process.env.EMAIL_REPLY_TO

export async function sendEmail({
  to,
  subject,
  html,
  from = FROM_EMAIL,
  replyTo = REPLY_TO_EMAIL,
}: {
  to: string
  subject: string
  html: string
  from?: string
  replyTo?: string
}) {
  console.log("\n" + "=".repeat(60))
  console.log("📧 SENDING EMAIL")
  console.log("=".repeat(60))
  console.log(`From: ${from}`)
  console.log(`To: ${to}`)
  console.log(`Subject: ${subject}`)
  if (replyTo) console.log(`Reply-To: ${replyTo}`)
  console.log("=".repeat(60) + "\n")

  if (isDev && !forceSendEmails) {
    console.log("✅ Email logged (development mode - no email sent)")
    return { success: true, logged: true }
  }

  if (!process.env.RESEND_API_KEY) {
    console.log("❌ RESEND_API_KEY not configured. Email not sent.")
    return { error: "No API key configured", logged: true }
  }

  try {
    const emailOptions: any = {
      from,
      to,
      subject,
      html,
    }
    
    if (replyTo) {
      emailOptions.replyTo = replyTo
    }
    
    const { data, error } = await resend.emails.send(emailOptions)

    if (error) {
      console.error("❌ Resend error:", error)
      return { error: error.message }
    }

    console.log(`✅ Email sent to ${to}`)
    return { success: true, data }
  } catch (error) {
    console.error("❌ Failed to send email:", error)
    return { error: "Failed to send email" }
  }
}

export async function sendVerificationEmail(email: string, verificationLink: string, name?: string) {
  const html = await render(VerificationEmail({ verificationLink, name }))
  return sendEmail({ to: email, subject: "Verify your email address", html })
}

export async function sendPasswordResetEmail(email: string, resetLink: string, name?: string) {
  const html = await render(PasswordResetEmail({ resetLink, name }))
  return sendEmail({ to: email, subject: "Reset your password", html })
}

export async function sendInviteEmail(email: string, name: string, organizationName: string, acceptLink: string, inviterName?: string) {
  const html = await render(InviteEmail({ name, organizationName, inviterName, acceptLink }))
  return sendEmail({ to: email, subject: `You're invited to join ${organizationName} on membersHome`, html })
}

export async function sendOrgOwnerInvitationEmail(
  email: string, 
  organizationName: string, 
  setupLink: string, 
  inviterName?: string
) {
  const html = await render(OrgOwnerInvitationEmail({ organizationName, inviterName, setupLink }))
  return sendEmail({ 
    to: email, 
    subject: `You're invited to own ${organizationName} on membersHome`, 
    html 
  })
}

export async function sendMemberInvitationEmail(
  email: string, 
  organizationName: string, 
  houseName: string, 
  acceptLink: string, 
  inviterName?: string
) {
  const html = await render(MemberInvitationEmail({ organizationName, houseName, inviterName, acceptLink }))
  return sendEmail({ to: email, subject: `You're invited to join ${organizationName}`, html })
}

export async function sendMembershipApprovedEmail(email: string, name: string, organizationName: string, houseName: string, portalLink: string) {
  const html = await render(MembershipApprovedEmail({ name, organizationName, houseName, portalLink }))
  return sendEmail({ to: email, subject: `Your membership to ${organizationName} has been approved!`, html })
}

export async function sendMembershipRejectedEmail(email: string, name: string, organizationName: string, contactLink: string, reason?: string) {
  const html = await render(MembershipRejectedEmail({ name, organizationName, reason, contactLink }))
  return sendEmail({ to: email, subject: `Update on your membership application to ${organizationName}`, html })
}

export async function sendEventReminderEmail(email: string, name: string, eventName: string, eventDate: string, eventTime: string, eventLocation: string, daysUntil: number, ticketLink?: string) {
  const html = await render(EventReminderEmail({ name, eventName, eventDate, eventTime, eventLocation, daysUntil, ticketLink }))
  return sendEmail({ to: email, subject: `Reminder: ${eventName} is ${daysUntil === 0 ? 'today' : `in ${daysUntil} days`}`, html })
}

export async function sendPaymentReceiptEmail(email: string, name: string, amount: number, currency: string, paymentDate: string, description: string, transactionId: string, receiptUrl: string) {
  const html = await render(PaymentReceiptEmail({ name, amount, currency, paymentDate, description, transactionId, receiptUrl }))
  return sendEmail({ to: email, subject: "Payment receipt from membersHome", html })
}

export async function sendCancellationConfirmationEmail(email: string, name: string, organizationName: string, effectiveDate: string, reason: string, reactivateLink: string) {
  const html = await render(CancellationConfirmationEmail({ name, organizationName, effectiveDate, reason, reactivateLink }))
  return sendEmail({ to: email, subject: `Your membership to ${organizationName} has been cancelled`, html })
}

export async function sendAnnouncementEmail(email: string, name: string, organizationName: string, title: string, message: string, ctaLink?: string, ctaText?: string) {
  const html = await render(AnnouncementEmail({ name, organizationName, title, message, ctaLink, ctaText }))
  return sendEmail({ to: email, subject: `Announcement from ${organizationName}: ${title}`, html })
}