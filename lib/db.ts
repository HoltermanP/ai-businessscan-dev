// Conditional import to avoid build-time evaluation issues
let PrismaClient: any
let prismaClient: any

const globalForPrisma = globalThis as unknown as {
  prisma: any
}

function getPrismaClient() {
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
    prismaClient = new PrismaClient()
    
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = prismaClient
    }

    return prismaClient
  } catch (error) {
    // During build, Prisma Client initialization might fail
    console.warn('Prisma Client initialization failed:', error)
    return new Proxy({}, {
      get() {
        throw new Error('Prisma Client initialization failed. Make sure DATABASE_URL is set correctly.')
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
