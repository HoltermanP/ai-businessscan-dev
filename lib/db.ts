import { PrismaClient } from '@prisma/client'

// Forceer library engine in plaats van client engine voor serverless omgevingen
// Dit voorkomt de "requires adapter or accelerateUrl" error in Vercel
// MOET worden ingesteld VOORDAT PrismaClient wordt geïmporteerd/geïnitialiseerd
if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
  process.env.PRISMA_CLIENT_ENGINE_TYPE = 'library'
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma
  }

  // Controleer of DATABASE_URL is ingesteld
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

  globalForPrisma.prisma = client
  return client
}

// Lazy initialization: initialiseer alleen wanneer daadwerkelijk gebruikt
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient()
    const value = (client as any)[prop]
    return typeof value === 'function' ? value.bind(client) : value
  },
})
