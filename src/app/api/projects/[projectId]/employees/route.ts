import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import prisma from '@/lib/db'

export async function POST(
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
        const { employeeId } = body

        if (!employeeId) {
            return NextResponse.json({ success: false, error: 'Employee ID is required' }, { status: 400 })
        }

        // Verify employee exists and is EMPLOYEE role
        const employee = await prisma.user.findUnique({
            where: { id: employeeId }
        })

        if (!employee || employee.role !== 'EMPLOYEE') {
            return NextResponse.json({ success: false, error: 'Invalid employee ID' }, { status: 400 })
        }

        // Get project for notification
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { name: true }
        })

        if (!project) {
            return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 })
        }

        // Create assignment
        const assignment = await prisma.projectEmployee.create({
            data: {
                projectId,
                employeeId
            }
        })

        // Create notification
        await prisma.notification.create({
            data: {
                userId: employeeId,
                title: 'New Project Assignment',
                message: `You've been assigned to ${project.name}`,
                type: 'PROJECT_ASSIGNMENT',
                link: `/employee/projects/${projectId}`
            }
        })

        return NextResponse.json({ success: true, data: assignment }, { status: 201 })
    } catch (error: any) {
        // Handle unique constraint violation
        if (error.code === 'P2002') {
            return NextResponse.json(
                { success: false, error: 'Employee already assigned to this project' },
                { status: 409 }
            )
        }
        console.error('Add employee error:', error)
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
        const body = await req.json()
        const { employeeId } = body

        if (!employeeId) {
            return NextResponse.json({ success: false, error: 'Employee ID is required' }, { status: 400 })
        }

        await prisma.projectEmployee.deleteMany({
            where: {
                projectId,
                employeeId
            }
        })

        return NextResponse.json({ success: true }, { status: 200 })
    } catch (error) {
        console.error('Remove employee error:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}
