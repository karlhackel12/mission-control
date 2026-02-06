'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PRODUCTS, STATUS_LABELS, BADGE_COLORS, STATUS_COLORS, PRIORITY_COLORS } from '@/lib/constants'
import { formatDistanceToNow } from 'date-fns'
import type { Id } from '../../convex/_generated/dataModel'

type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'done' | 'cancelled'

// Extended status for dashboard kanban
const DASHBOARD_STATUSES = ['backlog', 'todo', 'in_progress', 'done'] as const

export default function MissionControlPage() {
  const [mounted, setMounted] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<Id<"tasks"> | null>(null)
  const [feedTab, setFeedTab] = useState<'activity' | 'chat' | 'cron'>('activity')

  // Convex queries - real-time updates!
  const agents = useQuery(api.agents.list)
  const tasks = useQuery(api.tasks.listWithAgents, {
    product: selectedProduct ?? undefined,
  })
  const activities = useQuery(api.activities.listWithAgents, { limit: 20 })
  const messages = useQuery(api.messages.listWithAgents, { limit: 20 })
  const cronJobs = useQuery(api.cronJobs.listWithAgents, {})

  // Convex mutations
  const updateTask = useMutation(api.tasks.update)

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Handle task status change
  const handleStatusChange = async (taskId: Id<"tasks">, newStatus: string) => {
    try {
      await updateTask({
        id: taskId,
        status: newStatus as TaskStatus,
      })
      setSelectedTaskId(null)
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

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

  const filteredTasks = tasks || []
  const tasksByStatus = (status: string) => filteredTasks.filter(t => t.status === status)
  
  const activeAgentIds = new Set(
    filteredTasks
      .filter(t => t.status !== 'done' && t.assignedTo)
      .map(t => t.assignedTo)
  )

  const getProductById = (id: string) => PRODUCTS.find(p => p.id === id)

  const selectedTask = selectedTaskId ? filteredTasks.find(t => t._id === selectedTaskId) : null

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
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{agents?.length || 0}</span>
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
                  <p className="text-xs text-green-600">{activeAgentIds.size} WITH TASKS</p>
                </div>
              </button>
              
              {/* Individual Agents */}
              {agents?.map(agent => {
                const isActive = activeAgentIds.has(agent._id)
                const taskCount = filteredTasks.filter(t => t.assignedTo === agent._id && t.status !== 'done').length
                return (
                  <div key={agent._id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                      style={{ backgroundColor: `${agent.color}20` }}
                    >
                      {agent.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 truncate">{agent.name}</p>
                        {agent.badge && (
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${(BADGE_COLORS as Record<string, string>)[agent.badge] || ''}`}>
                            {agent.badge}
                          </Badge>
                        )}
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
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Real-time
              </div>
            </div>
          </div>
          
          <div className="p-4 h-[calc(100vh-8rem)] overflow-x-auto">
            <div className="flex gap-4 h-full min-w-max">
              {DASHBOARD_STATUSES.map(status => (
                <div key={status} className="w-72 flex flex-col bg-gray-50/50 rounded-lg shrink-0">
                  {/* Column Header */}
                  <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: STATUS_COLORS[status] || '#888' }}
                      ></span>
                      <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        {STATUS_LABELS[status] || status}
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
                        const product = getProductById(task.product || '')
                        const tags = task.tags || []
                        return (
                          <div 
                            key={task._id}
                            onClick={() => setSelectedTaskId(task._id)}
                            className="bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:shadow-sm hover:border-gray-300 transition-all"
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
                              {task.assignee ? (
                                <div className="flex items-center gap-1.5">
                                  <span 
                                    className="w-5 h-5 rounded flex items-center justify-center text-xs"
                                    style={{ backgroundColor: `${task.assignee.color}20` }}
                                  >
                                    {task.assignee.emoji}
                                  </span>
                                  <span className="text-xs text-gray-600">{task.assignee.name}</span>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">Unassigned</span>
                              )}
                              
                              {/* Time */}
                              <span className="text-[10px] text-gray-400">
                                {formatDistanceToNow(new Date(task.createdAt), { addSuffix: false })}
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
                              {task.priority !== 'medium' && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${PRIORITY_COLORS[task.priority] || ''}`}>
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
              <span className="text-xs text-gray-500">{activities?.length || 0} events</span>
            </div>
          </div>
          
          {/* Tabs: Activity | Chat | Cron */}
          <div className="p-3 border-b border-gray-100">
            <div className="flex gap-1">
              <button
                onClick={() => setFeedTab('activity')}
                className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                  feedTab === 'activity' 
                    ? 'bg-amber-100 text-amber-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                📊 Activity
              </button>
              <button
                onClick={() => setFeedTab('chat')}
                className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                  feedTab === 'chat' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                💬 Chat
              </button>
              <button
                onClick={() => setFeedTab('cron')}
                className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                  feedTab === 'cron' 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                ⏰ Cron
              </button>
            </div>
          </div>
          
          {/* Feed Content */}
          <ScrollArea className="h-[calc(100vh-14rem)]">
            <div className="p-3 space-y-3">
              {feedTab === 'activity' ? (
                /* Activity Stream */
                !activities || activities.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No activity yet
                  </div>
                ) : (
                  activities.map(item => (
                    <div key={item._id} className="flex gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
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
                          <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{item.details}</p>
                        )}
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))
                )
              ) : feedTab === 'chat' ? (
                /* Squad Chat */
                !messages || messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No messages yet
                  </div>
                ) : (
                  messages.map(msg => (
                    <div key={msg._id} className="flex gap-3 p-2 rounded-lg hover:bg-blue-50 transition-colors">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                        style={{ backgroundColor: msg.agent ? `${msg.agent.color}20` : '#f3f4f6' }}
                      >
                        {msg.isHuman ? '👤' : (msg.agent?.emoji || '🤖')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900">{msg.agent?.name || 'Unknown'}</p>
                          {msg.isHuman && (
                            <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 rounded">Human</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mt-0.5 line-clamp-2">{msg.content}</p>
                        {msg.taskRef && (
                          <p className="text-[10px] text-blue-500 mt-1">📎 Task: {msg.taskRef}</p>
                        )}
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))
                )
              ) : (
                /* Cron Jobs */
                !cronJobs || cronJobs.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No cron jobs configured
                  </div>
                ) : (
                  cronJobs.slice(0, 10).map(job => (
                    <div 
                      key={job._id} 
                      className={`p-3 rounded-lg border transition-colors ${
                        job.isActive 
                          ? 'bg-purple-50 border-purple-200 hover:border-purple-300' 
                          : 'bg-gray-50 border-gray-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${job.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                          <span className="font-medium text-sm text-gray-900">{job.name}</span>
                        </div>
                        {job.agent && (
                          <div 
                            className="w-6 h-6 rounded flex items-center justify-center text-xs"
                            style={{ backgroundColor: `${job.agent.color}20` }}
                            title={job.agent.name}
                          >
                            {job.agent.emoji}
                          </div>
                        )}
                      </div>
                      
                      {job.description && (
                        <p className="text-xs text-gray-600 mb-2">{job.description}</p>
                      )}
                      
                      <div className="flex flex-col gap-1 text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-16">Schedule:</span>
                          <code className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded font-mono">
                            {job.schedule}
                          </code>
                        </div>
                        
                        {job.lastRunAtMs && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 w-16">Last run:</span>
                            <span className="text-gray-700">
                              {formatDistanceToNow(new Date(job.lastRunAtMs), { addSuffix: true })}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-16">Status:</span>
                          <span className={`px-1.5 py-0.5 rounded ${
                            job.isActive 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {job.isActive ? 'Active' : 'Paused'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )
              )}
            </div>
          </ScrollArea>
        </aside>
      </div>

      {/* Task Detail Modal - simplified version */}
      {selectedTask && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setSelectedTaskId(null)}
        >
          <div 
            className="bg-white rounded-lg p-6 w-full max-w-lg m-4"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">{selectedTask.title}</h2>
            {selectedTask.description && (
              <p className="text-gray-600 mb-4">{selectedTask.description}</p>
            )}
            <div className="flex gap-2 mb-4">
              <Badge>{selectedTask.status}</Badge>
              <Badge variant="outline">{selectedTask.priority}</Badge>
            </div>
            <div className="flex gap-2">
              {DASHBOARD_STATUSES.map(status => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(selectedTask._id, status)}
                  className={`px-3 py-1 text-sm rounded ${
                    selectedTask.status === status 
                      ? 'bg-gray-900 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {STATUS_LABELS[status] || status}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setSelectedTaskId(null)}
              className="mt-4 text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
