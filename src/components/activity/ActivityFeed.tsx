'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Id, Doc } from '../../../convex/_generated/dataModel'
import { ActivityItem } from './ActivityItem'
import { ActivityFilters, ActivityFiltersState } from './ActivityFilters'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2, ChevronDown, Activity, Zap, Database } from 'lucide-react'

interface ActivityFeedProps {
  compact?: boolean
  showFilters?: boolean
  initialLimit?: number
  maxHeight?: string
}

interface Agent {
  _id: Id<"agents">
  name: string
  emoji: string
  color: string
  role: string
}

export function ActivityFeed({
  compact = false,
  showFilters = true,
  initialLimit = 25,
  maxHeight = 'calc(100vh - 300px)',
}: ActivityFeedProps) {
  // Filters state
  const [filters, setFilters] = useState<ActivityFiltersState>({
    agentId: null,
    type: null,
    timeRange: 'all',
    startDate: null,
    endDate: null,
  })
  
  // Pagination state
  const [cursor, setCursor] = useState<Id<"activities"> | undefined>(undefined)
  const [allItems, setAllItems] = useState<Doc<"activities">[]>([])
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  
  // Refs for infinite scroll
  const scrollRef = useRef<HTMLDivElement>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Fetch agents
  const agents = useQuery(api.agents.list) as Agent[] | undefined

  // Fetch activities with filters
  const activitiesResult = useQuery(api.activities.listFiltered, {
    agentId: filters.agentId ?? undefined,
    type: filters.type ?? undefined,
    startDate: filters.startDate?.getTime() ?? undefined,
    endDate: filters.endDate?.getTime() ?? undefined,
    limit: initialLimit,
    cursor: cursor,
  })

  // Seed mutation (for development)
  const seedActivities = useMutation(api.seed.seedActivities)

  // Create agent lookup map
  const agentMap = useMemo(() => {
    if (!agents) return new Map<string, Agent>()
    return new Map(agents.map(agent => [agent._id, agent]))
  }, [agents])

  // Reset items when filters change
  useEffect(() => {
    setCursor(undefined)
    setAllItems([])
  }, [filters.agentId, filters.type, filters.startDate, filters.endDate])

  // Update items when new data arrives
  useEffect(() => {
    if (activitiesResult?.items) {
      if (cursor === undefined) {
        // First load or filter change - replace all items
        setAllItems(activitiesResult.items)
      } else {
        // Loading more - append new items
        setAllItems(prev => {
          const newIds = new Set(activitiesResult.items.map(i => i._id))
          const filtered = prev.filter(i => !newIds.has(i._id))
          return [...filtered, ...activitiesResult.items]
        })
      }
      setIsLoadingMore(false)
    }
  }, [activitiesResult, cursor])

  const handleLoadMore = useCallback(() => {
    if (activitiesResult?.nextCursor && !isLoadingMore) {
      setIsLoadingMore(true)
      setCursor(activitiesResult.nextCursor)
    }
  }, [activitiesResult?.nextCursor, isLoadingMore])

  // Intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        if (first.isIntersecting && activitiesResult?.hasMore && !isLoadingMore) {
          handleLoadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [activitiesResult?.hasMore, isLoadingMore, handleLoadMore])

  const handleFiltersChange = useCallback((newFilters: ActivityFiltersState) => {
    setFilters(newFilters)
  }, [])

  const handleRefresh = useCallback(() => {
    setCursor(undefined)
    setAllItems([])
  }, [])

  const handleSeedData = async () => {
    try {
      await seedActivities({})
      handleRefresh()
    } catch (error) {
      console.error('Failed to seed data:', error)
    }
  }

  // Loading state
  const isLoading = agents === undefined || (activitiesResult === undefined && allItems.length === 0)

  if (isLoading) {
    return (
      <div className="space-y-4">
        {showFilters && (
          <div className="flex gap-3">
            <Skeleton className="h-9 w-[180px]" />
            <Skeleton className="h-9 w-[180px]" />
            <Skeleton className="h-9 w-[160px]" />
          </div>
        )}
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  // Sort items by timestamp (newest first)
  const sortedItems = [...allItems].sort((a, b) => b.timestamp - a.timestamp)

  return (
    <div className="space-y-4">
      {/* Filters */}
      {showFilters && agents && (
        <ActivityFilters
          agents={agents}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onRefresh={handleRefresh}
          loading={isLoadingMore}
          totalCount={activitiesResult?.total}
        />
      )}

      {/* Activity list */}
      <ScrollArea 
        className="pr-4" 
        style={{ maxHeight }}
        ref={scrollRef}
      >
        <div className="space-y-3">
          {sortedItems.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              <Activity className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-2">No activities found</p>
              <p className="text-sm text-gray-400 mb-4">
                {filters.agentId || filters.type || filters.timeRange !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Activities will appear here as agents work'}
              </p>
              {process.env.NODE_ENV === 'development' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSeedData}
                  className="gap-2"
                >
                  <Database className="w-4 h-4" />
                  Seed Mock Data
                </Button>
              )}
            </div>
          ) : (
            <>
              {sortedItems.map((activity) => (
                <ActivityItem
                  key={activity._id}
                  activity={activity}
                  agent={agentMap.get(activity.agentId)}
                  compact={compact}
                />
              ))}
              
              {/* Load more trigger */}
              <div ref={loadMoreRef} className="py-4">
                {isLoadingMore && (
                  <div className="flex items-center justify-center gap-2 text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Loading more...</span>
                  </div>
                )}
                {activitiesResult?.hasMore && !isLoadingMore && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-gray-500 hover:text-gray-700"
                    onClick={handleLoadMore}
                  >
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Load more activities
                  </Button>
                )}
                {!activitiesResult?.hasMore && sortedItems.length > 0 && (
                  <div className="text-center text-sm text-gray-400 py-2">
                    <Zap className="w-4 h-4 inline mr-1" />
                    All caught up!
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

// Export a compact version for sidebars
export function ActivityFeedCompact() {
  return (
    <ActivityFeed 
      compact={true} 
      showFilters={false} 
      initialLimit={10}
      maxHeight="calc(100vh - 200px)"
    />
  )
}
