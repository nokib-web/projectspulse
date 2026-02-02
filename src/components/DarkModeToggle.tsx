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

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as Theme
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        const initialTheme = savedTheme || systemTheme

        setTheme(initialTheme)
        if (initialTheme === 'dark') {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }, [])

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light'
        setTheme(newTheme)
        localStorage.setItem('theme', newTheme)

        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }

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
