import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

const createPrismaClient = () => {
    if (!process.env.DATABASE_URL) {
        console.warn('DATABASE_URL is not set. Prisma Client will not be initialized.')
        return null
    }

    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
    const adapter = new PrismaPg(pool)

    return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production' && prisma) {
    globalForPrisma.prisma = prisma
}

export default prisma
