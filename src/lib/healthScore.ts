import prisma from './db'
import { ProjectStatus } from '@/types'

/**
 * Recalculates the health score for a project based on:
 * - Client satisfaction (30%)
 * - Employee confidence (25%)
 * - Progress vs timeline (25%)
 * - Risk penalty (20%)
 */
export async function recalcHealthScore(projectId: string): Promise<number> {
    if (!prisma) {
        console.warn('Prisma not initialized, skipping health score calculation')
        return 100
    }

    try {
        // Get project details
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: {
                id: true,
                name: true,
                status: true,
                startDate: true,
                endDate: true,
                adminId: true
            }
        })

        if (!project) {
            console.warn(`Project ${projectId} not found`)
            return 100
        }

        // ============================================
        // COMPONENT A: Client Satisfaction (30%)
        // ============================================
        let clientSatisfactionScore = 60 // Default

        const recentFeedback = await prisma.clientFeedback.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' },
            take: 4
        })

        if (recentFeedback.length > 0) {
            const avgSatisfaction = recentFeedback.reduce((sum: number, fb: any) => sum + fb.satisfactionRating, 0) / recentFeedback.length
            // Map 1-5 to 0-100: (rating - 1) * 25
            clientSatisfactionScore = (avgSatisfaction - 1) * 25
        }

        // ============================================
        // COMPONENT B: Employee Confidence (25%)
        // ============================================
        let employeeConfidenceScore = 60 // Default

        const recentCheckIns = await prisma.employeeCheckIn.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' },
            take: 4
        })

        if (recentCheckIns.length > 0) {
            const avgConfidence = recentCheckIns.reduce((sum: number, ci: any) => sum + ci.confidenceLevel, 0) / recentCheckIns.length
            // Map 1-5 to 0-100: (confidence - 1) * 25
            employeeConfidenceScore = (avgConfidence - 1) * 25
        }

        // ============================================
        // COMPONENT C: Progress vs Timeline (25%)
        // ============================================
        let progressScore = 50 // Default

        const latestCheckIn = await prisma.employeeCheckIn.findFirst({
            where: { projectId },
            orderBy: { createdAt: 'desc' }
        })

        if (latestCheckIn) {
            const now = new Date()
            const startDate = new Date(project.startDate)
            const endDate = new Date(project.endDate)

            // Calculate expected progress
            const totalDuration = endDate.getTime() - startDate.getTime()
            const elapsed = now.getTime() - startDate.getTime()
            const expectedProgress = totalDuration > 0
                ? Math.min(100, Math.max(0, (elapsed / totalDuration) * 100))
                : 100

            // Calculate score based on actual vs expected
            const actualProgress = latestCheckIn.completionPercent
            const difference = expectedProgress - actualProgress

            // If actual >= expected, score is 100
            // If behind, subtract the difference (clamped to 0-100)
            const calculatedProgressScore = 100 - Math.max(0, Math.min(100, difference))
            if (!isNaN(calculatedProgressScore)) {
                progressScore = calculatedProgressScore
            }
        }

        // ============================================
        // COMPONENT D: Risk Penalty (20%)
        // ============================================
        let riskScore = 100 // Start at 100

        // Get open risks
        const openRisks = await prisma.risk.findMany({
            where: {
                projectId,
                status: 'OPEN'
            }
        })

        // Subtract points for each risk
        const highRisks = openRisks.filter((r: any) => r.severity === 'HIGH').length
        const mediumRisks = openRisks.filter((r: any) => r.severity === 'MEDIUM').length
        const lowRisks = openRisks.filter((r: any) => r.severity === 'LOW').length

        riskScore -= highRisks * 15
        riskScore -= mediumRisks * 8
        riskScore -= lowRisks * 3

        // Subtract points for flagged issues
        const flaggedIssues = recentFeedback.filter((fb: any) => fb.flaggedIssue).length
        riskScore -= flaggedIssues * 10

        // Clamp to minimum 0
        riskScore = Math.max(0, riskScore)

        // finalScore calculation
        let finalScore = Math.round(
            (clientSatisfactionScore * 0.30) +
            (employeeConfidenceScore * 0.25) +
            (progressScore * 0.25) +
            (riskScore * 0.20)
        )

        // Fallback if NaN
        if (isNaN(finalScore)) {
            console.error(`Health score calculation resulted in NaN for project ${projectId}. Components:`, {
                clientSatisfactionScore,
                employeeConfidenceScore,
                progressScore,
                riskScore
            })
            finalScore = 100
        }

        // Determine status from score
        const newStatus = getStatusLabel(finalScore)
        const currentStatus = project.status

        const updateData: any = { healthScore: finalScore }

        // If status changed, update and notify
        if (newStatus !== currentStatus && currentStatus !== 'COMPLETED') {
            updateData.status = newStatus

            // Log activity (fire and forget / handled)
            prisma.activityLog.create({
                data: {
                    projectId,
                    userId: project.adminId,
                    type: 'PROJECT_STATUS_CHANGED',
                    title: `Status changed to ${newStatus}`,
                    description: `Health score: ${finalScore}. Status automatically updated from ${currentStatus} to ${newStatus}.`
                }
            }).catch((e: any) => console.error('Failed to create status change activity log:', e))

            // Notify admin (fire and forget / handled)
            prisma.notification.create({
                data: {
                    userId: project.adminId,
                    title: 'Project Status Changed',
                    message: `Project "${project.name}" status changed to ${newStatus}`,
                    type: 'STATUS_CHANGE',
                    link: `/admin/projects/${projectId}`
                }
            }).catch((e: any) => console.error('Failed to create status change notification:', e))
        }

        // Final single update call
        await prisma.project.update({
            where: { id: projectId },
            data: updateData
        })

        return finalScore
    } catch (error) {
        console.error('Error calculating health score:', error)
        return 100
    }
}

/**
 * Get project status label based on health score
 */
export function getStatusLabel(score: number): ProjectStatus {
    if (score >= 80) return 'ON_TRACK'
    if (score >= 60) return 'AT_RISK'
    return 'CRITICAL'
}

/**
 * Get Tailwind CSS classes for status badge
 */
export function getStatusColor(status: ProjectStatus): string {
    switch (status) {
        case 'ON_TRACK':
            return 'text-green-600 bg-green-50'
        case 'AT_RISK':
            return 'text-yellow-600 bg-yellow-50'
        case 'CRITICAL':
            return 'text-red-600 bg-red-50'
        case 'COMPLETED':
            return 'text-blue-600 bg-blue-50'
        default:
            return 'text-gray-600 bg-gray-50'
    }
}
