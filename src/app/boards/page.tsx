'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PRODUCTS, STATUS_LABELS, STATUS_COLORS, PRIORITY_COLORS } from '@/lib/constants'
import { formatDistanceToNow } from 'date-fns'
import type { Id } from '../../../convex/_generated/dataModel'
import { ListTodo, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'done' | 'cancelled'

const DASHBOARD_STATUSES = ['backlog', 'todo', 'in_progress', 'done'] as const

export default function BoardsPage() {
  const [mounted, setMounted] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<Id<"tasks"> | null>(null)

  const tasks = useQuery(api.tasks.listWithAgents, {
    product: selectedProduct ?? undefined,
  })

  const updateTask = useMutation(api.tasks.update)

  useEffect(() => {
    setMounted(true)
  }, [])

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

  const loading = tasks === undefined

  if (loading) {
    return (
      <div className="h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading tasks...</p>
        </div>
      </div>
    )
  }

  const filteredTasks = tasks || []
  const tasksByStatus = (status: string) => filteredTasks.filter(t => t.status === status)
  const getProductById = (id: string) => PRODUCTS.find(p => p.id === id)

  const selectedTask = selectedTaskId ? filteredTasks.find(t => t._id === selectedTaskId) : null

  return (
    <div className="h-screen bg-[#FAFAF8] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-gray-200 bg-white px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-emerald-500" />
            Task Board
          </h1>
          <div className="flex gap-1 ml-4">
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
        
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{filteredTasks.filter(t => t.status !== 'done').length}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Open Tasks</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-sm font-medium text-green-600">LIVE</span>
          </div>
        </div>
      </header>

      {/* Kanban Board */}
      <main className="flex-1 overflow-hidden p-4">
        <div className="flex gap-4 h-full overflow-x-auto">
          {DASHBOARD_STATUSES.map(status => (
            <div key={status} className="w-80 flex flex-col bg-gray-50/80 rounded-xl shrink-0">
              {/* Column Header */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: STATUS_COLORS[status] || '#888' }}
                  ></span>
                  <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    {STATUS_LABELS[status] || status}
                  </span>
                </div>
                <span className="text-sm text-gray-500 bg-white px-2.5 py-0.5 rounded-full border border-gray-200 font-medium">
                  {tasksByStatus(status).length}
                </span>
              </div>
              
              {/* Tasks */}
              <ScrollArea className="flex-1 px-3 pb-3">
                <div className="space-y-3">
                  {tasksByStatus(status).map(task => {
                    const product = getProductById(task.product || '')
                    const tags = task.tags || []
                    return (
                      <div 
                        key={task._id}
                        onClick={() => setSelectedTaskId(task._id)}
                        className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:shadow-md hover:border-gray-300 transition-all"
                      >
                        {/* Priority indicator */}
                        {task.priority === 'urgent' && (
                          <div className="flex items-center gap-1 text-red-600 text-xs font-medium mb-2">
                            <span>⚡</span> URGENT
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
                                className="w-6 h-6 rounded-lg flex items-center justify-center text-xs"
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
                          <span className="text-[11px] text-gray-400">
                            {formatDistanceToNow(new Date(task.createdAt), { addSuffix: false })}
                          </span>
                        </div>
                        
                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {product && (
                            <span 
                              className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                              style={{ backgroundColor: `${product.color}15`, color: product.color }}
                            >
                              {product.shortName}
                            </span>
                          )}
                          {tags.slice(0, 2).map(tag => (
                            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                              {tag}
                            </span>
                          ))}
                          {task.priority !== 'medium' && task.priority !== 'urgent' && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${PRIORITY_COLORS[task.priority] || ''}`}>
                              {task.priority}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  
                  {/* Empty state */}
                  {tasksByStatus(status).length === 0 && (
                    <div className="text-center py-12 text-gray-400 text-sm">
                      No tasks
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          ))}
        </div>
      </main>

      {/* Task Detail Modal */}
      {selectedTask && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setSelectedTaskId(null)}
        >
          <div 
            className="bg-white rounded-xl p-6 w-full max-w-lg m-4 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">{selectedTask.title}</h2>
            {selectedTask.description && (
              <p className="text-gray-600 mb-4">{selectedTask.description}</p>
            )}
            <div className="flex gap-2 mb-6">
              <Badge>{selectedTask.status}</Badge>
              <Badge variant="outline">{selectedTask.priority}</Badge>
            </div>
            <p className="text-sm text-gray-500 mb-4">Move to:</p>
            <div className="flex gap-2 flex-wrap">
              {DASHBOARD_STATUSES.map(status => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(selectedTask._id, status)}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                    selectedTask.status === status 
                      ? 'bg-gray-900 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {STATUS_LABELS[status] || status}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setSelectedTaskId(null)}
              className="mt-6 text-gray-500 hover:text-gray-700 text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
