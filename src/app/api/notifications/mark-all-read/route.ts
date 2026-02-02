import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import prisma from '@/lib/db'

export async function POST(req: NextRequest) {
    const authUser = await getAuthenticatedUser(req)
    if (!authUser) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    if (!prisma) {
        return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 503 })
    }

    try {
        await prisma.notification.updateMany({
            where: {
                userId: authUser.id,
                isRead: false
            },
            data: {
                isRead: true
            }
        })

        return NextResponse.json({ success: true }, { status: 200 })
    } catch (error) {
        console.error('Mark all notifications as read error:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}
