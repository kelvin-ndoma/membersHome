// lib/db/index.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// MongoDB-specific utilities
export const connectToDatabase = async () => {
  try {
    await prisma.$connect()
    console.log('✅ Connected to MongoDB')
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error)
    throw error
  }
}

// Graceful shutdown
export const disconnectFromDatabase = async () => {
  await prisma.$disconnect()
}