'use client'

import { cn } from '@/lib/utils'
import { format } from 'date-fns'

export interface CronJobEvent {
  _id: string
  openclawId: string
  name: string
  schedule: string
  nextRunAtMs?: number
  lastStatus?: 'success' | 'failure' | 'running'
  isActive: boolean
  agent: {
    name: string
    emoji: string
    color: string
  } | null
}

interface CalendarEventProps {
  event: CronJobEvent
  occurrenceTime: Date
  onClick?: (event: CronJobEvent) => void
}

// Agent colors mapping
const agentColors: Record<string, { bg: string; border: string; text: string }> = {
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  pink: { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700' },
  green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
  yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' },
  red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700' },
  cyan: { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700' },
  teal: { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700' },
}

const defaultColors = { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700' }

export function CalendarEvent({ event, occurrenceTime, onClick }: CalendarEventProps) {
  const colors = event.agent?.color 
    ? (agentColors[event.agent.color] || defaultColors)
    : defaultColors

  const timeStr = format(occurrenceTime, 'HH:mm')

  return (
    <button
      onClick={() => onClick?.(event)}
      className={cn(
        'w-full text-left p-2 rounded-lg border transition-all',
        'hover:shadow-md hover:scale-[1.02] cursor-pointer',
        colors.bg,
        colors.border
      )}
    >
      <div className="flex items-start gap-2">
        <span className="text-lg flex-shrink-0">
          {event.agent?.emoji || '⏰'}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn('text-xs font-medium', colors.text)}>
              {timeStr}
            </span>
            {event.lastStatus === 'success' && (
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" title="Last run: success" />
            )}
            {event.lastStatus === 'failure' && (
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" title="Last run: failure" />
            )}
            {event.lastStatus === 'running' && (
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" title="Running" />
            )}
          </div>
          <p className={cn('text-sm font-medium truncate', colors.text)}>
            {event.name}
          </p>
          {event.agent && (
            <p className="text-xs text-gray-500 truncate">
              {event.agent.name}
            </p>
          )}
        </div>
      </div>
    </button>
  )
}
