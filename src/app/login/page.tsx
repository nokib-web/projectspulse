'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const { login, user } = useAuth()
    const router = useRouter()

    // Redirect based on role when user is set
    useEffect(() => {
        if (user) {
            switch (user.role) {
                case 'ADMIN':
                    router.push('/admin/dashboard')
                    break
                case 'EMPLOYEE':
                    router.push('/employee/dashboard')
                    break
                case 'CLIENT':
                    router.push('/client/dashboard')
                    break
                default:
                    router.push('/')
            }
        }
    }, [user, router])

    const handleLogin = async (e: string, p: string) => {
        setError('')
        setIsLoading(true)

        try {
            await login(e, p)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await handleLogin(email, password)
    }

    const handleDemoLogin = (role: 'ADMIN' | 'EMPLOYEE' | 'CLIENT') => {
        let demoEmail = ''
        let demoPassword = ''

        switch (role) {
            case 'ADMIN':
                demoEmail = 'admin@projectpulse.io'
                demoPassword = 'Admin123!'
                break
            case 'EMPLOYEE':
                demoEmail = 'sarah@projectpulse.io'
                demoPassword = 'Employee123!'
                break
            case 'CLIENT':
                demoEmail = 'olivia@projectpulse.io'
                demoPassword = 'Client123!'
                break
        }

        setEmail(demoEmail)
        setPassword(demoPassword)
        handleLogin(demoEmail, demoPassword)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#1e1b4b] to-[#312e81] flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
                        <p className="text-gray-300">Sign in to ProjectPulse</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Signing in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-white/10">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 text-center">
                            Demo Access
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                onClick={() => handleDemoLogin('ADMIN')}
                                className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium text-gray-300 transition-colors"
                            >
                                Admin
                            </button>
                            <button
                                onClick={() => handleDemoLogin('EMPLOYEE')}
                                className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium text-gray-300 transition-colors"
                            >
                                Employee
                            </button>
                            <button
                                onClick={() => handleDemoLogin('CLIENT')}
                                className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium text-gray-300 transition-colors"
                            >
                                Client
                            </button>
                        </div>
                    </div>

                    <p className="text-center text-gray-400 text-sm mt-6">
                        Accounts are created by administrators.
                    </p>
                </div>
            </div>
        </div>
    )
}
