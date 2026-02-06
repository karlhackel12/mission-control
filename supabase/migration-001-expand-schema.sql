-- Migration 001: Expand schema for rich Task Detail
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/lwjxjixgxqahruygshrb/sql

-- 1. Create agents table (was hardcoded in constants.ts)
CREATE TABLE IF NOT EXISTS public.agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  color TEXT NOT NULL,
  role TEXT NOT NULL,
  badge TEXT CHECK (badge IN ('LEAD', 'INT', 'SPC')),
  whatsapp_group TEXT,
  openclaw_agent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Update tasks status constraint to include inbox/assigned
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_status_check 
  CHECK (status IN ('inbox', 'assigned', 'in_progress', 'review', 'done'));

-- 3. Add rich fields to tasks table
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS deliverables JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS context TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS seo_alignment TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS linked_refs JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS completion_note TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'::text[];

-- 4. Enable RLS on agents
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read" ON public.agents FOR SELECT USING (true);
CREATE POLICY "Allow all for authenticated" ON public.agents FOR ALL USING (auth.role() = 'authenticated');

-- 5. Seed agents data
INSERT INTO public.agents (id, name, emoji, color, role, badge, whatsapp_group, openclaw_agent_id) VALUES
  ('chief', 'Chief', '🎯', '#F59E0B', 'AI Chief of Staff', 'LEAD', NULL, 'main'),
  ('builder', 'Builder', '📋', '#3B82F6', 'Product Specs & PRDs', 'INT', '120363423328712477@g.us', 'work'),
  ('growth', 'Growth', '📣', '#EC4899', 'Marketing & Launches', 'SPC', '120363424164661536@g.us', 'marketing'),
  ('developer', 'Developer', '🛠️', '#10B981', 'Technical Specialist', 'INT', '120363422821083967@g.us', 'developer'),
  ('scout', 'Scout', '🔍', '#8B5CF6', 'Research & Competitors', 'SPC', '120363405172639120@g.us', 'scout'),
  ('metrics', 'Metrics', '📊', '#F97316', 'Analytics & Dashboards', 'SPC', '120363404591395720@g.us', 'metrics'),
  ('infra', 'Infra', '⚙️', '#6B7280', 'DevOps & Deployments', 'INT', '120363406985247380@g.us', 'infra'),
  ('finance', 'Finance', '💰', '#EAB308', 'Budget & Expenses', 'SPC', '120363425816221890@g.us', 'finance')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  emoji = EXCLUDED.emoji,
  color = EXCLUDED.color,
  role = EXCLUDED.role,
  badge = EXCLUDED.badge,
  whatsapp_group = EXCLUDED.whatsapp_group,
  openclaw_agent_id = EXCLUDED.openclaw_agent_id;

-- 6. Create index for faster agent lookups
CREATE INDEX IF NOT EXISTS agents_openclaw_agent_id_idx ON public.agents(openclaw_agent_id);

-- Done! Verify with:
-- SELECT * FROM public.agents;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'tasks';
