import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function getPrismaClient(): PrismaClient | null {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma
  }

  // Controleer of DATABASE_URL is ingesteld
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL environment variable is not set - database features will be disabled')
    return null
  }

  try {
    const client = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })

    globalForPrisma.prisma = client
    return client
  } catch (error) {
    console.error('Failed to initialize Prisma client:', error)
    return null
  }
}

// Lazy initialization: initialiseer alleen wanneer daadwerkelijk gebruikt
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient()
    if (!client) {
      // Return een mock object dat altijd 0 teruggeeft voor count queries
      if (prop === 'quickscan' || prop === 'fullQuickscan') {
        return {
          count: () => Promise.resolve(0),
          create: () => Promise.reject(new Error('Database not configured')),
          findUnique: () => Promise.resolve(null),
          findMany: () => Promise.resolve([]),
        }
      }
      throw new Error('Database not configured - DATABASE_URL is not set')
    }
    const value = (client as any)[prop]
    return typeof value === 'function' ? value.bind(client) : value
  },
}) as PrismaClient
