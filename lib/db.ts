import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

// In serverless omgevingen (zoals Vercel) is het belangrijk om de client te bewaren
// om connection reuse te voorkomen tussen verschillende serverless functie invocaties
if (!globalForPrisma.prisma) globalForPrisma.prisma = prisma
