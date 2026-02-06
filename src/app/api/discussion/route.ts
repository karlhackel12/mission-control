import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Create Supabase client for server-side operations
function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

/**
 * POST /api/discussion - Create a new discussion prompt
 * 
 * Body:
 * {
 *   "task_id": "optional-task-uuid",
 *   "requester_agent": "Developer",
 *   "prompt_message": "Before implementing feature X, what considerations should I keep in mind?",
 *   "required_responses": 2,  // optional, default 2
 *   "timeout_minutes": 30     // optional, default 30
 * }
 * 
 * Returns the created prompt with squad_chat_id
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { task_id, requester_agent, prompt_message, required_responses = 2, timeout_minutes = 30 } = body

    if (!requester_agent || !prompt_message) {
      return NextResponse.json(
        { error: 'Missing required fields: requester_agent, prompt_message' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // 1. Create the discussion prompt record
    const { data: promptData, error: promptError } = await supabase
      .from('discussion_prompts')
      .insert({
        task_id: task_id || null,
        requester_agent,
        prompt_message,
        required_responses,
        timeout_minutes,
        status: 'collecting'
      })
      .select()
      .single()

    if (promptError) {
      console.error('Error creating discussion prompt:', promptError)
      return NextResponse.json({ error: promptError.message }, { status: 500 })
    }

    // 2. Post to squad chat
    const { data: chatData, error: chatError } = await supabase
      .from('squad_chat')
      .insert({
        agent_name: requester_agent,
        message: prompt_message,
        task_ref: task_id || null,
        discussion_prompt_id: promptData.id,
        message_type: 'discussion_prompt',
        is_human: false
      })
      .select()
      .single()

    if (chatError) {
      console.error('Error posting to squad chat:', chatError)
      // Return prompt anyway
      return NextResponse.json({ prompt: promptData, chat: null })
    }

    // 3. Update prompt with chat ID
    await supabase
      .from('discussion_prompts')
      .update({ squad_chat_id: chatData.id })
      .eq('id', promptData.id)

    return NextResponse.json({
      prompt: { ...promptData, squad_chat_id: chatData.id },
      chat: chatData
    })
  } catch (error) {
    console.error('Error in POST /api/discussion:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/discussion - Get pending discussion prompts
 * 
 * Query params:
 * - status: 'pending' | 'collecting' | 'resolved' | 'timed_out' | 'cancelled' (optional)
 * - agent: exclude prompts from this agent (optional)
 * - task_id: filter by task (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const excludeAgent = searchParams.get('agent')
    const taskId = searchParams.get('task_id')

    const supabase = createClient()

    let query = supabase
      .from('discussion_prompts')
      .select('*')
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    } else {
      // Default to pending/collecting
      query = query.in('status', ['pending', 'collecting'])
    }

    if (excludeAgent) {
      query = query.neq('requester_agent', excludeAgent)
    }

    if (taskId) {
      query = query.eq('task_id', taskId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching prompts:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ prompts: data || [] })
  } catch (error) {
    console.error('Error in GET /api/discussion:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
