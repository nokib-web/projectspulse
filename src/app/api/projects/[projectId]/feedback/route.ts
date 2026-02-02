import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import prisma from '@/lib/db'
import { getCurrentWeekAndYear } from '@/lib/helpers'
import { recalcHealthScore } from '@/lib/healthScore'

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

        // Verify access
        const project = await prisma.project.findUnique({
            where: { id: projectId }
        })

        if (!project) {
            return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 })
        }

        const hasAccess =
            authUser.role === 'ADMIN' ||
            project.adminId === authUser.id ||
            project.clientId === authUser.id

        if (!hasAccess) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
        }

        const feedback = await prisma.clientFeedback.findMany({
            where: { projectId },
            include: {
                client: {
                    select: { id: true, name: true, email: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({ success: true, data: feedback }, { status: 200 })
    } catch (error) {
        console.error('Get feedback error:', error)
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

    // CLIENT ONLY
    if (authUser.role !== 'CLIENT') {
        return NextResponse.json({ success: false, error: 'Only clients can submit feedback' }, { status: 403 })
    }

    if (!prisma) {
        return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 503 })
    }

    try {
        const { projectId } = params
        const body = await req.json()
        const { satisfactionRating, communicationClarity, comments, flaggedIssue } = body

        // Validate required fields
        if (satisfactionRating === undefined || communicationClarity === undefined) {
            return NextResponse.json(
                { success: false, error: 'Satisfaction rating and communication clarity are required' },
                { status: 400 }
            )
        }

        // Validate ranges
        if (satisfactionRating < 1 || satisfactionRating > 5) {
            return NextResponse.json(
                { success: false, error: 'Satisfaction rating must be between 1 and 5' },
                { status: 400 }
            )
        }

        if (communicationClarity < 1 || communicationClarity > 5) {
            return NextResponse.json(
                { success: false, error: 'Communication clarity must be between 1 and 5' },
                { status: 400 }
            )
        }

        // Verify client is assigned to project
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { clientId: true, name: true, adminId: true }
        })

        if (!project) {
            return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 })
        }

        if (project.clientId !== authUser.id) {
            return NextResponse.json(
                { success: false, error: 'You are not the client of this project' },
                { status: 403 }
            )
        }

        // Get current week and year
        const { weekNumber, year } = getCurrentWeekAndYear()

        // Check for existing feedback
        const existing = await prisma.clientFeedback.findFirst({
            where: {
                projectId,
                clientId: authUser.id,
                weekNumber,
                year
            }
        })

        if (existing) {
            return NextResponse.json(
                { success: false, error: 'You have already submitted feedback for this week' },
                { status: 409 }
            )
        }

        // Create feedback
        const feedback = await prisma.clientFeedback.create({
            data: {
                projectId,
                clientId: authUser.id,
                weekNumber,
                year,
                satisfactionRating,
                communicationClarity,
                comments,
                flaggedIssue: flaggedIssue || false
            },
            include: {
                client: {
                    select: { id: true, name: true, email: true }
                }
            }
        })

        // Log activity
        await prisma.activityLog.create({
            data: {
                projectId,
                userId: authUser.id,
                type: 'FEEDBACK_SUBMITTED',
                title: 'Client feedback submitted',
                description: `Satisfaction: ${satisfactionRating}/5, Communication: ${communicationClarity}/5`
            }
        })

        // Create notification if issue flagged
        if (flaggedIssue && project.adminId) {
            await prisma.notification.create({
                data: {
                    userId: project.adminId,
                    title: 'Issue Flagged',
                    message: `Issue flagged on ${project.name}`,
                    type: 'ISSUE_FLAGGED',
                    link: `/admin/projects/${projectId}`
                }
            })
        }

        // Recalculate health score
        await recalcHealthScore(projectId)

        return NextResponse.json({ success: true, data: feedback }, { status: 201 })
    } catch (error) {
        console.error('Create feedback error:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}
