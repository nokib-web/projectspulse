'use client'

import React, { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import { CLIENT_LINKS } from '@/config/navLinks'
import Card from '@/components/Card'
import Spinner from '@/components/Spinner'
import { StatusBadge, Badge } from '@/components/Badge'
import { useToast } from '@/components/ToastContainer'
import {
    Folder,
    TrendingUp,
    MessageCircle,
    AlertCircle,
    ChevronRight,
    ShieldCheck
} from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

export default function ClientDashboard() {
    const [loading, setLoading] = useState(true)
    const [projects, setProjects] = useState<any[]>([])
    const { user } = useAuth()
    const { toast } = useToast()

    useEffect(() => {
        const fetchMyProjects = async () => {
            try {
                const res = await fetch('/api/projects')
                const result = await res.json()
                if (result.success) setProjects(result.data)
            } catch (err) {
                toast('Failed to load your projects', 'error')
            } finally {
                setLoading(false)
            }
        }
        fetchMyProjects()
    }, [])

    const criticalProjects = projects.filter(p => p.status === 'CRITICAL')

    if (loading) {
        return (
            <ProtectedRoute allowedRoles={['CLIENT']}>
                <AppLayout links={CLIENT_LINKS} title="Partnership Overview">
                    <div className="flex h-64 items-center justify-center">
                        <Spinner size="lg" />
                    </div>
                </AppLayout>
            </ProtectedRoute>
        )
    }

    return (
        <ProtectedRoute allowedRoles={['CLIENT']}>
            <AppLayout links={CLIENT_LINKS} title="Client Dashboard">
                <div className="space-y-8 animate-in fade-in duration-500">

                    {/* Partnership Banner */}
                    <div className="bg-gray-900 rounded-3xl p-10 text-white relative overflow-hidden shadow-2xl">
                        <div className="relative z-10 max-w-2xl">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="px-3 py-1 bg-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">Enterprise Partner</div>
                                <div className="text-gray-400 text-xs font-bold uppercase tracking-widest flex items-center">
                                    <ShieldCheck className="w-3 h-3 mr-1 text-green-500" /> Active Engagement
                                </div>
                            </div>
                            <h2 className="text-4xl font-black mb-4 leading-tight">Your Projects, <br /><span className="text-indigo-500">Crystal Clear.</span></h2>
                            <p className="text-gray-400 font-medium text-lg leading-relaxed">
                                Real-time visibility into your initiatives. Track health, review milestones, and provide feedback directly to our delivery teams.
                            </p>
                        </div>
                        {/* Decorative Abstraction */}
                        <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-indigo-900/40 to-transparent pointer-events-none" />
                        <div className="absolute top-1/2 right-20 -translate-y-1/2 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl" />
                    </div>

                    {/* Critical Alerts */}
                    {criticalProjects.length > 0 && (
                        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-900/40 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse">
                            <div className="flex items-center space-x-4">
                                <div className="p-3 bg-red-100 rounded-xl text-red-600">
                                    <AlertCircle className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="text-red-900 dark:text-red-200 font-black text-lg">Attention Required</h4>
                                    <p className="text-red-700 dark:text-red-300 text-sm font-medium">{criticalProjects.length} project(s) are currently in critical health status.</p>
                                </div>
                            </div>
                            <Link href="/client/projects" className="px-6 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all shadow-lg shadow-red-100">
                                Review Projects
                            </Link>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                        {/* Project Hub */}
                        <div className="lg:col-span-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center uppercase tracking-tight">
                                    <Folder className="w-5 h-5 mr-3 text-indigo-500" /> Current Initiatives
                                </h3>
                            </div>

                            {projects.length === 0 ? (
                                <Card className="text-center py-20 text-gray-400 italic font-medium">No projects are currently active for your account.</Card>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {projects.map((p) => (
                                        <Card key={p.id} className={`group hover:shadow-2xl transition-all duration-500 p-6 ${p.status === 'CRITICAL' ? 'border-red-100 dark:border-red-900/40' : 'border-gray-50 dark:border-gray-800'}`}>
                                            <div className="flex justify-between items-start mb-6">
                                                <StatusBadge status={p.status} />
                                                <div className="text-right">
                                                    <div className="text-[10px] font-black text-gray-400 uppercase mb-1">Health Score</div>
                                                    <div className={`text-xl font-black ${p.healthScore >= 80 ? 'text-green-600' : p.healthScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                        {p.healthScore}%
                                                    </div>
                                                </div>
                                            </div>
                                            <h4 className="text-lg font-black text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{p.name}</h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-6 font-medium leading-relaxed">
                                                {p.description || "Active partnership project focus on delivery excellence."}
                                            </p>

                                            <div className="pt-6 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between">
                                                <div className="text-[10px] font-black text-gray-400 uppercase">
                                                    Last Feedback: <span className="text-gray-900 dark:text-white">{p.feedback?.[0] ? new Date(p.feedback[0].createdAt).toLocaleDateString() : 'None'}</span>
                                                </div>
                                                <Link href={`/client/projects/${p.id}`} className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-all">
                                                    <ChevronRight className="w-5 h-5" />
                                                </Link>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Quick Actions / Highlights */}
                        <div className="lg:col-span-4 space-y-8">

                            <Card title="Quick Stats" className="bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800">
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center space-x-3">
                                            <TrendingUp className="w-5 h-5 text-green-500" />
                                            <span className="text-sm font-bold text-gray-600 dark:text-gray-300">Active Phase</span>
                                        </div>
                                        <span className="font-black text-indigo-600 dark:text-indigo-400">{projects.length}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center space-x-3">
                                            <MessageCircle className="w-5 h-5 text-indigo-500" />
                                            <span className="text-sm font-bold text-gray-600 dark:text-gray-300">Feedback Logs</span>
                                        </div>
                                        <span className="font-black text-indigo-600 dark:text-indigo-400">{projects.reduce((s, p) => s + (p.feedback?.length || 0), 0)}</span>
                                    </div>
                                </div>
                            </Card>

                            {/* Action Prompt */}
                            <div className="p-8 bg-indigo-600 rounded-3xl text-white shadow-xl shadow-indigo-100 relative overflow-hidden flex flex-col items-center text-center">
                                <MessageCircle className="w-12 h-12 mb-4 opacity-50" />
                                <h4 className="text-xl font-black mb-2">Share Your Thoughts</h4>
                                <p className="text-indigo-100 text-sm font-medium mb-6 leading-relaxed">Your feedback directly influences our weekly performance score.</p>
                                <Link
                                    href="/client/feedback"
                                    className="w-full py-3 bg-white text-indigo-600 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-gray-50 transition-all"
                                >
                                    Send Feedback
                                </Link>
                            </div>

                        </div>

                    </div>
                </div>
            </AppLayout>
        </ProtectedRoute>
    )
}
