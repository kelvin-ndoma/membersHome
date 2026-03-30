"use client"

import { useState } from "react"
import { format } from "date-fns"
import { MoreHorizontal, Download, Mail, Eye } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/Dropdown"

interface Invoice {
  id: string
  invoiceNumber: string
  amount: number
  currency: string
  description: string | null
  dueDate: Date | null
  status: string
  paidAt: Date | null
  createdAt: Date
  membership: {
    user: {
      name: string
      email: string
    }
  }
}

interface InvoicesTableProps {
  invoices: Invoice[]
  onView?: (invoiceId: string) => void
  onDownload?: (invoiceId: string) => void
  onSend?: (invoiceId: string) => void
  onPay?: (invoiceId: string) => void
  canManage?: boolean
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  SENT: "bg-blue-100 text-blue-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-800",
  OVERDUE: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-800",
  REFUNDED: "bg-purple-100 text-purple-800",
}

export function InvoicesTable({ 
  invoices, 
  onView, 
  onDownload, 
  onSend, 
  onPay,
  canManage = false 
}: InvoicesTableProps) {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount)
  }

  const isOverdue = (dueDate: Date | null, status: string) => {
    if (!dueDate || status === "PAID" || status === "CANCELLED") return false
    return new Date() > new Date(dueDate)
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No invoices found
              </TableCell>
            </TableRow>
          ) : (
            invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm font-medium">{invoice.membership.user.name}</p>
                    <p className="text-xs text-muted-foreground">{invoice.membership.user.email}</p>
                  </div>
                </TableCell>
                <TableCell>{formatCurrency(invoice.amount, invoice.currency)}</TableCell>
                <TableCell>
                  {invoice.dueDate ? (
                    <span className={isOverdue(invoice.dueDate, invoice.status) ? "text-red-600" : ""}>
                      {format(new Date(invoice.dueDate), "MMM d, yyyy")}
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[invoice.status]}>
                    {invoice.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {format(new Date(invoice.createdAt), "MMM d, yyyy")}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {onView && (
                        <DropdownMenuItem onClick={() => onView(invoice.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                      )}
                      {onDownload && (
                        <DropdownMenuItem onClick={() => onDownload(invoice.id)}>
                          <Download className="mr-2 h-4 w-4" />
                          Download PDF
                        </DropdownMenuItem>
                      )}
                      {canManage && invoice.status === "DRAFT" && onSend && (
                        <DropdownMenuItem onClick={() => onSend(invoice.id)}>
                          <Mail className="mr-2 h-4 w-4" />
                          Send to Customer
                        </DropdownMenuItem>
                      )}
                      {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && onPay && (
                        <DropdownMenuItem onClick={() => onPay(invoice.id)}>
                          Pay Now
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}