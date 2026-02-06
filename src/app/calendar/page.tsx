'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns'
import { CalendarHeader } from '@/components/calendar/CalendarHeader'
import { WeeklyCalendar } from '@/components/calendar/WeeklyCalendar'
import { EventDetailModal } from '@/components/calendar/EventDetailModal'
import { CronJobEvent } from '@/components/calendar/CalendarEvent'
import { Button } from '@/components/ui/button'
import { RefreshCw, Database } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<CronJobEvent | null>(null)
  const [isSeeding, setIsSeeding] = useState(false)
  
  // Calculate week boundaries in BRT timezone
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
  
  // Fetch cron jobs for this week
  const cronJobs = useQuery(api.cronJobs.listByWeek, {
    weekStartMs: weekStart.getTime(),
    weekEndMs: weekEnd.getTime(),
  })
  
  // Seed mutation
  const seedMutation = useMutation(api.sync.seedCronJobs)
  
  const handlePreviousWeek = useCallback(() => {
    setCurrentDate(prev => subWeeks(prev, 1))
  }, [])
  
  const handleNextWeek = useCallback(() => {
    setCurrentDate(prev => addWeeks(prev, 1))
  }, [])
  
  const handleToday = useCallback(() => {
    setCurrentDate(new Date())
  }, [])
  
  const handleEventClick = useCallback((event: CronJobEvent) => {
    setSelectedEvent(event)
  }, [])
  
  const handleSeedData = useCallback(async () => {
    setIsSeeding(true)
    try {
      const result = await seedMutation({})
      console.log('Seeded:', result)
    } catch (error) {
      console.error('Seed error:', error)
    } finally {
      setIsSeeding(false)
    }
  }, [seedMutation])
  
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-2">
        <CalendarHeader
          currentDate={currentDate}
          onPreviousWeek={handlePreviousWeek}
          onNextWeek={handleNextWeek}
          onToday={handleToday}
        />
      </div>
      
      {/* Actions bar */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {cronJobs === undefined 
            ? 'Loading...'
            : `${cronJobs.length} cron job${cronJobs.length !== 1 ? 's' : ''} configured`
          }
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSeedData}
            disabled={isSeeding}
          >
            <Database className="w-4 h-4 mr-2" />
            {isSeeding ? 'Seeding...' : 'Seed Demo Data'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Calendar grid */}
      {cronJobs === undefined ? (
        <CalendarSkeleton />
      ) : (
        <WeeklyCalendar
          currentDate={currentDate}
          cronJobs={cronJobs}
          onEventClick={handleEventClick}
        />
      )}
      
      {/* Event detail modal */}
      <EventDetailModal
        event={selectedEvent}
        open={selectedEvent !== null}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  )
}

function CalendarSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="grid grid-cols-7 border-b border-gray-200">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="px-3 py-3 text-center border-r last:border-r-0 border-gray-200">
            <Skeleton className="h-4 w-8 mx-auto mb-2" />
            <Skeleton className="h-6 w-6 mx-auto" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 min-h-[500px]">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="border-r last:border-r-0 border-gray-200 p-2">
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
