'use client'

import React, { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import { EMPLOYEE_LINKS } from '@/config/navLinks'
import Card from '@/components/Card'
import Spinner from '@/components/Spinner'
import { StatusBadge, Badge } from '@/components/Badge'
import { useToast } from '@/components/ToastContainer'
import {
    Plus,
    Clock,
    AlertTriangle,
    Folder,
    CheckSquare,
    ChevronRight,
    TrendingUp
} from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

export default function EmployeeDashboard() {
    const [loading, setLoading] = useState(true)
    const [projects, setProjects] = useState<any[]>([])
    const { user } = useAuth()
    const { toast } = useToast()

    useEffect(() => {
        const fetchMyProjects = async () => {
            try {
                const res = await fetch('/api/projects') // The API should filter based on token, but let's double check
                const result = await res.json()
                if (result.success) {
                    setProjects(result.data)
                }
            } catch (err) {
                toast('Failed to load your projects', 'error')
            } finally {
                setLoading(false)
            }
        }

        fetchMyProjects()
    }, [])

    const checkInPending = (p: any) => {
        // Basic logic: Check if a check-in exists for this employee for the current week
        // For now, check if no check-in exists in the last 7 days
        const oneWeekAgo = new Date()
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
        return !p.checkins?.some((c: any) => c.employeeId === user?.id && new Date(c.createdAt) >= oneWeekAgo)
    }

    const openRisksCount = projects.reduce((sum, p) =>
        sum + (p.risks?.filter((r: any) => r.status === 'OPEN').length || 0), 0
    )

    if (loading) {
        return (
            <ProtectedRoute allowedRoles={['EMPLOYEE']}>
                <AppLayout links={EMPLOYEE_LINKS} title="My Dashboard">
                    <div className="flex h-64 items-center justify-center">
                        <Spinner size="lg" />
                    </div>
                </AppLayout>
            </ProtectedRoute>
        )
    }

    return (
        <ProtectedRoute allowedRoles={['EMPLOYEE']}>
            <AppLayout links={EMPLOYEE_LINKS} title="Employee Dashboard">
                <div className="space-y-8 animate-in fade-in duration-500">

                    {/* Welcome Header */}
                    <div className="bg-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
                        <div className="relative z-10">
                            <h2 className="text-3xl font-bold mb-2">Welcome Back, {user?.name.split(' ')[0]}!</h2>
                            <p className="text-indigo-100 font-medium">You have {projects.length} active project{projects.length !== 1 ? 's' : ''} and {openRisksCount} open risk{openRisksCount !== 1 ? 's' : ''} to manage.</p>
                        </div>
                        {/* Decorative Circles */}
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500 rounded-full opacity-20" />
                        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-indigo-400 rounded-full opacity-20" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* Project List */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                                    <Folder className="w-5 h-5 mr-3 text-indigo-500" /> My Active Projects
                                </h3>
                                <Link href="/employee/projects" className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">View All</Link>
                            </div>

                            {projects.length === 0 ? (
                                <Card className="text-center py-12 text-gray-400 italic">You aren't assigned to any projects yet.</Card>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {projects.slice(0, 4).map((p) => {
                                        const isPending = checkInPending(p)
                                        return (
                                            <Card key={p.id} className="hover:border-indigo-200 dark:hover:border-indigo-800 transition-all group p-5">
                                                <div className="flex justify-between mb-4">
                                                    <StatusBadge status={p.status} />
                                                    {isPending && (
                                                        <span className="flex h-2 w-2 relative">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" title="Check-in Due"></span>
                                                        </span>
                                                    )}
                                                </div>
                                                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                    {p.name}
                                                </h4>
                                                <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-4">
                                                    <span className="flex items-center">
                                                        <TrendingUp className="w-3 h-3 mr-1 text-green-500" /> {p.healthScore}% Health
                                                    </span>
                                                    <span className="flex items-center">
                                                        <CheckSquare className="w-3 h-3 mr-1 text-indigo-500" /> {p.checkins?.length || 0} Logs
                                                    </span>
                                                </div>
                                                <Link
                                                    href={`/employee/projects/${p.id}`}
                                                    className="w-full flex items-center justify-center p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 font-bold text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/40 hover:text-indigo-700 dark:hover:text-indigo-400 hover:border-indigo-100 dark:hover:border-indigo-800 transition-all"
                                                >
                                                    Manage Project <ChevronRight className="w-4 h-4 ml-2" />
                                                </Link>
                                            </Card>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Right Side Column */}
                        <div className="space-y-8">

                            {/* Summary Stats */}
                            <Card title="Engagement Summary" className="bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/30">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 mr-3">
                                                <CheckSquare className="w-4 h-4" />
                                            </div>
                                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Total Updates</span>
                                        </div>
                                        <span className="font-black text-gray-900 dark:text-white">{projects.reduce((s, p) => s + (p.checkins?.filter((c: any) => c.employeeId === user?.id).length || 0), 0)}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 mr-3">
                                                <AlertTriangle className="w-4 h-4" />
                                            </div>
                                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Open Risks</span>
                                        </div>
                                        <span className="font-black text-gray-900 dark:text-white">{openRisksCount}</span>
                                    </div>
                                </div>
                            </Card>

                            {/* Action Banner */}
                            <div className="p-6 bg-amber-50 dark:bg-amber-900/20 rounded-3xl border border-amber-100 dark:border-amber-900/30 relative overflow-hidden group">
                                <div className="relative z-10">
                                    <h4 className="text-amber-800 dark:text-amber-200 font-black text-lg mb-2">Weekly Check-in</h4>
                                    <p className="text-amber-700/80 dark:text-amber-400/80 text-sm font-medium mb-4 leading-relaxed">Keep your project manager aligned with your progress.</p>
                                    <Link
                                        href="/employee/checkins"
                                        className="inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-xl font-bold text-sm hover:bg-amber-700 transition-all shadow-lg shadow-amber-200 dark:shadow-none"
                                    >
                                        <Plus className="w-4 h-4 mr-2" /> Submit Now
                                    </Link>
                                </div>
                                <Clock className="absolute -bottom-4 -right-4 w-24 h-24 text-amber-200/50 dark:text-amber-900/20 group-hover:scale-110 transition-transform duration-500" />
                            </div>

                        </div>
                    </div>
                </div>
            </AppLayout>
        </ProtectedRoute>
    )
}
