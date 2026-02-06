# Mission Control v2 - Roadmap

## Overview

Migrate from Supabase to Convex and add three core features:
1. **Activity Feed** - Log every agent action
2. **Calendar View** - Weekly view of scheduled tasks/cron jobs
3. **Global Search** - Search memories, docs, tasks

## Phases

### Phase 1: Convex Setup ✅ COMPLETE
- [x] Install Convex dependencies
- [x] Configure convex.json
- [x] Create initial schema (agents, activities, tasks, messages, cronJobs, memories)
- [x] Set up ConvexProvider in Next.js
- [x] Verify dev server works
- [x] Create basic queries and mutations (agents, activities, tasks, messages, cronJobs, memories)

### Phase 2: Schema & Data Layer
- [ ] Define full schema (agents, activities, tasks, memories, cronJobs, messages)
- [ ] Create basic queries and mutations
- [ ] Migrate existing data from Supabase
- [ ] Set up vector search for memories

### Phase 3: Activity Feed ✅ COMPLETE
- [x] Create activities table and functions
- [x] Build ActivityFeed component with timeline view
- [x] Real-time subscriptions (auto-refresh with live/pause toggle)
- [x] Filter by agent/type/date and search
- [x] Activity stats sidebar with agent breakdown

### Phase 4: Calendar View ✅ COMPLETE
- [x] Create calendar page (/calendar)
- [x] Weekly view component with day headers
- [x] Display cron jobs from OpenClaw (API route reads jobs.json)
- [x] Parse cron expressions and show occurrences
- [x] Today's schedule sidebar with event details modal

### Phase 5: Global Search ✅ COMPLETE
- [x] Build Command+K search modal (GlobalSearch component)
- [x] Search across tasks, agents, activities, messages, cron jobs
- [x] Quick navigation to all pages
- [x] Keyboard navigation (up/down/enter/esc)
- [x] Integrated in sidebar

### Phase 6: OpenClaw Integration
- [ ] Create HTTP endpoint for activity webhook
- [ ] Sync cron jobs from OpenClaw
- [ ] Sync sessions from OpenClaw
- [ ] Real-time activity logging

### Phase 7: Polish & Deploy
- [ ] UI polish
- [ ] Error handling
- [ ] Loading states
- [ ] Performance optimization
- [ ] Deploy to Vercel
- [ ] Configure Convex production

## Tech Stack

- **Frontend**: Next.js 14 + App Router
- **Backend**: Convex
- **UI**: Tailwind CSS + shadcn/ui
- **Auth**: Convex Auth (optional)
- **Hosting**: Vercel + Convex Cloud

## Convex Resources

- Dashboard: https://dashboard.convex.dev
- Docs: https://docs.convex.dev
- Free credits: https://convex.dev/claw

## Current Status

**Phases 1, 3, 4, 5 COMPLETE** (2026-02-06)
- Convex initialized with project `mission-control-cb6d3`
- Dashboard: https://dashboard.convex.dev/t/karl-hackel/mission-control-cb6d3
- Full schema with 6 tables and indexes
- Basic CRUD queries/mutations for all tables
- ConvexClientProvider configured in Next.js
- **Calendar View**: Weekly calendar syncing cron jobs from OpenClaw
- **Activity Feed**: Timeline view with filters, search, auto-refresh
- **Global Search**: Cmd+K modal searching tasks, agents, activities, messages, crons

Next: Phase 2 (Schema refinement) and Phase 6 (OpenClaw webhook integration).
