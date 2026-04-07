// lib/email/index.ts
import { Resend } from "resend"
import { render } from "@react-email/render"
import { InvitationEmail } from "./templates/invitation"
import { WelcomeEmail } from "./templates/welcome"
import { InvoiceEmail } from "./templates/invoice"
import { ResetPasswordEmail } from "./templates/reset-password"
import { TicketPurchaseEmail } from "./templates/ticket-purchase"
import { AccountSetupEmail } from "./templates/account-setup"

const resend = new Resend(process.env.RESEND_API_KEY)
const isDev = process.env.NODE_ENV === "development"
const forceSendEmails = process.env.FORCE_SEND_EMAILS === "true"
const FROM_EMAIL = "connect@theburnsbrothers.com"

// Generic sendEmail function
export async function sendEmail({
  to,
  subject,
  html,
  from = FROM_EMAIL,
}: {
  to: string
  subject: string
  html: string
  from?: string
}) {
  console.log("\n" + "=".repeat(60))
  console.log("📧 SENDING EMAIL")
  console.log("=".repeat(60))
  console.log(`From: ${from}`)
  console.log(`To: ${to}`)
  console.log(`Subject: ${subject}`)
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
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
    })

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

export async function sendInvitationEmail(
  email: string,
  organizationName: string,
  inviteToken: string
) {
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invitations/${inviteToken}`

  console.log("\n" + "=".repeat(60))
  console.log("📧 INVITATION EMAIL")
  console.log("=".repeat(60))
  console.log(`From: ${FROM_EMAIL}`)
  console.log(`To: ${email}`)
  console.log(`Organization: ${organizationName}`)
  console.log(`Invite Token: ${inviteToken}`)
  console.log(`Accept Link: ${inviteUrl}`)
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
    const html = await render(InvitationEmail({ organizationName, inviteUrl }))
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Invitation to join ${organizationName}`,
      html: html,
    })

    if (error) {
      console.error("❌ Resend error:", error)
      return { error: error.message, logged: true }
    }

    console.log(`✅ Email sent to ${email}:`, data)
    return { success: true, data }
  } catch (error) {
    console.error("❌ Failed to send email:", error)
    console.log(`📋 Invitation link for ${email}: ${inviteUrl}`)
    return { error: "Email failed but invitation created", inviteUrl, logged: true }
  }
}

export async function sendAccountSetupEmail(
  email: string,
  name: string,
  organizationName: string,
  inviteToken: string
) {
  const setupUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/setup-account?token=${inviteToken}&email=${encodeURIComponent(email)}`

  console.log("\n" + "=".repeat(60))
  console.log("📧 ACCOUNT SETUP EMAIL")
  console.log("=".repeat(60))
  console.log(`From: ${FROM_EMAIL}`)
  console.log(`To: ${email}`)
  console.log(`Organization: ${organizationName}`)
  console.log(`Setup Link: ${setupUrl}`)
  console.log("=".repeat(60) + "\n")

  if (isDev && !forceSendEmails) {
    console.log("✅ Email logged (development mode - no email sent)")
    return { success: true, logged: true }
  }

  if (!process.env.RESEND_API_KEY) {
    console.log("❌ RESEND_API_KEY not configured. Email not sent.")
    console.log(`📋 Account setup link for ${email}: ${setupUrl}`)
    return { error: "No API key configured", logged: true }
  }

  try {
    const html = await render(AccountSetupEmail({ name, organizationName, setupUrl }))
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Complete your ${organizationName} membership setup`,
      html: html,
    })

    if (error) {
      console.error("❌ Resend error:", error)
      return { error: error.message }
    }

    console.log(`✅ Account setup email sent to ${email}`)
    return { success: true, data }
  } catch (error) {
    console.error("❌ Failed to send account setup email:", error)
    return { error: "Failed to send email" }
  }
}

export async function sendWelcomeEmail(email: string, name: string) {
  if (isDev && !forceSendEmails) {
    console.log(`📧 WELCOME EMAIL (logged) - From: ${FROM_EMAIL}, To: ${email}, Name: ${name}`)
    return { success: true, logged: true }
  }

  if (!process.env.RESEND_API_KEY) {
    console.log("❌ RESEND_API_KEY not configured. Welcome email not sent.")
    return { error: "No API key configured" }
  }

  try {
    const html = await render(WelcomeEmail({ name }))
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Welcome to MembersHome!",
      html: html,
    })

    if (error) {
      console.error("❌ Resend error:", error)
      return { error: error.message }
    }

    console.log(`✅ Welcome email sent to ${email}`)
    return { success: true, data }
  } catch (error) {
    console.error("❌ Failed to send welcome email:", error)
    return { error: "Failed to send welcome email" }
  }
}

export async function sendInvoiceEmail(
  email: string,
  invoiceNumber: string,
  amount: number,
  dueDate: Date,
  invoiceUrl: string
) {
  if (isDev && !forceSendEmails) {
    console.log(`📧 INVOICE EMAIL (logged) - To: ${email}, Invoice: ${invoiceNumber}, Amount: $${amount}`)
    return { success: true, logged: true }
  }

  if (!process.env.RESEND_API_KEY) {
    console.log("❌ RESEND_API_KEY not configured. Invoice email not sent.")
    return { error: "No API key configured" }
  }

  try {
    const html = await render(InvoiceEmail({ invoiceNumber, amount, dueDate, invoiceUrl }))
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Invoice ${invoiceNumber} from MembersHome`,
      html: html,
    })

    if (error) {
      console.error("❌ Resend error:", error)
      return { error: error.message }
    }

    console.log(`✅ Invoice email sent to ${email}`)
    return { success: true, data }
  } catch (error) {
    console.error("❌ Failed to send invoice email:", error)
    return { error: "Failed to send invoice email" }
  }
}

export async function sendResetPasswordEmail(email: string, resetToken: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`

  if (isDev && !forceSendEmails) {
    console.log(`📧 RESET PASSWORD EMAIL (logged) - To: ${email}, Link: ${resetUrl}`)
    return { success: true, logged: true }
  }

  if (!process.env.RESEND_API_KEY) {
    console.log("❌ RESEND_API_KEY not configured. Reset password email not sent.")
    return { error: "No API key configured" }
  }

  try {
    const html = await render(ResetPasswordEmail({ resetUrl }))
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Reset your password",
      html: html,
    })

    if (error) {
      console.error("❌ Resend error:", error)
      return { error: error.message }
    }

    console.log(`✅ Reset password email sent to ${email}`)
    return { success: true, data }
  } catch (error) {
    console.error("❌ Failed to send reset password email:", error)
    return { error: "Failed to send reset password email" }
  }
}

export async function sendTicketPurchaseEmail(
  email: string,
  ticketName: string,
  quantity: number,
  totalAmount: number,
  ticketCodes: string[],
  eventName?: string,
  eventDate?: Date,
  ticketUrl?: string
) {
  if (isDev && !forceSendEmails) {
    console.log(`📧 TICKET PURCHASE EMAIL (logged) - To: ${email}, Ticket: ${ticketName} x${quantity}, Total: $${totalAmount}`)
    return { success: true, logged: true }
  }

  if (!process.env.RESEND_API_KEY) {
    console.log("❌ RESEND_API_KEY not configured. Ticket email not sent.")
    return { error: "No API key configured" }
  }

  try {
    const html = await render(TicketPurchaseEmail({
      ticketName,
      quantity,
      totalAmount,
      ticketCodes,
      eventName,
      eventDate,
      ticketUrl,
    }))
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Your ticket${quantity > 1 ? "s" : ""} for ${ticketName}`,
      html: html,
    })

    if (error) {
      console.error("❌ Resend error:", error)
      return { error: error.message }
    }

    console.log(`✅ Ticket purchase email sent to ${email}`)
    return { success: true, data }
  } catch (error) {
    console.error("❌ Failed to send ticket purchase email:", error)
    return { error: "Failed to send ticket purchase email" }
  }
}