'use client'

import React, { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import { ADMIN_LINKS } from '@/config/navLinks'
import Card from '@/components/Card'
import Spinner from '@/components/Spinner'
import { StatusBadge } from '@/components/Badge'
import SearchInput from '@/components/SearchInput'
import Modal from '@/components/Modal'
import { useToast } from '@/components/ToastContainer'
import { Plus, Edit2, Calendar, Users, BarChart3 } from 'lucide-react'
import Link from 'next/link'

export default function AdminProjects() {
    const [loading, setLoading] = useState(true)
    const [projects, setProjects] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    // Users for dropdowns
    const [clients, setClients] = useState<any[]>([])
    const [employees, setEmployees] = useState<any[]>([])

    const { toast } = useToast()

    const fetchProjects = async () => {
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

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/users')
            const result = await res.json()
            if (result.success) {
                setClients(result.data.filter((u: any) => u.role === 'CLIENT'))
                setEmployees(result.data.filter((u: any) => u.role === 'EMPLOYEE'))
            }
        } catch (err) {
            console.error('Failed to load users', err)
        }
    }

    useEffect(() => {
        fetchProjects()
        fetchUsers()
    }, [])

    const handleCreateProject = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setSubmitting(true)
        const formData = new FormData(e.currentTarget)

        // Process employees correctly (multi-select)
        const formValues = Object.fromEntries(formData.entries())
        const selectedEmployees = Array.from(e.currentTarget.querySelectorAll('input[name="employees"]:checked'))
            .map((el: any) => ({ employeeId: el.value }))

        const body = {
            name: formValues.name,
            description: formValues.description,
            startDate: formValues.startDate,
            endDate: formValues.endDate,
            clientId: formValues.clientId,
            employees: selectedEmployees
        }

        try {
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })
            const result = await res.json()

            if (result.success) {
                toast('Project created successfully', 'success')
                setIsModalOpen(false)
                fetchProjects()
            } else {
                toast(result.error || 'Failed to create project', 'error')
            }
        } catch (err) {
            toast('Internal server error', 'error')
        } finally {
            setSubmitting(false)
        }
    }

    const filteredProjects = projects.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter
        return matchesSearch && matchesStatus
    })

    return (
        <ProtectedRoute allowedRoles={['ADMIN']}>
            <AppLayout links={ADMIN_LINKS} title="Projects Management">
                <div className="space-y-6">

                    {/* Controls */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex flex-1 max-w-md gap-2">
                            <SearchInput
                                value={searchTerm}
                                onChange={setSearchTerm}
                                placeholder="Find a project..."
                                className="flex-1"
                            />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="ALL">All Status</option>
                                <option value="ON_TRACK">On Track</option>
                                <option value="AT_RISK">At Risk</option>
                                <option value="CRITICAL">Critical</option>
                                <option value="COMPLETED">Completed</option>
                            </select>
                        </div>

                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            New Project
                        </button>
                    </div>

                    {/* Table / Grid */}
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Spinner size="lg" />
                        </div>
                    ) : filteredProjects.length === 0 ? (
                        <div className="bg-white dark:bg-gray-900 p-12 text-center rounded-xl border-2 border-dashed border-gray-100 dark:border-gray-800 italic text-gray-400">
                            No projects match your criteria.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            {filteredProjects.map((p) => (
                                <Card key={p.id} className="group hover:border-indigo-200 transition-all">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 pr-4">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <StatusBadge status={p.status} />
                                                <span className="text-xs text-gray-400 flex items-center">
                                                    <BarChart3 className="w-3 h-3 mr-1" />
                                                    Health: {p.healthScore}%
                                                </span>
                                            </div>
                                            <Link
                                                href={`/admin/projects/${p.id}`}
                                                className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors block mb-1"
                                            >
                                                {p.name}
                                            </Link>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">
                                                {p.description || 'No description provided.'}
                                            </p>
                                        </div>

                                        <Link
                                            href={`/admin/projects/${p.id}`}
                                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                        >
                                            <Edit2 className="w-5 h-5" />
                                        </Link>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 py-4 border-t border-gray-50 dark:border-gray-800">
                                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                            Ends {new Date(p.endDate).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                            <Users className="w-4 h-4 mr-2 text-gray-400" />
                                            {p.employees?.length || 0} Team Members
                                        </div>
                                    </div>

                                    {/* Health Bar */}
                                    <div className="mt-2 h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-500 rounded-full ${p.healthScore >= 80 ? 'bg-green-500' : p.healthScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                                }`}
                                            style={{ width: `${p.healthScore}%` }}
                                        />
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Create Project Modal */}
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title="Create New Project"
                    size="lg"
                >
                    <form onSubmit={handleCreateProject} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Project Name</label>
                                <input
                                    name="name"
                                    required
                                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    placeholder="e.g. Website Overhaul 2024"
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Description</label>
                                <textarea
                                    name="description"
                                    rows={3}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                                    placeholder="Summarize the project goals..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Start Date</label>
                                <input
                                    type="date"
                                    name="startDate"
                                    required
                                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all [color-scheme:light] dark:[color-scheme:dark]"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">End Date</label>
                                <input
                                    type="date"
                                    name="endDate"
                                    required
                                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all [color-scheme:light] dark:[color-scheme:dark]"
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Client</label>
                                <select
                                    name="clientId"
                                    required
                                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                >
                                    <option value="">Select a client...</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
                                </select>
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Assign Employees</label>
                                <div className="max-h-48 overflow-y-auto p-4 border border-gray-200 dark:border-gray-800 rounded-xl space-y-3 bg-gray-50 dark:bg-gray-900/50">
                                    {employees.length === 0 ? (
                                        <p className="text-xs text-gray-400 italic">No employees found.</p>
                                    ) : employees.map(e => (
                                        <label key={e.id} className="flex items-center space-x-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                name="employees"
                                                value={e.id}
                                                className="w-4 h-4 text-indigo-600 rounded border-gray-300 dark:border-gray-700 focus:ring-indigo-500 bg-white dark:bg-gray-800"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                                                {e.name} <span className="text-gray-400 text-xs ml-1">— {e.email}</span>
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 space-x-3">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-8 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-md shadow-indigo-200 dark:shadow-none"
                            >
                                {submitting ? 'Creating...' : 'Create Project'}
                            </button>
                        </div>
                    </form>
                </Modal>
            </AppLayout>
        </ProtectedRoute>
    )
}
