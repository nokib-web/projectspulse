'use client'

import React, { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import { ADMIN_LINKS } from '@/config/navLinks'
import Card from '@/components/Card'
import Spinner from '@/components/Spinner'
import { StatusBadge, Badge } from '@/components/Badge'
import { useToast } from '@/components/ToastContainer'
import ActivityTimeline from '@/components/ActivityTimeline'
import Modal from '@/components/Modal'
import {
    Calendar,
    Users,
    Target,
    AlertTriangle,
    MessageSquare,
    Clock,
    History,
    Plus,
    ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

type TabType = 'Overview' | 'Check-ins' | 'Feedback' | 'Risks' | 'Milestones' | 'Activity'

export default function AdminProjectDetail() {
    const { projectId } = useParams()
    const [loading, setLoading] = useState(true)
    const [project, setProject] = useState<any>(null)
    const [activeTab, setActiveTab] = useState<TabType>('Overview')
    const { toast } = useToast()

    // Modal states for adding items
    const [isRiskModalOpen, setIsRiskModalOpen] = useState(false)
    const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    const fetchProjectDetails = async () => {
        try {
            const res = await fetch(`/api/projects/${projectId}`)
            const result = await res.json()
            if (result.success) {
                setProject(result.data)
            } else {
                toast(result.error || 'Failed to load project details', 'error')
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
                toast('Risk added successfully', 'success')
                setIsRiskModalOpen(false)
                fetchProjectDetails()
            } else {
                toast(result.error || 'Failed to add risk', 'error')
            }
        } catch (err) {
            toast('Network error', 'error')
        } finally {
            setSubmitting(false)
        }
    }

    const handleAddMilestone = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setSubmitting(true)
        const formData = new FormData(e.currentTarget)
        const body = Object.fromEntries(formData.entries())

        try {
            const res = await fetch(`/api/projects/${projectId}/milestones`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })
            const result = await res.json()
            if (result.success) {
                toast('Milestone created', 'success')
                setIsMilestoneModalOpen(false)
                fetchProjectDetails()
            } else {
                toast(result.error || 'Failed to create milestone', 'error')
            }
        } catch (err) {
            toast('Network error', 'error')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <ProtectedRoute allowedRoles={['ADMIN']}>
                <AppLayout links={ADMIN_LINKS} title="Project Details">
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
        { name: 'Check-ins', icon: Clock },
        { name: 'Feedback', icon: MessageSquare },
        { name: 'Risks', icon: AlertTriangle },
        { name: 'Milestones', icon: Flag },
        { name: 'Activity', icon: History },
    ]

    return (
        <ProtectedRoute allowedRoles={['ADMIN']}>
            <AppLayout links={ADMIN_LINKS} title={project.name}>
                <div className="space-y-6">

                    {/* Header Stats */}
                    <div className="flex flex-col md:flex-row items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 sticky top-0 z-20">
                        <div className="flex items-center space-x-4 mb-4 md:mb-0">
                            <Link href="/admin/projects" className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600">
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                                <div className="flex items-center mt-1 space-x-3">
                                    <StatusBadge status={project.status} />
                                    <span className="text-sm text-gray-400 font-medium">Updated 2m ago</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-8">
                            <div className="text-center">
                                <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Health Score</div>
                                <div className={`text-2xl font-black ${project.healthScore >= 80 ? 'text-green-600' : project.healthScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                                    {project.healthScore}%
                                </div>
                            </div>
                            <div className="h-10 w-px bg-gray-100" />
                            <div className="text-center">
                                <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Timeline</div>
                                <div className="text-sm font-bold text-gray-700">
                                    {new Date(project.startDate).toLocaleDateString()} — {new Date(project.endDate).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center space-x-1 border-b border-gray-200 mb-6 overflow-x-auto">
                        {tabs.map((tab) => {
                            const TabIcon = tab.icon
                            const active = activeTab === tab.name
                            return (
                                <button
                                    key={tab.name}
                                    onClick={() => setActiveTab(tab.name)}
                                    className={`flex items-center px-4 py-3 text-sm font-semibold transition-all border-b-2 whitespace-nowrap ${active
                                            ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <TabIcon className="w-4 h-4 mr-2" />
                                    {tab.name}
                                </button>
                            )
                        })}
                    </div>

                    {/* Content Area */}
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {activeTab === 'Overview' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                <Card title="Project Summary" className="lg:col-span-2">
                                    <p className="text-gray-600 leading-relaxed indent-4 mb-6">
                                        {project.description || 'No detailed description provided for this project.'}
                                    </p>

                                    <div className="grid grid-cols-2 gap-8 p-6 bg-gray-50 rounded-2xl">
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Client</h4>
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold mr-3">
                                                    {project.client?.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{project.client?.name}</p>
                                                    <p className="text-xs text-gray-500">{project.client?.email}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Project Manager</h4>
                                            <p className="text-sm font-bold text-gray-900">{project.admin?.name || 'Unassigned'}</p>
                                            <p className="text-xs text-gray-500">{project.admin?.email}</p>
                                        </div>
                                    </div>
                                </Card>

                                <Card title="Assigned Team" actions={<span className="text-xs text-gray-400 font-bold">{project.employees?.length || 0} Members</span>}>
                                    <div className="space-y-4">
                                        {project.employees?.length === 0 ? (
                                            <p className="text-sm text-gray-400 italic">No employees assigned.</p>
                                        ) : project.employees.map((pe: any) => (
                                            <div key={pe.employeeId} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl">
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold mr-3">
                                                        {pe.employee?.name.charAt(0)}
                                                    </div>
                                                    <span className="text-sm font-semibold text-gray-800">{pe.employee?.name}</span>
                                                </div>
                                                <Badge variant="info">Developer</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                        )}

                        {activeTab === 'Check-ins' && (
                            <Card title="Team Progress Updates">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-gray-100">
                                                <th className="py-4 text-xs font-bold text-gray-400 uppercase">Employee</th>
                                                <th className="py-4 text-xs font-bold text-gray-400 uppercase">Done %</th>
                                                <th className="py-4 text-xs font-bold text-gray-400 uppercase">Confidence</th>
                                                <th className="py-4 text-xs font-bold text-gray-400 uppercase">Latest Summary</th>
                                                <th className="py-4 text-xs font-bold text-gray-400 uppercase text-right">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {project.checkins?.length === 0 ? (
                                                <tr><td colSpan={5} className="py-12 text-center text-gray-400 italic">No check-ins submitted yet.</td></tr>
                                            ) : project.checkins.map((ci: any) => (
                                                <tr key={ci.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                                    <td className="py-4 font-bold text-gray-800 text-sm whitespace-nowrap">{ci.employee?.name}</td>
                                                    <td className="py-4">
                                                        <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md text-xs font-bold">{ci.completionPercent}%</span>
                                                    </td>
                                                    <td className="py-4">
                                                        <div className="flex items-center">
                                                            {[1, 2, 3, 4, 5].map(s => (
                                                                <div key={s} className={`w-1.5 h-3 mr-1 rounded-full ${s <= ci.confidenceLevel ? 'bg-indigo-500' : 'bg-gray-200'}`} />
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 text-sm text-gray-600 line-clamp-1 max-w-xs">{ci.progressSummary}</td>
                                                    <td className="py-4 text-right text-xs text-gray-400 font-medium">{new Date(ci.createdAt).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        )}

                        {activeTab === 'Feedback' && (
                            <Card title="Client Satisfaction History">
                                <div className="space-y-6">
                                    {project.feedback?.length === 0 ? (
                                        <p className="text-center py-12 text-gray-400 italic">No feedback received from the client yet.</p>
                                    ) : project.feedback.map((fb: any) => (
                                        <div key={fb.id} className={`p-6 rounded-2xl border-l-4 transition-all hover:shadow-md ${fb.flaggedIssue ? 'bg-red-50 border-red-500' : 'bg-white border-indigo-500 shadow-sm'}`}>
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center space-x-4">
                                                    <div className={`p-2 rounded-lg font-black text-lg ${fb.satisfactionRating >= 4 ? 'text-green-600 bg-green-100' : 'text-amber-600 bg-amber-100'}`}>
                                                        {fb.satisfactionRating}/5
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">Weekly Feedback — Week {fb.weekNumber}</p>
                                                        <p className="text-xs text-gray-500">Submitted on {new Date(fb.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                {fb.flaggedIssue && <Badge variant="danger">FLAGGED ISSUE</Badge>}
                                            </div>
                                            <p className="text-sm text-gray-700 leading-relaxed italic border-l-2 border-gray-100 pl-4 py-1">
                                                "{fb.comments || 'No comments left.'}"
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {activeTab === 'Risks' && (
                            <Card title="Project Risk Matrix" actions={
                                <button
                                    onClick={() => setIsRiskModalOpen(true)}
                                    className="inline-flex items-center px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    <Plus className="w-3 h-3 mr-1" /> Add Risk
                                </button>
                            }>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                    {project.risks?.length === 0 ? (
                                        <div className="md:col-span-2 py-12 text-center text-gray-400 italic">Excellent! No risks identified yet.</div>
                                    ) : project.risks.map((risk: any) => (
                                        <div key={risk.id} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-indigo-200 transition-all">
                                            <div className="flex justify-between mb-3">
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${risk.severity === 'HIGH' ? 'bg-red-100 text-red-700' : risk.severity === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {risk.severity} Severity
                                                </span>
                                                <Badge variant={risk.status === 'RESOLVED' ? 'success' : 'warning'}>{risk.status}</Badge>
                                            </div>
                                            <h4 className="font-bold text-gray-900 mb-1">{risk.title}</h4>
                                            <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">{risk.description}</p>
                                            <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold border-t border-gray-50 pt-3">
                                                <span>Mitigation: {risk.mitigationPlan ? 'Defined' : 'Pending'}</span>
                                                <span>Owner: {risk.assignedTo?.name || 'Everyone'}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {activeTab === 'Milestones' && (
                            <Card title="Project Milestones" actions={
                                <button
                                    onClick={() => setIsMilestoneModalOpen(true)}
                                    className="inline-flex items-center px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    <Plus className="w-3 h-3 mr-1" /> Add Milestone
                                </button>
                            }>
                                <div className="relative pl-8 space-y-8 mt-4">
                                    <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-100" />
                                    {project.milestones?.length === 0 ? (
                                        <p className="text-gray-400 italic text-sm">No milestones mapped out yet.</p>
                                    ) : project.milestones.map((ms: any) => (
                                        <div key={ms.id} className="relative">
                                            <div className={`absolute -left-[25px] top-1 w-4 h-4 rounded-full border-4 border-white ring-2 ${ms.status === 'COMPLETED' ? 'bg-green-500 ring-green-100' : ms.status === 'OVERDUE' ? 'bg-red-500 ring-red-100' : 'bg-indigo-500 ring-indigo-100'
                                                }`} />
                                            <div>
                                                <div className="flex items-center space-x-3 mb-1">
                                                    <h4 className="font-bold text-gray-900">{ms.title}</h4>
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(ms.dueDate).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-xs text-gray-500 mb-2">{ms.description}</p>
                                                <Badge variant={ms.status === 'COMPLETED' ? 'success' : ms.status === 'OVERDUE' ? 'danger' : 'info'}>
                                                    {ms.status.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {activeTab === 'Activity' && (
                            <Card title="Project Audit Trail">
                                <ActivityTimeline activities={project.activityLogs || []} />
                            </Card>
                        )}
                    </div>
                </div>

                {/* Risk Modal */}
                <Modal isOpen={isRiskModalOpen} onClose={() => setIsRiskModalOpen(false)} title="Identify New Risk">
                    <form onSubmit={handleAddRisk} className="space-y-5">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Title</label>
                            <input name="title" required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Budget Overrun" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Severity</label>
                            <select name="severity" className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Description</label>
                            <textarea name="description" rows={3} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 resize-none" placeholder="What might happen?"></textarea>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Impact Score (1-10)</label>
                            <input name="impactScore" type="number" min="1" max="10" required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="7" />
                        </div>
                        <button type="submit" disabled={submitting} className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50">
                            {submitting ? 'Submitting...' : 'Record Risk'}
                        </button>
                    </form>
                </Modal>

                {/* Milestone Modal */}
                <Modal isOpen={isMilestoneModalOpen} onClose={() => setIsMilestoneModalOpen(false)} title="Create Milestone">
                    <form onSubmit={handleAddMilestone} className="space-y-5">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Milestone Name</label>
                            <input name="title" required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Beta Version Launch" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Due Date</label>
                            <input type="date" name="dueDate" required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Description</label>
                            <textarea name="description" rows={3} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 resize-none" placeholder="What qualifies as completion?"></textarea>
                        </div>
                        <button type="submit" disabled={submitting} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50">
                            {submitting ? 'Saving...' : 'Create Milestone'}
                        </button>
                    </form>
                </Modal>

            </AppLayout>
        </ProtectedRoute>
    )
}
