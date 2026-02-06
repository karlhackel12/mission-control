'use client'

import { useState, useEffect } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Play, 
  History,
  RefreshCw
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { PRODUCTS } from '@/lib/constants'

export default function CronsPage() {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)

  // Convex queries - real-time updates!
  const jobs = useQuery(api.cronJobs.listWithAgents, {
    product: selectedProduct ?? undefined,
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  const getProductById = (id: string | null | undefined) => id ? PRODUCTS.find(p => p.id === id) : null

  const selectedJob = jobs?.find(j => j._id === selectedJobId)

  if (!mounted) return null

  const loading = jobs === undefined

  if (loading) {
    return (
      <div className="h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading cron jobs...</p>
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
            <h1 className="text-xl font-bold text-gray-900">CRON JOBS</h1>
            <div className="flex gap-1">
              <button
                onClick={() => setSelectedProduct(null)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${!selectedProduct ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                All
              </button>
              {PRODUCTS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProduct(p.id)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${selectedProduct === p.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {p.shortName}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Live updates
            </div>
            <Badge variant="secondary">{jobs.length} jobs</Badge>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Jobs List */}
        <div className="w-1/2 border-r border-gray-200 bg-white">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              {jobs.map(job => {
                const product = getProductById(job.product)
                
                return (
                  <Card 
                    key={job._id}
                    className={`cursor-pointer transition-all hover:shadow-md ${selectedJobId === job._id ? 'ring-2 ring-amber-500' : ''}`}
                    onClick={() => setSelectedJobId(job._id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900">{job.name}</h3>
                            {product && (
                              <span 
                                className="text-[10px] px-1.5 py-0.5 rounded"
                                style={{ backgroundColor: `${product.color}15`, color: product.color }}
                              >
                                {product.shortName}
                              </span>
                            )}
                            {job.agent && (
                              <span 
                                className="text-xs px-1.5 py-0.5 rounded"
                                style={{ backgroundColor: `${job.agent.color}20` }}
                              >
                                {job.agent.emoji} {job.agent.name}
                              </span>
                            )}
                          </div>
                          {job.description && (
                            <p className="text-sm text-gray-500 mb-2">{job.description}</p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {job.schedule}
                            </span>
                            {job.lastRunAtMs && (
                              <span>Last: {formatDistanceToNow(new Date(job.lastRunAtMs), { addSuffix: true })}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {job.lastStatus === 'success' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                          {job.lastStatus === 'failure' && <XCircle className="w-5 h-5 text-red-500" />}
                          {job.lastStatus === 'running' && <RefreshCw className="w-5 h-5 text-amber-500 animate-spin" />}
                          <Switch checked={job.isActive} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              
              {jobs.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  No cron jobs found
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Job Details */}
        <div className="w-1/2 bg-gray-50">
          {selectedJob ? (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{selectedJob.name}</h2>
                  {selectedJob.description && (
                    <p className="text-sm text-gray-500">{selectedJob.description}</p>
                  )}
                </div>
                <Button size="sm">
                  <Play className="w-4 h-4 mr-1" /> Run Now
                </Button>
              </div>
              
              <Card className="mb-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                  <code className="text-lg font-mono bg-gray-100 px-3 py-1 rounded">{selectedJob.schedule}</code>
                </CardContent>
              </Card>

              <Card className="mb-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status:</span>
                    <span className={selectedJob.isActive ? 'text-green-600' : 'text-gray-400'}>
                      {selectedJob.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Last Status:</span>
                    <span className={
                      selectedJob.lastStatus === 'success' ? 'text-green-600' :
                      selectedJob.lastStatus === 'failure' ? 'text-red-600' :
                      selectedJob.lastStatus === 'running' ? 'text-amber-600' : 'text-gray-400'
                    }>
                      {selectedJob.lastStatus || 'Never run'}
                    </span>
                  </div>
                  {selectedJob.lastRunAtMs && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Last Run:</span>
                      <span>{formatDistanceToNow(new Date(selectedJob.lastRunAtMs), { addSuffix: true })}</span>
                    </div>
                  )}
                  {selectedJob.nextRunAtMs && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Next Run:</span>
                      <span>{formatDistanceToNow(new Date(selectedJob.nextRunAtMs), { addSuffix: true })}</span>
                    </div>
                  )}
                  {selectedJob.agent && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Agent:</span>
                      <span className="flex items-center gap-1">
                        {selectedJob.agent.emoji} {selectedJob.agent.name}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <History className="w-4 h-4" /> OpenClaw ID
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded break-all">
                    {selectedJob.openclawId}
                  </code>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              Select a job to view details
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
