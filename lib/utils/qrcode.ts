import QRCode from "qrcode"

export interface QRCodeOptions {
  width?: number
  margin?: number
  color?: {
    dark?: string
    light?: string
  }
  errorCorrectionLevel?: "L" | "M" | "Q" | "H"
}

export async function generateQRCodeDataURL(
  text: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const defaultOptions: QRCodeOptions = {
    width: 200,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
    errorCorrectionLevel: "M",
  }

  const mergedOptions = { ...defaultOptions, ...options }
  
  return QRCode.toDataURL(text, mergedOptions)
}

export async function generateQRCodeBuffer(
  text: string,
  options: QRCodeOptions = {}
): Promise<Buffer> {
  const defaultOptions: QRCodeOptions = {
    width: 200,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
    errorCorrectionLevel: "M",
  }

  const mergedOptions = { ...defaultOptions, ...options }
  
  return QRCode.toBuffer(text, mergedOptions)
}

export function generateTicketQRData(
  ticketId: string,
  ticketCode: string,
  purchaseId: string
): string {
  return JSON.stringify({
    ticketId,
    ticketCode,
    purchaseId,
    timestamp: Date.now(),
  })
}

export function parseTicketQRData(data: string): {
  ticketId: string
  ticketCode: string
  purchaseId: string
  timestamp: number
} | null {
  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}

export function generateCheckInQRData(
  membershipId: string,
  eventId: string
): string {
  return JSON.stringify({
    type: "checkin",
    membershipId,
    eventId,
    timestamp: Date.now(),
  })
}