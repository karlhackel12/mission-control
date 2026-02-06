'use client'

import { useMemo } from 'react'
import { format, startOfWeek, addDays, isToday } from 'date-fns'
import { CalendarEvent, CronJobEvent } from './CalendarEvent'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'

interface WeeklyCalendarProps {
  currentDate: Date
  cronJobs: CronJobEvent[]
  onEventClick?: (event: CronJobEvent) => void
}

// Parse cron expression to get occurrences in a day
function getCronOccurrences(
  schedule: string,
  targetDay: Date
): Date[] {
  const occurrences: Date[] = []
  const parts = schedule.split(' ')
  
  if (parts.length < 5) return occurrences
  
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts
  
  // Check day of week (0 = Sunday, 1 = Monday, etc.)
  const targetDow = targetDay.getDay()
  if (dayOfWeek !== '*') {
    const dows = parseCronField(dayOfWeek, 0, 6)
    // Convert Monday=1 format to Sunday=0 format if needed
    const normalizedDows = dows.map(d => d === 7 ? 0 : d)
    if (!normalizedDows.includes(targetDow)) return occurrences
  }
  
  // Check day of month
  const targetDom = targetDay.getDate()
  if (dayOfMonth !== '*') {
    const doms = parseCronField(dayOfMonth, 1, 31)
    if (!doms.includes(targetDom)) return occurrences
  }
  
  // Check month (1-12)
  const targetMonth = targetDay.getMonth() + 1
  if (month !== '*') {
    const months = parseCronField(month, 1, 12)
    if (!months.includes(targetMonth)) return occurrences
  }
  
  // Get hours
  const hours = hour === '*' ? Array.from({ length: 24 }, (_, i) => i) : parseCronField(hour, 0, 23)
  
  // Get minutes
  const minutes = minute === '*' ? [0] : parseCronField(minute, 0, 59)
  
  // Create occurrences for each hour/minute combination
  for (const h of hours) {
    for (const m of minutes) {
      const occurrence = new Date(targetDay)
      occurrence.setHours(h, m, 0, 0)
      occurrences.push(occurrence)
    }
  }
  
  return occurrences.sort((a, b) => a.getTime() - b.getTime())
}

// Parse a cron field (handles *, */n, n, n-m, n,m,o)
function parseCronField(field: string, min: number, max: number): number[] {
  const values: number[] = []
  
  if (field === '*') {
    for (let i = min; i <= max; i++) values.push(i)
    return values
  }
  
  // Handle step values */n
  if (field.startsWith('*/')) {
    const step = parseInt(field.slice(2))
    for (let i = min; i <= max; i += step) values.push(i)
    return values
  }
  
  // Handle comma-separated values
  const parts = field.split(',')
  for (const part of parts) {
    // Handle ranges n-m
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(Number)
      for (let i = start; i <= end; i++) values.push(i)
    } else {
      values.push(parseInt(part))
    }
  }
  
  return values.filter(v => v >= min && v <= max)
}

export function WeeklyCalendar({ currentDate, cronJobs, onEventClick }: WeeklyCalendarProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  
  // Generate array of 7 days
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  }, [weekStart])
  
  // Calculate events for each day
  const eventsByDay = useMemo(() => {
    const result: Map<string, Array<{ event: CronJobEvent; time: Date }>> = new Map()
    
    for (const day of weekDays) {
      const dayKey = format(day, 'yyyy-MM-dd')
      const dayEvents: Array<{ event: CronJobEvent; time: Date }> = []
      
      for (const job of cronJobs) {
        if (!job.isActive) continue
        
        const occurrences = getCronOccurrences(job.schedule, day)
        for (const time of occurrences) {
          dayEvents.push({ event: job, time })
        }
      }
      
      // Sort by time
      dayEvents.sort((a, b) => a.time.getTime() - b.time.getTime())
      result.set(dayKey, dayEvents)
    }
    
    return result
  }, [weekDays, cronJobs])
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {weekDays.map((day) => {
          const dayKey = format(day, 'yyyy-MM-dd')
          const today = isToday(day)
          
          return (
            <div
              key={dayKey}
              className={cn(
                'px-3 py-3 text-center border-r last:border-r-0 border-gray-200',
                today && 'bg-indigo-50'
              )}
            >
              <div className={cn(
                'text-xs font-medium uppercase tracking-wide',
                today ? 'text-indigo-600' : 'text-gray-500'
              )}>
                {format(day, 'EEE')}
              </div>
              <div className={cn(
                'text-lg font-semibold mt-1',
                today ? 'text-indigo-700' : 'text-gray-900'
              )}>
                {format(day, 'd')}
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Day columns with events */}
      <div className="grid grid-cols-7 min-h-[500px]">
        {weekDays.map((day) => {
          const dayKey = format(day, 'yyyy-MM-dd')
          const dayEvents = eventsByDay.get(dayKey) || []
          const today = isToday(day)
          
          return (
            <div
              key={dayKey}
              className={cn(
                'border-r last:border-r-0 border-gray-200 p-2',
                today && 'bg-indigo-50/30'
              )}
            >
              <ScrollArea className="h-[500px]">
                <div className="space-y-2 pr-2">
                  {dayEvents.length === 0 ? (
                    <div className="text-center text-gray-400 text-sm py-8">
                      No events
                    </div>
                  ) : (
                    dayEvents.map(({ event, time }, idx) => (
                      <CalendarEvent
                        key={`${event._id}-${time.getTime()}-${idx}`}
                        event={event}
                        occurrenceTime={time}
                        onClick={onEventClick}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          )
        })}
      </div>
    </div>
  )
}
