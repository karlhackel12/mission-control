'use client'

import { useEffect, useState } from 'react'
import { Clock, Play, Send, CheckCircle, MessageSquare, AlertCircle, RefreshCw, Loader2 } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { getActivityByTask } from '@/lib/supabase/queries'
import type { AgentActivity } from '@/lib/supabase/types'

interface TaskHistoryProps {
  taskId: string
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  'created': <Clock className="w-3.5 h-3.5" />,
  'started': <Play className="w-3.5 h-3.5" />,
  'submitted': <Send className="w-3.5 h-3.5" />,
  'completed': <CheckCircle className="w-3.5 h-3.5" />,
  'approved': <CheckCircle className="w-3.5 h-3.5" />,
  'rejected': <AlertCircle className="w-3.5 h-3.5" />,
  'comment': <MessageSquare className="w-3.5 h-3.5" />,
  'updated': <RefreshCw className="w-3.5 h-3.5" />,
}

const ACTION_COLORS: Record<string, string> = {
  'created': 'bg-gray-100 text-gray-600',
  'started': 'bg-purple-100 text-purple-600',
  'submitted': 'bg-orange-100 text-orange-600',
  'completed': 'bg-green-100 text-green-600',
  'approved': 'bg-green-100 text-green-600',
  'rejected': 'bg-red-100 text-red-600',
  'comment': 'bg-blue-100 text-blue-600',
  'updated': 'bg-gray-100 text-gray-600',
}

function getActionCategory(action: string): string {
  const lower = action.toLowerCase()
  if (lower.includes('creat')) return 'created'
  if (lower.includes('start') || lower.includes('progress')) return 'started'
  if (lower.includes('submit') || lower.includes('review')) return 'submitted'
  if (lower.includes('complet') || lower.includes('done')) return 'completed'
  if (lower.includes('approv')) return 'approved'
  if (lower.includes('reject') || lower.includes('change')) return 'rejected'
  if (lower.includes('comment') || lower.includes('note')) return 'comment'
  return 'updated'
}

export function TaskHistory({ taskId }: TaskHistoryProps) {
  const [activities, setActivities] = useState<AgentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadHistory() {
      setLoading(true)
      const data = await getActivityByTask(taskId)
      setActivities(data)
      setLoading(false)
    }
    loadHistory()
  }, [taskId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500 text-sm">
        <Clock className="w-5 h-5 mx-auto mb-2 opacity-50" />
        No history yet
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gray-200" />
      
      <div className="space-y-3">
        {activities.map((activity) => {
          const category = getActionCategory(activity.action)
          const icon = ACTION_ICONS[category] || ACTION_ICONS['updated']
          const colorClass = ACTION_COLORS[category] || ACTION_COLORS['updated']
          
          return (
            <div key={activity.id} className="relative flex gap-3 pl-0">
              {/* Icon */}
              <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${colorClass} shrink-0`}>
                {icon}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900 text-sm">
                    @{activity.agent_name}
                  </span>
                  <span className="text-gray-700 text-sm">
                    {activity.action}
                  </span>
                </div>
                
                {activity.content && (
                  <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                    {activity.content}
                  </p>
                )}
                
                <p className="text-gray-400 text-xs mt-1" title={format(new Date(activity.created_at), 'PPpp')}>
                  {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
