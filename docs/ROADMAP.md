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

### Phase 3: Activity Feed
- [ ] Create activities table and functions
- [ ] Build ActivityFeed component
- [ ] Real-time subscriptions
- [ ] Filter by agent/type/date
- [ ] Infinite scroll pagination

### Phase 4: Calendar View
- [ ] Create calendar page
- [ ] Weekly view component
- [ ] Display cron jobs from OpenClaw
- [ ] Display scheduled tasks
- [ ] Drag & drop reschedule (optional)

### Phase 5: Global Search
- [ ] Implement vector embeddings for memories
- [ ] Create search query with hybrid search
- [ ] Build Command+K search modal
- [ ] Search across tasks, memories, documents
- [ ] Preview results

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

**Phase 1 COMPLETE** (2026-02-06)
- Convex initialized with project `mission-control-cb6d3`
- Dashboard: https://dashboard.convex.dev/t/karl-hackel/mission-control-cb6d3
- Full schema with 6 tables and indexes
- Basic CRUD queries/mutations for all tables
- ConvexClientProvider configured in Next.js

Ready to start Phase 2: Schema refinement and data migration.
