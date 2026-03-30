import { prisma } from "@/lib/db"

async function main() {
  await prisma.$transaction([
    prisma.ticketValidation.deleteMany(),
    prisma.ticketPurchase.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.invoice.deleteMany(),
    prisma.rSVP.deleteMany(),
    prisma.report.deleteMany(),
    prisma.communication.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.ticket.deleteMany(),
    prisma.event.deleteMany(),
    prisma.houseMembership.deleteMany(),
    prisma.house.deleteMany(),
    prisma.membership.deleteMany(),
    prisma.session.deleteMany(),
    prisma.user.deleteMany(),
    prisma.organization.deleteMany(),
  ])

  console.log("Database wiped successfully.")
}

main()
  .catch((e) => {
    console.error("Wipe failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })