import { format, formatDistance, formatRelative, differenceInDays, isAfter, isBefore, addDays, subDays } from "date-fns"

export function formatDate(date: Date | string, formatStr: string = "MMM dd, yyyy"): string {
  const d = typeof date === "string" ? new Date(date) : date
  return format(d, formatStr)
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return format(d, "MMM dd, yyyy HH:mm")
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return formatRelative(d, new Date())
}

export function formatDistanceToNow(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return formatDistance(d, new Date(), { addSuffix: true })
}

export function isExpired(date: Date | string): boolean {
  const d = typeof date === "string" ? new Date(date) : date
  return isAfter(new Date(), d)
}

export function isUpcoming(date: Date | string): boolean {
  const d = typeof date === "string" ? new Date(date) : date
  return isAfter(d, new Date())
}

export function daysUntil(date: Date | string): number {
  const d = typeof date === "string" ? new Date(date) : date
  return differenceInDays(d, new Date())
}

export function addDaysToDate(date: Date | string, days: number): Date {
  const d = typeof date === "string" ? new Date(date) : date
  return addDays(d, days)
}

export function subtractDaysFromDate(date: Date | string, days: number): Date {
  const d = typeof date === "string" ? new Date(date) : date
  return subDays(d, days)
}

export function isValidDate(date: any): boolean {
  const d = new Date(date)
  return d instanceof Date && !isNaN(d.getTime())
}