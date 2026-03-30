"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Printer, Download, ArrowLeft } from "lucide-react"
import { format } from "date-fns"

interface InvoiceData {
  id: string
  invoiceNumber: string
  amount: number
  currency: string
  description: string | null
  dueDate: string | null
  status: string
  createdAt: string
  paidAt: string | null
  items: any[]
  membership: {
    user: {
      name: string
      email: string
      phone: string | null
    }
  }
  creator: {
    name: string
    email: string
  }
}

export default function InvoicePDFPage() {
  const params = useParams()
  const router = useRouter()
  const orgSlug = params.orgSlug as string
  const invoiceId = params.invoiceId as string
  const [invoice, setInvoice] = useState<InvoiceData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/organizations/${orgSlug}/commerce/invoices/${invoiceId}`)
      .then((res) => res.json())
      .then((data) => {
        setInvoice(data)
        setLoading(false)
      })
      .catch((error) => {
        console.error("Failed to load invoice", error)
        setLoading(false)
      })
  }, [orgSlug, invoiceId])

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    // Implement PDF download
    alert("Download functionality coming soon")
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!invoice) {
    return <div>Invoice not found</div>
  }

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      <Card className="print:shadow-none">
        <CardHeader className="text-center border-b pb-6">
          <CardTitle className="text-3xl">INVOICE</CardTitle>
          <p className="text-muted-foreground">{invoice.invoiceNumber}</p>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-2 font-semibold">From:</h3>
              <p className="font-medium">{invoice.creator.name}</p>
              <p className="text-sm text-muted-foreground">{invoice.creator.email}</p>
            </div>
            <div>
              <h3 className="mb-2 font-semibold">Bill To:</h3>
              <p className="font-medium">{invoice.membership.user.name}</p>
              <p className="text-sm text-muted-foreground">{invoice.membership.user.email}</p>
              {invoice.membership.user.phone && (
                <p className="text-sm text-muted-foreground">{invoice.membership.user.phone}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Invoice Date</p>
              <p className="font-medium">{format(new Date(invoice.createdAt), "MMMM d, yyyy")}</p>
            </div>
            {invoice.dueDate && (
              <div>
                <p className="text-sm text-muted-foreground">Due Date</p>
                <p className="font-medium">{format(new Date(invoice.dueDate), "MMMM d, yyyy")}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium">{invoice.status}</p>
            </div>
          </div>

          {invoice.description && (
            <div>
              <p className="text-sm text-muted-foreground">Description</p>
              <p>{invoice.description}</p>
            </div>
          )}

          <div>
            <h3 className="mb-3 font-semibold">Invoice Items</h3>
            <div className="rounded-md border">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3 text-left text-sm font-medium">Description</th>
                    <th className="p-3 text-center text-sm font-medium">Quantity</th>
                    <th className="p-3 text-right text-sm font-medium">Unit Price</th>
                    <th className="p-3 text-right text-sm font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-3">{item.description}</td>
                      <td className="p-3 text-center">{item.quantity}</td>
                      <td className="p-3 text-right">{invoice.currency} {item.unitPrice}</td>
                      <td className="p-3 text-right">{invoice.currency} {item.total}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t bg-muted/50">
                  <tr>
                    <td colSpan={3} className="p-3 text-right font-bold">Total</td>
                    <td className="p-3 text-right font-bold">{invoice.currency} {invoice.amount}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>Thank you for your business!</p>
            <p className="mt-1">For questions about this invoice, please contact {invoice.creator.email}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}