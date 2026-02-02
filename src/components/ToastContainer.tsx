'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'warning' | 'error' | 'info'

interface Toast {
    id: string
    message: string
    type: ToastType
}

interface ToastContextType {
    toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([])

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }, [])

    const toast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9)
        setToasts((prev) => [...prev, { id, message, type }])
        setTimeout(() => removeToast(id), 4000)
    }, [removeToast])

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col space-y-4 max-w-sm w-full">
                {toasts.map((t) => (
                    <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    )
}

const ToastItem: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
    const icons = {
        success: <CheckCircle className="w-5 h-5 text-green-500" />,
        warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
        error: <XCircle className="w-5 h-5 text-red-500" />,
        info: <Info className="w-5 h-5 text-blue-500" />
    }

    const borderColors = {
        success: 'border-l-green-500',
        warning: 'border-l-yellow-500',
        error: 'border-l-red-500',
        info: 'border-l-blue-500'
    }

    return (
        <div className={`bg-white shadow-lg rounded-lg border-l-4 ${borderColors[toast.type]} p-4 flex items-start space-x-3 animate-in slide-in-from-right duration-300 ring-1 ring-black/5`}>
            <div className="flex-shrink-0">{icons[toast.type]}</div>
            <div className="flex-1 text-sm font-medium text-gray-900">{toast.message}</div>
            <button
                onClick={onClose}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    )
}

export const useToast = () => {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider')
    }
    return context
}
