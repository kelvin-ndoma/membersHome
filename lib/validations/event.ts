import { z } from "zod"

export const createEventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200, "Title must be less than 200 characters"),
  description: z.string().max(2000, "Description must be less than 2000 characters").optional(),
  startDate: z.date({ required_error: "Start date is required" }),
  endDate: z.date({ required_error: "End date is required" }),
  timezone: z.string().default("UTC"),
  location: z.string().max(255, "Location must be less than 255 characters").optional().nullable(),
  address: z.any().optional(),
  onlineUrl: z.string().url("Must be a valid URL").optional().nullable(),
  type: z.enum(["IN_PERSON", "ONLINE", "HYBRID"]).default("IN_PERSON"),
  isFree: z.boolean().default(true),
  capacity: z.number().positive("Capacity must be positive").optional().nullable(),
  price: z.number().min(0, "Price must be 0 or greater").optional().nullable(),
  currency: z.string().length(3, "Currency must be 3 characters").default("USD"),
  houseId: z.string().optional().nullable(),
}).refine((data) => data.endDate > data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
})

export const updateEventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200, "Title must be less than 200 characters").optional(),
  description: z.string().max(2000, "Description must be less than 2000 characters").optional().nullable(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  location: z.string().max(255, "Location must be less than 255 characters").optional().nullable(),
  address: z.any().optional(),
  onlineUrl: z.string().url("Must be a valid URL").optional().nullable(),
  type: z.enum(["IN_PERSON", "ONLINE", "HYBRID"]).optional(),
  isFree: z.boolean().optional(),
  capacity: z.number().positive("Capacity must be positive").optional().nullable(),
  price: z.number().min(0, "Price must be 0 or greater").optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "CANCELLED", "COMPLETED"]).optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return data.endDate > data.startDate
  }
  return true
}, {
  message: "End date must be after start date",
  path: ["endDate"],
})

export const rsvpSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED"]),
  guestsCount: z.number().min(0, "Guests count cannot be negative").max(50, "Guests count cannot exceed 50").default(0),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional().nullable(),
})