import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export type PrismaTransaction = Parameters<
  Parameters<typeof prisma.$transaction>[0]
>[0]

export async function withTransaction<T>(
  fn: (tx: PrismaTransaction) => Promise<T>
): Promise<T> {
  return prisma.$transaction(fn)
}

export async function disconnectDatabase() {
  await prisma.$disconnect()
}

export async function checkDatabaseConnection() {
  try {
    await prisma.$runCommandRaw({ ping: 1 })
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}

export * from '@prisma/client'