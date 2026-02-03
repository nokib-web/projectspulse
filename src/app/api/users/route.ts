import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import prisma from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest) {
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
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({ success: true, data: users }, { status: 200 })
    } catch (error) {
        console.error('Get users error:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
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
        const body = await req.json()
        const { email, password, name, role } = body

        // Validate required fields
        if (!email || !password || !name || !role) {
            return NextResponse.json(
                { success: false, error: 'Email, password, name, and role are required' },
                { status: 400 }
            )
        }

        // Validate role
        if (!['ADMIN', 'EMPLOYEE', 'CLIENT'].includes(role)) {
            return NextResponse.json(
                { success: false, error: 'Invalid role' },
                { status: 400 }
            )
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            return NextResponse.json(
                { success: false, error: 'Email already exists' },
                { status: 409 }
            )
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12)

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
                updatedAt: true
            }
        })

        return NextResponse.json({ success: true, data: user }, { status: 201 })
    } catch (error) {
        console.error('Create user error:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}
