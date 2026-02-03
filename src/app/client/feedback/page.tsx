'use client'

import React, { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import { CLIENT_LINKS } from '@/config/navLinks'
import Card from '@/components/Card'
import Spinner from '@/components/Spinner'
import { Badge } from '@/components/Badge'
import Modal from '@/components/Modal'
import { useToast } from '@/components/ToastContainer'
import { MessageSquare, Star, Send, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export default function ClientFeedback() {
    const [loading, setLoading] = useState(true)
    const [projects, setProjects] = useState<any[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedProjectId, setSelectedProjectId] = useState('')
    const [submitting, setSubmitting] = useState(false)

    // Form states
    const [satisfaction, setSatisfaction] = useState(5)
    const [clarity, setClarity] = useState(5)
    const [flagged, setFlagged] = useState(false)

    const { toast } = useToast()

    const fetchStatus = async () => {
        try {
            const res = await fetch('/api/projects')
            const result = await res.json()
            if (result.success) setProjects(result.data)
        } catch (err) {
            toast('Failed to load projects', 'error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStatus()
    }, [])

    const handleSubmitFeedback = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setSubmitting(true)
        const formData = new FormData(e.currentTarget)
        const comments = formData.get('comments')

        try {
            const res = await fetch(`/api/projects/${selectedProjectId}/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    satisfactionRating: satisfaction,
                    communicationClarity: clarity,
                    comments,
                    flaggedIssue: flagged
                })
            })
            const result = await res.json()
            if (result.success) {
                toast('Feedback recorded. Thank you!', 'success')
                setIsModalOpen(false)
                fetchStatus()
            } else {
                toast(result.error || 'Failed to submit feedback', 'error')
            }
        } catch (err) {
            toast('Network error', 'error')
        } finally {
            setSubmitting(false)
        }
    }

    const openModalFor = (id: string) => {
        setSelectedProjectId(id)
        setSatisfaction(5)
        setClarity(5)
        setFlagged(false)
        setIsModalOpen(true)
    }

    const StarRating = ({ value, onChange, label }: any) => (
        <div className="space-y-3">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{label}</label>
            <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((s) => (
                    <button
                        key={s}
                        type="button"
                        onClick={() => onChange(s)}
                        className="group focus:outline-none"
                    >
                        <Star
                            className={`w-10 h-10 transition-all transform group-hover:scale-110 ${s <= value ? 'fill-indigo-500 text-indigo-500' : 'text-gray-200'
                                }`}
                        />
                    </button>
                ))}
            </div>
        </div>
    )

    return (
        <ProtectedRoute allowedRoles={['CLIENT']}>
            <AppLayout links={CLIENT_LINKS} title="Partnership Feedback">
                <div className="space-y-8 max-w-4xl mx-auto">

                    <div className="text-center py-12 px-6 bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
                        <div className="relative z-10">
                            <MessageSquare className="w-12 h-12 text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
                            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2 uppercase">Voice of the Customer</h2>
                            <p className="text-gray-500 dark:text-gray-400 font-medium max-w-lg mx-auto leading-relaxed">
                                Your weekly feedback is the core driver of our health metrics. Tell us how we're performing.
                            </p>
                        </div>
                        <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-50/50 dark:bg-indigo-900/30 rounded-full -ml-16 -mt-16" />
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
                    ) : projects.length === 0 ? (
                        <Card className="text-center py-20 text-gray-400 italic font-medium">No projects assigned for feedback.</Card>
                    ) : (
                        <div className="space-y-6">
                            {projects.map((p) => {
                                const lastFeedback = p.feedback?.[0]
                                return (
                                    <Card key={p.id} className="hover:border-indigo-200 transition-all duration-300">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div>
                                                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-1 uppercase tracking-tight">{p.name}</h3>
                                                {lastFeedback ? (
                                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest flex items-center">
                                                        <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" /> Latest Score: {lastFeedback.satisfactionRating}/5 — {new Date(lastFeedback.createdAt).toLocaleDateString()}
                                                    </p>
                                                ) : (
                                                    <p className="text-xs text-indigo-500 font-black uppercase tracking-widest italic animate-pulse">Initial Feedback Requested</p>
                                                )}
                                            </div>

                                            <button
                                                onClick={() => openModalFor(p.id)}
                                                className="inline-flex items-center px-8 py-4 bg-indigo-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 dark:shadow-none"
                                            >
                                                <Send className="w-4 h-4 mr-2" />
                                                Submit Weekly Review
                                            </button>
                                        </div>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Feedback Modal */}
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title="Project Performance Review"
                    size="lg"
                >
                    <form onSubmit={handleSubmitFeedback} className="space-y-10 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <StarRating value={satisfaction} onChange={setSatisfaction} label="Service Satisfaction" />
                            <StarRating value={clarity} onChange={setClarity} label="Communication Clarity" />
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Qualitative Comments</label>
                            <textarea
                                name="comments"
                                rows={4}
                                className="w-full px-6 py-4 border-2 border-gray-100 dark:border-gray-800 rounded-3xl outline-none focus:border-indigo-500 transition-all resize-none shadow-inner bg-gray-50/50 dark:bg-gray-950 font-medium text-gray-700 dark:text-gray-200"
                                placeholder="Describe your experience this week..."
                            />
                        </div>

                        <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-3xl border border-red-100 dark:border-red-900/40 flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-xl text-red-600">
                                    <AlertCircle className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="text-red-900 dark:text-red-200 font-black text-sm">Flag Urgent Issue</h4>
                                    <p className="text-red-700/70 dark:text-red-400/70 text-xs font-bold uppercase">Escalate to Project Management</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFlagged(!flagged)}
                                className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${flagged ? 'bg-red-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                            >
                                <span className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${flagged ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-5 bg-gray-950 dark:bg-indigo-600 text-white font-black text-sm uppercase tracking-widest rounded-[2rem] hover:bg-indigo-600 dark:hover:bg-indigo-700 hover:shadow-2xl hover:shadow-indigo-100 dark:hover:shadow-none transition-all disabled:opacity-50"
                        >
                            {submitting ? 'Transmitting...' : 'Confirm & Submit Review'}
                        </button>
                    </form>
                </Modal>

            </AppLayout>
        </ProtectedRoute>
    )
}
