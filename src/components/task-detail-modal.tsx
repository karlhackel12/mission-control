'use client'

import { useState } from 'react'
import { X, CheckSquare, ExternalLink, Twitter, FileText, TicketIcon, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { PRODUCTS, PRIORITY_COLORS, BADGE_COLORS } from '@/lib/constants'
import { formatDistanceToNow, format } from 'date-fns'
import type { Agent } from '@/lib/supabase/queries'
import { TaskHistory } from './task-history'

interface LinkedRef {
  type: 'twitter' | 'doc' | 'jira' | string
  url: string
  title: string
}

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  assignee_id: string | null
  assignee_name: string | null
  product_id: string
  tags?: string[] | null
  created_at: string
  updated_at: string
  deliverables?: string[] | null
  context?: string | null
  seo_alignment?: string | null
  linked_refs?: LinkedRef[] | null
  completion_note?: string | null
  completed_at?: string | null
  error_message?: string | null
}

interface TaskDetailModalProps {
  task: Task
  agents: Agent[]
  onClose: () => void
  onStatusChange?: (taskId: string, newStatus: string, rejectionNote?: string) => void
}

export function TaskDetailModal({ task, agents, onClose, onStatusChange }: TaskDetailModalProps) {
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectionNote, setRejectionNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const product = PRODUCTS.find(p => p.id === task.product_id)
  const assignee = task.assignee_id ? agents.find(a => a.id === task.assignee_id) : null

  const handleReject = async () => {
    if (!rejectionNote.trim()) return
    setIsSubmitting(true)
    await onStatusChange?.(task.id, 'in_progress', rejectionNote)
    setIsSubmitting(false)
    setShowRejectDialog(false)
    setRejectionNote('')
  }

  const handleApprove = async () => {
    setIsSubmitting(true)
    await onStatusChange?.(task.id, 'done')
    setIsSubmitting(false)
  }

  const statusColors: Record<string, string> = {
    inbox: 'bg-amber-100 text-amber-700',
    assigned: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-purple-100 text-purple-700',
    review: 'bg-orange-100 text-orange-700',
    done: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
  }

  const statusLabels: Record<string, string> = {
    inbox: 'INBOX',
    assigned: 'ASSIGNED',
    in_progress: 'IN PROGRESS',
    review: 'REVIEW',
    done: 'DONE',
    failed: 'FAILED',
  }
  
  const hasError = task.status === 'failed' || task.error_message

  const getRefIcon = (type: string) => {
    switch (type) {
      case 'twitter': return <Twitter className="w-4 h-4" />
      case 'doc': return <FileText className="w-4 h-4" />
      case 'jira': return <TicketIcon className="w-4 h-4" />
      default: return <ExternalLink className="w-4 h-4" />
    }
  }

  // Parse description for structured content
  const parseDescription = (desc: string | null) => {
    if (!desc) return { objective: '', sections: [] }
    
    const lines = desc.split('\n')
    let objective = ''
    const sections: { title: string; items: string[] }[] = []
    let currentSection: { title: string; items: string[] } | null = null
    
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.toLowerCase().startsWith('objective:')) {
        objective = trimmed.replace(/^objective:\s*/i, '')
      } else if (trimmed.endsWith(':') && !trimmed.includes(' ')) {
        // New section header
        if (currentSection) sections.push(currentSection)
        currentSection = { title: trimmed.slice(0, -1), items: [] }
      } else if ((trimmed.startsWith('- ') || trimmed.startsWith('• ') || /^\d+\./.test(trimmed)) && currentSection) {
        currentSection.items.push(trimmed.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, ''))
      } else if (trimmed && currentSection) {
        currentSection.items.push(trimmed)
      } else if (trimmed && !objective) {
        objective = trimmed
      }
    }
    if (currentSection) sections.push(currentSection)
    
    return { objective: objective || desc, sections }
  }

  const { objective, sections } = parseDescription(task.description)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg h-full bg-white shadow-xl animate-in slide-in-from-right">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
            <span className="text-sm font-semibold text-gray-900">TASK DETAIL</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <ScrollArea className="h-[calc(100vh-4rem)]">
          <div className="p-6">
            {/* Title */}
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {task.title}
            </h2>
            
            {/* Status & Priority Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge className={statusColors[task.status]}>
                {statusLabels[task.status]}
              </Badge>
              <Badge variant="outline" className={PRIORITY_COLORS[task.priority]}>
                {task.priority.toUpperCase()}
              </Badge>
            </div>

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {task.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-gray-600 border-gray-300 text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            
            {/* Error Message Section */}
            {hasError && (
              <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700 mb-2">
                  <AlertTriangle className="w-5 h-5" />
                  <h3 className="font-semibold">
                    {task.status === 'failed' ? 'Task Failed' : 'Error Occurred'}
                  </h3>
                </div>
                {task.error_message && (
                  <p className="text-sm text-red-600 font-mono bg-red-100 p-2 rounded">
                    {task.error_message}
                  </p>
                )}
              </div>
            )}
            
            {/* Description Section */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Description
              </h3>
              <div className="space-y-4">
                {objective && (
                  <p className="text-gray-700 leading-relaxed">
                    <span className="font-medium">Objective:</span> {objective}
                  </p>
                )}
                
                {sections.map((section, idx) => (
                  <div key={idx}>
                    <p className="font-medium text-gray-800 mb-2">{section.title}:</p>
                    <ul className="space-y-1">
                      {section.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-gray-400">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Deliverables */}
            {task.deliverables && task.deliverables.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Deliverables
                </h3>
                <div className="space-y-2">
                  {task.deliverables.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-gray-400 font-mono w-5">{i + 1}.</span>
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SEO Alignment */}
            {task.seo_alignment && (
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  SEO Alignment
                </h3>
                <p className="text-sm text-gray-700">{task.seo_alignment}</p>
              </div>
            )}
            
            {/* Assigned To */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Assigned to
              </h3>
              {assignee ? (
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                    style={{ backgroundColor: `${assignee.color}20` }}
                  >
                    {assignee.emoji}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">@{assignee.name}</p>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${BADGE_COLORS[assignee.badge]}`}>
                        {assignee.badge}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">{assignee.role}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Unassigned - waiting in inbox</p>
              )}
            </div>
            
            {/* Deliverable Summary - shown when agent submits for review */}
            {task.completion_note && (
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Deliverable Summary
                </h3>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckSquare className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                        {task.completion_note}
                      </p>
                      {task.completed_at && (
                        <p className="mt-2 text-xs text-gray-500">
                          Submitted {formatDistanceToNow(new Date(task.completed_at), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Context Section */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Context
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 space-y-3">
                {task.status === 'done' && task.completed_at ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckSquare className="w-5 h-5" />
                    <span className="font-medium">DELIVERABLE COMPLETE</span>
                    <span className="text-gray-500 text-sm">
                      ({format(new Date(task.completed_at), 'MMM d, yyyy')})
                    </span>
                  </div>
                ) : task.status === 'done' ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckSquare className="w-5 h-5" />
                    <span className="font-medium">COMPLETE</span>
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">
                    <p>Created {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}</p>
                    <p className="text-xs text-gray-400">
                      Updated {formatDistanceToNow(new Date(task.updated_at), { addSuffix: true })}
                    </p>
                  </div>
                )}
                
                {task.context && (
                  <p className="text-sm text-gray-600">{task.context}</p>
                )}
              </div>
            </div>

            {/* Task History */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                History
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <TaskHistory taskId={task.id} />
              </div>
            </div>

            {/* Linked References */}
            {task.linked_refs && task.linked_refs.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  See
                </h3>
                <div className="space-y-2">
                  {task.linked_refs.map((ref, i) => (
                    <a
                      key={i}
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {getRefIcon(ref.type)}
                      <span>{ref.title}</span>
                      <ExternalLink className="w-3 h-3 opacity-50" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Product */}
            {product && (
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Product
                </h3>
                <div 
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{ backgroundColor: `${product.color}10` }}
                >
                  <span>{product.emoji}</span>
                  <span className="font-medium" style={{ color: product.color }}>{product.name}</span>
                </div>
              </div>
            )}
            
            {/* Actions */}
            {task.status !== 'done' && (
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                {task.status === 'failed' && (
                  <>
                    <button 
                      onClick={() => onStatusChange?.(task.id, 'in_progress')}
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
                    >
                      ↻ Retry Task
                    </button>
                    <button 
                      onClick={() => onStatusChange?.(task.id, 'review')}
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Move to Review
                    </button>
                  </>
                )}
                {task.status === 'review' && (
                  <>
                    <button 
                      onClick={handleApprove}
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      ✓ Approve & Close
                    </button>
                    <button 
                      onClick={() => setShowRejectDialog(true)}
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Request Changes
                    </button>
                  </>
                )}
                {task.status === 'inbox' && (
                  <button 
                    onClick={() => onStatusChange?.(task.id, 'assigned')}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Assign Task
                  </button>
                )}
                {task.status === 'assigned' && (
                  <button 
                    onClick={() => onStatusChange?.(task.id, 'in_progress')}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                  >
                    Start Work
                  </button>
                )}
                {task.status === 'in_progress' && (
                  <button 
                    onClick={() => onStatusChange?.(task.id, 'review')}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
                  >
                    Submit for Review
                  </button>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Request Changes</DialogTitle>
            <DialogDescription>
              Explain what changes are needed. This will be sent to the assignee.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <textarea
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              placeholder="Describe the changes needed..."
              className="w-full h-32 p-3 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              autoFocus
            />
          </div>
          <DialogFooter>
            <button
              onClick={() => {
                setShowRejectDialog(false)
                setRejectionNote('')
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={!rejectionNote.trim() || isSubmitting}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Sending...' : 'Send Feedback'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
