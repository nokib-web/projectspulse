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

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                admin: { select: { id: true, name: true, email: true } },
                client: { select: { id: true, name: true, email: true } },
                employees: {
                    include: {
                        employee: { select: { id: true, name: true, email: true } }
                    }
                },
                risks: {
                    include: {
                        createdBy: { select: { id: true, name: true, email: true } }
                    },
                    orderBy: { createdAt: 'desc' }
                },
                milestones: {
                    orderBy: { dueDate: 'asc' }
                },
                activities: {
                    orderBy: { createdAt: 'desc' },
                    take: 5
                }
            }
        })

        if (!project) {
            return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 })
        }

        // Verify access
        const hasAccess =
            authUser.role === 'ADMIN' ||
            project.adminId === authUser.id ||
            project.clientId === authUser.id ||
            project.employees.some(pe => pe.employeeId === authUser.id)

        if (!hasAccess) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
        }

        return NextResponse.json({ success: true, data: project }, { status: 200 })
    } catch (error) {
        console.error('Get project error:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: { projectId: string } }
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
        const { projectId } = params
        const body = await req.json()
        const { name, description, startDate, endDate, clientId, status } = body

        // Get current project
        const currentProject = await prisma.project.findUnique({
            where: { id: projectId }
        })

        if (!currentProject) {
            return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 })
        }

        // Build update data
        const updateData: any = {}
        if (name !== undefined) updateData.name = name
        if (description !== undefined) updateData.description = description
        if (startDate !== undefined) updateData.startDate = new Date(startDate)
        if (endDate !== undefined) updateData.endDate = new Date(endDate)
        if (clientId !== undefined) updateData.clientId = clientId
        if (status !== undefined) updateData.status = status

        // Update project
        const updatedProject = await prisma.project.update({
            where: { id: projectId },
            data: updateData,
            include: {
                admin: { select: { id: true, name: true, email: true } },
                client: { select: { id: true, name: true, email: true } },
                employees: {
                    include: {
                        employee: { select: { id: true, name: true, email: true } }
                    }
                }
            }
        })

        // Log status change
        if (status && status !== currentProject.status) {
            await prisma.activityLog.create({
                data: {
                    projectId,
                    userId: authUser.id,
                    type: 'PROJECT_STATUS_CHANGED',
                    title: 'Project status changed',
                    description: `Status changed from ${currentProject.status} to ${status}`
                }
            })
        }

        return NextResponse.json({ success: true, data: updatedProject }, { status: 200 })
    } catch (error) {
        console.error('Update project error:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { projectId: string } }
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
        const { projectId } = params

        await prisma.project.delete({
            where: { id: projectId }
        })

        return NextResponse.json({ success: true }, { status: 200 })
    } catch (error) {
        console.error('Delete project error:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}
