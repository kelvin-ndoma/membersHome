import { randomBytes } from "crypto"

export function generateTicketNumber(): string {
  const timestamp = Date.now().toString(36)
  const random = randomBytes(8).toString("hex")
  return `${timestamp}-${random}`.toUpperCase()
}

export function generateBatchTicketNumbers(quantity: number): string[] {
  const tickets: string[] = []
  for (let i = 0; i < quantity; i++) {
    tickets.push(generateTicketNumber())
  }
  return tickets
}

export function generateQRCodeData(
  ticketId: string,
  ticketNumber: string,
  purchaseId: string
): string {
  return JSON.stringify({
    v: 1,
    tid: ticketId,
    tn: ticketNumber,
    pid: purchaseId,
    ts: Date.now(),
  })
}

export function generateCheckInCode(membershipId: string, eventId: string): string {
  const data = JSON.stringify({
    type: "checkin",
    mid: membershipId,
    eid: eventId,
    ts: Date.now(),
  })
  return Buffer.from(data).toString("base64")
}

export function generateTicketReference(): string {
  const prefix = "TKT"
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = randomBytes(4).toString("hex").toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}