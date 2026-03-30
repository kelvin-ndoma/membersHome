import { InvoiceStatus } from "@prisma/client"

export interface Invoice {
  id: string
  invoiceNumber: string
  organizationId: string
  membershipId: string
  amount: number
  currency: string
  description: string | null
  dueDate: Date | null
  items: InvoiceItem[]
  status: InvoiceStatus
  paidAt: Date | null
  paidBy: string | null
  cancelledAt: Date | null
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface InvoiceItem {
  id?: string
  description: string
  quantity: number
  unitPrice: number
  total: number
  metadata?: any
}

export interface CreateInvoiceData {
  membershipId: string
  amount: number
  description?: string
  dueDate?: Date
  items: InvoiceItem[]
  currency?: string
}

export interface UpdateInvoiceData {
  amount?: number
  description?: string
  dueDate?: Date
  items?: InvoiceItem[]
  status?: InvoiceStatus
}