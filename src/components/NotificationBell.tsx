'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Bell, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Notification {
    id: string
    title: string
    message: string
    type: string
    link: string | null
    isRead: boolean
    createdAt: string
}

const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
}

const NotificationBell: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const router = useRouter()

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await fetch('/api/notifications')
            const result = await res.json()
            if (result.success) {
                setNotifications(result.data.notifications || [])
                setUnreadCount(result.data.unreadCount || 0)
            }
        } catch (error) {
            console.error('Failed to fetch notifications', error)
        }
    }, [])

    useEffect(() => {
        fetchNotifications()
        const interval = setInterval(fetchNotifications, 30000)
        return () => clearInterval(interval)
    }, [fetchNotifications])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const markAsRead = async (id: string) => {
        try {
            await fetch(`/api/notifications/${id}`, { method: 'PUT' })
            fetchNotifications()
        } catch (error) {
            console.error('Failed to mark notification as read')
        }
    }

    const markAllRead = async () => {
        try {
            await fetch('/api/notifications/mark-all-read', { method: 'POST' })
            fetchNotifications()
        } catch (error) {
            console.error('Failed to mark all as read')
        }
    }

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.isRead) markAsRead(notification.id)
        if (notification.link) router.push(notification.link)
        setIsOpen(false)
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-500 hover:text-indigo-600 transition-colors bg-gray-100 rounded-full"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm">
                                No notifications yet
                            </div>
                        ) : (
                            notifications.slice(0, 10).map((n) => (
                                <div
                                    key={n.id}
                                    onClick={() => handleNotificationClick(n)}
                                    className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors last:border-0 ${!n.isRead ? 'bg-indigo-50/30' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-sm font-semibold ${!n.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                                            {n.title}
                                        </span>
                                        <span className="text-[10px] text-gray-400">
                                            {formatRelativeTime(n.createdAt)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 leading-relaxed mb-2">
                                        {n.message}
                                    </p>
                                    {!n.isRead && (
                                        <div className="flex items-center text-[10px] text-indigo-600 font-medium">
                                            <Check className="w-3 h-3 mr-1" /> Mark as read
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default NotificationBell
