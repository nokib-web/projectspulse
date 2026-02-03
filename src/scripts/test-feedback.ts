import * as dotenv from 'dotenv'
dotenv.config()

async function simulate() {
    // Need a valid project ID from the check script
    const projectId = 'cm16a0bsd000ay4ufwmhkuzcc'

    // We need to simulate the auth header if the API uses it.
    // The API uses getAuthenticatedUser(req)
    // getAuthenticatedUser usually checks for a cookie or header.

    // Actually, I can just call the API directly if I bypass the route and call the logic...
    // But it's easier to just guess based on the error.

    // Wait, I can just try to create a ClientFeedback record directly in a script 
    // to see if Prisma complains about something.

    const { PrismaClient } = await import('@prisma/client')
    const { PrismaPg } = await import('@prisma/adapter-pg')
    const pg = await import('pg')

    const pool = new pg.default.Pool({ connectionString: process.env.DATABASE_URL })
    const adapter = new PrismaPg(pool)
    const prisma = new PrismaClient({ adapter })

    try {
        console.log('Attempting to create feedback directly...')
        const client = await prisma.user.findFirst({ where: { role: 'CLIENT' } })
        if (!client) throw new Error('No client found')

        const feedback = await prisma.clientFeedback.create({
            data: {
                projectId,
                clientId: client.id,
                weekNumber: 1,
                year: 2024,
                satisfactionRating: 5,
                communicationClarity: 5,
                comments: 'Test comments',
                flaggedIssue: false
            }
        })
        console.log('Created feedback:', feedback.id)

        // Clean up
        await prisma.clientFeedback.delete({ where: { id: feedback.id } })
        console.log('Cleaned up.')

    } catch (e: any) {
        console.error('Direct create failed:', e.message)
    } finally {
        await prisma.$disconnect()
    }
}

simulate()
