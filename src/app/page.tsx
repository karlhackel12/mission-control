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
  getSquadChat,
  getCronJobs,
  updateTask,
  logActivity,
  sendMessage,
  type Agent,
  type TaskWithRelations,
  type TaskUpdate
} from '@/lib/supabase/queries'
import type { AgentActivity, SquadChat, CronJob } from '@/lib/supabase/types'

type TaskStatus = 'inbox' | 'assigned' | 'in_progress' | 'review' | 'done' | 'failed'

export default function MissionControlPage() {
  const [mounted, setMounted] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null)
  // const [activityFilter, setActivityFilter] = useState<string>('all') // TODO: implement filters
  
  // Data state
  const [agents, setAgents] = useState<Agent[]>([])
  const [tasks, setTasks] = useState<TaskWithRelations[]>([])
  const [activity, setActivity] = useState<AgentActivity[]>([])
  const [squadChat, setSquadChat] = useState<SquadChat[]>([])
  const [cronJobs, setCronJobs] = useState<CronJob[]>([])
  const [loading, setLoading] = useState(true)
  const [feedTab, setFeedTab] = useState<'activity' | 'chat' | 'cron'>('activity')
  const [replyingTo, setReplyingTo] = useState<SquadChat | null>(null)

  // Fetch data from Supabase
  const fetchData = useCallback(async () => {
    try {
      const [agentsData, tasksData, activityData, chatData, cronData] = await Promise.all([
        getAgents(),
        getTasks(),
        getActivity(20),
        getSquadChat(20),
        getCronJobs()
      ])
      setAgents(agentsData)
      setTasks(tasksData)
      setActivity(activityData)
      setSquadChat(chatData)
      setCronJobs(cronData)
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
    // Auto-refresh data every 10 seconds
    const refreshTimer = setInterval(() => fetchData(), 10000)
    return () => {
      clearInterval(timer)
      clearInterval(refreshTimer)
    }
  }, [fetchData])

  // Handle task status change
  const handleStatusChange = async (taskId: string, newStatus: string, rejectionNote?: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    
    const updates: TaskUpdate = { 
      status: newStatus as TaskStatus
    }
    
    if (newStatus === 'done') {
      updates.completed_at = new Date().toISOString()
    }
    
    // Clear error_message when retrying a failed task or moving away from error state
    if (task.status === 'failed' || task.error_message) {
      updates.error_message = null
    }
    
    // If rejecting (from review to in_progress with a note), store the feedback
    if (rejectionNote && newStatus === 'in_progress') {
      // Prepend rejection note to context or create new one
      const timestamp = new Date().toLocaleString('en-US', { 
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
      })
      const feedback = `[${timestamp}] Changes requested: ${rejectionNote}`
      updates.context = task.context 
        ? `${feedback}\n\n${task.context}`
        : feedback
    }
    
    const updated = await updateTask(taskId, updates)
    if (updated) {
      // Log activity for the status change
      const actionVerb = newStatus === 'done' 
        ? 'approved' 
        : rejectionNote 
          ? 'requested changes on' 
          : `moved to ${newStatus}`
      
      await logActivity({
        agent_name: 'karl', // Human reviewer
        action: actionVerb,
        content: rejectionNote || task.title,
        task_id: taskId
      })
      
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t))
      setSelectedTask(null)
      
      // Refresh activity feed
      const newActivity = await getActivity(20)
      setActivity(newActivity)
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
                  <p className="text-xs text-green-600">{activeAgentIds.size} WITH TASKS</p>
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
              {(['inbox', 'assigned', 'in_progress', 'review', 'failed', 'done'] as TaskStatus[]).map(status => (
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
                        const hasError = task.status === 'failed' || task.error_message
                        return (
                          <div 
                            key={task.id}
                            onClick={() => setSelectedTask(task)}
                            className={`bg-white rounded-lg border p-3 cursor-pointer hover:shadow-sm transition-all ${
                              hasError 
                                ? 'border-red-400 border-2 bg-red-50/30 hover:border-red-500' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {/* Error indicator */}
                            {hasError && (
                              <div className="flex items-center gap-1.5 text-red-600 text-xs mb-2 font-medium">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                {task.status === 'failed' ? 'FAILED' : 'ERROR'}
                              </div>
                            )}
                            
                            {/* Priority indicator */}
                            {!hasError && task.priority === 'urgent' && (
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
          
          {/* Feed Content */}
          <ScrollArea className="h-[calc(100vh-14rem)]">
            <div className="p-3 space-y-3">
              {feedTab === 'activity' ? (
                /* Activity Stream */
                activity.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No activity yet
                  </div>
                ) : (
                  activity.map(item => {
                    const agent = agents.find(a => a.name === item.agent_name)
                    return (
                      <div key={item.id} className="flex gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
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
                )
              ) : feedTab === 'chat' ? (
                /* Squad Chat with Reply Threads */
                <>
                  {squadChat.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      No messages yet
                    </div>
                  ) : (
                    (() => {
                      // Organize messages: parent messages first, then group replies
                      const parentMessages = squadChat.filter(m => !m.reply_to_id)
                      const repliesMap = squadChat
                        .filter(m => m.reply_to_id)
                        .reduce((acc, m) => {
                          const parentId = m.reply_to_id!
                          if (!acc[parentId]) acc[parentId] = []
                          acc[parentId].push(m)
                          return acc
                        }, {} as Record<string, SquadChat[]>)
                      
                      return parentMessages.map(msg => {
                        const agent = agents.find(a => a.name === msg.agent_name)
                        const replies = repliesMap[msg.id] || []
                        
                        return (
                          <div key={msg.id}>
                            {/* Parent Message */}
                            <div className="flex gap-3 p-2 rounded-lg hover:bg-blue-50 transition-colors group">
                              <div 
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                                style={{ backgroundColor: agent ? `${agent.color}20` : '#f3f4f6' }}
                              >
                                {msg.is_human ? '👤' : (agent?.emoji || '🤖')}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium text-gray-900">{msg.agent_name}</p>
                                  {msg.is_human && (
                                    <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 rounded">Human</span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-700 mt-0.5">{msg.message}</p>
                                {msg.task_ref && (
                                  <p className="text-[10px] text-blue-500 mt-1">📎 Task: {msg.task_ref}</p>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                  <p className="text-[10px] text-gray-400">
                                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                                  </p>
                                  <button
                                    onClick={() => setReplyingTo(msg)}
                                    className="text-[10px] text-blue-500 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                                  >
                                    ↩️ Reply
                                  </button>
                                </div>
                              </div>
                            </div>
                            
                            {/* Replies (indented) */}
                            {replies.length > 0 && (
                              <div className="ml-8 border-l-2 border-blue-100 pl-2 space-y-1">
                                {replies.map(reply => {
                                  const replyAgent = agents.find(a => a.name === reply.agent_name)
                                  return (
                                    <div key={reply.id} className="flex gap-2 p-2 rounded-lg hover:bg-blue-50/50 transition-colors group">
                                      <div 
                                        className="w-6 h-6 rounded flex items-center justify-center text-xs shrink-0"
                                        style={{ backgroundColor: replyAgent ? `${replyAgent.color}20` : '#f3f4f6' }}
                                      >
                                        {reply.is_human ? '👤' : (replyAgent?.emoji || '🤖')}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <p className="text-xs font-medium text-gray-900">{reply.agent_name}</p>
                                          {reply.is_human && (
                                            <span className="text-[9px] bg-amber-100 text-amber-700 px-1 rounded">Human</span>
                                          )}
                                        </div>
                                        <p className="text-xs text-gray-700 mt-0.5">{reply.message}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                          <p className="text-[10px] text-gray-400">
                                            {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                                          </p>
                                          <button
                                            onClick={() => setReplyingTo(msg)}
                                            className="text-[10px] text-blue-500 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                          >
                                            ↩️
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })
                    })()
                  )}
                  
                  {/* Reply Input */}
                  {replyingTo && (
                    <div className="sticky bottom-0 bg-white border-t border-blue-200 p-2 mt-2 rounded-lg shadow-lg">
                      <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
                        <span>↩️ Replying to</span>
                        <span className="font-medium text-gray-700">{replyingTo.agent_name}</span>
                        <button
                          onClick={() => setReplyingTo(null)}
                          className="ml-auto text-gray-400 hover:text-gray-600"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="text-[10px] text-gray-400 bg-gray-50 p-1.5 rounded mb-2 line-clamp-1">
                        {replyingTo.message}
                      </div>
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault()
                          const form = e.target as HTMLFormElement
                          const input = form.elements.namedItem('replyMessage') as HTMLInputElement
                          if (!input.value.trim()) return
                          
                          await sendMessage({
                            agent_name: 'Karl',
                            message: input.value.trim(),
                            reply_to_id: replyingTo.id,
                            is_human: true
                          })
                          
                          input.value = ''
                          setReplyingTo(null)
                          fetchData()
                        }}
                        className="flex gap-2"
                      >
                        <input
                          name="replyMessage"
                          type="text"
                          placeholder="Type your reply..."
                          className="flex-1 text-sm px-3 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                        <button
                          type="submit"
                          className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600"
                        >
                          Send
                        </button>
                      </form>
                    </div>
                  )}
                </>
              ) : (
                /* Cron Jobs */
                cronJobs.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No cron jobs configured
                  </div>
                ) : (
                  cronJobs.map(job => {
                    const agent = job.agent_id ? agents.find(a => a.id === job.agent_id) : null
                    return (
                      <div 
                        key={job.id} 
                        className={`p-3 rounded-lg border transition-colors ${
                          job.enabled 
                            ? 'bg-purple-50 border-purple-200 hover:border-purple-300' 
                            : 'bg-gray-50 border-gray-200 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${job.enabled ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                            <span className="font-medium text-sm text-gray-900">{job.name}</span>
                          </div>
                          {agent && (
                            <div 
                              className="w-6 h-6 rounded flex items-center justify-center text-xs"
                              style={{ backgroundColor: `${agent.color}20` }}
                              title={agent.name}
                            >
                              {agent.emoji}
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
                          
                          {job.last_run && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500 w-16">Last run:</span>
                              <span className="text-gray-700">
                                {formatDistanceToNow(new Date(job.last_run), { addSuffix: true })}
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 w-16">Status:</span>
                            <span className={`px-1.5 py-0.5 rounded ${
                              job.enabled 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-200 text-gray-600'
                            }`}>
                              {job.enabled ? 'Active' : 'Paused'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )
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
