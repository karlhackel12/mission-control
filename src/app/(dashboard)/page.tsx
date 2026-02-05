'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AGENTS, PRODUCTS } from '@/lib/constants'
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Activity,
  Zap
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

// Mock data for demo
const mockReviewQueue = [
  { id: '1', title: 'TransForce Indeed Apply MVP', product: 'transforce', priority: 'high', agent: 'Developer' },
  { id: '2', title: 'HelloPeople Landing Page Copy', product: 'hellopeople', priority: 'medium', agent: 'Growth' },
  { id: '3', title: 'goLance Stripe Integration Docs', product: 'golance', priority: 'urgent', agent: 'Builder' },
]

const mockActivity = [
  { id: '1', agent: 'Builder', action: 'completed', task: 'Setup CI/CD pipeline', time: new Date(Date.now() - 1000 * 60 * 30) },
  { id: '2', agent: 'Scout', action: 'researching', task: 'Competitor analysis Q1', time: new Date(Date.now() - 1000 * 60 * 45) },
  { id: '3', agent: 'Growth', action: 'drafted', task: 'Email campaign for launch', time: new Date(Date.now() - 1000 * 60 * 60) },
  { id: '4', agent: 'Metrics', action: 'analyzed', task: 'Weekly KPI report', time: new Date(Date.now() - 1000 * 60 * 90) },
  { id: '5', agent: 'Developer', action: 'pushed', task: 'API v2 endpoints', time: new Date(Date.now() - 1000 * 60 * 120) },
]

const mockCrons = [
  { id: '1', name: 'Daily Standup Report', status: 'success', lastRun: new Date(Date.now() - 1000 * 60 * 60 * 8) },
  { id: '2', name: 'Competitor Price Check', status: 'success', lastRun: new Date(Date.now() - 1000 * 60 * 60 * 4) },
  { id: '3', name: 'Jira Sync', status: 'running', lastRun: new Date() },
  { id: '4', name: 'Email Inbox Check', status: 'failed', lastRun: new Date(Date.now() - 1000 * 60 * 30) },
]

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mission Control</h1>
        <p className="text-gray-500">Your AI squad at a glance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockReviewQueue.length}</p>
                <p className="text-sm text-gray-500">Needs Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">12</p>
                <p className="text-sm text-gray-500">Done Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{AGENTS.filter(a => ['Chief', 'Builder', 'Growth', 'Developer'].includes(a.name)).length}</p>
                <p className="text-sm text-gray-500">Agents Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockCrons.filter(c => c.status === 'success').length}/{mockCrons.length}</p>
                <p className="text-sm text-gray-500">Crons Healthy</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Review Queue */}
        <Card className="col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              🔥 Needs Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockReviewQueue.map((item) => {
                const product = PRODUCTS.find(p => p.id === item.product)
                return (
                  <div key={item.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900 line-clamp-2">{item.title}</p>
                      <Badge 
                        variant="secondary" 
                        className={
                          item.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                          item.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-700'
                        }
                      >
                        {item.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <span>{product?.emoji} {product?.shortName}</span>
                      <span>•</span>
                      <span>@{item.agent}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card className="col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4" /> Agent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[280px]">
              <div className="space-y-3">
                {mockActivity.map((item) => {
                  const agent = AGENTS.find(a => a.name === item.agent)
                  return (
                    <div key={item.id} className="flex items-start gap-3">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                        style={{ backgroundColor: agent?.color + '20' }}
                      >
                        {agent?.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium">{item.agent}</span>
                          <span className="text-gray-500"> {item.action} </span>
                          <span className="text-gray-700">{item.task}</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatDistanceToNow(item.time, { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Today's Crons */}
        <Card className="col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4" /> Today&apos;s Crons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockCrons.map((cron) => (
                <div key={cron.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {cron.status === 'success' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    {cron.status === 'failed' && <AlertCircle className="w-4 h-4 text-red-500" />}
                    {cron.status === 'running' && <Clock className="w-4 h-4 text-blue-500 animate-pulse" />}
                    <span className="text-sm font-medium">{cron.name}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(cron.lastRun, { addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agents Grid */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">🤖 Squad Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {AGENTS.map((agent) => (
              <div 
                key={agent.id} 
                className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                    style={{ backgroundColor: agent.color + '20' }}
                  >
                    {agent.emoji}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{agent.name}</p>
                    <p className="text-xs text-gray-500">{agent.role}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <span className="text-xs text-gray-500">Active</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
