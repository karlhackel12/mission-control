'use client'

import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { ActivityFeed } from '@/components/activity'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Activity, 
  Zap, 
  TrendingUp,
  Users,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  Database,
  Trash2
} from 'lucide-react'

// Stats card component
function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend,
  color = 'gray'
}: { 
  title: string
  value: number | string
  icon: React.ElementType
  trend?: string
  color?: string
}) {
  const colorClasses: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-600',
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    amber: 'bg-amber-100 text-amber-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {trend && (
              <p className="text-xs text-gray-400 mt-1">{trend}</p>
            )}
          </div>
          <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Type badge component
function TypeBadge({ type, count }: { type: string; count: number }) {
  const config: Record<string, { emoji: string; color: string }> = {
    tool_call: { emoji: '🛠️', color: 'bg-blue-100 text-blue-700' },
    message_sent: { emoji: '💬', color: 'bg-green-100 text-green-700' },
    task_created: { emoji: '📝', color: 'bg-purple-100 text-purple-700' },
    task_completed: { emoji: '✅', color: 'bg-emerald-100 text-emerald-700' },
    file_written: { emoji: '📄', color: 'bg-amber-100 text-amber-700' },
    search: { emoji: '🔍', color: 'bg-cyan-100 text-cyan-700' },
    decision: { emoji: '💡', color: 'bg-yellow-100 text-yellow-700' },
    error: { emoji: '❌', color: 'bg-red-100 text-red-700' },
  }

  const { emoji, color } = config[type] || { emoji: '📌', color: 'bg-gray-100 text-gray-700' }

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${color}`}>
      <span>{emoji}</span>
      <span className="font-medium capitalize">{type.replace('_', ' ')}</span>
      <Badge variant="secondary" className="ml-auto bg-white/50">
        {count}
      </Badge>
    </div>
  )
}

export default function ActivityPage() {
  // const [activeTab, setActiveTab] = useState('feed') // For future tabs
  
  // Fetch stats
  const stats = useQuery(api.activities.getGlobalStats, {
    since: Date.now() - 24 * 60 * 60 * 1000, // Last 24h
  })
  
  // Fetch agents for stats
  const agents = useQuery(api.agents.list)

  // Seed and clear mutations
  const seedActivities = useMutation(api.seed.seedActivities)
  const clearSeededActivities = useMutation(api.seed.clearSeededActivities)

  const handleSeed = async () => {
    try {
      const result = await seedActivities({})
      console.log('Seeded:', result)
    } catch (error) {
      console.error('Seed error:', error)
    }
  }

  const handleClear = async () => {
    try {
      const result = await clearSeededActivities({})
      console.log('Cleared:', result)
    } catch (error) {
      console.error('Clear error:', error)
    }
  }

  // Calculate stats
  const totalActivities = stats?.total ?? 0
  const errorCount = stats?.byType?.error ?? 0
  const completedCount = stats?.byType?.task_completed ?? 0
  const toolCalls = stats?.byType?.tool_call ?? 0

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-6 h-6 text-amber-500" />
              Activity Feed
            </h1>
            <p className="text-gray-500 mt-1">
              Real-time monitoring of all agent actions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Live updates enabled
            </div>
            {/* Dev tools */}
            {process.env.NODE_ENV === 'development' && (
              <div className="flex gap-2 ml-4">
                <Button variant="outline" size="sm" onClick={handleSeed}>
                  <Database className="w-4 h-4 mr-1" />
                  Seed
                </Button>
                <Button variant="outline" size="sm" onClick={handleClear}>
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Activities (24h)"
            value={totalActivities}
            icon={Activity}
            trend="Last 24 hours"
            color="blue"
          />
          <StatCard
            title="Tool Calls"
            value={toolCalls}
            icon={Wrench}
            color="purple"
          />
          <StatCard
            title="Completed"
            value={completedCount}
            icon={CheckCircle2}
            color="green"
          />
          <StatCard
            title="Errors"
            value={errorCount}
            icon={AlertTriangle}
            color={errorCount > 0 ? 'red' : 'gray'}
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-4 gap-6">
          {/* Activity Feed - Main */}
          <div className="col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  Activity Stream
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ActivityFeed 
                  showFilters={true}
                  initialLimit={25}
                  maxHeight="calc(100vh - 400px)"
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Activity by Type */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  By Type (24h)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {stats?.byType && Object.entries(stats.byType)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => (
                    <TypeBadge key={type} type={type} count={count as number} />
                  ))
                }
                {(!stats?.byType || Object.keys(stats.byType).length === 0) && (
                  <p className="text-sm text-gray-400 text-center py-4">
                    No activity data yet
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Active Agents */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Agent Activity (24h)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {agents && stats?.byAgent && (
                  Object.entries(stats.byAgent)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .slice(0, 5)
                    .map(([agentId, count]) => {
                      const agent = agents.find(a => a._id === agentId)
                      if (!agent) return null
                      return (
                        <div 
                          key={agentId}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-8 h-8 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: `${agent.color}20` }}
                            >
                              {agent.emoji}
                            </div>
                            <span className="font-medium text-sm">{agent.name}</span>
                          </div>
                          <Badge variant="secondary">{count as number}</Badge>
                        </div>
                      )
                    })
                )}
                {(!stats?.byAgent || Object.keys(stats.byAgent).length === 0) && (
                  <p className="text-sm text-gray-400 text-center py-4">
                    No agent activity yet
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Webhook Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Webhook Endpoint
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-xs text-gray-500">
                    Send activity logs to Mission Control:
                  </p>
                  <code className="block text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                    POST /activity
                  </code>
                  <p className="text-xs text-gray-400">
                    Body: {`{ agentName, type, action, details? }`}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
