import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

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
 * GET /api/discussion/[id] - Get a specific discussion prompt with its status
 * 
 * Returns:
 * {
 *   "prompt": { ... },
 *   "responses": [ ... ],
 *   "ready": true/false,
 *   "responseCount": 2,
 *   "requiredResponses": 2
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { id } = params

    // Get the prompt
    const { data: prompt, error: promptError } = await supabase
      .from('discussion_prompts')
      .select('*')
      .eq('id', id)
      .single()

    if (promptError) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
    }

    // Get responses
    const { data: responses, error: responsesError } = await supabase
      .from('squad_chat')
      .select('*')
      .eq('discussion_prompt_id', id)
      .eq('message_type', 'discussion_response')
      .order('created_at', { ascending: true })

    if (responsesError) {
      console.error('Error fetching responses:', responsesError)
    }

    const responseCount = responses?.length || 0
    const ready = prompt.status === 'resolved' || prompt.status === 'timed_out'

    return NextResponse.json({
      prompt,
      responses: responses || [],
      ready,
      responseCount,
      requiredResponses: prompt.required_responses,
      collectedContext: prompt.collected_context || []
    })
  } catch (error) {
    console.error('Error in GET /api/discussion/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/discussion/[id] - Respond to a discussion prompt
 * 
 * Body:
 * {
 *   "agent_name": "Builder",
 *   "message": "Here are my thoughts...",
 *   "is_human": false
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { id } = params
    const body = await request.json()
    const { agent_name, message, is_human = false } = body

    if (!agent_name || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: agent_name, message' },
        { status: 400 }
      )
    }

    // Check if prompt exists and is still collecting
    const { data: prompt, error: promptError } = await supabase
      .from('discussion_prompts')
      .select('*')
      .eq('id', id)
      .single()

    if (promptError || !prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
    }

    if (prompt.status !== 'collecting' && prompt.status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot respond to prompt with status: ${prompt.status}` },
        { status: 400 }
      )
    }

    // Create the response message
    const { data: chatData, error: chatError } = await supabase
      .from('squad_chat')
      .insert({
        agent_name,
        message,
        discussion_prompt_id: id,
        message_type: 'discussion_response',
        is_human
      })
      .select()
      .single()

    if (chatError) {
      console.error('Error creating response:', chatError)
      return NextResponse.json({ error: chatError.message }, { status: 500 })
    }

    // The trigger will automatically check if we've reached required_responses
    // Let's fetch the updated prompt status
    const { data: updatedPrompt } = await supabase
      .from('discussion_prompts')
      .select('*')
      .eq('id', id)
      .single()

    return NextResponse.json({
      response: chatData,
      prompt: updatedPrompt,
      ready: updatedPrompt?.status === 'resolved'
    })
  } catch (error) {
    console.error('Error in POST /api/discussion/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/discussion/[id] - Update discussion prompt (resolve/cancel)
 * 
 * Body:
 * {
 *   "action": "resolve" | "cancel"
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { id } = params
    const body = await request.json()
    const { action } = body

    if (!action || !['resolve', 'cancel'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "resolve" or "cancel"' },
        { status: 400 }
      )
    }

    // Get current responses for context collection
    const { data: responses } = await supabase
      .from('squad_chat')
      .select('agent_name, message, is_human, created_at')
      .eq('discussion_prompt_id', id)
      .eq('message_type', 'discussion_response')
      .order('created_at', { ascending: true })

    const collectedContext = (responses || []).map(r => ({
      agent: r.agent_name,
      message: r.message,
      is_human: r.is_human || false,
      created_at: r.created_at
    }))

    const newStatus = action === 'resolve' ? 'resolved' : 'cancelled'

    const { data, error } = await supabase
      .from('discussion_prompts')
      .update({
        status: newStatus,
        collected_context: collectedContext,
        resolved_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating prompt:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      prompt: data,
      collectedContext
    })
  } catch (error) {
    console.error('Error in PATCH /api/discussion/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
