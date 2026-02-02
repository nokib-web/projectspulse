import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import prisma from '@/lib/db'
import { getCurrentWeekAndYear } from '@/lib/helpers'

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
        const search = searchParams.get('search')
        const status = searchParams.get('status')

        let whereClause: any = {}

        // Role-based filtering
        if (authUser.role === 'ADMIN') {
            // Admin sees all projects
        } else if (authUser.role === 'EMPLOYEE') {
            // Employee sees only assigned projects
            whereClause.employees = {
                some: {
                    employeeId: authUser.id
                }
            }
        } else if (authUser.role === 'CLIENT') {
            // Client sees only their projects
            whereClause.clientId = authUser.id
        }

        // Apply search filter
        if (search) {
            whereClause.name = {
                contains: search,
                mode: 'insensitive'
            }
        }

        // Apply status filter
        if (status) {
            whereClause.status = status
        }

        const projects = await prisma.project.findMany({
            where: whereClause,
            include: {
                admin: {
                    select: { id: true, name: true, email: true }
                },
                client: {
                    select: { id: true, name: true, email: true }
                },
                employees: {
                    include: {
                        employee: {
                            select: { id: true, name: true, email: true }
                        }
                    }
                },
                _count: {
                    select: { risks: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({ success: true, data: projects }, { status: 200 })
    } catch (error) {
        console.error('Get projects error:', error)
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
        const { name, description, startDate, endDate, clientId, employeeIds } = body

        // Validate required fields
        if (!name || !startDate || !endDate) {
            return NextResponse.json(
                { success: false, error: 'Name, startDate, and endDate are required' },
                { status: 400 }
            )
        }

        // Validate dates
        const start = new Date(startDate)
        const end = new Date(endDate)
        if (end <= start) {
            return NextResponse.json(
                { success: false, error: 'End date must be after start date' },
                { status: 400 }
            )
        }

        // Validate client if provided
        if (clientId) {
            const client = await prisma.user.findUnique({
                where: { id: clientId }
            })
            if (!client || client.role !== 'CLIENT') {
                return NextResponse.json(
                    { success: false, error: 'Invalid client ID' },
                    { status: 400 }
                )
            }
        }

        // Create project
        const project = await prisma.project.create({
            data: {
                name,
                description,
                startDate: start,
                endDate: end,
                adminId: authUser.id,
                clientId: clientId || null
            }
        })

        // Add employees if provided
        if (employeeIds && Array.isArray(employeeIds) && employeeIds.length > 0) {
            await prisma.projectEmployee.createMany({
                data: employeeIds.map((empId: string) => ({
                    projectId: project.id,
                    employeeId: empId
                }))
            })
        }

        // Log activity
        await prisma.activityLog.create({
            data: {
                projectId: project.id,
                userId: authUser.id,
                type: 'PROJECT_CREATED',
                title: 'Project created',
                description: `${authUser.email} created project "${name}"`
            }
        })

        // Fetch complete project data
        const completeProject = await prisma.project.findUnique({
            where: { id: project.id },
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

        return NextResponse.json({ success: true, data: completeProject }, { status: 201 })
    } catch (error) {
        console.error('Create project error:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}
