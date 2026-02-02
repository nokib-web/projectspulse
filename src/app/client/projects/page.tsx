'use client'

import React, { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import { CLIENT_LINKS } from '@/config/navLinks'
import Card from '@/components/Card'
import Spinner from '@/components/Spinner'
import { StatusBadge } from '@/components/Badge'
import { useToast } from '@/components/ToastContainer'
import { Folder, ChevronRight, Calendar, User } from 'lucide-react'
import Link from 'next/link'

export default function ClientProjects() {
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
                toast('Failed to load project list', 'error')
            } finally {
                setLoading(false)
            }
        }
        fetchMyProjects()
    }, [])

    return (
        <ProtectedRoute allowedRoles={['CLIENT']}>
            <AppLayout links={CLIENT_LINKS} title="My Projects">
                <div className="space-y-6 max-w-6xl mx-auto">
                    <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-6">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Active Portfolio</h2>
                            <p className="text-sm text-gray-500 font-medium">Tracking {projects.length} collaborative initiatives.</p>
                        </div>
                        <Folder className="w-10 h-10 text-indigo-100" />
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-24"><Spinner size="lg" /></div>
                    ) : projects.length === 0 ? (
                        <div className="py-32 text-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Folder className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-400 italic">Your project list is currently empty.</h3>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {projects.map((p) => (
                                <Link key={p.id} href={`/client/projects/${p.id}`} className="block group">
                                    <Card className="hover:border-indigo-400 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 overflow-hidden relative">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/30 rounded-full -mr-16 -mt-16 group-hover:bg-indigo-100/50 transition-colors" />

                                        <div className="relative z-10 p-2">
                                            <div className="flex items-center justify-between mb-6">
                                                <StatusBadge status={p.status} />
                                                <div className="flex items-center space-x-1 text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md uppercase tracking-widest">
                                                    Health: {p.healthScore}%
                                                </div>
                                            </div>

                                            <h3 className="text-xl font-black text-gray-900 mb-2 leading-tight group-hover:text-indigo-600 transition-colors">{p.name}</h3>
                                            <p className="text-sm text-gray-500 font-medium line-clamp-2 mb-8 leading-relaxed">
                                                {p.description || "Partnering to deliver excellence and business value."}
                                            </p>

                                            <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                                                <div className="flex items-center space-x-6">
                                                    <div className="flex items-center text-xs font-bold text-gray-400">
                                                        <Calendar className="w-4 h-4 mr-2" />
                                                        {new Date(p.endDate).toLocaleDateString()}
                                                    </div>
                                                    <div className="flex items-center text-xs font-bold text-gray-400">
                                                        <User className="w-4 h-4 mr-2" />
                                                        {p.employees?.length || 0} Experts
                                                    </div>
                                                </div>
                                                <div className="text-indigo-600 font-black text-xs uppercase tracking-widest flex items-center">
                                                    Details <ChevronRight className="w-4 h-4 ml-1" />
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </AppLayout>
        </ProtectedRoute>
    )
}
