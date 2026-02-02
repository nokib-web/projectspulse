import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import prisma from '@/lib/db'

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
        const type = searchParams.get('type')

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
        if (type) whereClause.type = type

        const activities = await prisma.activityLog.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            take: 50
        })

        return NextResponse.json({ success: true, data: activities }, { status: 200 })
    } catch (error) {
        console.error('Get activity log error:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}
