'use client'

import React, { ReactNode } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import { NavLink } from '@/config/navLinks'

interface AppLayoutProps {
    children: ReactNode
    links: NavLink[]
    title?: string
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, links, title }) => {
    return (
        <div className="flex h-screen bg-gray-50 dark:bg-black overflow-hidden font-sans">
            <Sidebar links={links} />

            <div className="flex-1 flex flex-col min-w-0 lg:ml-64 transition-all duration-300">
                <Header title={title} />

                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}

export default AppLayout
