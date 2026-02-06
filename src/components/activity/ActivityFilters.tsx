'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { X, Filter, Calendar, RefreshCw } from 'lucide-react'
import { Id } from '../../../convex/_generated/dataModel'

interface Agent {
  _id: Id<"agents">
  name: string
  emoji: string
  color: string
}

// Activity type definitions
const ACTIVITY_TYPES = [
  { value: 'tool_call', label: '🛠️ Tool Call', color: 'blue' },
  { value: 'message_sent', label: '💬 Message Sent', color: 'green' },
  { value: 'task_created', label: '📝 Task Created', color: 'purple' },
  { value: 'task_completed', label: '✅ Task Completed', color: 'emerald' },
  { value: 'file_written', label: '📄 File Written', color: 'amber' },
  { value: 'search', label: '🔍 Search', color: 'cyan' },
  { value: 'decision', label: '💡 Decision', color: 'yellow' },
  { value: 'error', label: '❌ Error', color: 'red' },
]

// Preset time ranges
const TIME_RANGES = [
  { value: 'all', label: 'All Time' },
  { value: '1h', label: 'Last Hour' },
  { value: '6h', label: 'Last 6 Hours' },
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: 'custom', label: 'Custom Range' },
]

export interface ActivityFiltersState {
  agentId: Id<"agents"> | null
  type: string | null
  timeRange: string
  startDate: Date | null
  endDate: Date | null
}

interface ActivityFiltersProps {
  agents: Agent[]
  filters: ActivityFiltersState
  onFiltersChange: (filters: ActivityFiltersState) => void
  onRefresh?: () => void
  loading?: boolean
  totalCount?: number
}

export function ActivityFilters({
  agents,
  filters,
  onFiltersChange,
  onRefresh,
  loading = false,
  totalCount,
}: ActivityFiltersProps) {
  const [showCustomDates, setShowCustomDates] = useState(filters.timeRange === 'custom')

  const handleAgentChange = (value: string) => {
    onFiltersChange({
      ...filters,
      agentId: value === 'all' ? null : value as Id<"agents">,
    })
  }

  const handleTypeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      type: value === 'all' ? null : value,
    })
  }

  const handleTimeRangeChange = (value: string) => {
    const isCustom = value === 'custom'
    setShowCustomDates(isCustom)
    
    let startDate: Date | null = null
    let endDate: Date | null = null
    const now = new Date()
    
    if (!isCustom && value !== 'all') {
      endDate = now
      switch (value) {
        case '1h':
          startDate = new Date(now.getTime() - 60 * 60 * 1000)
          break
        case '6h':
          startDate = new Date(now.getTime() - 6 * 60 * 60 * 1000)
          break
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          break
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
      }
    }
    
    onFiltersChange({
      ...filters,
      timeRange: value,
      startDate,
      endDate: value === 'all' ? null : endDate,
    })
  }

  const handleCustomDateChange = (field: 'startDate' | 'endDate', value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value ? new Date(value) : null,
    })
  }

  const clearFilters = () => {
    setShowCustomDates(false)
    onFiltersChange({
      agentId: null,
      type: null,
      timeRange: 'all',
      startDate: null,
      endDate: null,
    })
  }

  const hasActiveFilters = filters.agentId || filters.type || filters.timeRange !== 'all'

  return (
    <div className="space-y-4">
      {/* Main filters row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Agent filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Agent:</span>
          <Select 
            value={filters.agentId ?? 'all'} 
            onValueChange={handleAgentChange}
          >
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="All Agents" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <span className="flex items-center gap-2">
                  <span>🌐</span>
                  <span>All Agents</span>
                </span>
              </SelectItem>
              {agents.map((agent) => (
                <SelectItem key={agent._id} value={agent._id}>
                  <span className="flex items-center gap-2">
                    <span>{agent.emoji}</span>
                    <span>{agent.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Type filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Type:</span>
          <Select 
            value={filters.type ?? 'all'} 
            onValueChange={handleTypeChange}
          >
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <span className="flex items-center gap-2">
                  <span>📊</span>
                  <span>All Types</span>
                </span>
              </SelectItem>
              {ACTIVITY_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Time range filter */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <Select 
            value={filters.timeRange} 
            onValueChange={handleTimeRangeChange}
          >
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              {TIME_RANGES.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 ml-auto">
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
          {onRefresh && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
        </div>
      </div>

      {/* Custom date range inputs */}
      {showCustomDates && (
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-500">From:</span>
          <Input
            type="datetime-local"
            className="w-auto h-9"
            value={filters.startDate?.toISOString().slice(0, 16) ?? ''}
            onChange={(e) => handleCustomDateChange('startDate', e.target.value)}
          />
          <span className="text-sm text-gray-500">To:</span>
          <Input
            type="datetime-local"
            className="w-auto h-9"
            value={filters.endDate?.toISOString().slice(0, 16) ?? ''}
            onChange={(e) => handleCustomDateChange('endDate', e.target.value)}
          />
        </div>
      )}

      {/* Results count */}
      {totalCount !== undefined && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Filter className="w-4 h-4" />
          <span>
            {totalCount} {totalCount === 1 ? 'activity' : 'activities'} found
          </span>
          {hasActiveFilters && (
            <span className="text-amber-600">(filtered)</span>
          )}
        </div>
      )}
    </div>
  )
}
