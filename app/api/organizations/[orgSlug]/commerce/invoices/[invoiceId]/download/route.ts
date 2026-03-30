import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireOrgAccess } from "@/lib/auth"

export async function GET(
  req: Request,
  { params }: { params: { orgSlug: string; invoiceId: string } }
) {
  try {
    await requireOrgAccess(params.orgSlug)

    const organization = await prisma.organization.findUnique({
      where: { slug: params.orgSlug },
      select: { id: true, name: true },
    })

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: params.invoiceId,
        organizationId: organization.id,
      },
      include: {
        membership: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    })

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      )
    }

    const pdfContent = generateInvoicePDF(invoice, organization.name)

    return new NextResponse(pdfContent, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Error downloading invoice:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

function generateInvoicePDF(invoice: any, organizationName: string): string {
  const itemsHtml = invoice.items.map((item: any) => {
    return `
      <tr>
        <td>${item.description}</td>
        <td>${item.quantity}</td>
        <td>${invoice.currency} ${item.unitPrice}</td>
        <td>${invoice.currency} ${item.total}</td>
      </tr>
    `
  }).join("")

  const html = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .invoice-title { font-size: 24px; font-weight: bold; }
          .company { font-size: 18px; color: #666; margin-top: 5px; }
          .details { margin: 20px 0; }
          .details table { width: 100%; }
          .details td { padding: 5px; }
          .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .items-table th { background-color: #f2f2f2; }
          .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px; }
          .footer { margin-top: 50px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="invoice-title">INVOICE</div>
          <div class="company">${organizationName}</div>
        </div>
        
        <div class="details">
          <table>
            <tr><td><strong>Invoice Number:</strong></td><td>${invoice.invoiceNumber}</td></tr>
            <tr><td><strong>Date:</strong></td><td>${new Date(invoice.createdAt).toLocaleDateString()}</td></tr>
            <tr><td><strong>Due Date:</strong></td><td>${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "N/A"}</td></tr>
            <tr><td><strong>Status:</strong></td><td>${invoice.status}</td></tr>
          </table>
        </div>
        
        <div class="details">
          <strong>Bill To:</strong><br/>
          ${invoice.membership.user.name || "N/A"}<br/>
          ${invoice.membership.user.email}
        </div>
        
        <table class="items-table">
          <thead>
            <tr><th>Description</th><th>Quantity</th><th>Unit Price</th><th>Total</th></tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <div class="total">
          Total Amount: ${invoice.currency} ${invoice.amount}
        </div>
        
        <div class="footer">
          Thank you for your business!
        </div>
      </body>
    </html>
  `

  return html
}