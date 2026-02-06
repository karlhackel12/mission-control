'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { format, startOfWeek, endOfWeek } from 'date-fns'

interface CalendarHeaderProps {
  currentDate: Date
  onPreviousWeek: () => void
  onNextWeek: () => void
  onToday: () => void
}

export function CalendarHeader({
  currentDate,
  onPreviousWeek,
  onNextWeek,
  onToday,
}: CalendarHeaderProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }) // Monday
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })

  const formatWeekRange = () => {
    const startMonth = format(weekStart, 'MMM')
    const endMonth = format(weekEnd, 'MMM')
    const startDay = format(weekStart, 'd')
    const endDay = format(weekEnd, 'd')
    const year = format(weekStart, 'yyyy')

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay}-${endDay}, ${year}`
    }
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`
  }

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <Calendar className="w-6 h-6 text-indigo-600" />
        <h1 className="text-2xl font-bold text-gray-900">
          Week of {formatWeekRange()}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPreviousWeek}
          className="h-9 px-3"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onNextWeek}
          className="h-9 px-3"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={onToday}
          className="h-9 px-4 ml-2"
        >
          Today
        </Button>
      </div>
    </div>
  )
}
