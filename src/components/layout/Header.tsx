'use client'

import React from 'react'
import NotificationBell from '../NotificationBell'
import { DarkModeToggle } from '../DarkModeToggle'

interface HeaderProps {
    title?: string
}

const Header: React.FC<HeaderProps> = ({ title }) => {
    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 dark:bg-gray-900 dark:border-gray-800">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {title || 'ProjectPulse'}
            </h1>

            <div className="flex items-center space-x-4">
                <NotificationBell />
                <DarkModeToggle />
            </div>
        </header>
    )
}

export default Header
