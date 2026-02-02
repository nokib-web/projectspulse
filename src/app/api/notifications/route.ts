import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import prisma from '@/lib/db'

export async function GET(req: NextRequest) {
    const authUser = await getAuthenticatedUser(req)
    if (!authUser) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    if (!prisma) {
        return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 503 })
    }

    try {
        const { searchParams } = new URL(req.url)
        const readParam = searchParams.get('read')

        // Build where clause
        const whereClause: any = { userId: authUser.id }
        if (readParam !== null) {
            whereClause.isRead = readParam === 'true'
        }

        const notifications = await prisma.notification.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' }
        })

        // Get unread count
        const unreadCount = await prisma.notification.count({
            where: {
                userId: authUser.id,
                isRead: false
            }
        })

        return NextResponse.json(
            {
                success: true,
                data: {
                    notifications,
                    unreadCount
                }
            },
            { status: 200 }
        )
    } catch (error) {
        console.error('Get notifications error:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}
