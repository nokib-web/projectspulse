import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import prisma from '@/lib/db'
import { getCurrentWeekAndYear, recalcHealthScore } from '@/lib/helpers'

export async function GET(
    req: NextRequest,
    { params }: { params: { projectId: string } }
) {
    const authUser = await getAuthenticatedUser(req)
    if (!authUser) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    if (!prisma) {
        return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 503 })
    }

    try {
        const { projectId } = params
        const { searchParams } = new URL(req.url)
        const employeeId = searchParams.get('employeeId')

        // Verify access to project
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                employees: true
            }
        })

        if (!project) {
            return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 })
        }

        const hasAccess =
            authUser.role === 'ADMIN' ||
            project.adminId === authUser.id ||
            project.clientId === authUser.id ||
            project.employees.some(pe => pe.employeeId === authUser.id)

        if (!hasAccess) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
        }

        // Build where clause
        const whereClause: any = { projectId }
        if (employeeId) {
            whereClause.employeeId = employeeId
        }

        const checkIns = await prisma.employeeCheckIn.findMany({
            where: whereClause,
            include: {
                employee: {
                    select: { id: true, name: true, email: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({ success: true, data: checkIns }, { status: 200 })
    } catch (error) {
        console.error('Get check-ins error:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: { projectId: string } }
) {
    const authUser = await getAuthenticatedUser(req)
    if (!authUser) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // EMPLOYEE ONLY
    if (authUser.role !== 'EMPLOYEE') {
        return NextResponse.json({ success: false, error: 'Only employees can submit check-ins' }, { status: 403 })
    }

    if (!prisma) {
        return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 503 })
    }

    try {
        const { projectId } = params
        const body = await req.json()
        const { progressSummary, blockers, confidenceLevel, completionPercent } = body

        // Validate required fields
        if (!progressSummary || confidenceLevel === undefined || completionPercent === undefined) {
            return NextResponse.json(
                { success: false, error: 'Progress summary, confidence level, and completion percent are required' },
                { status: 400 }
            )
        }

        // Validate ranges
        if (confidenceLevel < 1 || confidenceLevel > 5) {
            return NextResponse.json(
                { success: false, error: 'Confidence level must be between 1 and 5' },
                { status: 400 }
            )
        }

        if (completionPercent < 0 || completionPercent > 100) {
            return NextResponse.json(
                { success: false, error: 'Completion percent must be between 0 and 100' },
                { status: 400 }
            )
        }

        // Verify employee is assigned to project
        const assignment = await prisma.projectEmployee.findFirst({
            where: {
                projectId,
                employeeId: authUser.id
            }
        })

        if (!assignment) {
            return NextResponse.json(
                { success: false, error: 'You are not assigned to this project' },
                { status: 403 }
            )
        }

        // Get current week and year
        const { weekNumber, year } = getCurrentWeekAndYear()

        // Check for existing check-in
        const existing = await prisma.employeeCheckIn.findFirst({
            where: {
                projectId,
                employeeId: authUser.id,
                weekNumber,
                year
            }
        })

        if (existing) {
            return NextResponse.json(
                { success: false, error: 'You have already submitted a check-in for this week' },
                { status: 409 }
            )
        }

        // Get project and employee info
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { name: true, adminId: true }
        })

        const employee = await prisma.user.findUnique({
            where: { id: authUser.id },
            select: { name: true }
        })

        // Create check-in
        const checkIn = await prisma.employeeCheckIn.create({
            data: {
                projectId,
                employeeId: authUser.id,
                weekNumber,
                year,
                progressSummary,
                blockers,
                confidenceLevel,
                completionPercent
            },
            include: {
                employee: {
                    select: { id: true, name: true, email: true }
                }
            }
        })

        // Log activity
        await prisma.activityLog.create({
            data: {
                projectId,
                userId: authUser.id,
                type: 'CHECK_IN_SUBMITTED',
                title: `${employee?.name} submitted a check-in`,
                description: `Confidence: ${confidenceLevel}/5, Completion: ${completionPercent}%`
            }
        })

        // Create notification if low confidence
        if (confidenceLevel <= 2 && project) {
            await prisma.notification.create({
                data: {
                    userId: project.adminId,
                    title: 'Low Confidence Alert',
                    message: `Low confidence (${confidenceLevel}/5) reported on ${project.name}`,
                    type: 'LOW_CONFIDENCE',
                    link: `/admin/projects/${projectId}`
                }
            })
        }

        // Recalculate health score
        await recalcHealthScore(projectId)

        return NextResponse.json({ success: true, data: checkIn }, { status: 201 })
    } catch (error) {
        console.error('Create check-in error:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}
