import { z } from "zod"

export const registerUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  email: z.string().email("Must be a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

export const loginUserSchema = z.object({
  email: z.string().email("Must be a valid email"),
  password: z.string().min(1, "Password is required"),
})

export const updateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters").optional(),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, "Must be a valid phone number").optional().nullable(),
  image: z.string().url("Must be a valid URL").optional().nullable(),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters").regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

export const forgotPasswordSchema = z.object({
  email: z.string().email("Must be a valid email"),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(8, "Password must be at least 8 characters").regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})