import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import * as dotenv from 'dotenv'

dotenv.config()

async function check() {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
    const adapter = new PrismaPg(pool)
    const prisma = new PrismaClient({ adapter })

    try {
        console.log('Testing connection...')
        const count = await prisma.project.count()
        console.log('Projects count:', count)

        console.log('Checking ClientFeedback table...')
        const feedbackCount = await prisma.clientFeedback.count()
        console.log('ClientFeedback count:', feedbackCount)

        const activityCount = await prisma.activityLog.count()
        console.log('ActivityLog count:', activityCount)

    } catch (e: any) {
        console.error('Check failed:', e.message)
    } finally {
        await prisma.$disconnect()
    }
}

check()
