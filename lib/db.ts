// Conditional import to avoid build-time evaluation issues
let PrismaClient: any
let prismaClient: any

const globalForPrisma = globalThis as unknown as {
  prisma: any
}

function getPrismaClient() {
  // In serverless omgevingen, check eerst globalThis voor bestaande client
  if (typeof globalThis !== 'undefined' && globalForPrisma.prisma) {
    prismaClient = globalForPrisma.prisma
    return prismaClient
  }
  
  if (prismaClient) {
    return prismaClient
  }

  // Lazy load PrismaClient only when needed
  if (!PrismaClient) {
    try {
      PrismaClient = require('@prisma/client').PrismaClient
    } catch (error) {
      // During build, Prisma might not be available
      console.warn('Prisma Client not available:', error)
      return new Proxy({}, {
        get() {
          throw new Error('Prisma Client is not available. Make sure DATABASE_URL is set and Prisma Client is generated.')
        }
      })
    }
  }

  if (!process.env.DATABASE_URL) {
    // Return a proxy that throws a helpful error if accessed during runtime
    return new Proxy({}, {
      get() {
        throw new Error(
          'Prisma Client is not initialized. DATABASE_URL must be set in environment variables.'
        )
      }
    })
  }

  try {
    // Configureer Prisma Client voor serverless omgevingen (Vercel + Neon)
    // De DATABASE_URL wordt automatisch gelezen uit environment variables
    // Connection pooling parameters (pgbouncer, connect_timeout) moeten
    // in de DATABASE_URL zelf zitten, niet via datasources configuratie
    const prismaOptions: any = {
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    }
    
    prismaClient = new PrismaClient(prismaOptions)
    
    // In serverless omgevingen (zoals Vercel), gebruik globalThis voor connection reuse
    // Dit voorkomt het maken van te veel connections
    if (typeof globalThis !== 'undefined') {
      globalForPrisma.prisma = prismaClient
    }

    return prismaClient
  } catch (error) {
    // During build, Prisma Client initialization might fail
    console.error('Prisma Client initialization failed:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error details:', { errorMessage, hasDatabaseUrl: !!process.env.DATABASE_URL })
    return new Proxy({}, {
      get() {
        throw new Error(`Prisma Client initialization failed: ${errorMessage}. Make sure DATABASE_URL is set correctly.`)
      }
    })
  }
}

// Use a proxy to lazy-initialize the client only when accessed
export const prisma = new Proxy({}, {
  get(_target, prop) {
    const client = getPrismaClient()
    const value = (client as any)[prop]
    return typeof value === 'function' ? value.bind(client) : value
  }
}) as any
