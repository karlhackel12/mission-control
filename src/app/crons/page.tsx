'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { getCronJobs, getCronRuns } from '@/lib/supabase/queries'
import type { CronJob, CronRun } from '@/lib/supabase/types'
import { PRODUCTS } from '@/lib/constants'

export default function CronsPage() {
  const [jobs, setJobs] = useState<CronJob[]>([])
  const [runs, setRuns] = useState<CronRun[]>([])
  const [selectedJob, setSelectedJob] = useState<CronJob | null>(null)
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [jobsData, runsData] = await Promise.all([
        getCronJobs(),
        getCronRuns(undefined, 50)
      ])
      setJobs(jobsData)
      setRuns(runsData)
    } catch (error) {
      console.error('Error fetching crons:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    fetchData()
  }, [fetchData])

  const filteredJobs = selectedProduct
    ? jobs.filter(j => j.product_id === selectedProduct)
    : jobs

  const getProductById = (id: string | null | undefined) => id ? PRODUCTS.find(p => p.id === id) : null

  const getJobRuns = (jobId: string) => runs.filter(r => r.job_id === jobId)

  if (!mounted) return null

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
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-1" /> Refresh
            </Button>
            <Badge variant="secondary">{filteredJobs.length} jobs</Badge>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Jobs List */}
        <div className="w-1/2 border-r border-gray-200 bg-white">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              {filteredJobs.map(job => {
                const product = getProductById(job.product_id)
                const jobRuns = getJobRuns(job.id)
                const lastRun = jobRuns[0]
                
                return (
                  <Card 
                    key={job.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${selectedJob?.id === job.id ? 'ring-2 ring-amber-500' : ''}`}
                    onClick={() => setSelectedJob(job)}
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
                          </div>
                          <p className="text-sm text-gray-500 mb-2">{job.description}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {job.schedule}
                            </span>
                            {job.last_run && (
                              <span>Last: {formatDistanceToNow(new Date(job.last_run), { addSuffix: true })}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {lastRun?.status === 'success' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                          {lastRun?.status === 'failed' && <XCircle className="w-5 h-5 text-red-500" />}
                          {lastRun?.status === 'running' && <RefreshCw className="w-5 h-5 text-amber-500 animate-spin" />}
                          <Switch checked={job.enabled} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              
              {filteredJobs.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  No cron jobs found
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Job Details / Run History */}
        <div className="w-1/2 bg-gray-50">
          {selectedJob ? (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{selectedJob.name}</h2>
                  <p className="text-sm text-gray-500">{selectedJob.description}</p>
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

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <History className="w-4 h-4" /> Run History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {getJobRuns(selectedJob.id).slice(0, 10).map(run => (
                      <div key={run.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        {run.status === 'success' && <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />}
                        {run.status === 'failed' && <XCircle className="w-4 h-4 text-red-500 mt-0.5" />}
                        {run.status === 'running' && <RefreshCw className="w-4 h-4 text-amber-500 animate-spin mt-0.5" />}
                        <div className="flex-1">
                          <p className="text-sm text-gray-700">{run.output_summary || 'No output'}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDistanceToNow(new Date(run.ran_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                    {getJobRuns(selectedJob.id).length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-4">No runs yet</p>
                    )}
                  </div>
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
