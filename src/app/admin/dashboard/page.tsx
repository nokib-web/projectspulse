'use client'

import React, { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import { ADMIN_LINKS } from '@/config/navLinks'
import Card from '@/components/Card'
import Spinner from '@/components/Spinner'
import { StatusBadge } from '@/components/Badge'
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend
} from 'recharts'
import { Folder, Users, AlertCircle, Clock } from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboard() {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<{
        stats: {
            totalProjects: number
            activeProjects: number
            highRiskProjects: number
            pendingCheckins: number
        }
        statusDistribution: { name: string, value: number, color: string }[]
        missingCheckins: any[]
        highRiskProjects: any[]
    } | null>(null)

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const res = await fetch('/api/projects')
                const result = await res.json()

                if (result.success) {
                    const projects = result.data

                    // Basic Stats
                    const totalProjects = projects.length
                    const activeProjects = projects.filter((p: any) => p.status !== 'COMPLETED').length
                    const highRiskProjects = projects.filter((p: any) => p.status === 'CRITICAL').length

                    // Pending Check-ins (Simulated logic: for each project, check if any assigned employee hasn't checked in this week)
                    // In practice, this would involve comparing project.employees with project.checkins for the current week.
                    // For now, we'll mark projects with no check-ins in the last 7 days as pending.
                    const oneWeekAgo = new Date()
                    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

                    const pendingCheckins = projects.filter((p: any) => {
                        if (p.employees.length === 0) return false
                        const recentCheckins = p.checkins?.filter((c: any) => new Date(c.createdAt) >= oneWeekAgo) || []
                        return recentCheckins.length < p.employees.length
                    }).length

                    // Status Distribution for Pie Chart
                    const statusCounts = projects.reduce((acc: any, p: any) => {
                        acc[p.status] = (acc[p.status] || 0) + 1
                        return acc
                    }, {})

                    const statusDistribution = [
                        { name: 'On Track', value: statusCounts['ON_TRACK'] || 0, color: '#059669' }, // green-600
                        { name: 'At Risk', value: statusCounts['AT_RISK'] || 0, color: '#D97706' },  // amber-600
                        { name: 'Critical', value: statusCounts['CRITICAL'] || 0, color: '#DC2626' }, // red-600
                        { name: 'Completed', value: statusCounts['COMPLETED'] || 0, color: '#2563EB' } // blue-600
                    ].filter(item => item.value > 0)

                    // Missing check-ins list
                    const missingCheckinsList = projects.filter((p: any) => {
                        if (p.employees.length === 0) return false
                        return !p.checkins?.some((c: any) => new Date(c.createdAt) >= oneWeekAgo)
                    }).slice(0, 5)

                    // High Risk Projects
                    const highRiskList = projects
                        .filter((p: any) => p.status === 'CRITICAL' || p.risks?.some((r: any) => r.severity === 'HIGH' && r.status === 'OPEN'))
                        .map((p: any) => ({
                            id: p.id,
                            name: p.name,
                            healthScore: p.healthScore,
                            highRisks: p.risks?.filter((r: any) => r.severity === 'HIGH' && r.status === 'OPEN').length || 0
                        }))
                        .slice(0, 5)

                    setData({
                        stats: { totalProjects, activeProjects, highRiskProjects, pendingCheckins },
                        statusDistribution,
                        missingCheckins: missingCheckinsList,
                        highRiskProjects: highRiskList
                    })
                }
            } catch (error) {
                console.error('Dashboard fetch error:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchDashboardData()
    }, [])

    if (loading) {
        return (
            <ProtectedRoute allowedRoles={['ADMIN']}>
                <AppLayout links={ADMIN_LINKS} title="Admin Dashboard">
                    <div className="flex h-64 items-center justify-center">
                        <Spinner size="lg" />
                    </div>
                </AppLayout>
            </ProtectedRoute>
        )
    }

    return (
        <ProtectedRoute allowedRoles={['ADMIN']}>
            <AppLayout links={ADMIN_LINKS} title="Admin Dashboard">
                <div className="space-y-8 animate-in fade-in duration-500">

                    {/* Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="flex items-center space-x-4">
                            <div className="p-3 bg-indigo-50 rounded-lg">
                                <Folder className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Projects</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{data?.stats.totalProjects}</p>
                            </div>
                        </Card>
                        <Card className="flex items-center space-x-4">
                            <div className="p-3 bg-green-50 rounded-lg">
                                <Folder className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Projects</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{data?.stats.activeProjects}</p>
                            </div>
                        </Card>
                        <Card className="flex items-center space-x-4 border-l-4 border-l-red-500">
                            <div className="p-3 bg-red-50 rounded-lg">
                                <AlertCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">High Risk</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{data?.stats.highRiskProjects}</p>
                            </div>
                        </Card>
                        <Card className="flex items-center space-x-4">
                            <div className="p-3 bg-yellow-50 rounded-lg">
                                <Clock className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Check-ins</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{data?.stats.pendingCheckins}</p>
                            </div>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Status Distribution Chart */}
                        <Card title="Projects by Health Status">
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={data?.statusDistribution}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {data?.statusDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        {/* High-Risk Projects List */}
                        <Card title="Critical Projects">
                            <div className="space-y-4">
                                {data?.highRiskProjects.length === 0 ? (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">No high-risk projects currently.</p>
                                ) : (
                                    data?.highRiskProjects.map((p) => (
                                        <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                            <div>
                                                <Link href={`/admin/projects/${p.id}`} className="text-sm font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400">
                                                    {p.name}
                                                </Link>
                                                <p className="text-xs text-red-500 dark:text-red-400 mt-1 font-medium">{p.highRisks} High Severity Risks</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Health Score</div>
                                                <div className={`text-sm font-bold ${p.healthScore < 60 ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                                                    {p.healthScore}/100
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Missing Check-ins List */}
                    <Card title="Check-in Alerts">
                        <div className="space-y-3">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Projects with missing employee check-ins this week:</p>
                            {data?.missingCheckins.length === 0 ? (
                                <div className="p-8 text-center bg-gray-50 dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium italic">All projects have check-ins submitted!</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {data?.missingCheckins.map((p) => (
                                        <Link
                                            key={p.id}
                                            href={`/admin/projects/${p.id}`}
                                            className="flex items-center p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/40 text-orange-800 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors group"
                                        >
                                            <Clock className="w-5 h-5 mr-3 text-orange-600 dark:text-orange-500" />
                                            <span className="text-sm font-semibold group-hover:underline">{p.name}</span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </AppLayout>
        </ProtectedRoute>
    )
}
