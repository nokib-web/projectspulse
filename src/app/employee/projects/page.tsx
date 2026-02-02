'use client'

import React, { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import { EMPLOYEE_LINKS } from '@/config/navLinks'
import Card from '@/components/Card'
import Spinner from '@/components/Spinner'
import { StatusBadge } from '@/components/Badge'
import { useToast } from '@/components/ToastContainer'
import { Search, Calendar, User, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default function EmployeeProjects() {
    const [loading, setLoading] = useState(true)
    const [projects, setProjects] = useState<any[]>([])
    const { toast } = useToast()

    useEffect(() => {
        const fetchMyProjects = async () => {
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
        fetchMyProjects()
    }, [])

    return (
        <ProtectedRoute allowedRoles={['EMPLOYEE']}>
            <AppLayout links={EMPLOYEE_LINKS} title="My Assigned Projects">
                <div className="space-y-6">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">{projects.length} Active Assignments</h2>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Spinner size="lg" />
                        </div>
                    ) : projects.length === 0 ? (
                        <Card className="text-center py-20 text-gray-400 italic">No project assignments found.</Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                            {projects.map((p) => (
                                <Card key={p.id} className="group hover:border-indigo-300 hover:shadow-xl transition-all duration-300 flex flex-col">
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-4">
                                            <StatusBadge status={p.status} />
                                            <div className="flex items-center text-[10px] font-black text-gray-400 bg-gray-50 px-2 py-1 rounded-md uppercase tracking-wider">
                                                ID: {p.id.substring(0, 6)}
                                            </div>
                                        </div>

                                        <h3 className="text-xl font-black text-gray-900 mb-2 truncate group-hover:text-indigo-600 transition-colors">
                                            {p.name}
                                        </h3>
                                        <p className="text-sm text-gray-500 line-clamp-2 mb-6 leading-relaxed">
                                            {p.description || "No description provided for this assignment."}
                                        </p>

                                        <div className="space-y-3 mb-6">
                                            <div className="flex items-center text-xs font-semibold text-gray-600">
                                                <User className="w-4 h-4 mr-3 text-indigo-400" />
                                                <span className="text-gray-400 mr-2">Client:</span> {p.client?.name}
                                            </div>
                                            <div className="flex items-center text-xs font-semibold text-gray-600">
                                                <Calendar className="w-4 h-4 mr-3 text-indigo-400" />
                                                <span className="text-gray-400 mr-2">Ends:</span> {new Date(p.endDate).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>

                                    <Link
                                        href={`/employee/projects/${p.id}`}
                                        className="mt-4 flex items-center justify-center py-3 bg-gray-950 text-white rounded-xl font-bold text-sm hover:bg-indigo-600 transition-all shadow-lg shadow-gray-200"
                                    >
                                        View Dashboard <ChevronRight className="w-4 h-4 ml-2" />
                                    </Link>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </AppLayout>
        </ProtectedRoute>
    )
}
