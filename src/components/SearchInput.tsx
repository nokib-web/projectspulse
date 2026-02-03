'use client'

import React, { useState, useEffect } from 'react'
import { Search } from 'lucide-react'

interface SearchInputProps {
    placeholder?: string
    value: string
    onChange: (value: string) => void
    className?: string
    debounceMs?: number
}

const SearchInput: React.FC<SearchInputProps> = ({
    placeholder = 'Search...',
    value,
    onChange,
    className = '',
    debounceMs = 300
}) => {
    const [internalValue, setInternalValue] = useState(value)

    useEffect(() => {
        setInternalValue(value)
    }, [value])

    useEffect(() => {
        const handler = setTimeout(() => {
            if (internalValue !== value) {
                onChange(internalValue)
            }
        }, debounceMs)

        return () => clearTimeout(handler)
    }, [internalValue, onChange, value, debounceMs])

    return (
        <div className={`relative ${className}`}>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg leading-5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:placeholder-gray-300 dark:focus:placeholder-gray-600 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all shadow-sm"
                placeholder={placeholder}
                value={internalValue}
                onChange={(e) => setInternalValue(e.target.value)}
            />
        </div>
    )
}

export default SearchInput
