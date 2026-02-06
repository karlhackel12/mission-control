'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Calendar, 
  Activity, 
  Clock, 
  ListTodo,
  Settings
} from 'lucide-react'

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/boards', label: 'Tasks', icon: ListTodo },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/activity', label: 'Activity', icon: Activity },
  { href: '/crons', label: 'Crons', icon: Clock },
]

export function MainNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:relative md:border-t-0 md:border-b md:bg-transparent z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-around md:justify-start md:gap-1 py-2 md:py-0">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 px-3 py-2 md:py-3 text-xs md:text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'text-amber-600 bg-amber-50 md:bg-amber-100/50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-amber-500' : ''}`} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

export function TopNav() {
  const pathname = usePathname()

  return (
    <div className="hidden md:flex items-center gap-1 ml-8">
      {navItems.slice(1).map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              isActive
                ? 'text-amber-700 bg-amber-100'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </div>
  )
}
