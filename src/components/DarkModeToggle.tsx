'use client'

import React, { useState, useEffect, createContext, useContext } from 'react'
import { Sun, Moon } from 'lucide-react'

type Theme = 'light' | 'dark'

interface DarkModeContextType {
    theme: Theme
    toggleTheme: () => void
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined)

export const DarkModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>('light')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const isDark = document.documentElement.classList.contains('dark')
        setTheme(isDark ? 'dark' : 'light')
    }, [])

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light'
        setTheme(newTheme)
        localStorage.setItem('theme', newTheme)

        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark')
            document.documentElement.classList.remove('light')
        } else {
            document.documentElement.classList.remove('dark')
            document.documentElement.classList.add('light')
        }
    }

    // Prevent hydration mismatch: only render children after mounted
    // We wrapped provider around toast and auth, so we should actually render children
    // but the VALUE will be correct after mount.
    return (
        <DarkModeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </DarkModeContext.Provider>
    )
}

export const useDarkMode = () => {
    const context = useContext(DarkModeContext)
    if (!context) {
        throw new Error('useDarkMode must be used within a DarkModeProvider')
    }
    return context
}

export const DarkModeToggle: React.FC = () => {
    const { theme, toggleTheme } = useDarkMode()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <div className="p-2 w-9 h-9" /> // Skeleton/Placeholder
    }

    return (
        <button
            onClick={toggleTheme}
            className="p-2 text-gray-500 hover:text-indigo-600 transition-colors bg-gray-100 rounded-full dark:bg-gray-800 dark:text-gray-400 dark:hover:text-indigo-400"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>
    )
}
