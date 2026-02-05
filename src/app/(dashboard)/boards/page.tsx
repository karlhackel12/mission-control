'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PRODUCTS, AGENTS, TASK_STATUSES, STATUS_LABELS, PRIORITY_COLORS } from '@/lib/constants'
import { Plus, GripVertical, ExternalLink } from 'lucide-react'
import type { Task } from '@/lib/supabase/types'

// Mock tasks
const initialTasks: Partial<Task>[] = [
  { id: '1', product_id: 'golance', title: 'Stripe Integration', status: 'in_progress', priority: 'high', assignee_name: 'Builder' },
  { id: '2', product_id: 'golance', title: 'Dashboard Analytics', status: 'backlog', priority: 'medium', assignee_name: 'Metrics' },
  { id: '3', product_id: 'golance', title: 'User Onboarding Flow', status: 'review', priority: 'high', assignee_name: 'Growth' },
  { id: '4', product_id: 'transforce', title: 'Indeed Apply MVP', status: 'in_progress', priority: 'urgent', assignee_name: 'Developer' },
  { id: '5', product_id: 'transforce', title: 'DQ Compliance Module', status: 'backlog', priority: 'high', assignee_name: 'Developer' },
  { id: '6', product_id: 'transforce', title: 'Job Alerts System', status: 'done', priority: 'medium', assignee_name: 'Infra' },
  { id: '7', product_id: 'hellopeople', title: 'Landing Page V2', status: 'review', priority: 'high', assignee_name: 'Growth' },
  { id: '8', product_id: 'hellopeople', title: 'Voice AI Improvements', status: 'in_progress', priority: 'medium', assignee_name: 'Developer' },
  { id: '9', product_id: 'manuai', title: 'RAG Pipeline Setup', status: 'backlog', priority: 'high', assignee_name: 'Developer' },
  { id: '10', product_id: 'manuai', title: 'Agent Memory System', status: 'in_progress', priority: 'urgent', assignee_name: 'Infra' },
]

export default function BoardsPage() {
  const [tasks, setTasks] = useState<Partial<Task>[]>(initialTasks)
  const [activeProduct, setActiveProduct] = useState('golance')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newTask, setNewTask] = useState<{
    title: string
    description: string
    priority: 'low' | 'medium' | 'high' | 'urgent'
    assignee_name: string
  }>({
    title: '',
    description: '',
    priority: 'medium',
    assignee_name: ''
  })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const productTasks = tasks.filter(t => t.product_id === activeProduct)

  const moveTask = (taskId: string, newStatus: Task['status']) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: newStatus } : t
    ))
  }

  const createTask = () => {
    if (!newTask.title) return
    const task: Partial<Task> = {
      id: String(Date.now()),
      product_id: activeProduct,
      title: newTask.title,
      description: newTask.description,
      status: 'backlog',
      priority: newTask.priority,
      assignee_name: newTask.assignee_name || null
    }
    setTasks(prev => [...prev, task])
    setNewTask({ title: '', description: '', priority: 'medium', assignee_name: '' })
    setShowCreateDialog(false)
  }

  if (!mounted) return null

  const currentProduct = PRODUCTS.find(p => p.id === activeProduct)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Boards</h1>
          <p className="text-gray-500">Kanban boards for each product</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Task for {currentProduct?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input 
                  value={newTask.title}
                  onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Task title..."
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea 
                  value={newTask.description}
                  onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <Select 
                    value={newTask.priority}
                    onValueChange={(v: 'low' | 'medium' | 'high' | 'urgent') => 
                      setNewTask(prev => ({ ...prev, priority: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Assignee</label>
                  <Select 
                    value={newTask.assignee_name}
                    onValueChange={(v) => setNewTask(prev => ({ ...prev, assignee_name: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {AGENTS.map(agent => (
                        <SelectItem key={agent.id} value={agent.name}>
                          {agent.emoji} {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={createTask} className="w-full">Create Task</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Product Tabs */}
      <Tabs value={activeProduct} onValueChange={setActiveProduct}>
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          {PRODUCTS.map(product => (
            <TabsTrigger key={product.id} value={product.id} className="gap-2">
              <span>{product.emoji}</span>
              <span className="hidden sm:inline">{product.shortName}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {PRODUCTS.map(product => (
          <TabsContent key={product.id} value={product.id} className="mt-6">
            {/* Kanban Columns */}
            <div className="grid grid-cols-4 gap-4">
              {TASK_STATUSES.map(status => {
                const statusTasks = productTasks.filter(t => t.status === status)
                return (
                  <div 
                    key={status} 
                    className="bg-gray-100 rounded-lg p-4 min-h-[500px]"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      const taskId = e.dataTransfer.getData('taskId')
                      moveTask(taskId, status)
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-700">{STATUS_LABELS[status]}</h3>
                      <Badge variant="secondary" className="rounded-full">
                        {statusTasks.length}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      {statusTasks.map(task => {
                        const agent = AGENTS.find(a => a.name === task.assignee_name)
                        return (
                          <Card 
                            key={task.id}
                            className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('taskId', task.id!)
                            }}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-2">
                                <GripVertical className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm text-gray-900">{task.title}</p>
                                  {task.description && (
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                      {task.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 mt-3">
                                    <Badge className={PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS]}>
                                      {task.priority}
                                    </Badge>
                                    {agent && (
                                      <div 
                                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                                        style={{ backgroundColor: agent.color + '20' }}
                                        title={agent.name}
                                      >
                                        {agent.emoji}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {task.deliverable_url && (
                                <a 
                                  href={task.deliverable_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline mt-2"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  View Deliverable
                                </a>
                              )}
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
