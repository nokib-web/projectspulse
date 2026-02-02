import prisma from './db'

/**
 * Recalculates the health score for a project based on:
 * - Recent check-in confidence levels
 * - Client feedback satisfaction ratings
 * - Open risks (especially HIGH severity)
 * - Flagged issues
 */
export async function recalcHealthScore(projectId: string): Promise<number> {
    if (!prisma) {
        console.warn('Prisma not initialized, skipping health score calculation')
        return 100
    }

    try {
        // Get recent check-ins (last 4 weeks)
        const recentCheckIns = await prisma.employeeCheckIn.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' },
            take: 10
        })

        // Get recent feedback (last 4 weeks)
        const recentFeedback = await prisma.clientFeedback.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' },
            take: 10
        })

        // Get open risks
        const openRisks = await prisma.risk.findMany({
            where: {
                projectId,
                status: 'OPEN'
            }
        })

        let score = 100

        // Factor 1: Check-in confidence (weight: 30%)
        if (recentCheckIns.length > 0) {
            const avgConfidence = recentCheckIns.reduce((sum, ci) => sum + ci.confidenceLevel, 0) / recentCheckIns.length
            // Scale from 1-5 to impact on score
            const confidenceImpact = ((avgConfidence - 3) / 2) * 30
            score += confidenceImpact
        }

        // Factor 2: Client satisfaction (weight: 30%)
        if (recentFeedback.length > 0) {
            const avgSatisfaction = recentFeedback.reduce((sum, fb) => sum + fb.satisfactionRating, 0) / recentFeedback.length
            const satisfactionImpact = ((avgSatisfaction - 3) / 2) * 30
            score += satisfactionImpact
        }

        // Factor 3: Open risks (weight: 40%)
        const highRisks = openRisks.filter(r => r.severity === 'HIGH').length
        const mediumRisks = openRisks.filter(r => r.severity === 'MEDIUM').length
        const lowRisks = openRisks.filter(r => r.severity === 'LOW').length

        score -= (highRisks * 15)
        score -= (mediumRisks * 8)
        score -= (lowRisks * 3)

        // Factor 4: Flagged issues
        const flaggedIssues = recentFeedback.filter(fb => fb.flaggedIssue).length
        score -= (flaggedIssues * 10)

        // Clamp score between 0 and 100
        score = Math.max(0, Math.min(100, Math.round(score)))

        // Update the project
        await prisma.project.update({
            where: { id: projectId },
            data: { healthScore: score }
        })

        return score
    } catch (error) {
        console.error('Error calculating health score:', error)
        return 100
    }
}

/**
 * Get current ISO week number and year
 */
export function getCurrentWeekAndYear(): { weekNumber: number; year: number } {
    const now = new Date()
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000))
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7)

    return {
        weekNumber,
        year: now.getFullYear()
    }
}
