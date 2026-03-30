export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[0-9]{10,15}$/
  return phoneRegex.test(phone)
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function isValidSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  return slugRegex.test(slug)
}

export function isValidHexColor(color: string): boolean {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  return hexRegex.test(color)
}

export function isValidPassword(password: string): boolean {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
  return passwordRegex.test(password)
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, "")
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + "..."
}