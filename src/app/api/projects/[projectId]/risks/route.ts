import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import prisma from '@/lib/db'
import { recalcHealthScore } from '@/lib/helpers'

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
        const status = searchParams.get('status')
        const severity = searchParams.get('severity')

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
            project.employees.some(pe => pe.employeeId === authUser.id)

        if (!hasAccess) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
        }

        // Build where clause
        const whereClause: any = { projectId }
        if (status) whereClause.status = status
        if (severity) whereClause.severity = severity

        const risks = await prisma.risk.findMany({
            where: whereClause,
            include: {
                createdBy: {
                    select: { id: true, name: true, email: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({ success: true, data: risks }, { status: 200 })
    } catch (error) {
        console.error('Get risks error:', error)
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
        return NextResponse.json({ success: false, error: 'Only employees can create risks' }, { status: 403 })
    }

    if (!prisma) {
        return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 503 })
    }

    try {
        const { projectId } = params
        const body = await req.json()
        const { title, description, severity, mitigationPlan, status } = body

        // Validate required fields
        if (!title || !severity) {
            return NextResponse.json(
                { success: false, error: 'Title and severity are required' },
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

        // Get project info
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { name: true, adminId: true }
        })

        // Create risk
        const risk = await prisma.risk.create({
            data: {
                projectId,
                createdById: authUser.id,
                title,
                description,
                severity,
                mitigationPlan,
                status: status || 'OPEN'
            },
            include: {
                createdBy: {
                    select: { id: true, name: true, email: true }
                }
            }
        })

        // Log activity
        await prisma.activityLog.create({
            data: {
                projectId,
                userId: authUser.id,
                type: 'RISK_CREATED',
                title: `Risk created: ${title}`,
                description: `Severity: ${severity}`
            }
        })

        // Create notification if HIGH severity
        if (severity === 'HIGH' && project?.adminId) {
            await prisma.notification.create({
                data: {
                    userId: project.adminId,
                    title: 'High Severity Risk',
                    message: `High severity risk created on ${project.name}: ${title}`,
                    type: 'HIGH_RISK',
                    link: `/admin/projects/${projectId}`
                }
            })
        }

        // Recalculate health score
        await recalcHealthScore(projectId)

        return NextResponse.json({ success: true, data: risk }, { status: 201 })
    } catch (error) {
        console.error('Create risk error:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}
