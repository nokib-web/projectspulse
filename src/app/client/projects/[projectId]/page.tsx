'use client'

import React, { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import { CLIENT_LINKS } from '@/config/navLinks'
import Card from '@/components/Card'
import Spinner from '@/components/Spinner'
import { StatusBadge, Badge } from '@/components/Badge'
import ActivityTimeline from '@/components/ActivityTimeline'
import {
    Target,
    Flag,
    History,
    ArrowLeft,
    Layout,
    Clock,
    TrendingUp,
    ShieldAlert
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

type TabType = 'Overview' | 'Milestones' | 'Activity'

export default function ClientProjectDetail() {
    const { projectId } = useParams()
    const [loading, setLoading] = useState(true)
    const [project, setProject] = useState<any>(null)
    const [activeTab, setActiveTab] = useState<TabType>('Overview')

    useEffect(() => {
        const fetchProjectDetails = async () => {
            try {
                const res = await fetch(`/api/projects/${projectId}`)
                const result = await res.json()
                if (result.success) setProject(result.data)
            } catch (err) {
                console.error('Fetch error')
            } finally {
                setLoading(false)
            }
        }
        fetchProjectDetails()
    }, [projectId])

    if (loading) {
        return (
            <ProtectedRoute allowedRoles={['CLIENT']}>
                <AppLayout links={CLIENT_LINKS} title="Project Details">
                    <div className="flex h-96 items-center justify-center">
                        <Spinner size="lg" />
                    </div>
                </AppLayout>
            </ProtectedRoute>
        )
    }

    if (!project) return null

    const tabs: { name: TabType; icon: any }[] = [
        { name: 'Overview', icon: Layout },
        { name: 'Milestones', icon: Flag },
        { name: 'Activity', icon: History }
    ]

    return (
        <ProtectedRoute allowedRoles={['CLIENT']}>
            <AppLayout links={CLIENT_LINKS} title={project.name}>
                <div className="space-y-6 max-w-6xl mx-auto">

                    {/* Partnership Banner Header */}
                    <div className="relative p-8 bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden mb-8">
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                            <div className="flex items-center space-x-6">
                                <Link href="/client/projects" className="p-3 bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-2xl transition-all">
                                    <ArrowLeft className="w-6 h-6" />
                                </Link>
                                <div>
                                    <h1 className="text-3xl font-black text-gray-900 leading-tight mb-2">{project.name}</h1>
                                    <div className="flex items-center space-x-3">
                                        <StatusBadge status={project.status} />
                                        <span className="text-xs text-gray-400 font-bold uppercase tracking-widest bg-gray-50 px-2 py-1 rounded">Update Daily</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center bg-gray-50/50 p-6 rounded-3xl border border-gray-100 space-x-8">
                                <div className="text-center">
                                    <p className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Live Health</p>
                                    <div className={`text-4xl font-black ${project.healthScore >= 80 ? 'text-green-600' : project.healthScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                                        {project.healthScore}%
                                    </div>
                                </div>
                                <div className="h-12 w-px bg-gray-200" />
                                <div className="text-center">
                                    <p className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Completion</p>
                                    <div className="text-4xl font-black text-gray-900">
                                        {project.milestones?.length > 0 ? Math.round((project.milestones.filter((m: any) => m.status === 'COMPLETED').length / project.milestones.length) * 100) : 0}%
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 w-1/4 h-full bg-gradient-to-l from-indigo-50/20 to-transparent pointer-events-none" />
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center space-x-2 border-b border-gray-100 mb-8 overflow-x-auto">
                        {tabs.map((tab) => {
                            const TabIcon = tab.icon
                            const active = activeTab === tab.name
                            return (
                                <button
                                    key={tab.name}
                                    onClick={() => setActiveTab(tab.name)}
                                    className={`flex items-center px-8 py-4 text-sm font-black transition-all border-b-2 whitespace-nowrap ${active
                                            ? 'border-indigo-600 text-indigo-700 bg-indigo-50/30'
                                            : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    <TabIcon className="w-4 h-4 mr-2" />
                                    {tab.name}
                                </button>
                            )
                        })}
                    </div>

                    {/* Content Area */}
                    <div className="animate-in fade-in duration-500">
                        {activeTab === 'Overview' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-8">
                                    <Card className="p-8">
                                        <h3 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] mb-4">Executive Summary</h3>
                                        <p className="text-gray-700 text-lg leading-relaxed mb-10 font-medium">
                                            {project.description || "Engagement initiative focused on digital transformation and delivery excellence."}
                                        </p>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-t border-gray-50">
                                            <div className="flex items-start">
                                                <Clock className="w-5 h-5 text-indigo-500 mr-4 mt-1" />
                                                <div>
                                                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Contract Timeline</p>
                                                    <p className="font-bold text-gray-900">{new Date(project.startDate).toLocaleDateString()} — {new Date(project.endDate).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start">
                                                <TrendingUp className="w-5 h-5 text-indigo-500 mr-4 mt-1" />
                                                <div>
                                                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Project Phase</p>
                                                    <p className="font-bold text-gray-900">Execution & Monitoring</p>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>

                                    {/* Latest Updates (Restricted View) */}
                                    <Card title="Latest Team Visibility" className="bg-gray-50 border-gray-100">
                                        <div className="space-y-4">
                                            {project.checkins?.slice(0, 3).map((ci: any) => (
                                                <div key={ci.id} className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-xs font-black text-indigo-600 uppercase">Update Registry</span>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase">{new Date(ci.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="text-gray-700 text-sm font-medium line-clamp-2 italic">"{ci.progressSummary}"</p>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                </div>

                                <div className="space-y-8">
                                    <Card title="Your Partners" className="bg-white border-gray-100 shadow-xl shadow-gray-100">
                                        <div className="space-y-4">
                                            <div className="flex items-center p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                                                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black mr-3">
                                                    {project.admin?.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-gray-900">{project.admin?.name}</p>
                                                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Key Account Manager</p>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>

                                    <div className="p-8 bg-gray-950 rounded-3xl text-white relative overflow-hidden group">
                                        <ShieldAlert className="w-12 h-12 mb-4 opacity-50 text-indigo-400" />
                                        <h4 className="text-xl font-black mb-2">Quality Assurance</h4>
                                        <p className="text-gray-400 text-sm font-medium leading-relaxed mb-6">Our algorithms calculate health based on real-time team inputs and risk registries.</p>
                                        <Link href="/client/feedback" className="w-full block py-3 bg-indigo-600 rounded-xl text-center font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all">Submit Feedback</Link>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'Milestones' && (
                            <Card title="Engagement Roadmap">
                                <div className="relative pl-10 space-y-12 mt-6">
                                    <div className="absolute left-4 top-4 bottom-4 w-1 bg-gray-50 rounded-full" />
                                    {project.milestones?.length === 0 ? (
                                        <p className="text-gray-400 italic text-center py-20 font-medium">No roadmap milestones have been published yet.</p>
                                    ) : project.milestones.map((ms: any) => (
                                        <div key={ms.id} className="relative">
                                            <div className={`absolute -left-[35px] top-1.5 w-6 h-6 rounded-full border-4 border-white ring-2 ${ms.status === 'COMPLETED' ? 'bg-green-500 ring-green-100 shadow-md shadow-green-100' : 'bg-gray-200 ring-gray-100'
                                                } flex items-center justify-center`}>
                                                {ms.status === 'COMPLETED' && <TrendingUp className="w-3 h-3 text-white" />}
                                            </div>
                                            <div className={`p-6 rounded-3xl border transition-all ${ms.status === 'COMPLETED' ? 'bg-green-50/30 border-green-100' : 'bg-white border-gray-100 shadow-sm'}`}>
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                                    <h4 className={`text-xl font-black ${ms.status === 'COMPLETED' ? 'text-green-900 uppercase tracking-tight' : 'text-gray-900 tracking-tight'}`}>{ms.title}</h4>
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{new Date(ms.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                </div>
                                                <p className="text-gray-600 text-sm font-medium leading-relaxed max-w-2xl">{ms.description}</p>
                                                <div className="mt-6">
                                                    <Badge variant={ms.status === 'COMPLETED' ? 'success' : 'info'}>{ms.status.replace('_', ' ')}</Badge>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {activeTab === 'Activity' && (
                            <Card title="Partnership Logistics & Logs">
                                <ActivityTimeline activities={project.activityLogs?.filter((l: any) => l.type !== 'RISK_CREATED') || []} />
                            </Card>
                        )}
                    </div>
                </div>
            </AppLayout>
        </ProtectedRoute>
    )
}
