'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, LogOut, Package2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { NavLink } from '@/config/navLinks'
import { Badge } from '../Badge'

interface SidebarProps {
    links: NavLink[]
}

const Sidebar: React.FC<SidebarProps> = ({ links }) => {
    const [isOpen, setIsOpen] = useState(false)
    const pathname = usePathname()
    const { user, logout } = useAuth()

    const isActive = (href: string) => pathname.startsWith(href)

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
            {/* Logo */}
            <div className="p-6">
                <Link href="/" className="flex items-center space-x-2">
                    <div className="bg-indigo-600 p-1.5 rounded-lg">
                        <Package2 className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xl font-bold text-gray-900 dark:text-white">ProjectPulse</span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                {links.map((link) => {
                    const ActiveIcon = link.icon
                    const active = isActive(link.href)

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active
                                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
                                }`}
                        >
                            <div className="flex items-center">
                                <ActiveIcon className={`w-5 h-5 mr-3 ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`} />
                                {link.label}
                            </div>
                            {link.badge !== undefined && link.badge > 0 && (
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${active ? 'bg-indigo-200 text-indigo-800' : 'bg-gray-200 text-gray-800'
                                    }`}>
                                    {link.badge}
                                </span>
                            )}
                        </Link>
                    )
                })}
            </nav>

            {/* User Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center mb-4 px-2">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-lg mr-3 shadow-sm shadow-indigo-200">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                            {user?.name || 'User'}
                        </p>
                        <Badge variant="info" className="mt-1">
                            {user?.role || 'Guest'}
                        </Badge>
                    </div>
                </div>

                <button
                    onClick={logout}
                    className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-red-900/10"
                >
                    <LogOut className="w-5 h-5 mr-3" />
                    Sign Out
                </button>
            </div>
        </div>
    )

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed top-4 left-4 z-40 lg:hidden p-2 bg-white rounded-lg shadow-md border border-gray-200"
            >
                <Menu className="w-6 h-6 text-gray-600" />
            </button>

            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-64 h-screen fixed left-0 top-0 z-30">
                <SidebarContent />
            </aside>

            {/* Mobile Drawer */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] lg:hidden">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 animate-in fade-in duration-300"
                        onClick={() => setIsOpen(false)}
                    />
                    {/* Menu */}
                    <div className="fixed inset-y-0 left-0 w-64 animate-in slide-in-from-left duration-300">
                        <div className="relative h-full">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-900"
                            >
                                <X className="w-6 h-6" />
                            </button>
                            <SidebarContent />
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default Sidebar
