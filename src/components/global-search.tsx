'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  FileText,
  User,
  Clock,
  MessageSquare,
  Calendar,
  Zap,
  Command,
  ArrowRight,
  LayoutDashboard,
  Kanban,
  Settings,
  Activity
} from 'lucide-react'
import { getTasks, getAgents, getActivity, getSquadChat, getCronJobs } from '@/lib/supabase/queries'
import type { Task, AgentActivity, SquadChat, CronJob, Agent } from '@/lib/supabase/types'
import { formatDistanceToNow } from 'date-fns'

interface SearchResult {
  id: string
  type: 'task' | 'agent' | 'activity' | 'message' | 'cron' | 'page'
  title: string
  subtitle?: string
  icon: React.ReactNode
  href?: string
  action?: () => void
  meta?: string
}

const QUICK_ACTIONS: SearchResult[] = [
  {
    id: 'page-dashboard',
    type: 'page',
    title: 'Dashboard',
    subtitle: 'View mission overview',
    icon: <LayoutDashboard className="w-4 h-4" />,
    href: '/'
  },
  {
    id: 'page-calendar',
    type: 'page',
    title: 'Calendar',
    subtitle: 'View scheduled cron jobs',
    icon: <Calendar className="w-4 h-4" />,
    href: '/calendar'
  },
  {
    id: 'page-boards',
    type: 'page',
    title: 'Boards',
    subtitle: 'Kanban task boards',
    icon: <Kanban className="w-4 h-4" />,
    href: '/boards'
  },
  {
    id: 'page-activity',
    type: 'page',
    title: 'Activity Feed',
    subtitle: 'View all agent activity',
    icon: <Activity className="w-4 h-4" />,
    href: '/activity'
  },
  {
    id: 'page-chat',
    type: 'page',
    title: 'Squad Chat',
    subtitle: 'Team communication',
    icon: <MessageSquare className="w-4 h-4" />,
    href: '/chat'
  },
  {
    id: 'page-crons',
    type: 'page',
    title: 'Cron Monitor',
    subtitle: 'View cron job status',
    icon: <Clock className="w-4 h-4" />,
    href: '/crons'
  },
  {
    id: 'page-settings',
    type: 'page',
    title: 'Settings',
    subtitle: 'Configure Mission Control',
    icon: <Settings className="w-4 h-4" />,
    href: '/settings'
  },
]

const TYPE_ICONS = {
  task: <FileText className="w-4 h-4 text-blue-500" />,
  agent: <User className="w-4 h-4 text-purple-500" />,
  activity: <Zap className="w-4 h-4 text-amber-500" />,
  message: <MessageSquare className="w-4 h-4 text-green-500" />,
  cron: <Clock className="w-4 h-4 text-cyan-500" />,
  page: <ArrowRight className="w-4 h-4 text-gray-500" />,
}

export function GlobalSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [tasks, setTasks] = useState<Task[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [activities, setActivities] = useState<AgentActivity[]>([])
  const [messages, setMessages] = useState<SquadChat[]>([])
  const [cronJobs, setCronJobs] = useState<CronJob[]>([])
  const [loaded, setLoaded] = useState(false)

  // Keyboard shortcut to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Load data when opening
  useEffect(() => {
    if (open && !loaded) {
      Promise.all([
        getTasks(),
        getAgents(),
        getActivity(50),
        getSquadChat(50),
        getCronJobs()
      ]).then(([tasksData, agentsData, activityData, messagesData, cronData]) => {
        setTasks(tasksData)
        setAgents(agentsData)
        setActivities(activityData)
        setMessages(messagesData)
        setCronJobs(cronData)
        setLoaded(true)
      })
    }
  }, [open, loaded])

  // Reset when closing
  useEffect(() => {
    if (!open) {
      setQuery('')
      setSelectedIndex(0)
    }
  }, [open])

  // Build search results
  const searchResults = useMemo(() => {
    const results: SearchResult[] = []
    const lowerQuery = query.toLowerCase().trim()
    
    // If no query, show quick actions
    if (!lowerQuery) {
      return QUICK_ACTIONS
    }
    
    // Search tasks
    tasks
      .filter(t => 
        t.title.toLowerCase().includes(lowerQuery) ||
        t.description?.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 5)
      .forEach(task => {
        results.push({
          id: `task-${task.id}`,
          type: 'task',
          title: task.title,
          subtitle: task.description?.substring(0, 60) || undefined,
          icon: TYPE_ICONS.task,
          meta: task.status,
          href: `/?task=${task.id}`
        })
      })
    
    // Search agents
    agents
      .filter(a =>
        a.name.toLowerCase().includes(lowerQuery) ||
        a.role.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 3)
      .forEach(agent => {
        results.push({
          id: `agent-${agent.id}`,
          type: 'agent',
          title: `${agent.emoji} ${agent.name}`,
          subtitle: agent.role,
          icon: TYPE_ICONS.agent,
          meta: agent.badge
        })
      })
    
    // Search activities
    activities
      .filter(a =>
        a.agent_name.toLowerCase().includes(lowerQuery) ||
        a.action.toLowerCase().includes(lowerQuery) ||
        a.content?.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 3)
      .forEach(activity => {
        results.push({
          id: `activity-${activity.id}`,
          type: 'activity',
          title: `${activity.agent_name} ${activity.action}`,
          subtitle: activity.content?.substring(0, 60) || undefined,
          icon: TYPE_ICONS.activity,
          meta: formatDistanceToNow(new Date(activity.created_at), { addSuffix: true }),
          href: '/activity'
        })
      })
    
    // Search messages
    messages
      .filter(m =>
        m.agent_name.toLowerCase().includes(lowerQuery) ||
        m.message.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 3)
      .forEach(message => {
        results.push({
          id: `message-${message.id}`,
          type: 'message',
          title: message.agent_name,
          subtitle: message.message.substring(0, 80),
          icon: TYPE_ICONS.message,
          meta: formatDistanceToNow(new Date(message.created_at), { addSuffix: true }),
          href: '/chat'
        })
      })
    
    // Search cron jobs
    cronJobs
      .filter(c =>
        c.name.toLowerCase().includes(lowerQuery) ||
        c.description?.toLowerCase().includes(lowerQuery) ||
        c.schedule.includes(lowerQuery)
      )
      .slice(0, 3)
      .forEach(cron => {
        results.push({
          id: `cron-${cron.id}`,
          type: 'cron',
          title: cron.name,
          subtitle: cron.description || cron.schedule,
          icon: TYPE_ICONS.cron,
          meta: cron.enabled ? 'Active' : 'Disabled',
          href: '/crons'
        })
      })
    
    // Add matching pages
    QUICK_ACTIONS
      .filter(p =>
        p.title.toLowerCase().includes(lowerQuery) ||
        p.subtitle?.toLowerCase().includes(lowerQuery)
      )
      .forEach(page => results.push(page))
    
    return results
  }, [query, tasks, agents, activities, messages, cronJobs])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return
      
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, searchResults.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const selected = searchResults[selectedIndex]
        if (selected) {
          if (selected.href) {
            router.push(selected.href)
            setOpen(false)
          } else if (selected.action) {
            selected.action()
            setOpen(false)
          }
        }
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, selectedIndex, searchResults, router])

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [searchResults])

  const handleSelect = (result: SearchResult) => {
    if (result.href) {
      router.push(result.href)
      setOpen(false)
    } else if (result.action) {
      result.action()
      setOpen(false)
    }
  }

  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
      >
        <Search className="w-4 h-4" />
        <span>Search...</span>
        <kbd className="hidden md:flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium bg-white rounded border border-gray-200">
          <Command className="w-3 h-3" />K
        </kbd>
      </button>
      
      {/* Search Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
            <Search className="w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search tasks, agents, messages, cron jobs..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 border-0 shadow-none focus-visible:ring-0 text-base placeholder:text-gray-400"
              autoFocus
            />
            <kbd className="px-2 py-1 text-xs text-gray-400 bg-gray-100 rounded">ESC</kbd>
          </div>
          
          {/* Results */}
          <ScrollArea className="max-h-[60vh]">
            <div className="p-2">
              {searchResults.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No results found for &quot;{query}&quot;
                </div>
              ) : (
                <>
                  {!query && (
                    <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase">
                      Quick Navigation
                    </p>
                  )}
                  
                  {query && (
                    <p className="px-3 py-2 text-xs text-gray-400">
                      {searchResults.length} results
                    </p>
                  )}
                  
                  {searchResults.map((result, index) => (
                    <button
                      key={result.id}
                      onClick={() => handleSelect(result)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left
                        transition-colors
                        ${selectedIndex === index 
                          ? 'bg-amber-50 text-gray-900' 
                          : 'hover:bg-gray-50 text-gray-700'
                        }
                      `}
                    >
                      <div className={`
                        w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                        ${selectedIndex === index ? 'bg-amber-100' : 'bg-gray-100'}
                      `}>
                        {result.icon}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{result.title}</p>
                        {result.subtitle && (
                          <p className="text-sm text-gray-500 truncate">
                            {result.subtitle}
                          </p>
                        )}
                      </div>
                      
                      {result.meta && (
                        <Badge variant="outline" className="shrink-0 text-xs">
                          {result.meta}
                        </Badge>
                      )}
                      
                      {selectedIndex === index && (
                        <ArrowRight className="w-4 h-4 text-amber-500 shrink-0" />
                      )}
                    </button>
                  ))}
                </>
              )}
            </div>
          </ScrollArea>
          
          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white rounded border">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-white rounded border">↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white rounded border">↵</kbd>
                Open
              </span>
            </div>
            <span>
              Mission Control v2
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
