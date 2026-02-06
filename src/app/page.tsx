'use client'

import { useState, useEffect, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PRODUCTS, STATUS_LABELS, BADGE_COLORS, STATUS_COLORS, PRIORITY_COLORS } from '@/lib/constants'
import { formatDistanceToNow } from 'date-fns'
import { TaskDetailModal } from '@/components/task-detail-modal'
import { 
  getAgents, 
  getTasks, 
  getActivity, 
  updateTask,
  type Agent,
  type TaskWithRelations,
  type TaskUpdate
} from '@/lib/supabase/queries'
import type { AgentActivity } from '@/lib/supabase/types'

type TaskStatus = 'inbox' | 'assigned' | 'in_progress' | 'review' | 'done'

export default function MissionControlPage() {
  const [mounted, setMounted] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null)
  const [activityFilter, setActivityFilter] = useState<string>('all')
  
  // Data state
  const [agents, setAgents] = useState<Agent[]>([])
  const [tasks, setTasks] = useState<TaskWithRelations[]>([])
  const [activity, setActivity] = useState<AgentActivity[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch data from Supabase
  const fetchData = useCallback(async () => {
    try {
      const [agentsData, tasksData, activityData] = await Promise.all([
        getAgents(),
        getTasks(),
        getActivity(20)
      ])
      setAgents(agentsData)
      setTasks(tasksData)
      setActivity(activityData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    fetchData()
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [fetchData])

  // Handle task status change
  const handleStatusChange = async (taskId: string, newStatus: string) => {
    const updates: TaskUpdate = { 
      status: newStatus as TaskStatus
    }
    if (newStatus === 'done') {
      updates.completed_at = new Date().toISOString()
    }
    
    const updated = await updateTask(taskId, updates)
    if (updated) {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t))
      setSelectedTask(null)
    }
  }

  if (!mounted) return null

  const filteredTasks = selectedProduct 
    ? tasks.filter(t => t.product_id === selectedProduct)
    : tasks

  const tasksByStatus = (status: TaskStatus) => filteredTasks.filter(t => t.status === status)
  
  const activeAgentIds = new Set(
    tasks
      .filter(t => t.status !== 'done' && t.assignee_id)
      .map(t => t.assignee_id)
  )

  const getAgentById = (id: string) => agents.find(a => a.id === id)
  const getProductById = (id: string) => PRODUCTS.find(p => p.id === id)

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

  return (
    <div className="h-screen bg-[#FAFAF8] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-gray-200 bg-white px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-amber-500">◇</span> MISSION CONTROL
          </h1>
          <div className="flex gap-1">
            <button 
              onClick={() => setSelectedProduct(null)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${!selectedProduct ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              All
            </button>
            {PRODUCTS.map(p => (
              <button 
                key={p.id}
                onClick={() => setSelectedProduct(p.id)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${selectedProduct === p.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {p.shortName}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-8">
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">{activeAgentIds.size}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Agents Active</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">{filteredTasks.filter(t => t.status !== 'done').length}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Tasks in Queue</p>
          </div>
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

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Agents */}
        <aside className="w-56 border-r border-gray-200 bg-white shrink-0">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                AGENTS
              </h2>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{agents.length}</span>
            </div>
          </div>
          <ScrollArea className="h-[calc(100vh-8rem)]">
            <div className="p-2">
              {/* All Agents Button */}
              <button className="w-full p-3 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 mb-2 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-lg">
                  ∞
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">All Agents</p>
                  <p className="text-xs text-green-600">{activeAgentIds.size} ACTIVE</p>
                </div>
              </button>
              
              {/* Individual Agents */}
              {agents.map(agent => {
                const isActive = activeAgentIds.has(agent.id)
                const taskCount = tasks.filter(t => t.assignee_id === agent.id && t.status !== 'done').length
                return (
                  <div key={agent.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                      style={{ backgroundColor: `${agent.color}20` }}
                    >
                      {agent.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 truncate">{agent.name}</p>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${BADGE_COLORS[agent.badge]}`}>
                          {agent.badge}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{agent.role}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {isActive ? (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                          WORKING
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">IDLE</span>
                      )}
                      {taskCount > 0 && (
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 rounded">{taskCount}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </aside>

        {/* Center - Mission Queue (Kanban) */}
        <main className="flex-1 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-white">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                MISSION QUEUE
              </h2>
            </div>
          </div>
          
          <div className="p-4 h-[calc(100vh-8rem)] overflow-x-auto">
            <div className="flex gap-4 h-full min-w-max">
              {(['inbox', 'assigned', 'in_progress', 'review', 'done'] as TaskStatus[]).map(status => (
                <div key={status} className="w-72 flex flex-col bg-gray-50/50 rounded-lg shrink-0">
                  {/* Column Header */}
                  <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: STATUS_COLORS[status] }}
                      ></span>
                      <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        {STATUS_LABELS[status]}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">
                      {tasksByStatus(status).length}
                    </span>
                  </div>
                  
                  {/* Tasks */}
                  <ScrollArea className="flex-1 px-2 pb-2">
                    <div className="space-y-2">
                      {tasksByStatus(status).map(task => {
                        const product = getProductById(task.product_id)
                        const assignee = task.assignee_id ? getAgentById(task.assignee_id) : null
                        const tags = task.tags || []
                        return (
                          <div 
                            key={task.id}
                            onClick={() => setSelectedTask(task)}
                            className="bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all"
                          >
                            {/* Priority indicator */}
                            {task.priority === 'urgent' && (
                              <div className="flex items-center gap-1 text-red-600 text-xs mb-2">
                                <span>!</span> URGENT
                              </div>
                            )}
                            
                            {/* Title */}
                            <h3 className="font-medium text-gray-900 text-sm leading-snug mb-2">
                              {task.title}
                            </h3>
                            
                            {/* Description preview */}
                            {task.description && (
                              <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                                {task.description}
                              </p>
                            )}
                            
                            {/* Footer */}
                            <div className="flex items-center justify-between">
                              {/* Assignee */}
                              {assignee ? (
                                <div className="flex items-center gap-1.5">
                                  <span 
                                    className="w-5 h-5 rounded flex items-center justify-center text-xs"
                                    style={{ backgroundColor: `${assignee.color}20` }}
                                  >
                                    {assignee.emoji}
                                  </span>
                                  <span className="text-xs text-gray-600">{assignee.name}</span>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">Unassigned</span>
                              )}
                              
                              {/* Time */}
                              <span className="text-[10px] text-gray-400">
                                {formatDistanceToNow(new Date(task.created_at), { addSuffix: false })}
                              </span>
                            </div>
                            
                            {/* Tags */}
                            <div className="flex flex-wrap gap-1 mt-2">
                              {product && (
                                <span 
                                  className="text-[10px] px-1.5 py-0.5 rounded"
                                  style={{ backgroundColor: `${product.color}15`, color: product.color }}
                                >
                                  {product.shortName}
                                </span>
                              )}
                              {tags.slice(0, 2).map(tag => (
                                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                                  {tag}
                                </span>
                              ))}
                              {task.priority !== 'normal' && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${PRIORITY_COLORS[task.priority]}`}>
                                  {task.priority}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                      
                      {/* Empty state */}
                      {tasksByStatus(status).length === 0 && (
                        <div className="text-center py-8 text-gray-400 text-sm">
                          No tasks
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Right Sidebar - Live Feed */}
        <aside className="w-80 border-l border-gray-200 bg-white shrink-0">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                LIVE FEED
              </h2>
              <span className="text-xs text-gray-500">{activity.length} events</span>
            </div>
          </div>
          
          {/* Filters */}
          <div className="p-3 border-b border-gray-100">
            <div className="flex flex-wrap gap-1">
              {['all', 'tasks', 'comments', 'decisions', 'status'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setActivityFilter(filter)}
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${
                    activityFilter === filter 
                      ? 'bg-amber-100 text-amber-700' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
            
            {/* Agent Filter */}
            <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-gray-50">
              <span className="text-[10px] text-gray-500 w-full mb-1">All Agents</span>
              {agents.slice(0, 6).map(agent => (
                <button
                  key={agent.id}
                  className="flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <span>{agent.emoji}</span>
                  <span className="text-gray-600">{agent.name}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Activity Stream */}
          <ScrollArea className="h-[calc(100vh-14rem)]">
            <div className="p-3 space-y-3">
              {activity.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No activity yet
                </div>
              ) : (
                activity.map(item => {
                  const agent = agents.find(a => a.name === item.agent_name)
                  return (
                    <div key={item.id} className="flex gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                        style={{ backgroundColor: agent ? `${agent.color}20` : '#f3f4f6' }}
                      >
                        {agent?.emoji || '🤖'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">{item.agent_name}</span>
                          <span className="text-gray-500"> {item.action}</span>
                        </p>
                        {item.content && (
                          <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{item.content}</p>
                        )}
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </ScrollArea>
        </aside>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal 
          task={selectedTask}
          agents={agents}
          onClose={() => setSelectedTask(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  )
}
