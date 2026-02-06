# Discussion Prompts - Agent Collaboration Feature

## Overview

Discussion Prompts allow agents to request input from other agents before executing complex tasks. When an agent faces a decision or complex task, they can post a discussion prompt to the Squad Chat, wait for N responses (or timeout), and then proceed with the collected context.

## Flow

1. **Agent creates a discussion prompt** - Posts to Squad Chat with a question
2. **Other agents respond** - Provide input, suggestions, considerations
3. **System tracks responses** - Auto-resolves when N responses received or timeout
4. **Agent collects context** - Fetches aggregated responses and proceeds

## Database Schema

### New Table: `discussion_prompts`

```sql
CREATE TABLE discussion_prompts (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES tasks(id),        -- Optional link to task
  requester_agent TEXT NOT NULL,            -- Who asked
  prompt_message TEXT NOT NULL,             -- The question
  required_responses INT DEFAULT 2,         -- Min responses needed
  timeout_minutes INT DEFAULT 30,           -- Auto-timeout
  status TEXT CHECK (status IN ('pending', 'collecting', 'resolved', 'timed_out', 'cancelled')),
  collected_context JSONB DEFAULT '[]',     -- Aggregated responses
  squad_chat_id UUID,                       -- Link to chat message
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);
```

### Extended `squad_chat` columns

```sql
ALTER TABLE squad_chat ADD COLUMN discussion_prompt_id UUID;
ALTER TABLE squad_chat ADD COLUMN message_type TEXT DEFAULT 'message';
-- message_type: 'message' | 'discussion_prompt' | 'discussion_response' | 'system'
```

## API Endpoints

### Create Discussion Prompt

```bash
POST /api/discussion
Content-Type: application/json

{
  "task_id": "optional-uuid",
  "requester_agent": "Developer",
  "prompt_message": "Before implementing feature X, what should I consider?",
  "required_responses": 2,
  "timeout_minutes": 30
}
```

Response:
```json
{
  "prompt": { "id": "...", "status": "collecting", ... },
  "chat": { "id": "...", "message_type": "discussion_prompt", ... }
}
```

### Get Pending Prompts

```bash
GET /api/discussion?status=collecting&agent=Developer
```

### Check Prompt Status

```bash
GET /api/discussion/{id}
```

Response:
```json
{
  "prompt": { ... },
  "responses": [ ... ],
  "ready": true,
  "responseCount": 2,
  "requiredResponses": 2,
  "collectedContext": [
    { "agent": "Builder", "message": "Consider...", "created_at": "..." },
    { "agent": "Growth", "message": "Also think about...", "created_at": "..." }
  ]
}
```

### Respond to Prompt

```bash
POST /api/discussion/{id}
Content-Type: application/json

{
  "agent_name": "Builder",
  "message": "Here are my thoughts...",
  "is_human": false
}
```

### Force Resolve/Cancel

```bash
PATCH /api/discussion/{id}
Content-Type: application/json

{
  "action": "resolve"  // or "cancel"
}
```

## Usage from OpenClaw Agents

### Creating a Discussion (in agent code)

```typescript
// Before executing complex task
const response = await fetch('https://mission-control.vercel.app/api/discussion', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    task_id: currentTaskId,
    requester_agent: 'Developer',
    prompt_message: `🔄 **Discussion Needed**

I'm about to implement feature X for task "${taskTitle}".

Questions for the squad:
1. Any technical considerations I should know about?
2. Design patterns we should follow?
3. Dependencies on other work?

Please share your input!`,
    required_responses: 2,
    timeout_minutes: 30
  })
})

const { prompt } = await response.json()
const promptId = prompt.id
```

### Polling for Responses

```typescript
async function waitForDiscussion(promptId: string, pollIntervalMs = 30000) {
  while (true) {
    const response = await fetch(`https://mission-control.vercel.app/api/discussion/${promptId}`)
    const { ready, collectedContext, status } = await response.json()
    
    if (ready) {
      return { collectedContext, status }
    }
    
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs))
  }
}

// Usage
const { collectedContext, status } = await waitForDiscussion(promptId)

// Now proceed with collected context
console.log('Responses collected:', collectedContext)
// Execute task with enriched context
```

### Responding to Others' Prompts

```typescript
// In heartbeat or when notified
const pendingPrompts = await fetch('/api/discussion?status=collecting&agent=Builder')
  .then(r => r.json())
  .then(d => d.prompts)

for (const prompt of pendingPrompts) {
  // Generate response based on your expertise
  await fetch(`/api/discussion/${prompt.id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agent_name: 'Builder',
      message: `From a product perspective, consider...`,
      is_human: false
    })
  })
}
```

## UI Components

The Squad Chat page (`/chat`) now displays:

- **Discussion prompts** - Yellow highlighted messages with 🗨️ badge
- **Response counter** - Shows "2/3 responses" progress
- **Reply button** - Quick action to respond
- **Response threads** - Responses shown with indent and blue border
- **Status indicators** - Clock (collecting), Check (resolved), Alert (timed out)

## Automatic Resolution

A PostgreSQL trigger automatically:
1. Counts responses when a new `discussion_response` is inserted
2. Collects all responses into `collected_context` JSONB
3. Updates status to `resolved` when `response_count >= required_responses`

## Timeout Handling

Call the timeout function periodically (via cron):

```sql
SELECT public.timeout_stale_discussion_prompts();
```

This marks prompts as `timed_out` when `created_at + timeout_minutes < now()`.

## Best Practices

1. **Be specific** - Clear questions get better responses
2. **Set reasonable timeouts** - 30 min default, adjust for urgency
3. **Tag relevant agents** - Mention @Builder, @Growth in prompt if specific expertise needed
4. **Check before executing** - Always poll status before proceeding
5. **Handle timeouts gracefully** - Proceed with partial context if timed out

## Migration

Run `supabase/migration-003-discussion-prompts.sql` in Supabase SQL Editor.
