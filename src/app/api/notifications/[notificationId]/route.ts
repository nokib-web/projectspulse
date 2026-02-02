import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import prisma from '@/lib/db'

export async function PUT(
    req: NextRequest,
    { params }: { params: { notificationId: string } }
) {
    const authUser = await getAuthenticatedUser(req)
    if (!authUser) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    if (!prisma) {
        return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 503 })
    }

    try {
        const { notificationId } = params

        // Verify notification belongs to user
        const notification = await prisma.notification.findUnique({
            where: { id: notificationId }
        })

        if (!notification) {
            return NextResponse.json({ success: false, error: 'Notification not found' }, { status: 404 })
        }

        if (notification.userId !== authUser.id) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
        }

        // Mark as read
        const updatedNotification = await prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true }
        })

        return NextResponse.json({ success: true, data: updatedNotification }, { status: 200 })
    } catch (error) {
        console.error('Mark notification as read error:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}
