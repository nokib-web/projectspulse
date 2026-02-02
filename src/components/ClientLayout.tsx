'use client'

import { AuthProvider } from '@/context/AuthContext'
import { ToastProvider } from '@/components/ToastContainer'
import { DarkModeProvider } from '@/components/DarkModeToggle'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    return (
        <DarkModeProvider>
            <ToastProvider>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </ToastProvider>
        </DarkModeProvider>
    )
}
