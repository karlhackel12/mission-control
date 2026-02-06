# Mission Control Implementation Spec

## Overview
Replace mock data with real Supabase queries and expand Task Detail Modal to match reference UI.

## Reference Images
- `/Users/karlhackel/Desktop/Screenshot 2026-02-05 at 22.06.49.png` - Full dashboard layout
- `/Users/karlhackel/Desktop/Screenshot 2026-02-05 at 22.06.59.png` - Agents sidebar
- `/Users/karlhackel/Desktop/Screenshot 2026-02-05 at 22.07.13.png` - Task Detail Modal (rich)

## Database
- **Supabase URL**: https://lwjxjixgxqahruygshrb.supabase.co
- **Config**: `~/.config/supabase/mission-control.json`
- **Migration pending**: `supabase/migration-001-expand-schema.sql`

## Tasks

### 1. Run Migration (FIRST)
Karl needs to run `migration-001-expand-schema.sql` in Supabase SQL Editor.

### 2. Create Supabase Data Layer
File: `src/lib/supabase/queries.ts`

```typescript
// Fetch agents from DB instead of constants
export async function getAgents()
export async function getAgentById(id: string)

// Tasks CRUD
export async function getTasks(filters?: { product?: string, status?: string })
export async function getTaskById(id: string)
export async function createTask(task: Partial<Task>)
export async function updateTask(id: string, updates: Partial<Task>)

// Activity feed
export async function getActivity(limit?: number)
export async function logActivity(activity: Partial<Activity>)

// Squad chat
export async function getMessages(limit?: number)
export async function sendMessage(message: Partial<Message>)
```

### 3. Update Types
File: `src/lib/supabase/types.ts`

Add:
```typescript
interface Task {
  // existing fields...
  deliverables: string[] // JSON array
  context: string
  seo_alignment: string
  linked_refs: { type: 'twitter' | 'doc' | 'jira', url: string, title: string }[]
  completion_note: string
  completed_at: string | null
}

interface Agent {
  id: string
  name: string
  emoji: string
  color: string
  role: string
  badge: 'LEAD' | 'INT' | 'SPC'
  whatsapp_group: string | null
  openclaw_agent_id: string
}
```

### 4. Expand Task Detail Modal
File: `src/components/task-detail-modal.tsx`

Match reference Screenshot 3:
- **Header**: Status badge (DONE/IN_PROGRESS/etc) + Priority badge
- **Tags**: Horizontal tag pills
- **DESCRIPTION section**: 
  - Objective paragraph
  - Bullet lists for targets/actions
- **Deliverables section**: Numbered list
- **SEO Alignment**: With @agent mentions
- **Assigned to**: @agent link
- **CONTEXT section**: 
  - Completion status with date
  - Linked references (Twitter threads, docs)

### 5. Replace Mock Data in Pages
Files:
- `src/app/page.tsx` - Dashboard (tasks, activity, agents)
- `src/app/chat/page.tsx` - Squad chat messages
- `src/app/crons/page.tsx` - Cron jobs (pull from OpenClaw API or keep mock for now)

### 6. Remove constants.ts hardcoded data
- Move AGENTS to DB query
- Keep PRODUCTS, STATUS_LABELS, BADGE_COLORS as UI constants

## Acceptance Criteria
- [ ] No mock data in production
- [ ] Tasks load from Supabase
- [ ] Agents load from Supabase  
- [ ] Activity feed is real
- [ ] Task Detail Modal matches reference design
- [ ] All CRUD operations work

## Tech Stack
- Next.js 14 + App Router
- Supabase JS Client (already installed)
- TailwindCSS + shadcn/ui
- date-fns for formatting

## Deploy
- Vercel: mission-control-gules-rho.vercel.app
- Auto-deploy on push to main
