'use client'

import React, { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import { ADMIN_LINKS } from '@/config/navLinks'
import Card from '@/components/Card'
import Spinner from '@/components/Spinner'
import { Badge } from '@/components/Badge'
import Modal from '@/components/Modal'
import ConfirmModal from '@/components/ConfirmModal'
import { useToast } from '@/components/ToastContainer'
import { UserPlus, Mail, Shield, Calendar, Trash2 } from 'lucide-react'

export default function AdminUsers() {
    const [loading, setLoading] = useState(true)
    const [users, setUsers] = useState<any[]>([])
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const { toast } = useToast()

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/users')
            const result = await res.json()
            if (result.success) setUsers(result.data)
        } catch (err) {
            toast('Failed to load users', 'error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setSubmitting(true)
        const formData = new FormData(e.currentTarget)
        const body = Object.fromEntries(formData.entries())

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })
            const result = await res.json()
            if (result.success) {
                toast('User created successfully', 'success')
                setIsAddModalOpen(false)
                fetchUsers()
            } else {
                toast(result.error || 'Failed to create user', 'error')
            }
        } catch (err) {
            toast('Internal server error', 'error')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteUser = async () => {
        if (!deleteConfirmId) return
        setSubmitting(true)
        try {
            const res = await fetch(`/api/users/${deleteConfirmId}`, { method: 'DELETE' })
            const result = await res.json()
            if (result.success) {
                toast('User deleted', 'success')
                setDeleteConfirmId(null)
                fetchUsers()
            } else {
                toast(result.error || 'Failed to delete user', 'error')
            }
        } catch (err) {
            toast('Internal server error', 'error')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <ProtectedRoute allowedRoles={['ADMIN']}>
            <AppLayout links={ADMIN_LINKS} title="User Directory">
                <div className="space-y-6">
                    <div className="flex justify-end">
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="inline-flex items-center px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 font-bold text-sm"
                        >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Add New User
                        </button>
                    </div>

                    <Card>
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <Spinner size="lg" />
                            </div>
                        ) : users.length === 0 ? (
                            <div className="text-center py-12 text-gray-400 italic">No users found in the system.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-gray-100 dark:border-gray-800">
                                            <th className="px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">User Details</th>
                                            <th className="px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Role</th>
                                            <th className="px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Joined Date</th>
                                            <th className="px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((user) => (
                                            <tr key={user.id} className="border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors group">
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center">
                                                        <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-black text-lg mr-4 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                            {user.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-900 dark:text-white">{user.name}</p>
                                                            <p className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                <Mail className="w-3 h-3 mr-1" /> {user.email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center text-sm">
                                                        <Shield className={`w-4 h-4 mr-2 ${user.role === 'ADMIN' ? 'text-indigo-500' : user.role === 'CLIENT' ? 'text-blue-500' : 'text-green-500'}`} />
                                                        <Badge variant={user.role === 'ADMIN' ? 'danger' : user.role === 'CLIENT' ? 'info' : 'success'}>
                                                            {user.role}
                                                        </Badge>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                                        <Calendar className="w-4 h-4 mr-2" />
                                                        {new Date(user.createdAt).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <button
                                                        onClick={() => setDeleteConfirmId(user.id)}
                                                        className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Add User Modal */}
                <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Create System User">
                    <form onSubmit={handleAddUser} className="space-y-5">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Full Name</label>
                            <input name="name" required className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="John Doe" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Email Address</label>
                            <input name="email" type="email" required className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="john@example.com" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Default Password</label>
                            <input name="password" type="password" required className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="••••••••" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Operational Role</label>
                            <select name="role" className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-indigo-500">
                                <option value="EMPLOYEE">Employee (Developer/Designer)</option>
                                <option value="CLIENT">Client (Business Stakeholder)</option>
                                <option value="ADMIN">Admin (Project Manager)</option>
                            </select>
                        </div>
                        <button type="submit" disabled={submitting} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50">
                            {submitting ? 'Creating...' : 'Provision User'}
                        </button>
                    </form>
                </Modal>

                {/* Delete Confirm */}
                <ConfirmModal
                    isOpen={!!deleteConfirmId}
                    onClose={() => setDeleteConfirmId(null)}
                    onConfirm={handleDeleteUser}
                    title="Delete User"
                    message="Are you sure you want to remove this user? This action cannot be undone and may affect project assignments."
                    variant="danger"
                    loading={submitting}
                />
            </AppLayout>
        </ProtectedRoute>
    )
}
