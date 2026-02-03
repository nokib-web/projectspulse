import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import prisma from '@/lib/db'

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ projectId: string }> }
) {
    const authUser = await getAuthenticatedUser(req)
    if (!authUser) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    if (!prisma) {
        return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 503 })
    }

    try {
        const { projectId } = await context.params

        // Verify access
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
            project.employees.some((pe: any) => pe.employeeId === authUser.id)

        if (!hasAccess) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
        }

        const milestones = await prisma.milestone.findMany({
            where: { projectId },
            orderBy: { dueDate: 'asc' }
        })

        // Compute OVERDUE status on-the-fly
        const now = new Date()
        const milestonesWithStatus = milestones.map((milestone: any) => {
            let computedStatus = milestone.status
            if (milestone.dueDate < now && milestone.status !== 'COMPLETED') {
                computedStatus = 'OVERDUE'
            }
            return {
                ...milestone,
                status: computedStatus
            }
        })

        return NextResponse.json({ success: true, data: milestonesWithStatus }, { status: 200 })
    } catch (error) {
        console.error('Get milestones error:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ projectId: string }> }
) {
    const authUser = await getAuthenticatedUser(req)
    if (!authUser) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // ADMIN ONLY
    if (authUser.role !== 'ADMIN') {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    if (!prisma) {
        return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 503 })
    }

    try {
        const { projectId } = await context.params
        const body = await req.json()
        const { title, description, dueDate } = body

        // Validate required fields
        if (!title || !dueDate) {
            return NextResponse.json(
                { success: false, error: 'Title and due date are required' },
                { status: 400 }
            )
        }

        const milestone = await prisma.milestone.create({
            data: {
                projectId,
                title,
                description,
                dueDate: new Date(dueDate)
            }
        })

        // Log activity
        await prisma.activityLog.create({
            data: {
                projectId,
                userId: authUser.id,
                type: 'MILESTONE_UPDATED',
                title: `Milestone created: ${title}`,
                description: `Due date: ${new Date(dueDate).toLocaleDateString()}`
            }
        })

        return NextResponse.json({ success: true, data: milestone }, { status: 201 })
    } catch (error) {
        console.error('Create milestone error:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}
