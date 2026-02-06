'use client'

import { useState, useEffect } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { 
  Calendar, 
  Activity, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Users,
  Zap,
  ArrowRight,
  ListTodo
} from 'lucide-react'
import { TopNav } from '@/components/nav'

export default function MissionControlPage() {
  const [mounted, setMounted] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Convex queries - real-time updates!
  const agents = useQuery(api.agents.list)
  const tasks = useQuery(api.tasks.listWithAgents, {})
  const activities = useQuery(api.activities.listWithAgents, { limit: 5 })
  const cronJobs = useQuery(api.cronJobs.listWithAgents, {})

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  if (!mounted) return null

  const loading = agents === undefined || tasks === undefined

  if (loading) {
    return (
      <div className="h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading Mission Control...</p>
        </div>
      </div>
    )
  }

  // Calculate metrics
  const activeCrons = cronJobs?.filter(c => c.isActive).length || 0
  const totalCrons = cronJobs?.length || 0
  const tasksByStatus = {
    todo: tasks?.filter(t => t.status === 'todo').length || 0,
    in_progress: tasks?.filter(t => t.status === 'in_progress').length || 0,
    done: tasks?.filter(t => t.status === 'done').length || 0,
    backlog: tasks?.filter(t => t.status === 'backlog').length || 0,
  }
  const urgentTasks = tasks?.filter(t => t.priority === 'urgent' && t.status !== 'done').length || 0
  const totalAgents = agents?.length || 0
  const activeAgentIds = new Set(
    tasks?.filter(t => t.status !== 'done' && t.assignedTo).map(t => t.assignedTo)
  )
  const activeAgents = activeAgentIds.size

  // Navigation cards
  const navCards = [
    {
      title: 'Calendar',
      description: 'View scheduled events and deadlines',
      href: '/calendar',
      icon: Calendar,
      color: 'bg-blue-500',
      hoverColor: 'hover:border-blue-300 hover:bg-blue-50/50',
    },
    {
      title: 'Activity Log',
      description: 'Real-time agent activity stream',
      href: '/activity',
      icon: Activity,
      color: 'bg-amber-500',
      hoverColor: 'hover:border-amber-300 hover:bg-amber-50/50',
    },
    {
      title: 'Cron Jobs',
      description: 'Scheduled tasks and automations',
      href: '/crons',
      icon: Clock,
      color: 'bg-purple-500',
      hoverColor: 'hover:border-purple-300 hover:bg-purple-50/50',
    },
    {
      title: 'Task Board',
      description: 'Kanban board for all tasks',
      href: '/boards',
      icon: ListTodo,
      color: 'bg-emerald-500',
      hoverColor: 'hover:border-emerald-300 hover:bg-emerald-50/50',
    },
  ]

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header */}
      <header className="h-16 border-b border-gray-200 bg-white px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-amber-500">◇</span> MISSION CONTROL
          </h1>
          <TopNav />
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-xl font-mono text-gray-900">
              {currentTime.toLocaleTimeString('en-US', { hour12: false })}
            </p>
            <p className="text-xs text-gray-500 uppercase">
              {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-sm font-medium text-green-600">ONLINE</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Business Status Section */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Business Status
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Agents Online */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  {activeAgents} active
                </span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{totalAgents}</p>
              <p className="text-sm text-gray-500 mt-1">Total Agents</p>
            </div>

            {/* Tasks in Progress */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Zap className="w-5 h-5 text-purple-600" />
                </div>
                {urgentTasks > 0 && (
                  <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {urgentTasks} urgent
                  </span>
                )}
              </div>
              <p className="text-3xl font-bold text-gray-900">{tasksByStatus.in_progress}</p>
              <p className="text-sm text-gray-500 mt-1">Tasks In Progress</p>
            </div>

            {/* Tasks Pending */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <ListTodo className="w-5 h-5 text-amber-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{tasksByStatus.todo + tasksByStatus.backlog}</p>
              <p className="text-sm text-gray-500 mt-1">Tasks Pending</p>
            </div>

            {/* Crons Running */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                  {activeCrons}/{totalCrons} active
                </span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{activeCrons}</p>
              <p className="text-sm text-gray-500 mt-1">Crons Running</p>
            </div>
          </div>
        </section>

        {/* Quick Navigation */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Quick Access
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {navCards.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className={`group bg-white rounded-xl border border-gray-200 p-5 transition-all ${card.hoverColor}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2.5 ${card.color} rounded-lg`}>
                    <card.icon className="w-5 h-5 text-white" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{card.title}</h3>
                <p className="text-sm text-gray-500">{card.description}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Two Column Layout: Recent Activity + Agents */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Recent Activity
              </h2>
              <Link href="/activity" className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {!activities || activities.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  No recent activity
                </div>
              ) : (
                activities.map((item) => (
                  <div key={item._id} className="p-4 flex gap-3 hover:bg-gray-50 transition-colors">
                    <div 
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-sm shrink-0"
                      style={{ backgroundColor: item.agent ? `${item.agent.color}20` : '#f3f4f6' }}
                    >
                      {item.agent?.emoji || '🤖'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{item.agent?.name || 'Unknown'}</span>
                        <span className="text-gray-500"> {item.action}</span>
                      </p>
                      {item.details && (
                        <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">{item.details}</p>
                      )}
                      <p className="text-[11px] text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Agent Status */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Agent Status
              </h2>
              <span className="text-sm text-gray-400">
                {activeAgents} working
              </span>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {agents?.map((agent) => {
                const isActive = activeAgentIds.has(agent._id)
                const taskCount = tasks?.filter(t => t.assignedTo === agent._id && t.status !== 'done').length || 0
                return (
                  <div key={agent._id} className="p-4 flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                      style={{ backgroundColor: `${agent.color}20` }}
                    >
                      {agent.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{agent.name}</p>
                        {agent.badge && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {agent.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{agent.role}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {taskCount > 0 && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          {taskCount} task{taskCount > 1 ? 's' : ''}
                        </span>
                      )}
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                        <span className={`text-xs ${isActive ? 'text-green-600' : 'text-gray-400'}`}>
                          {isActive ? 'ACTIVE' : 'IDLE'}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
