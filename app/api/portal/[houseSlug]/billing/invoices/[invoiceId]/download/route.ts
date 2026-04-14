// app/api/portal/[houseSlug]/billing/invoices/[invoiceId]/download/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { houseSlug: string; invoiceId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: params.invoiceId,
        houseMembership: {
          membership: { userId: session.user.id }
        }
      }
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Generate simple HTML invoice
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            .invoice { max-width: 800px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px; }
            .header { border-bottom: 2px solid #8B5CF6; padding-bottom: 20px; margin-bottom: 24px; }
            h1 { color: #1a1a1a; margin: 0; }
            .invoice-number { color: #6b7280; font-size: 14px; margin-top: 4px; }
            .details { margin-bottom: 32px; }
            .details p { margin: 4px 0; color: #374151; }
            .items { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
            .items th { background: #f9fafb; padding: 12px; text-align: left; font-size: 12px; color: #6b7280; border-bottom: 1px solid #e5e7eb; }
            .items td { padding: 12px; border-bottom: 1px solid #f3f4f6; }
            .total { text-align: right; font-size: 18px; font-weight: bold; }
            .status { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 500; }
            .paid { background: #d1fae5; color: #065f46; }
            .pending { background: #fef3c7; color: #92400e; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="invoice">
            <div class="header">
              <h1>MembersHome</h1>
              <div class="invoice-number">Invoice #${invoice.invoiceNumber}</div>
            </div>
            
            <div class="details">
              <p><strong>Date:</strong> ${new Date(invoice.createdAt).toLocaleDateString()}</p>
              <p><strong>Due Date:</strong> ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Upon Receipt'}</p>
              <p><strong>Status:</strong> <span class="status ${invoice.status === 'PAID' ? 'paid' : 'pending'}">${invoice.status}</span></p>
            </div>
            
            <table class="items">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${invoice.description || 'Membership Subscription'}</td>
                  <td>${invoice.currency} ${invoice.amount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
            
            <div class="total">
              Total: ${invoice.currency} ${invoice.amount.toFixed(2)}
            </div>
            
            ${invoice.paidAt ? `<p style="margin-top: 16px; color: #6b7280; font-size: 14px;">Paid on: ${new Date(invoice.paidAt).toLocaleDateString()}</p>` : ''}
            
            <div class="footer">
              <p>Thank you for your business!</p>
              <p>MembersHome - Complete Membership Management</p>
            </div>
          </div>
        </body>
      </html>
    `

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.html"`
      }
    })
  } catch (error) {
    console.error('Download invoice error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}