'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Role } from '@/types'

interface ProtectedRouteProps {
    children: React.ReactNode
    allowedRoles?: Role[]
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login')
            } else if (allowedRoles && !allowedRoles.includes(user.role)) {
                router.push('/unauthorized')
            }
        }
    }, [user, loading, allowedRoles, router])

    // Show loading spinner while checking authentication
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1e1b4b] to-[#312e81]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-white text-lg">Loading...</p>
                </div>
            </div>
        )
    }

    // Don't render children if not authenticated or not authorized
    if (!user) {
        return null
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return null
    }

    return <>{children}</>
}
