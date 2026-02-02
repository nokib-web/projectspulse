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
