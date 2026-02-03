import React, { ReactNode } from 'react'

interface CardProps {
    children: ReactNode
    title?: string
    actions?: ReactNode
    className?: string
}

const Card: React.FC<CardProps> = ({ children, title, actions, className = '' }) => {
    return (
        <div className={`bg-white dark:bg-gray-900 shadow-sm rounded-lg p-6 border border-gray-200 dark:border-gray-800 ${className}`}>
            {(title || actions) && (
                <div className="flex items-center justify-between mb-6">
                    {title && <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>}
                    {actions && <div className="flex items-center space-x-2">{actions}</div>}
                </div>
            )}
            {children}
        </div>
    )
}

export default Card
