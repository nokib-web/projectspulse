'use client'

import React, { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import { EMPLOYEE_LINKS } from '@/config/navLinks'
import Card from '@/components/Card'
import Spinner from '@/components/Spinner'
import { StatusBadge, Badge } from '@/components/Badge'
import { useToast } from '@/components/ToastContainer'
import ActivityTimeline from '@/components/ActivityTimeline'
import Modal from '@/components/Modal'
import {
    Target,
    Clock,
    AlertTriangle,
    Flag,
    History,
    Plus,
    ArrowLeft,
    Calendar,
    CheckCircle2
} from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

type TabType = 'Overview' | 'My Updates' | 'Risks' | 'Milestones' | 'Activity'

export default function EmployeeProjectDetail() {
    const { projectId } = useParams()
    const [loading, setLoading] = useState(true)
    const [project, setProject] = useState<any>(null)
    const [activeTab, setActiveTab] = useState<TabType>('Overview')
    const { toast } = useToast()
    const { user } = useAuth()
    const router = useRouter()

    const [isRiskModalOpen, setIsRiskModalOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    const fetchProjectDetails = async () => {
        try {
            const res = await fetch(`/api/projects/${projectId}`)
            const result = await res.json()
            if (result.success) {
                setProject(result.data)
            } else {
                toast(result.error || 'Failed to load details', 'error')
            }
        } catch (err) {
            toast('Internal server error', 'error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchProjectDetails()
    }, [projectId])

    const handleAddRisk = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setSubmitting(true)
        const formData = new FormData(e.currentTarget)
        const body = Object.fromEntries(formData.entries())

        try {
            const res = await fetch(`/api/projects/${projectId}/risks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...body,
                    impactScore: parseInt(body.impactScore as string)
                })
            })
            const result = await res.json()
            if (result.success) {
                toast('Risk flagged successfully', 'success')
                setIsRiskModalOpen(false)
                fetchProjectDetails()
            } else {
                toast(result.error || 'Failed to record risk', 'error')
            }
        } catch (err) {
            toast('Network error', 'error')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <ProtectedRoute allowedRoles={['EMPLOYEE']}>
                <AppLayout links={EMPLOYEE_LINKS} title="Project View">
                    <div className="flex h-96 items-center justify-center">
                        <Spinner size="lg" />
                    </div>
                </AppLayout>
            </ProtectedRoute>
        )
    }

    if (!project) return null

    const tabs: { name: TabType; icon: any }[] = [
        { name: 'Overview', icon: Target },
        { name: 'My Updates', icon: CheckCircle2 },
        { name: 'Risks', icon: AlertTriangle },
        { name: 'Milestones', icon: Flag },
        { name: 'Activity', icon: History },
    ]

    const myCheckins = project.checkins?.filter((c: any) => c.employeeId === user?.id) || []

    return (
        <ProtectedRoute allowedRoles={['EMPLOYEE']}>
            <AppLayout links={EMPLOYEE_LINKS} title={project.name}>
                <div className="space-y-6">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row items-center justify-between bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 mb-8 sticky top-0 z-20">
                        <div className="flex items-center space-x-4 mb-4 md:mb-0">
                            <Link href="/employee/projects" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-400">
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <div>
                                <h1 className="text-2xl font-black text-gray-900 dark:text-white">{project.name}</h1>
                                <StatusBadge status={project.status} className="mt-1" />
                            </div>
                        </div>

                        <div className="flex space-x-4">
                            <Link
                                href="/employee/checkins"
                                className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none text-sm"
                            >
                                Submit Weekly Update
                            </Link>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center space-x-1 border-b border-gray-200 dark:border-gray-800 mb-6 overflow-x-auto">
                        {tabs.map((tab) => {
                            const TabIcon = tab.icon
                            const active = activeTab === tab.name
                            return (
                                <button
                                    key={tab.name}
                                    onClick={() => setActiveTab(tab.name)}
                                    className={`flex items-center px-6 py-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${active
                                        ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                        }`}
                                >
                                    <TabIcon className="w-4 h-4 mr-2" />
                                    {tab.name}
                                </button>
                            )
                        })}
                    </div>

                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {activeTab === 'Overview' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <Card title="Assignment Description" className="lg:col-span-2">
                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                                        {project.description || 'No detailed project description found.'}
                                    </p>
                                    <div className="grid grid-cols-2 gap-4 p-5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                                        <div className="flex items-center">
                                            <Calendar className="w-5 h-5 text-indigo-500 mr-3" />
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Deadlines</p>
                                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{new Date(project.startDate).toLocaleDateString()} — {new Date(project.endDate).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            <Target className="w-5 h-5 text-indigo-500 mr-3" />
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Health</p>
                                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{project.healthScore}% - <span className="text-indigo-600 dark:text-indigo-400 uppercase italic">On System</span></p>
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                <Card title="Project Team">
                                    <div className="space-y-4">
                                        {project.employees?.map((pe: any) => (
                                            <div key={pe.employeeId} className="flex items-center p-3 border border-gray-50 dark:border-gray-800 rounded-xl">
                                                <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold mr-3 text-sm">
                                                    {pe.employee?.name.charAt(0)}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{pe.employee?.name} {pe.employeeId === user?.id && <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-black">(ME)</span>}</p>
                                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Core Contributor</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                        )}

                        {activeTab === 'My Updates' && (
                            <Card title="My Work History" actions={<Badge variant="default">{myCheckins.length} Submissions</Badge>}>
                                <div className="space-y-4">
                                    {myCheckins.length === 0 ? (
                                        <div className="py-12 text-center text-gray-400 italic">You haven't submitted any updates for this project yet.</div>
                                    ) : myCheckins.map((ci: any) => (
                                        <div key={ci.id} className="p-5 border border-gray-100 dark:border-gray-800 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <div className="flex justify-between items-start mb-3">
                                                <Badge variant="info">Phase Update: {ci.completionPercent}%</Badge>
                                                <span className="text-xs text-gray-400 font-bold">{new Date(ci.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium mb-3">"{ci.progressSummary}"</p>
                                            {ci.blockers && (
                                                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-xs text-red-700 dark:text-red-300 border border-red-100 dark:border-red-900/30">
                                                    <strong className="block mb-1 font-black">Blockers Identified:</strong>
                                                    {ci.blockers}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {activeTab === 'Risks' && (
                            <Card title="Project Risks" actions={
                                <button
                                    onClick={() => setIsRiskModalOpen(true)}
                                    className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs font-bold rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors border border-indigo-100 dark:border-indigo-800"
                                >
                                    <Plus className="w-3 h-3 mr-1" /> Record New Risk
                                </button>
                            }>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                    {project.risks?.length === 0 ? (
                                        <div className="md:col-span-2 py-12 text-center text-gray-400 italic font-medium">Clear skies! No risks identified.</div>
                                    ) : project.risks.map((risk: any) => (
                                        <div key={risk.id} className="p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl hover:border-indigo-200 dark:hover:border-indigo-500 transition-all">
                                            <div className="flex justify-between mb-3 text-[10px] font-black uppercase tracking-widest">
                                                <span className={risk.severity === 'HIGH' ? 'text-red-500' : 'text-amber-500'}>
                                                    {risk.severity} Risk
                                                </span>
                                                <span className="text-gray-400 dark:text-gray-500">{risk.status}</span>
                                            </div>
                                            <h4 className="font-bold text-gray-900 dark:text-white mb-1">{risk.title}</h4>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{risk.description}</p>
                                            <div className="bg-gray-50 dark:bg-gray-900/50 p-2 rounded text-[10px] font-medium text-gray-500 dark:text-gray-400 flex justify-between border dark:border-gray-800">
                                                <span>Reported by: {risk.createdBy?.name || 'User'}</span>
                                                <span className="italic">{new Date(risk.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {activeTab === 'Milestones' && (
                            <Card title="Roadmap Progress (Read-Only)">
                                <div className="relative pl-8 space-y-8 mt-4">
                                    <div className="absolute left-3 top-2 bottom-2 w-px bg-gray-100 dark:bg-gray-800" />
                                    {project.milestones?.map((ms: any) => (
                                        <div key={ms.id} className="relative">
                                            <div className={`absolute -left-[25px] top-1 w-3 h-3 rounded-full ring-4 ring-white dark:ring-gray-950 ${ms.status === 'COMPLETED' ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'
                                                }`} />
                                            <div>
                                                <div className="flex items-center space-x-3 mb-1">
                                                    <h4 className="font-bold text-gray-900 dark:text-white leading-tight">{ms.title}</h4>
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{ms.description}</p>
                                                <Badge variant={ms.status === 'COMPLETED' ? 'success' : 'info'}>{ms.status}</Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {activeTab === 'Activity' && (
                            <Card title="Evolution Timeline">
                                <ActivityTimeline projectId={projectId as string} activities={project.activityLogs || []} />
                            </Card>
                        )}
                    </div>
                </div>

                {/* Risk Modal */}
                <Modal isOpen={isRiskModalOpen} onClose={() => setIsRiskModalOpen(false)} title="Flag Project Risk">
                    <form onSubmit={handleAddRisk} className="space-y-5">
                        <div className="space-y-1">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Title</label>
                            <input name="title" required className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="e.g. Dependencies on API X delayed" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Severity</label>
                            <select name="severity" className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                                <option value="LOW">Low - Nominal impact</option>
                                <option value="MEDIUM">Medium - Noticeable delay</option>
                                <option value="HIGH">High - Project blocker</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Context & Description</label>
                            <textarea name="description" rows={3} className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="Provide details for the PM..."></textarea>
                        </div>
                        <button type="submit" disabled={submitting} className="w-full py-4 bg-gray-900 dark:bg-indigo-600 text-white font-black text-sm uppercase tracking-widest rounded-xl hover:bg-gray-800 dark:hover:bg-indigo-700 transition-all disabled:opacity-50">
                            {submitting ? 'Recording...' : 'Flag Risk to PM'}
                        </button>
                    </form>
                </Modal>

            </AppLayout>
        </ProtectedRoute>
    )
}
