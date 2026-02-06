'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { CronJobEvent } from './CalendarEvent'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface EventDetailModalProps {
  event: CronJobEvent | null
  open: boolean
  onClose: () => void
}

// Helper to get human-readable cron description
function describeCronSchedule(schedule: string): string {
  const parts = schedule.split(' ')
  if (parts.length < 5) return schedule
  
  const [minute, hour, dayOfMonth, , dayOfWeek] = parts
  
  let description = ''
  
  // Time part
  if (hour === '*' && minute.startsWith('*/')) {
    const interval = minute.slice(2)
    description = `Every ${interval} minutes`
  } else if (hour === '*') {
    description = 'Every hour'
  } else if (hour.includes(',')) {
    const hours = hour.split(',').map(h => `${h}:00`)
    description = `At ${hours.join(', ')}`
  } else if (hour.includes('/')) {
    const interval = hour.split('/')[1]
    description = `Every ${interval} hours`
  } else {
    const m = minute === '0' ? '00' : minute
    description = `At ${hour}:${m}`
  }
  
  // Day part
  if (dayOfWeek !== '*') {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const dowStr = dayOfWeek.split(',').map(d => {
      if (d.includes('-')) {
        const [start, end] = d.split('-').map(Number)
        return `${days[start]}-${days[end]}`
      }
      return days[parseInt(d)] || d
    }).join(', ')
    description += ` on ${dowStr}`
  } else if (dayOfMonth !== '*') {
    description += ` on day ${dayOfMonth} of month`
  } else {
    description += ' every day'
  }
  
  return description
}

export function EventDetailModal({ event, open, onClose }: EventDetailModalProps) {
  if (!event) return null

  const scheduleDescription = describeCronSchedule(event.schedule)
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-2xl">{event.agent?.emoji || '⏰'}</span>
            <span>{event.name}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {/* Agent info */}
          {event.agent && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 w-20">Agent:</span>
              <Badge variant="secondary" className={cn(
                'text-sm',
                event.agent.color === 'blue' && 'bg-blue-100 text-blue-700',
                event.agent.color === 'pink' && 'bg-pink-100 text-pink-700',
                event.agent.color === 'green' && 'bg-green-100 text-green-700',
                event.agent.color === 'purple' && 'bg-purple-100 text-purple-700',
                event.agent.color === 'orange' && 'bg-orange-100 text-orange-700',
              )}>
                {event.agent.name}
              </Badge>
            </div>
          )}
          
          {/* Schedule */}
          <div className="flex items-start gap-2">
            <span className="text-sm text-gray-500 w-20">Schedule:</span>
            <div>
              <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                {event.schedule}
              </code>
              <p className="text-sm text-gray-600 mt-1">{scheduleDescription}</p>
            </div>
          </div>
          
          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 w-20">Status:</span>
            <Badge variant={event.isActive ? 'default' : 'secondary'}>
              {event.isActive ? '🟢 Active' : '⏸️ Paused'}
            </Badge>
          </div>
          
          {/* Last run status */}
          {event.lastStatus && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 w-20">Last run:</span>
              <Badge variant={
                event.lastStatus === 'success' ? 'default' :
                event.lastStatus === 'failure' ? 'destructive' : 'secondary'
              }>
                {event.lastStatus === 'success' && '✅ Success'}
                {event.lastStatus === 'failure' && '❌ Failed'}
                {event.lastStatus === 'running' && '🔄 Running'}
              </Badge>
            </div>
          )}
          
          {/* Next run */}
          {event.nextRunAtMs && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 w-20">Next run:</span>
              <span className="text-sm text-gray-900">
                {format(new Date(event.nextRunAtMs), 'PPpp')}
              </span>
            </div>
          )}
          
          {/* OpenClaw ID */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 w-20">ID:</span>
            <code className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
              {event.openclawId}
            </code>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
