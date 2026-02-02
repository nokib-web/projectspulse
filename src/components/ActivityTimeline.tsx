'use client'

import React from 'react'
import {
    CheckCircle2,
    MessageSquare,
    AlertTriangle,
    RefreshCcw,
    Flag,
    Calendar,
    PlusCircle
} from 'lucide-react'

interface Activity {
    id: string
    type: string
    title: string
    description?: string | null
    createdAt: string
    user?: {
        name: string
    } | null
}

interface ActivityTimelineProps {
    activities: Activity[]
}

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ activities }) => {
    const getIcon = (type: string) => {
        switch (type) {
            case 'CHECK_IN_SUBMITTED':
                return <CheckCircle2 className="w-5 h-5 text-indigo-500" />
            case 'FEEDBACK_SUBMITTED':
                return <MessageSquare className="w-5 h-5 text-blue-500" />
            case 'RISK_CREATED':
                return <AlertTriangle className="w-5 h-5 text-red-500" />
            case 'RISK_RESOLVED':
                return <CheckCircle2 className="w-5 h-5 text-green-500" />
            case 'PROJECT_STATUS_CHANGED':
                return <RefreshCcw className="w-5 h-5 text-amber-500" />
            case 'MILESTONE_UPDATED':
                return <Flag className="w-5 h-5 text-purple-500" />
            case 'PROJECT_CREATED':
                return <PlusCircle className="w-5 h-5 text-emerald-500" />
            default:
                return <Calendar className="w-5 h-5 text-gray-400" />
        }
    }

    if (activities.length === 0) {
        return (
            <div className="py-12 text-center text-gray-500 font-medium">
                No recent activity found.
            </div>
        )
    }

    return (
        <div className="flow-root">
            <ul className="-mb-8">
                {activities.map((activity, idx) => (
                    <li key={activity.id}>
                        <div className="relative pb-8">
                            {idx !== activities.length - 1 && (
                                <span className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-800" aria-hidden="true" />
                            )}
                            <div className="relative flex items-start space-x-3">
                                <div className="relative">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm ring-8 ring-white dark:ring-gray-950">
                                        {getIcon(activity.type)}
                                    </div>
                                </div>
                                <div className="min-w-0 flex-1 py-1.5">
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        <span className="font-semibold text-gray-900 dark:text-white mr-2">
                                            {activity.title}
                                        </span>
                                        {activity.user?.name && (
                                            <span className="inline-flex items-center text-gray-600 dark:text-gray-300">
                                                by {activity.user.name}
                                            </span>
                                        )}
                                        <span className="ml-2 whitespace-nowrap">
                                            {new Date(activity.createdAt).toLocaleDateString()} at {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    {activity.description && (
                                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 leading-relaxed italic bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg border-l-2 border-gray-200 dark:border-gray-700">
                                            {activity.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default ActivityTimeline
