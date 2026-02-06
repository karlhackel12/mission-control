/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { Task, Product, AgentActivity, SquadChat, CronJob, CronRun, Agent as AgentType, Database, Document, Notification } from './types'
import type { DiscussionPrompt, DiscussionResponse } from './types'

export type TaskInsert = Database['public']['Tables']['tasks']['Insert']
export type TaskUpdate = Database['public']['Tables']['tasks']['Update']
export type ActivityInsert = Database['public']['Tables']['agent_activity']['Insert']
export type ChatInsert = Database['public']['Tables']['squad_chat']['Insert']

// Create untyped client to avoid type conflicts with schema changes
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ============ AGENTS ============
export type Agent = AgentType

export async function getAgents(): Promise<Agent[]> {
  const { data, error } = await supabase
    .from('agents' as any)
    .select('*')
    .order('name')
  
  if (error) {
    console.error('Error fetching agents:', error)
    return []
  }
  return (data || []) as Agent[]
}

export async function getAgentById(id: string): Promise<Agent | null> {
  const { data, error } = await supabase
    .from('agents' as any)
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching agent:', error)
    return null
  }
  return data as Agent
}

// ============ PRODUCTS ============
export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name')
  
  if (error) {
    console.error('Error fetching products:', error)
    return []
  }
  return data || []
}

// ============ TASKS ============
// Task type with all fields from DB
export type TaskWithRelations = Task

export async function getTasks(filters?: { 
  product_id?: string
  status?: Task['status']
  assignee_id?: string 
}): Promise<TaskWithRelations[]> {
  let query = supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (filters?.product_id) {
    query = query.eq('product_id', filters.product_id)
  }
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.assignee_id) {
    query = query.eq('assignee_id', filters.assignee_id)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching tasks:', error)
    return []
  }
  return data || []
}

export async function getTaskById(id: string): Promise<TaskWithRelations | null> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching task:', error)
    return null
  }
  return data
}

export async function createTask(task: TaskInsert): Promise<TaskWithRelations | null> {
  const { data, error } = await supabase
    .from('tasks')
    .insert(task as any)
    .select()
    .single()
  
  if (error) {
    console.error('Error creating task:', error)
    return null
  }
  return data as TaskWithRelations
}

export async function updateTask(id: string, updates: TaskUpdate): Promise<TaskWithRelations | null> {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates as any)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating task:', error)
    return null
  }
  return data as TaskWithRelations
}

export async function deleteTask(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting task:', error)
    return false
  }
  return true
}

// ============ ACTIVITY ============
export async function getActivity(limit = 20): Promise<AgentActivity[]> {
  const { data, error } = await supabase
    .from('agent_activity')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error('Error fetching activity:', error)
    return []
  }
  return data || []
}

export async function logActivity(activity: ActivityInsert): Promise<AgentActivity | null> {
  const { data, error } = await supabase
    .from('agent_activity')
    .insert(activity as any)
    .select()
    .single()
  
  if (error) {
    console.error('Error logging activity:', error)
    return null
  }
  return data as AgentActivity
}

export async function getActivityByTask(taskId: string): Promise<AgentActivity[]> {
  const { data, error } = await supabase
    .from('agent_activity')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching task activity:', error)
    return []
  }
  return data || []
}

// ============ SQUAD CHAT ============
export async function getMessages(limit = 50): Promise<SquadChat[]> {
  const { data, error } = await supabase
    .from('squad_chat')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(limit)
  
  if (error) {
    console.error('Error fetching messages:', error)
    return []
  }
  return data || []
}

// Alias for clarity
export const getSquadChat = (limit = 20) => getMessages(limit)

export async function sendMessage(message: ChatInsert): Promise<SquadChat | null> {
  const { data, error } = await supabase
    .from('squad_chat')
    .insert(message as any)
    .select()
    .single()
  
  if (error) {
    console.error('Error sending message:', error)
    return null
  }
  return data as SquadChat
}

// ============ CRON JOBS ============
export async function getCronJobs(): Promise<CronJob[]> {
  const { data, error } = await supabase
    .from('cron_jobs')
    .select('*')
    .order('name')
  
  if (error) {
    console.error('Error fetching cron jobs:', error)
    return []
  }
  return data || []
}

export async function getCronRuns(jobId?: string, limit = 20): Promise<CronRun[]> {
  let query = supabase
    .from('cron_runs')
    .select('*')
    .order('ran_at', { ascending: false })
    .limit(limit)
  
  if (jobId) {
    query = query.eq('job_id', jobId)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching cron runs:', error)
    return []
  }
  return data || []
}

// ============ STATS ============
export async function getDashboardStats() {
  const [tasks, agents, activity] = await Promise.all([
    getTasks(),
    getAgents(),
    getActivity(10)
  ])
  
  const activeAgentIds = new Set(
    tasks
      .filter(t => t.status !== 'done' && t.assignee_id)
      .map(t => t.assignee_id)
  )
  
  return {
    totalTasks: tasks.length,
    tasksInQueue: tasks.filter(t => t.status !== 'done').length,
    activeAgents: activeAgentIds.size,
    totalAgents: agents.length,
    recentActivity: activity
  }
}

// ============ DOCUMENTS ============

export async function getDocuments(limit = 20): Promise<Document[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error('Error fetching documents:', error)
    return []
  }
  return data || []
}

export async function getDocumentsByTask(taskId: string): Promise<Document[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching documents:', error)
    return []
  }
  return data || []
}

export async function createDocument(doc: Omit<Document, 'id' | 'created_at'>): Promise<Document | null> {
  const { data, error } = await supabase
    .from('documents')
    .insert(doc)
    .select()
    .single()
  
  if (error) {
    console.error('Error creating document:', error)
    return null
  }
  return data
}

// ============ NOTIFICATIONS ============
export async function getNotifications(agentName?: string): Promise<Notification[]> {
  let query = supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (agentName) {
    query = query.eq('mentioned_agent', agentName)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching notifications:', error)
    return []
  }
  return data || []
}

export async function getUndeliveredNotifications(): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('delivered', false)
    .order('created_at', { ascending: true })
  
  if (error) {
    console.error('Error fetching notifications:', error)
    return []
  }
  return data || []
}

export async function markNotificationDelivered(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ delivered: true })
    .eq('id', id)
  
  return !error
}

export async function createNotification(notification: Omit<Notification, 'id' | 'created_at' | 'delivered'>): Promise<Notification | null> {
  const { data, error } = await supabase
    .from('notifications')
    .insert({ ...notification, delivered: false })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating notification:', error)
    return null
  }
  return data
}

// ============ DISCUSSION PROMPTS ============

export type DiscussionPromptInsert = Database['public']['Tables']['discussion_prompts']['Insert']
export type DiscussionPromptUpdate = Database['public']['Tables']['discussion_prompts']['Update']

/**
 * Create a new discussion prompt - posts to squad chat and awaits responses
 * @param prompt - The prompt configuration
 * @returns The created prompt with squad_chat message linked
 */
export async function createDiscussionPrompt(prompt: {
  task_id?: string
  requester_agent: string
  prompt_message: string
  required_responses?: number
  timeout_minutes?: number
}): Promise<DiscussionPrompt | null> {
  // 1. Create the discussion prompt record
  const { data: promptData, error: promptError } = await supabase
    .from('discussion_prompts' as any)
    .insert({
      task_id: prompt.task_id || null,
      requester_agent: prompt.requester_agent,
      prompt_message: prompt.prompt_message,
      required_responses: prompt.required_responses || 2,
      timeout_minutes: prompt.timeout_minutes || 30,
      status: 'collecting'
    })
    .select()
    .single()
  
  if (promptError) {
    console.error('Error creating discussion prompt:', promptError)
    return null
  }
  
  // 2. Post to squad chat with the prompt
  const { data: chatData, error: chatError } = await supabase
    .from('squad_chat')
    .insert({
      agent_name: prompt.requester_agent,
      message: prompt.prompt_message,
      task_ref: prompt.task_id || null,
      discussion_prompt_id: (promptData as any).id,
      message_type: 'discussion_prompt',
      is_human: false
    } as any)
    .select()
    .single()
  
  if (chatError) {
    console.error('Error posting discussion to squad chat:', chatError)
    // Still return the prompt even if chat post failed
    return promptData as DiscussionPrompt
  }
  
  // 3. Update prompt with the chat message ID
  const { data: updatedPrompt, error: updateError } = await supabase
    .from('discussion_prompts' as any)
    .update({ squad_chat_id: (chatData as any).id })
    .eq('id', (promptData as any).id)
    .select()
    .single()
  
  if (updateError) {
    console.error('Error linking chat to prompt:', updateError)
    return promptData as DiscussionPrompt
  }
  
  return updatedPrompt as DiscussionPrompt
}

/**
 * Respond to a discussion prompt
 * @param promptId - The discussion prompt ID
 * @param response - The response details
 * @returns The created chat message
 */
export async function respondToDiscussionPrompt(
  promptId: string,
  response: {
    agent_name: string
    message: string
    is_human?: boolean
  }
): Promise<SquadChat | null> {
  const { data, error } = await supabase
    .from('squad_chat')
    .insert({
      agent_name: response.agent_name,
      message: response.message,
      discussion_prompt_id: promptId,
      message_type: 'discussion_response',
      is_human: response.is_human || false
    } as any)
    .select()
    .single()
  
  if (error) {
    console.error('Error responding to discussion:', error)
    return null
  }
  return data as SquadChat
}

/**
 * Get a discussion prompt by ID
 */
export async function getDiscussionPrompt(id: string): Promise<DiscussionPrompt | null> {
  const { data, error } = await supabase
    .from('discussion_prompts' as any)
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching discussion prompt:', error)
    return null
  }
  return data as DiscussionPrompt
}

/**
 * Get all pending/collecting prompts for an agent to respond to
 */
export async function getPendingDiscussionPrompts(excludeAgent?: string): Promise<DiscussionPrompt[]> {
  let query = supabase
    .from('discussion_prompts' as any)
    .select('*')
    .in('status', ['pending', 'collecting'])
    .order('created_at', { ascending: false })
  
  if (excludeAgent) {
    query = query.neq('requester_agent', excludeAgent)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching pending prompts:', error)
    return []
  }
  return (data || []) as DiscussionPrompt[]
}

/**
 * Get discussion prompts for a specific task
 */
export async function getDiscussionPromptsForTask(taskId: string): Promise<DiscussionPrompt[]> {
  const { data, error } = await supabase
    .from('discussion_prompts' as any)
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching task prompts:', error)
    return []
  }
  return (data || []) as DiscussionPrompt[]
}

/**
 * Check if a prompt is ready (has enough responses or timed out)
 * Returns the collected context if ready, null if still waiting
 */
export async function checkDiscussionPromptStatus(promptId: string): Promise<{
  ready: boolean
  status: DiscussionPrompt['status']
  responses: DiscussionResponse[]
  responseCount: number
  requiredResponses: number
} | null> {
  const prompt = await getDiscussionPrompt(promptId)
  if (!prompt) return null
  
  const responses = (prompt.collected_context || []) as DiscussionResponse[]
  const ready = prompt.status === 'resolved' || prompt.status === 'timed_out'
  
  return {
    ready,
    status: prompt.status,
    responses,
    responseCount: responses.length,
    requiredResponses: prompt.required_responses
  }
}

/**
 * Cancel a discussion prompt
 */
export async function cancelDiscussionPrompt(promptId: string): Promise<boolean> {
  const { error } = await supabase
    .from('discussion_prompts' as any)
    .update({ 
      status: 'cancelled',
      resolved_at: new Date().toISOString()
    })
    .eq('id', promptId)
  
  if (error) {
    console.error('Error cancelling discussion prompt:', error)
    return false
  }
  return true
}

/**
 * Manually resolve a discussion prompt (force collect context)
 */
export async function resolveDiscussionPrompt(promptId: string): Promise<DiscussionPrompt | null> {
  // First get current responses
  const { data: responses, error: responseError } = await (supabase as any)
    .from('squad_chat')
    .select('agent_name, message, is_human, created_at')
    .eq('discussion_prompt_id', promptId)
    .eq('message_type', 'discussion_response')
    .order('created_at', { ascending: true })
  
  if (responseError) {
    console.error('Error fetching responses:', responseError)
    return null
  }
  
  const collectedContext = (responses || []).map((r: { agent_name: string; message: string; is_human?: boolean; created_at: string }) => ({
    agent: r.agent_name,
    message: r.message,
    is_human: r.is_human || false,
    created_at: r.created_at
  }))
  
  const { data, error } = await supabase
    .from('discussion_prompts' as any)
    .update({
      status: 'resolved',
      collected_context: collectedContext,
      resolved_at: new Date().toISOString()
    })
    .eq('id', promptId)
    .select()
    .single()
  
  if (error) {
    console.error('Error resolving discussion prompt:', error)
    return null
  }
  return data as DiscussionPrompt
}

/**
 * Get responses for a discussion prompt
 */
export async function getDiscussionResponses(promptId: string): Promise<SquadChat[]> {
  const { data, error } = await (supabase as any)
    .from('squad_chat')
    .select('*')
    .eq('discussion_prompt_id', promptId)
    .eq('message_type', 'discussion_response')
    .order('created_at', { ascending: true })
  
  if (error) {
    console.error('Error fetching discussion responses:', error)
    return []
  }
  return data || []
}
