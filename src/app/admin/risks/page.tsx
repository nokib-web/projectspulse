'use client'

import React, { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import { ADMIN_LINKS } from '@/config/navLinks'
import Card from '@/components/Card'
import Spinner from '@/components/Spinner'
import { Badge } from '@/components/Badge'
import { useToast } from '@/components/ToastContainer'
import { AlertCircle, ChevronRight, Filter } from 'lucide-react'
import Link from 'next/link'

export default function AdminRisks() {
    const [loading, setLoading] = useState(true)
    const [risks, setRisks] = useState<any[]>([])
    const [severityFilter, setSeverityFilter] = useState('ALL')
    const [statusFilter, setStatusFilter] = useState('OPEN')
    const { toast } = useToast()

    const fetchRisks = async () => {
        try {
            const res = await fetch('/api/projects/all-risks') // Need to check if this exists, otherwise fetch all projects
            let result = await res.json()

            if (!result.success) {
                // Fallback: Fetch all projects and flatten risks if specific endpoint doesn't exist
                const pRes = await fetch('/api/projects')
                const pResult = await pRes.json()
                if (pResult.success) {
                    const allRisks = pResult.data.flatMap((p: any) =>
                        (p.risks || []).map((r: any) => ({ ...r, projectName: p.name, projectId: p.id }))
                    )
                    result = { success: true, data: allRisks }
                }
            }

            if (result.success) setRisks(result.data)
        } catch (err) {
            toast('Failed to load risks', 'error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRisks()
    }, [])

    const filteredRisks = risks.filter(r => {
        const sMatch = severityFilter === 'ALL' || r.severity === severityFilter
        const stMatch = statusFilter === 'ALL' || r.status === statusFilter
        return sMatch && stMatch
    })

    return (
        <ProtectedRoute allowedRoles={['ADMIN']}>
            <AppLayout links={ADMIN_LINKS} title="Global Risk Registry">
                <div className="space-y-6">

                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                        <div className="flex items-center text-sm font-bold text-gray-500 dark:text-gray-400 mr-2">
                            <Filter className="w-4 h-4 mr-2" /> Filters
                        </div>

                        <select
                            value={severityFilter}
                            onChange={(e) => setSeverityFilter(e.target.value)}
                            className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-1.5 text-sm focus:ring-indigo-500"
                        >
                            <option value="ALL">All Severities</option>
                            <option value="HIGH">High Severity</option>
                            <option value="MEDIUM">Medium Severity</option>
                            <option value="LOW">Low Severity</option>
                        </select>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-1.5 text-sm focus:ring-indigo-500"
                        >
                            <option value="OPEN">Open Risks</option>
                            <option value="RESOLVED">Resolved Risks</option>
                            <option value="ALL">All Status</option>
                        </select>

                        <div className="ml-auto text-xs font-bold text-gray-400 uppercase tracking-widest">
                            {filteredRisks.length} Risks Found
                        </div>
                    </div>

                    <Card className="p-0 overflow-hidden">
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <Spinner size="lg" />
                            </div>
                        ) : filteredRisks.length === 0 ? (
                            <div className="p-12 text-center text-gray-400 italic">No risks match the selected filters.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                                            <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Risk Information</th>
                                            <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Project</th>
                                            <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-center">Severity</th>
                                            <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                                            <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredRisks.sort((a, b) => b.severity === 'HIGH' ? 1 : -1).map((r) => (
                                            <tr key={r.id} className="border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{r.title}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{r.description || 'No description provided.'}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Link href={`/admin/projects/${r.projectId}`} className="inline-flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">
                                                        {r.projectName}
                                                    </Link>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${r.severity === 'HIGH' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : r.severity === 'MEDIUM' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                                                        }`}>
                                                        {r.severity}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <Badge variant={r.status === 'RESOLVED' ? 'success' : 'warning'}>{r.status}</Badge>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Link
                                                        href={`/admin/projects/${r.projectId}?tab=Risks`}
                                                        className="inline-flex items-center p-2 text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                    >
                                                        <ChevronRight className="w-5 h-5" />
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </div>
            </AppLayout>
        </ProtectedRoute>
    )
}
