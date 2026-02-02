import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import prisma from '@/lib/db'

export async function PUT(
    req: NextRequest,
    { params }: { params: { projectId: string; milestoneId: string } }
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
        const { projectId, milestoneId } = params
        const body = await req.json()
        const { title, description, dueDate, status } = body

        // Build update data
        const updateData: any = {}
        if (title !== undefined) updateData.title = title
        if (description !== undefined) updateData.description = description
        if (dueDate !== undefined) updateData.dueDate = new Date(dueDate)
        if (status !== undefined) updateData.status = status

        const milestone = await prisma.milestone.update({
            where: { id: milestoneId },
            data: updateData
        })

        // Log activity
        await prisma.activityLog.create({
            data: {
                projectId,
                userId: authUser.id,
                type: 'MILESTONE_UPDATED',
                title: `Milestone updated: ${milestone.title}`,
                description: status ? `Status changed to ${status}` : 'Milestone details updated'
            }
        })

        return NextResponse.json({ success: true, data: milestone }, { status: 200 })
    } catch (error) {
        console.error('Update milestone error:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { projectId: string; milestoneId: string } }
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
        const { milestoneId } = params

        await prisma.milestone.delete({
            where: { id: milestoneId }
        })

        return NextResponse.json({ success: true }, { status: 200 })
    } catch (error) {
        console.error('Delete milestone error:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}
