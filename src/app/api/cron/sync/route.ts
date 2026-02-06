import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

interface OpenClawCronJob {
  id: string
  agentId: string
  name: string
  enabled: boolean
  createdAtMs: number
  updatedAtMs: number
  schedule: {
    kind: 'cron' | 'interval'
    expr?: string
    tz?: string
    ms?: number
  }
  sessionTarget: string
  wakeMode: string
  payload: {
    kind: string
    message?: string
  }
  state: {
    nextRunAtMs?: number
    lastRunAtMs?: number
    lastStatus?: 'ok' | 'error'
    lastDurationMs?: number
  }
  delivery?: {
    mode: string
    channel: string
    to: string
    bestEffort?: boolean
  }
}

interface OpenClawCronData {
  version: number
  jobs: OpenClawCronJob[]
}

// Format cron expression for display
function formatCronSchedule(schedule: OpenClawCronJob['schedule']): string {
  if (schedule.kind === 'interval') {
    const hours = (schedule.ms || 0) / (1000 * 60 * 60)
    return `Every ${hours}h`
  }
  return schedule.expr || 'Unknown'
}

// Parse cron expression to human readable
function describeCron(expr: string): string {
  const parts = expr.split(' ')
  if (parts.length !== 5) return expr
  
  const [minute, hour, , , dayOfWeek] = parts
  
  const dayNames: Record<string, string> = {
    '0': 'Sun',
    '1': 'Mon', 
    '2': 'Tue',
    '3': 'Wed',
    '4': 'Thu',
    '5': 'Fri',
    '6': 'Sat',
    '1-5': 'Weekdays',
    '1-6': 'Mon-Sat',
    '*': 'Daily'
  }
  
  const time = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`
  const days = dayNames[dayOfWeek] || dayOfWeek
  
  return `${time} ${days}`
}

export async function GET() {
  try {
    const cronPath = path.join(process.env.HOME || '', '.openclaw', 'cron', 'jobs.json')
    
    const fileContent = await fs.readFile(cronPath, 'utf-8')
    const cronData: OpenClawCronData = JSON.parse(fileContent)
    
    const jobs = cronData.jobs.map(job => ({
      id: job.id,
      agentId: job.agentId,
      name: job.name,
      enabled: job.enabled,
      schedule: formatCronSchedule(job.schedule),
      scheduleDescription: job.schedule.kind === 'cron' && job.schedule.expr 
        ? describeCron(job.schedule.expr) 
        : formatCronSchedule(job.schedule),
      timezone: job.schedule.tz || 'UTC',
      nextRunAtMs: job.state?.nextRunAtMs,
      lastRunAtMs: job.state?.lastRunAtMs,
      lastStatus: job.state?.lastStatus === 'ok' ? 'success' : job.state?.lastStatus === 'error' ? 'failure' : undefined,
      lastDurationMs: job.state?.lastDurationMs,
      deliveryChannel: job.delivery?.channel,
      deliveryTo: job.delivery?.to,
      message: job.payload?.message?.substring(0, 200) + (job.payload?.message && job.payload.message.length > 200 ? '...' : ''),
    }))
    
    return NextResponse.json({ 
      success: true, 
      jobs,
      lastSync: Date.now(),
      totalJobs: jobs.length,
      activeJobs: jobs.filter(j => j.enabled).length
    })
  } catch (error) {
    console.error('Error reading OpenClaw cron jobs:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to read cron jobs',
      jobs: [] 
    }, { status: 500 })
  }
}
