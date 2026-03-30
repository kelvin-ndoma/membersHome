import { z } from "zod"

export const createTicketSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(200, "Name must be less than 200 characters"),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
  type: z.enum(["GENERAL_ADMISSION", "VIP", "EARLY_BIRD", "GROUP", "SEASON_PASS", "WORKSHOP", "COURSE", "DONATION", "CUSTOM"]).default("GENERAL_ADMISSION"),
  price: z.number().min(0, "Price must be 0 or greater"),
  currency: z.string().length(3, "Currency must be 3 characters").default("USD"),
  totalQuantity: z.number().int().positive("Total quantity must be positive"),
  maxPerPurchase: z.number().int().positive("Max per purchase must be positive").default(10),
  memberOnly: z.boolean().default(false),
  salesStartAt: z.date({ required_error: "Sales start date is required" }),
  salesEndAt: z.date({ required_error: "Sales end date is required" }),
  validFrom: z.date({ required_error: "Valid from date is required" }),
  validUntil: z.date({ required_error: "Valid until date is required" }),
  isPublic: z.boolean().default(true),
  eventId: z.string().optional().nullable(),
  houseId: z.string().optional().nullable(),
  earlyBirdPrice: z.number().min(0, "Early bird price must be 0 or greater").optional().nullable(),
  memberPrice: z.number().min(0, "Member price must be 0 or greater").optional().nullable(),
}).refine((data) => data.salesEndAt > data.salesStartAt, {
  message: "Sales end date must be after sales start date",
  path: ["salesEndAt"],
}).refine((data) => data.validUntil > data.validFrom, {
  message: "Valid until date must be after valid from date",
  path: ["validUntil"],
})

export const updateTicketSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(200, "Name must be less than 200 characters").optional(),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional().nullable(),
  price: z.number().min(0, "Price must be 0 or greater").optional(),
  totalQuantity: z.number().int().positive("Total quantity must be positive").optional(),
  maxPerPurchase: z.number().int().positive("Max per purchase must be positive").optional(),
  memberOnly: z.boolean().optional(),
  salesStartAt: z.date().optional(),
  salesEndAt: z.date().optional(),
  validFrom: z.date().optional(),
  validUntil: z.date().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "SOLD_OUT", "CANCELLED", "EXPIRED"]).optional(),
  isPublic: z.boolean().optional(),
  earlyBirdPrice: z.number().min(0, "Early bird price must be 0 or greater").optional().nullable(),
  memberPrice: z.number().min(0, "Member price must be 0 or greater").optional().nullable(),
})

export const purchaseTicketSchema = z.object({
  ticketId: z.string().min(1, "Ticket ID is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  customerName: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters").optional(),
  customerEmail: z.string().email("Must be a valid email").optional(),
  customerPhone: z.string().regex(/^\+?[0-9]{10,15}$/, "Must be a valid phone number").optional(),
  membershipId: z.string().optional(),
  metadata: z.any().optional(),
})

export const validateTicketSchema = z.object({
  ticketCode: z.string().min(1, "Ticket code is required"),
  entryPoint: z.string().max(100, "Entry point must be less than 100 characters").optional(),
  gateNumber: z.string().max(50, "Gate number must be less than 50 characters").optional(),
  isReentry: z.boolean().default(false),
})