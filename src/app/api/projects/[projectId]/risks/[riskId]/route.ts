import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import prisma from '@/lib/db'
import { recalcHealthScore } from '@/lib/healthScore'

export async function PUT(
    req: NextRequest,
    { params }: { params: { projectId: string; riskId: string } }
) {
    const authUser = await getAuthenticatedUser(req)
    if (!authUser) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    if (!prisma) {
        return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 503 })
    }

    try {
        const { projectId, riskId } = params
        const body = await req.json()
        const { title, description, severity, mitigationPlan, status } = body

        // Get current risk
        const currentRisk = await prisma.risk.findUnique({
            where: { id: riskId }
        })

        if (!currentRisk) {
            return NextResponse.json({ success: false, error: 'Risk not found' }, { status: 404 })
        }

        // Verify user is ADMIN or creator
        const isCreator = currentRisk.createdById === authUser.id
        const isAdmin = authUser.role === 'ADMIN'

        if (!isAdmin && !isCreator) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
        }

        // Build update data
        const updateData: any = {}
        if (title !== undefined) updateData.title = title
        if (description !== undefined) updateData.description = description
        if (severity !== undefined) updateData.severity = severity
        if (mitigationPlan !== undefined) updateData.mitigationPlan = mitigationPlan
        if (status !== undefined) {
            updateData.status = status
            if (status === 'RESOLVED' && currentRisk.status !== 'RESOLVED') {
                updateData.resolvedAt = new Date()
            }
        }

        // Update risk
        const updatedRisk = await prisma.risk.update({
            where: { id: riskId },
            data: updateData,
            include: {
                createdBy: {
                    select: { id: true, name: true, email: true }
                }
            }
        })

        // Log activity if status changed to RESOLVED
        if (status === 'RESOLVED' && currentRisk.status !== 'RESOLVED') {
            await prisma.activityLog.create({
                data: {
                    projectId,
                    userId: authUser.id,
                    type: 'RISK_RESOLVED',
                    title: `Risk resolved: ${updatedRisk.title}`,
                    description: `Risk was marked as resolved`
                }
            })
        }

        // Recalculate health score
        await recalcHealthScore(projectId)

        return NextResponse.json({ success: true, data: updatedRisk }, { status: 200 })
    } catch (error) {
        console.error('Update risk error:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { projectId: string; riskId: string } }
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
        const { projectId, riskId } = params

        await prisma.risk.delete({
            where: { id: riskId }
        })

        // Recalculate health score
        await recalcHealthScore(projectId)

        return NextResponse.json({ success: true }, { status: 200 })
    } catch (error) {
        console.error('Delete risk error:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}
