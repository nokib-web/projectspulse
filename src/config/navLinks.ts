import {
    LayoutDashboard,
    FolderOpen,
    Users,
    AlertTriangle,
    CheckSquare,
    MessageSquare,
    LucideIcon
} from 'lucide-react'

export interface NavLink {
    label: string
    href: string
    icon: LucideIcon
    badge?: number
}

export const ADMIN_LINKS: NavLink[] = [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Projects", href: "/admin/projects", icon: FolderOpen },
    { label: "Users", href: "/admin/users", icon: Users },
    { label: "Risks", href: "/admin/risks", icon: AlertTriangle },
]

export const EMPLOYEE_LINKS: NavLink[] = [
    { label: "Dashboard", href: "/employee/dashboard", icon: LayoutDashboard },
    { label: "My Projects", href: "/employee/projects", icon: FolderOpen },
    { label: "Check-Ins", href: "/employee/checkins", icon: CheckSquare },
]

export const CLIENT_LINKS: NavLink[] = [
    { label: "Dashboard", href: "/client/dashboard", icon: LayoutDashboard },
    { label: "My Projects", href: "/client/projects", icon: FolderOpen },
    { label: "Feedback", href: "/client/feedback", icon: MessageSquare },
]
