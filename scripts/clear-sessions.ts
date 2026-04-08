import { prisma } from "../prisma/client"

async function clearSessions() {
  try {
    const result = await prisma.session.deleteMany({})
    console.log(`✅ Deleted ${result.count} sessions`)
  } catch (error) {
    console.error("❌ Error:", error)
  } finally {
    await prisma.$disconnect()
  }
}

clearSessions()