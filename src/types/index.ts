// Re-export Prisma enums for convenience
export type Role = 'ADMIN' | 'EMPLOYEE' | 'CLIENT'
export type ProjectStatus = 'ON_TRACK' | 'AT_RISK' | 'CRITICAL' | 'COMPLETED'
export type RiskSeverity = 'LOW' | 'MEDIUM' | 'HIGH'
export type RiskStatus = 'OPEN' | 'RESOLVED'
export type MilestoneStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE'
export type ActivityType =
    | 'CHECK_IN_SUBMITTED'
    | 'FEEDBACK_SUBMITTED'
    | 'RISK_CREATED'
    | 'RISK_RESOLVED'
    | 'PROJECT_STATUS_CHANGED'
    | 'MILESTONE_UPDATED'
    | 'PROJECT_CREATED'

