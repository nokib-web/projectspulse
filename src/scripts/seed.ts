import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import bcrypt from 'bcryptjs'
import { recalcHealthScore } from '../lib/healthScore'

// Initialize Prisma Client with adapter
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log('🌱 Starting database seed...')

    // 1. Delete ALL data in dependency order to avoid foreign key constraints
    console.log('🧹 Clearing existing data...')
    try {
        await prisma.notification.deleteMany()
        await prisma.activityLog.deleteMany()
        await prisma.milestone.deleteMany()
        await prisma.risk.deleteMany()
        await prisma.clientFeedback.deleteMany()
        await prisma.employeeCheckIn.deleteMany()
        await prisma.projectEmployee.deleteMany()
        await prisma.project.deleteMany()
        await prisma.user.deleteMany()
    } catch (error) {
        console.error('Error clearing data:', error)
    }

    // 2. Create Users
    console.log('👤 Creating users...')
    const passwordHash = (password: string) => bcrypt.hashSync(password, 12)

    const admin = await prisma.user.create({
        data: {
            name: 'Admin One',
            email: 'admin@projectpulse.io',
            role: 'ADMIN',
            password: passwordHash('Admin123!'),
        },
    })

    const sarah = await prisma.user.create({
        data: {
            name: 'Sarah Chen',
            email: 'sarah@projectpulse.io',
            role: 'EMPLOYEE',
            password: passwordHash('Employee123!'),
        },
    })

    const james = await prisma.user.create({
        data: {
            name: 'James Patel',
            email: 'james@projectpulse.io',
            role: 'EMPLOYEE',
            password: passwordHash('Employee123!'),
        },
    })

    const olivia = await prisma.user.create({
        data: {
            name: 'Olivia Nash',
            email: 'olivia@projectpulse.io',
            role: 'CLIENT',
            password: passwordHash('Client123!'),
        },
    })

    const liam = await prisma.user.create({
        data: {
            name: 'Liam Torres',
            email: 'liam@projectpulse.io',
            role: 'CLIENT',
            password: passwordHash('Client123!'),
        },
    })

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    const fortyFiveDaysAgo = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000)

    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    // 3. Create Projects
    console.log('📁 Creating projects...')

    const projectA = await prisma.project.create({
        data: {
            name: 'E-Commerce Platform Redesign',
            description: 'Full redesign of the client-facing e-commerce storefront.',
            startDate: thirtyDaysAgo,
            endDate: thirtyDaysFromNow,
            adminId: admin.id,
            clientId: olivia.id,
            employees: {
                create: [
                    { employeeId: sarah.id },
                    { employeeId: james.id },
                ],
            },
        },
    })

    const projectB = await prisma.project.create({
        data: {
            name: 'Mobile Banking App',
            description: 'Native mobile banking application with biometric auth.',
            startDate: fourteenDaysAgo,
            endDate: sixtyDaysFromNow,
            adminId: admin.id,
            clientId: liam.id,
            employees: {
                create: [
                    { employeeId: sarah.id },
                ],
            },
        },
    })

    const projectC = await prisma.project.create({
        data: {
            name: 'CRM Data Migration',
            description: 'Migrate legacy CRM data to the new Salesforce instance.',
            startDate: fortyFiveDaysAgo,
            endDate: sevenDaysFromNow,
            adminId: admin.id,
            clientId: olivia.id,
            employees: {
                create: [
                    { employeeId: james.id },
                ],
            },
        },
    })

    // 4. Create Milestones
    console.log('🚩 Creating milestones...')

    await prisma.milestone.createMany({
        data: [
            {
                projectId: projectA.id,
                title: 'Wireframes Approved',
                dueDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
                status: 'COMPLETED',
            },
            {
                projectId: projectA.id,
                title: 'Beta Launch',
                dueDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
                status: 'IN_PROGRESS',
            },
            {
                projectId: projectB.id,
                title: 'API Integration Done',
                dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
                status: 'PENDING',
            },
            {
                projectId: projectB.id,
                title: 'QA Sign-off',
                dueDate: new Date(now.getTime() + 40 * 24 * 60 * 60 * 1000),
                status: 'PENDING',
            },
            {
                projectId: projectC.id,
                title: 'Schema Mapping',
                dueDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
                status: 'COMPLETED',
            },
            {
                projectId: projectC.id,
                title: 'Data Validation',
                dueDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
                status: 'PENDING',
            },
        ],
    })

    // 5. Create Check-ins (last 2 weeks)
    console.log('📝 Creating check-ins...')

    const currentWeek = 6 // Hardcoded based on current date roughly (Feb 2, 2026)
    const currentYear = 2026

    const checkinsArr = [
        // Sarah Project A
        { projectId: projectA.id, employeeId: sarah.id, weekNumber: currentWeek - 1, year: currentYear, confidenceLevel: 4, completionPercent: 40, progressSummary: 'Focused on UI components and landing page draft.' },
        { projectId: projectA.id, employeeId: sarah.id, weekNumber: currentWeek, year: currentYear, confidenceLevel: 4, completionPercent: 55, progressSummary: 'Component library nearly complete, started integration.' },
        // Sarah Project B
        { projectId: projectB.id, employeeId: sarah.id, weekNumber: currentWeek - 1, year: currentYear, confidenceLevel: 3, completionPercent: 20, progressSummary: 'Initial setup and auth flow research.' },
        { projectId: projectB.id, employeeId: sarah.id, weekNumber: currentWeek, year: currentYear, confidenceLevel: 3, completionPercent: 30, progressSummary: 'Implementing biometric auth logic.' },
        // James Project A
        { projectId: projectA.id, employeeId: james.id, weekNumber: currentWeek - 1, year: currentYear, confidenceLevel: 4, completionPercent: 45, progressSummary: 'Backend API endpoints for products and cart.' },
        { projectId: projectA.id, employeeId: james.id, weekNumber: currentWeek, year: currentYear, confidenceLevel: 4, completionPercent: 60, progressSummary: 'Database optimization and checkout flow logic.' },
        // James Project C
        { projectId: projectC.id, employeeId: james.id, weekNumber: currentWeek - 1, year: currentYear, confidenceLevel: 2, completionPercent: 70, progressSummary: 'Data extraction from legacy system 80% done.' },
        { projectId: projectC.id, employeeId: james.id, weekNumber: currentWeek, year: currentYear, confidenceLevel: 2, completionPercent: 75, progressSummary: 'Hitting snags with record validation.', blockers: 'Waiting on client approval' },
    ]

    for (const ciData of checkinsArr) {
        await prisma.employeeCheckIn.create({ data: ciData })
    }

    // 6. Create Client Feedback (last 2 weeks)
    console.log('💬 Creating client feedback...')

    const feedbacksArr = [
        { projectId: projectA.id, clientId: olivia.id, weekNumber: currentWeek - 1, year: currentYear, satisfactionRating: 4, communicationClarity: 5, comments: 'Good progress on designs.' },
        { projectId: projectA.id, clientId: olivia.id, weekNumber: currentWeek, year: currentYear, satisfactionRating: 4, communicationClarity: 5, comments: 'Excited for the beta!' },
        { projectId: projectC.id, clientId: olivia.id, weekNumber: currentWeek - 1, year: currentYear, satisfactionRating: 3, communicationClarity: 4, comments: 'Steady, but slow.' },
        { projectId: projectC.id, clientId: olivia.id, weekNumber: currentWeek, year: currentYear, satisfactionRating: 2, communicationClarity: 3, comments: 'Delays are frustrating', flaggedIssue: true },
        { projectId: projectB.id, clientId: liam.id, weekNumber: currentWeek, year: currentYear, satisfactionRating: 3, communicationClarity: 4, comments: 'Looking forward to the first demo.' },
    ]

    for (const fbData of feedbacksArr) {
        await prisma.clientFeedback.create({ data: fbData })
    }

    // 7. Create Risks
    console.log('⚠️ Creating risks...')

    await prisma.risk.create({
        data: {
            projectId: projectA.id,
            createdById: admin.id,
            title: 'Design asset delays',
            severity: 'MEDIUM',
            status: 'OPEN',
            mitigationPlan: 'Escalate to design lead',
        },
    })

    await prisma.risk.create({
        data: {
            projectId: projectB.id,
            createdById: sarah.id,
            title: 'Third-party API instability',
            severity: 'HIGH',
            status: 'OPEN',
            mitigationPlan: 'Implement retry logic + fallback',
        },
    })

    await prisma.risk.create({
        data: {
            projectId: projectC.id,
            createdById: james.id,
            title: 'Legacy data format issues',
            severity: 'HIGH',
            status: 'OPEN',
        },
    })

    await prisma.risk.create({
        data: {
            projectId: projectC.id,
            createdById: admin.id,
            title: 'Stakeholder availability',
            severity: 'LOW',
            status: 'RESOLVED',
            resolvedAt: now,
        },
    })

    // 8. Create ActivityLogs
    console.log('📜 Creating activity logs...')

    await prisma.activityLog.createMany({
        data: [
            { projectId: projectA.id, type: 'PROJECT_CREATED', title: 'Project Created', description: 'E-Commerce redesign initiated.' },
            { projectId: projectA.id, type: 'CHECK_IN_SUBMITTED', title: 'Check-in: Sarah Chen', userId: sarah.id, createdAt: lastWeekDate() },
            { projectId: projectA.id, type: 'FEEDBACK_SUBMITTED', title: 'Feedback: Olivia Nash', userId: olivia.id },
            { projectId: projectB.id, type: 'RISK_CREATED', title: 'High Severity Risk Flagged', userId: sarah.id, description: 'API instability detected.' },
            { projectId: projectC.id, type: 'MILESTONE_UPDATED', title: 'Milestone COMPLETED: Schema Mapping', userId: james.id },
            { projectId: projectC.id, type: 'FEEDBACK_SUBMITTED', title: 'Critical Feedback Received', userId: olivia.id, description: 'Delays are frustrating' },
        ],
    })

    // 9. Create Notifications
    console.log('🔔 Creating notifications...')

    await prisma.notification.createMany({
        data: [
            {
                userId: admin.id,
                title: 'High Severity Risk Found',
                message: 'A HIGH severity risk was created on "Mobile Banking App"',
                type: 'RISK',
                link: `/admin/projects/${projectB.id}`,
            },
            {
                userId: admin.id,
                title: 'Client Flagged Issue',
                message: 'Olivia Nash flagged a critical issue in feedback for "CRM Data Migration"',
                type: 'FEEDBACK',
                link: `/admin/projects/${projectC.id}`,
            },
            {
                userId: admin.id,
                title: 'Low Team Confidence',
                message: 'James Patel reported low confidence (2/5) on "CRM Data Migration"',
                type: 'CONFIDENCE',
                link: `/admin/projects/${projectC.id}`,
            },
        ],
    })

    // 10. Recalculate Health Scores
    console.log('📊 Calculating health scores...')
    await recalcHealthScore(projectA.id)
    await recalcHealthScore(projectB.id)
    await recalcHealthScore(projectC.id)

    console.log('\n✅ Seed complete!')
    console.log(`Users: 5 | Projects: 3 | Check-ins: 8 | Feedback: 5 | Risks: 4 | Milestones: 6`)
}

function lastWeekDate() {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return d
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
