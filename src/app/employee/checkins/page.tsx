'use client'

import React, { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import { EMPLOYEE_LINKS } from '@/config/navLinks'
import Card from '@/components/Card'
import Spinner from '@/components/Spinner'
import { Badge } from '@/components/Badge'
import Modal from '@/components/Modal'
import { useToast } from '@/components/ToastContainer'
import { Plus, CheckSquare, Clock, AlertTriangle, TrendingUp } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export default function EmployeeCheckins() {
    const [loading, setLoading] = useState(true)
    const [projects, setProjects] = useState<any[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedProjectId, setSelectedProjectId] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [progressValue, setProgressValue] = useState(0)

    const { user } = useAuth()
    const { toast } = useToast()

    const fetchStatus = async () => {
        try {
            const res = await fetch('/api/projects')
            const result = await res.json()
            if (result.success) {
                setProjects(result.data)
            }
        } catch (err) {
            toast('Failed to load check-in status', 'error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStatus()
    }, [])

    const checkInPending = (p: any) => {
        const oneWeekAgo = new Date()
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
        return !p.checkins?.some((c: any) => c.employeeId === user?.id && new Date(c.createdAt) >= oneWeekAgo)
    }

    const handleSubmitCheckin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setSubmitting(true)
        const formData = new FormData(e.currentTarget)
        const body = Object.fromEntries(formData.entries())

        try {
            const res = await fetch(`/api/projects/${selectedProjectId}/checkins`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...body,
                    completionPercent: parseInt(body.completionPercent as string),
                    confidenceLevel: parseInt(body.confidenceLevel as string)
                })
            })
            const result = await res.json()
            if (result.success) {
                toast('Check-in submitted successfully!', 'success')
                setIsModalOpen(false)
                fetchStatus()
            } else {
                toast(result.error || 'Failed to submit check-in', 'error')
            }
        } catch (err) {
            toast('Network error', 'error')
        } finally {
            setSubmitting(false)
        }
    }

    const openModalFor = (id: string) => {
        setSelectedProjectId(id)
        setProgressValue(0)
        setIsModalOpen(true)
    }

    return (
        <ProtectedRoute allowedRoles={['EMPLOYEE']}>
            <AppLayout links={EMPLOYEE_LINKS} title="Weekly Progress Updates">
                <div className="space-y-8 max-w-5xl mx-auto">

                    <div className="flex items-center space-x-4 mb-4">
                        <div className="p-3 bg-indigo-100 rounded-2xl">
                            <CheckSquare className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900">Check-in Registry</h2>
                            <p className="text-sm text-gray-500 font-medium">Keep your team synced with your individual milestones.</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
                    ) : projects.length === 0 ? (
                        <Card className="text-center py-20 text-gray-400 italic">No assigned projects found.</Card>
                    ) : (
                        <div className="space-y-4">
                            {projects.map((p) => {
                                const isPending = checkInPending(p)
                                const lastCheckin = p.checkins?.filter((c: any) => c.employeeId === user?.id).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

                                return (
                                    <Card key={p.id} className={`transition-all duration-300 ${isPending ? 'border-amber-200 bg-amber-50/10' : 'border-gray-50'}`}>
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <h3 className="text-lg font-black text-gray-900">{p.name}</h3>
                                                    {isPending ? (
                                                        <Badge variant="warning">SUBMISSION DUE</Badge>
                                                    ) : (
                                                        <Badge variant="success">LOGGED</Badge>
                                                    )}
                                                </div>
                                                {lastCheckin ? (
                                                    <p className="text-xs text-gray-500 font-semibold italic">
                                                        Last updated: {new Date(lastCheckin.createdAt).toLocaleDateString()} — "{lastCheckin.progressSummary.substring(0, 60)}..."
                                                    </p>
                                                ) : (
                                                    <p className="text-xs text-gray-400 font-medium italic">No updates logged yet.</p>
                                                )}
                                            </div>

                                            <button
                                                onClick={() => openModalFor(p.id)}
                                                className={`inline-flex items-center px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg ${isPending
                                                        ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-100'
                                                        : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50 shadow-gray-100'
                                                    }`}
                                            >
                                                <Plus className="w-4 h-4 mr-2" />
                                                {isPending ? 'Submit Update' : 'New Update'}
                                            </button>
                                        </div>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Check-in Modal */}
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title="Submit Weekly Progress"
                    size="lg"
                >
                    <form onSubmit={handleSubmitCheckin} className="space-y-8 py-2">
                        <div className="space-y-3">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Progress Summary</label>
                            <textarea
                                name="progressSummary"
                                required
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all resize-none shadow-sm font-medium text-sm leading-relaxed"
                                placeholder="What did you achieve this week?"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex justify-between">
                                Completion Level
                                <span className="text-indigo-600">{progressValue}%</span>
                            </label>
                            <div className="space-y-4">
                                <input
                                    type="range"
                                    name="completionPercent"
                                    min="0"
                                    max="100"
                                    value={progressValue}
                                    onChange={(e) => setProgressValue(parseInt(e.target.value))}
                                    className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                                <div className="h-4 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                                    <div
                                        className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 transition-all duration-500"
                                        style={{ width: `${progressValue}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Confidence Level</label>
                                <div className="flex items-center space-x-1">
                                    {[1, 2, 3, 4, 5].map((level) => (
                                        <label key={level} className="flex-1 cursor-pointer group">
                                            <input type="radio" name="confidenceLevel" value={level} className="sr-only peer" defaultChecked={level === 3} />
                                            <div className="py-2.5 text-center rounded-xl bg-gray-50 text-gray-400 font-black text-lg peer-checked:bg-indigo-600 peer-checked:text-white group-hover:bg-indigo-50 transition-all border border-transparent peer-checked:border-indigo-700 shadow-sm">
                                                {level}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                                <div className="flex justify-between text-[10px] font-bold text-gray-400 px-1">
                                    <span>Low</span>
                                    <span>Neutral</span>
                                    <span>High</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center">
                                    <AlertTriangle className="w-3 h-3 mr-1 text-amber-500" /> Current Blockers
                                </label>
                                <textarea
                                    name="blockers"
                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-amber-50 focus:border-amber-400 transition-all resize-none shadow-sm text-sm"
                                    placeholder="Anything slowing you down? (Optional)"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-4 bg-gray-950 text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-indigo-700 hover:shadow-2xl hover:shadow-indigo-200 transition-all disabled:opacity-50"
                        >
                            {submitting ? 'Submitting...' : 'Log Weekly Update'}
                        </button>
                    </form>
                </Modal>

            </AppLayout>
        </ProtectedRoute>
    )
}
