import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import prisma from '@/lib/db'

export async function PUT(
    req: NextRequest,
    { params }: { params: { userId: string } }
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
        const { userId } = params
        const body = await req.json()
        const { name, role } = body

        // Build update data
        const updateData: any = {}
        if (name !== undefined) updateData.name = name
        if (role !== undefined) {
            // Validate role
            if (!['ADMIN', 'EMPLOYEE', 'CLIENT'].includes(role)) {
                return NextResponse.json(
                    { success: false, error: 'Invalid role' },
                    { status: 400 }
                )
            }
            updateData.role = role
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
                updatedAt: true
            }
        })

        return NextResponse.json({ success: true, data: user }, { status: 200 })
    } catch (error) {
        console.error('Update user error:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { userId: string } }
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
        const { userId } = params

        // Prevent self-deletion
        if (userId === authUser.id) {
            return NextResponse.json(
                { success: false, error: 'Cannot delete your own account' },
                { status: 400 }
            )
        }

        await prisma.user.delete({
            where: { id: userId }
        })

        return NextResponse.json({ success: true }, { status: 200 })
    } catch (error) {
        console.error('Delete user error:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}
