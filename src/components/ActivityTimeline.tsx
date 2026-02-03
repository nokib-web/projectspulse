'use client'

import React, { useState, useEffect } from 'react'
import {
    CheckCircle,
    MessageCircle,
    AlertOctagon,
    ShieldCheck,
    RefreshCw,
    Flag,
    Plus,
    Calendar
} from 'lucide-react'

interface Activity {
    id: string
    type: string
    title: string
    description?: string | null
    createdAt: string
    userId?: string
}

interface ActivityTimelineProps {
    projectId: string
    activities?: Activity[]
}

const formatRelativeTime = (date: string | Date) => {
    const now = new Date()
    const then = new Date(date)
    const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`
    return `${Math.floor(diffInSeconds / 31536000)} years ago`
}

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ projectId, activities: initialActivities }) => {
    const [activities, setActivities] = useState<Activity[]>(initialActivities || [])
    const [loading, setLoading] = useState(!initialActivities)

    useEffect(() => {
        if (initialActivities) return

        const fetchActivities = async () => {
            try {
                const res = await fetch(`/api/projects/${projectId}/activity`)
                const result = await res.json()
                if (result.success) {
                    setActivities(result.data)
                }
            } catch (error) {
                console.error('Failed to fetch activities:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchActivities()
    }, [projectId])

    const getIcon = (type: string) => {
        switch (type) {
            case 'CHECK_IN_SUBMITTED':
                return <CheckCircle className="w-5 h-5 text-green-500" />
            case 'FEEDBACK_SUBMITTED':
                return <MessageCircle className="w-5 h-5 text-blue-500" />
            case 'RISK_CREATED':
                return <AlertOctagon className="w-5 h-5 text-orange-500" />
            case 'RISK_RESOLVED':
                return <ShieldCheck className="w-5 h-5 text-green-500" />
            case 'PROJECT_STATUS_CHANGED':
                return <RefreshCw className="w-5 h-5 text-indigo-500" />
            case 'MILESTONE_UPDATED':
                return <Flag className="w-5 h-5 text-purple-500" />
            case 'PROJECT_CREATED':
                return <Plus className="w-5 h-5 text-indigo-500" />
            default:
                return <Calendar className="w-5 h-5 text-gray-400" />
        }
    }

    if (loading) {
        return (
            <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-4 animate-pulse">
                        <div className="flex flex-col items-center">
                            <div className="w-[10px] h-[10px] rounded-full bg-gray-200 border-2 border-gray-300" />
                            <div className="w-px h-full bg-gray-200" />
                        </div>
                        <div className="flex-1 bg-gray-100 h-24 rounded-lg border border-gray-200" />
                    </div>
                ))}
            </div>
        )
    }

    if (activities.length === 0) {
        return (
            <div className="py-12 text-center bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm rounded-2xl">
                <div className="bg-indigo-50 dark:bg-indigo-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-indigo-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium px-6 italic">
                    No activity yet. Check-ins, feedback, and risk updates will appear here.
                </p>
            </div>
        )
    }

    return (
        <div className="relative">
            {/* Vertical line - 1px indigo-200 */}
            <div className="absolute left-[4.5px] top-3 bottom-0 w-px bg-indigo-200 dark:bg-indigo-900/50" />

            <div className="space-y-6">
                {activities.map((activity, index) => (
                    <div key={activity.id} className="relative flex gap-4 md:gap-6 group">
                        {/* Timeline Dot - 10px circle, indigo-600 border, white fill */}
                        <div className="flex flex-col items-center pt-[11px] relative z-10">
                            <div className="w-[10px] h-[10px] flex-shrink-0 rounded-full bg-white dark:bg-gray-950 border-2 border-indigo-600 shadow-sm" />
                        </div>

                        {/* Activity Card - alternating bg white/gray-50 */}
                        <div className={`flex-1 border border-gray-200 dark:border-gray-800 rounded-lg p-4 shadow-sm transition-all hover:border-indigo-200 dark:hover:border-indigo-500/50 ${index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'
                            }`}>
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 flex-shrink-0">{getIcon(activity.type)}</div>
                                    <div className="min-w-0">
                                        <h4 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
                                            {activity.title}
                                        </h4>
                                        {activity.description && (
                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                                                {activity.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap pt-1 sm:text-right">
                                    {formatRelativeTime(activity.createdAt)}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default ActivityTimeline
