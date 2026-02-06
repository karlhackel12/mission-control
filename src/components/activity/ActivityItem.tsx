'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { 
  Wrench, 
  MessageSquare, 
  CheckCircle2, 
  FilePlus, 
  Search, 
  Lightbulb, 
  AlertTriangle,
  Plus,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { Doc, Id } from '../../../convex/_generated/dataModel'

// Type icons mapping
const TYPE_ICONS: Record<string, React.ElementType> = {
  tool_call: Wrench,
  message_sent: MessageSquare,
  task_created: Plus,
  task_completed: CheckCircle2,
  file_written: FilePlus,
  search: Search,
  decision: Lightbulb,
  error: AlertTriangle,
}

// Type emoji mapping
const TYPE_EMOJIS: Record<string, string> = {
  tool_call: '🛠️',
  message_sent: '💬',
  task_created: '📝',
  task_completed: '✅',
  file_written: '📄',
  search: '🔍',
  decision: '💡',
  error: '❌',
}

// Type colors for badges
const TYPE_COLORS: Record<string, string> = {
  tool_call: 'bg-blue-100 text-blue-700 border-blue-200',
  message_sent: 'bg-green-100 text-green-700 border-green-200',
  task_created: 'bg-purple-100 text-purple-700 border-purple-200',
  task_completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  file_written: 'bg-amber-100 text-amber-700 border-amber-200',
  search: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  decision: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  error: 'bg-red-100 text-red-700 border-red-200',
}

interface Agent {
  _id: Id<"agents">
  name: string
  emoji: string
  color: string
  role: string
}

interface ActivityItemProps {
  activity: Doc<"activities">
  agent?: Agent | null
  compact?: boolean
}

export function ActivityItem({ activity, agent, compact = false }: ActivityItemProps) {
  const [expanded, setExpanded] = useState(false)
  
  const Icon = TYPE_ICONS[activity.type] || Wrench
  const emoji = TYPE_EMOJIS[activity.type] || '📌'
  const colorClass = TYPE_COLORS[activity.type] || 'bg-gray-100 text-gray-700 border-gray-200'
  
  const isError = activity.type === 'error'
  const hasMetadata = activity.metadata && Object.keys(activity.metadata).length > 0

  if (compact) {
    return (
      <div 
        className={cn(
          "flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer",
          isError && "bg-red-50/50 hover:bg-red-50"
        )}
        onClick={() => setExpanded(!expanded)}
      >
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
          style={{ backgroundColor: agent ? `${agent.color}20` : '#f3f4f6' }}
        >
          {agent?.emoji || '🤖'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">{agent?.name || 'Unknown'}</span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-500">{activity.action}</span>
          </div>
          {activity.details && (
            <p className="text-xs text-gray-600 truncate">{activity.details}</p>
          )}
        </div>
        <span className="text-[10px] text-gray-400 whitespace-nowrap">
          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: false })}
        </span>
      </div>
    )
  }

  return (
    <div 
      className={cn(
        "rounded-lg border transition-all",
        isError 
          ? "bg-red-50/50 border-red-200 hover:border-red-300" 
          : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm",
        expanded && "shadow-md"
      )}
    >
      {/* Main content */}
      <div 
        className="p-4 cursor-pointer"
        onClick={() => hasMetadata && setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3">
          {/* Agent avatar */}
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
            style={{ backgroundColor: agent ? `${agent.color}20` : '#f3f4f6' }}
          >
            {agent?.emoji || '🤖'}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-900">{agent?.name || 'Unknown Agent'}</span>
              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", colorClass)}>
                {emoji} {activity.type.replace('_', ' ')}
              </Badge>
              <span className="text-xs text-gray-400">
                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
              </span>
            </div>
            
            {/* Action */}
            <div className="flex items-center gap-2 mt-1">
              <Icon className={cn("w-4 h-4", isError ? "text-red-500" : "text-gray-400")} />
              <span className={cn(
                "text-sm font-medium",
                isError ? "text-red-700" : "text-gray-700"
              )}>
                {activity.action}
              </span>
            </div>
            
            {/* Details */}
            {activity.details && (
              <p className={cn(
                "text-sm mt-2",
                isError ? "text-red-600" : "text-gray-600"
              )}>
                {activity.details}
              </p>
            )}
            
            {/* Expand indicator */}
            {hasMetadata && (
              <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                {expanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
                <span>{expanded ? 'Hide details' : 'Show details'}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Expanded metadata */}
      {expanded && hasMetadata && (
        <div className="px-4 pb-4 pt-0">
          <div className="bg-gray-50 rounded-lg p-3 ml-13">
            <p className="text-xs font-medium text-gray-500 mb-2">Metadata</p>
            <pre className="text-xs text-gray-700 overflow-x-auto">
              {JSON.stringify(activity.metadata, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
