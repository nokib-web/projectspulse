'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Role } from '@/types'

interface User {
    id: string
    email: string
    name: string
    role: Role
}

interface AuthContextType {
    user: User | null
    loading: boolean
    token: string | null
    login: (email: string, password: string) => Promise<void>
    logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [token, setToken] = useState<string | null>(null)

    // Load user on mount
    useEffect(() => {
        const loadUser = async () => {
            try {
                // Check localStorage for token
                const storedToken = localStorage.getItem('projectpulse_token')
                if (storedToken) {
                    setToken(storedToken)
                }

                // Fetch current user from API
                const response = await fetch('/api/auth/me', {
                    headers: storedToken
                        ? { Authorization: `Bearer ${storedToken}` }
                        : {}
                })

                if (response.ok) {
                    const data = await response.json()
                    if (data.success) {
                        setUser(data.data)
                    }
                } else {
                    // Clear invalid token
                    localStorage.removeItem('projectpulse_token')
                    setToken(null)
                }
            } catch (error) {
                console.error('Failed to load user:', error)
            } finally {
                setLoading(false)
            }
        }

        loadUser()
    }, [])

    const login = async (email: string, password: string) => {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Login failed')
            }

            if (data.success) {
                const { token: newToken, user: userData } = data.data

                // Save token to localStorage
                localStorage.setItem('projectpulse_token', newToken)
                setToken(newToken)
                setUser(userData)
            }
        } catch (error) {
            console.error('Login error:', error)
            throw error
        }
    }

    const logout = async () => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST'
            })
        } catch (error) {
            console.error('Logout error:', error)
        } finally {
            // Clear state and localStorage regardless of API response
            localStorage.removeItem('projectpulse_token')
            setToken(null)
            setUser(null)
        }
    }

    return (
        <AuthContext.Provider value={{ user, loading, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
