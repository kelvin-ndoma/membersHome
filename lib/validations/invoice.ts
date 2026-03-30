import { z } from "zod"

const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required").max(500, "Description must be less than 500 characters"),
  quantity: z.number().positive("Quantity must be positive"),
  unitPrice: z.number().min(0, "Unit price must be 0 or greater"),
  total: z.number().min(0, "Total must be 0 or greater"),
  metadata: z.any().optional(),
})

export const createInvoiceSchema = z.object({
  membershipId: z.string().min(1, "Membership ID is required"),
  amount: z.number().positive("Amount must be positive"),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional().nullable(),
  dueDate: z.date().optional().nullable(),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
  currency: z.string().length(3, "Currency must be 3 characters").default("USD"),
})

export const updateInvoiceSchema = z.object({
  amount: z.number().positive("Amount must be positive").optional(),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional().nullable(),
  dueDate: z.date().optional().nullable(),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required").optional(),
  status: z.enum(["DRAFT", "SENT", "PENDING", "PAID", "OVERDUE", "CANCELLED", "REFUNDED"]).optional(),
})