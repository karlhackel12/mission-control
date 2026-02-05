'use client'

import { useState, useEffect } from 'react'
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
  Plus,
  RefreshCw
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

type CronJob = {
  id: string
  name: string
  schedule: string
  description: string
  enabled: boolean
  lastRun: Date | null
  lastStatus: 'success' | 'failed' | 'running' | null
}

type CronRun = {
  id: string
  jobId: string
  status: 'success' | 'failed' | 'running'
  output: string
  ranAt: Date
}

const initialJobs: CronJob[] = [
  { id: '1', name: 'Daily Standup Report', schedule: '0 9 * * *', description: 'Generate and send daily standup summary', enabled: true, lastRun: new Date(Date.now() - 1000 * 60 * 60 * 8), lastStatus: 'success' },
  { id: '2', name: 'Email Inbox Check', schedule: '*/30 * * * *', description: 'Check and summarize new emails', enabled: true, lastRun: new Date(Date.now() - 1000 * 60 * 30), lastStatus: 'success' },
  { id: '3', name: 'Competitor Price Monitor', schedule: '0 */4 * * *', description: 'Scrape and analyze competitor pricing', enabled: true, lastRun: new Date(Date.now() - 1000 * 60 * 60 * 4), lastStatus: 'success' },
  { id: '4', name: 'Jira Sync', schedule: '*/15 * * * *', description: 'Sync tasks with Jira boards', enabled: true, lastRun: new Date(Date.now() - 1000 * 60 * 15), lastStatus: 'failed' },
  { id: '5', name: 'Weekly Analytics Report', schedule: '0 9 * * 1', description: 'Generate weekly analytics summary', enabled: true, lastRun: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), lastStatus: 'success' },
  { id: '6', name: 'Twitter Mentions Check', schedule: '0 */2 * * *', description: 'Monitor Twitter for brand mentions', enabled: false, lastRun: new Date(Date.now() - 1000 * 60 * 60 * 48), lastStatus: 'success' },
  { id: '7', name: 'Database Backup', schedule: '0 3 * * *', description: 'Backup all Supabase databases', enabled: true, lastRun: new Date(Date.now() - 1000 * 60 * 60 * 21), lastStatus: 'success' },
  { id: '8', name: 'Slack Digest', schedule: '0 18 * * 1-5', description: 'Send daily Slack activity digest', enabled: true, lastRun: new Date(Date.now() - 1000 * 60 * 60 * 26), lastStatus: 'success' },
]

const initialRuns: CronRun[] = [
  { id: '1', jobId: '2', status: 'success', output: 'Checked 5 new emails. 2 marked important.', ranAt: new Date(Date.now() - 1000 * 60 * 30) },
  { id: '2', jobId: '4', status: 'failed', output: 'Error: Jira API rate limit exceeded', ranAt: new Date(Date.now() - 1000 * 60 * 15) },
  { id: '3', jobId: '3', status: 'success', output: 'Analyzed 3 competitors. No price changes detected.', ranAt: new Date(Date.now() - 1000 * 60 * 60 * 4) },
  { id: '4', jobId: '1', status: 'success', output: 'Standup report sent to #product-team', ranAt: new Date(Date.now() - 1000 * 60 * 60 * 8) },
  { id: '5', jobId: '2', status: 'success', output: 'Checked 12 new emails. 4 marked important.', ranAt: new Date(Date.now() - 1000 * 60 * 60) },
]

export default function CronsPage() {
  const [jobs, setJobs] = useState<CronJob[]>(initialJobs)
  const [runs] = useState<CronRun[]>(initialRuns)
  const [selectedJob, setSelectedJob] = useState<CronJob | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleJob = (jobId: string) => {
    setJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, enabled: !job.enabled } : job
    ))
  }

  const runJob = (jobId: string) => {
    setJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, lastRun: new Date(), lastStatus: 'running' } : job
    ))
    // Simulate completion
    setTimeout(() => {
      setJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, lastStatus: 'success' } : job
      ))
    }, 2000)
  }

  if (!mounted) return null

  const successCount = jobs.filter(j => j.lastStatus === 'success' && j.enabled).length
  const failedCount = jobs.filter(j => j.lastStatus === 'failed' && j.enabled).length
  const enabledCount = jobs.filter(j => j.enabled).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cron Monitor</h1>
          <p className="text-gray-500">Scheduled jobs and automation</p>
        </div>
        <Button variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Add Job
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{jobs.length}</p>
                <p className="text-sm text-gray-500">Total Jobs</p>
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
                <p className="text-2xl font-bold">{successCount}</p>
                <p className="text-sm text-gray-500">Healthy</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{failedCount}</p>
                <p className="text-sm text-gray-500">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Play className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{enabledCount}</p>
                <p className="text-sm text-gray-500">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Job List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Scheduled Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {jobs.map((job) => (
                <div 
                  key={job.id}
                  className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                    selectedJob?.id === job.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                  } ${!job.enabled ? 'opacity-50' : ''}`}
                  onClick={() => setSelectedJob(job)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {job.lastStatus === 'success' && job.enabled && (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      )}
                      {job.lastStatus === 'failed' && job.enabled && (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      {job.lastStatus === 'running' && (
                        <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                      )}
                      {(!job.lastStatus || !job.enabled) && (
                        <Clock className="w-5 h-5 text-gray-400" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{job.name}</p>
                        <p className="text-xs text-gray-500 font-mono">{job.schedule}</p>
                      </div>
                    </div>
                    <Switch 
                      checked={job.enabled}
                      onCheckedChange={() => toggleJob(job.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">{job.description}</p>
                  {job.lastRun && (
                    <p className="text-xs text-gray-400 mt-2">
                      Last run: {formatDistanceToNow(job.lastRun, { addSuffix: true })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Run History */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="w-4 h-4" />
              {selectedJob ? `${selectedJob.name} History` : 'Recent Runs'}
            </CardTitle>
            {selectedJob && (
              <Button 
                size="sm" 
                onClick={() => runJob(selectedJob.id)}
                disabled={selectedJob.lastStatus === 'running'}
              >
                <Play className="w-4 h-4 mr-1" />
                Run Now
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {runs
                  .filter(run => !selectedJob || run.jobId === selectedJob.id)
                  .sort((a, b) => b.ranAt.getTime() - a.ranAt.getTime())
                  .map((run) => {
                    const job = jobs.find(j => j.id === run.jobId)
                    return (
                      <div key={run.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {run.status === 'success' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                            {run.status === 'failed' && <XCircle className="w-4 h-4 text-red-500" />}
                            {run.status === 'running' && <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />}
                            <span className="font-medium text-sm">{job?.name}</span>
                          </div>
                          <Badge 
                            variant="secondary"
                            className={
                              run.status === 'success' ? 'bg-green-100 text-green-700' :
                              run.status === 'failed' ? 'bg-red-100 text-red-700' :
                              'bg-blue-100 text-blue-700'
                            }
                          >
                            {run.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{run.output}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {format(run.ranAt, 'MMM d, yyyy HH:mm:ss')}
                        </p>
                      </div>
                    )
                  })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
