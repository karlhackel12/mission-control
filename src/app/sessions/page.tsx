'use client'

import { useState, useEffect } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Activity,
  Clock,
  Zap,
  ArrowLeft,
  Radio,
  Moon,
  Power,
  Wifi
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow, format } from 'date-fns'

type SessionStatus = 'active' | 'idle' | 'sleeping' | 'terminated'

const statusConfig: Record<SessionStatus, { color: string; bg: string; icon: typeof Activity; label: string }> = {
  active: { color: 'text-green-600', bg: 'bg-green-100', icon: Zap, label: 'Active' },
  idle: { color: 'text-amber-600', bg: 'bg-amber-100', icon: Clock, label: 'Idle' },
  sleeping: { color: 'text-purple-600', bg: 'bg-purple-100', icon: Moon, label: 'Sleeping' },
  terminated: { color: 'text-gray-400', bg: 'bg-gray-100', icon: Power, label: 'Terminated' },
}

export default function SessionsPage() {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [statusFilter, setStatusFilter] = useState<SessionStatus | null>(null)

  // Convex queries - real-time updates!
  const sessions = useQuery(api.sessions.listWithAgents, { limit: 50 })
  const stats = useQuery(api.sessions.getStats)

  useEffect(() => {
    setMounted(true)
  }, [])

  const selectedSession = sessions?.find(s => s._id === selectedSessionId)

  // Filter sessions by status
  const filteredSessions = statusFilter 
    ? sessions?.filter(s => s.status === statusFilter) 
    : sessions

  if (!mounted) return null

  const loading = sessions === undefined

  if (loading) {
    return (
      <div className="h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading sessions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Radio className="w-5 h-5 text-green-500" />
              Agent Sessions
            </h1>
            <div className="flex gap-1">
              <button
                onClick={() => setStatusFilter(null)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${!statusFilter ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                All
              </button>
              {(['active', 'idle', 'sleeping', 'terminated'] as SessionStatus[]).map(status => {
                const config = statusConfig[status]
                return (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1 text-sm rounded-md transition-colors flex items-center gap-1 ${statusFilter === status ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {status === 'active' && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>}
                    {config.label}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Wifi className="w-4 h-4 text-green-500" />
              Live updates
            </div>
            {stats && (
              <Badge variant="secondary">
                {stats.byStatus?.active || 0} active / {stats.total} total
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Stats Row */}
      {stats && (
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex gap-6">
            {(['active', 'idle', 'sleeping', 'terminated'] as SessionStatus[]).map(status => {
              const config = statusConfig[status]
              const count = stats.byStatus?.[status] || 0
              return (
                <div key={status} className="flex items-center gap-2">
                  <div className={`p-1.5 rounded ${config.bg}`}>
                    <config.icon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">{count}</p>
                    <p className="text-xs text-gray-500">{config.label}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex h-[calc(100vh-140px)]">
        {/* Sessions List */}
        <div className="w-1/2 border-r border-gray-200 bg-white">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              {filteredSessions?.map(session => {
                const config = statusConfig[session.status]
                const StatusIcon = config.icon
                
                return (
                  <Card 
                    key={session._id}
                    className={`cursor-pointer transition-all hover:shadow-md ${selectedSessionId === session._id ? 'ring-2 ring-amber-500' : ''}`}
                    onClick={() => setSelectedSessionId(session._id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {session.agent ? (
                            <div 
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                              style={{ backgroundColor: `${session.agent.color}20` }}
                            >
                              {session.agent.emoji}
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100 text-lg">
                              🤖
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <h3 className="font-medium text-gray-900">
                                {session.agent?.name || session.agentName}
                              </h3>
                              {session.channel && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 uppercase">
                                  {session.channel}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 font-mono truncate max-w-[200px]">
                              {session.sessionId}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusIcon className={`w-4 h-4 ${config.color}`} />
                          <span className={`text-xs font-medium ${config.color}`}>
                            {config.label}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          {formatDistanceToNow(new Date(session.lastActivityAt), { addSuffix: true })}
                        </span>
                        {session.model && (
                          <span className="px-1.5 py-0.5 bg-gray-50 rounded text-gray-500">
                            {session.model.split('/').pop()}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              
              {(!filteredSessions || filteredSessions.length === 0) && (
                <div className="text-center py-12 text-gray-400">
                  {statusFilter ? `No ${statusFilter} sessions` : 'No sessions found'}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Session Details */}
        <div className="w-1/2 bg-gray-50">
          {selectedSession ? (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  {selectedSession.agent ? (
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${selectedSession.agent.color}20` }}
                    >
                      {selectedSession.agent.emoji}
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-100 text-2xl">
                      🤖
                    </div>
                  )}
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {selectedSession.agent?.name || selectedSession.agentName}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      {(() => {
                        const config = statusConfig[selectedSession.status]
                        const StatusIcon = config.icon
                        return (
                          <>
                            <StatusIcon className={`w-4 h-4 ${config.color}`} />
                            <span className={`text-sm font-medium ${config.color}`}>
                              {config.label}
                            </span>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              </div>
              
              <Card className="mb-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">Session ID</CardTitle>
                </CardHeader>
                <CardContent>
                  <code className="text-sm font-mono bg-gray-100 px-3 py-2 rounded block break-all">
                    {selectedSession.sessionId}
                  </code>
                </CardContent>
              </Card>

              <Card className="mb-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {selectedSession.channel && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Channel:</span>
                      <span className="font-medium uppercase">{selectedSession.channel}</span>
                    </div>
                  )}
                  {selectedSession.model && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Model:</span>
                      <span className="font-mono text-xs">{selectedSession.model}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Started:</span>
                    <span>{format(new Date(selectedSession.startedAt), 'PPp')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Last Activity:</span>
                    <span>{formatDistanceToNow(new Date(selectedSession.lastActivityAt), { addSuffix: true })}</span>
                  </div>
                </CardContent>
              </Card>

              {selectedSession.metadata && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-700">Metadata</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs font-mono bg-gray-100 p-3 rounded overflow-auto max-h-48">
                      {JSON.stringify(selectedSession.metadata, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              Select a session to view details
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
