-- Migration 002: Squad Chat Replies + Human Sender
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/lwjxjixgxqahruygshrb/sql

-- 1. Add reply_to_id for threaded conversations
ALTER TABLE public.squad_chat ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES public.squad_chat(id);

-- 2. Add is_human flag to distinguish Karl from agents
ALTER TABLE public.squad_chat ADD COLUMN IF NOT EXISTS is_human BOOLEAN DEFAULT false;

-- 3. Create index for faster thread lookups
CREATE INDEX IF NOT EXISTS squad_chat_reply_to_id_idx ON public.squad_chat(reply_to_id);

-- 4. Add product_id to cron_jobs for filtering by product
ALTER TABLE public.cron_jobs ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id);

-- 5. Add agent_id to cron_jobs to track which agent owns the cron
ALTER TABLE public.cron_jobs ADD COLUMN IF NOT EXISTS agent_id TEXT REFERENCES public.agents(id);

-- 6. Seed some example cron jobs for heartbeats
INSERT INTO public.cron_jobs (id, name, schedule, description, enabled, agent_id) VALUES
  (gen_random_uuid(), 'Chief Heartbeat', '*/30 * * * *', 'Main agent heartbeat - checks inbox, calendar, emails', true, 'chief'),
  (gen_random_uuid(), 'Builder Heartbeat', '0 9,14,18 * * *', 'Work agent heartbeat - reviews tasks, checks PRs', true, 'builder'),
  (gen_random_uuid(), 'Metrics Daily Report', '0 8 * * *', 'Generate daily metrics summary', true, 'metrics'),
  (gen_random_uuid(), 'Growth Social Scan', '0 */4 * * *', 'Scan social mentions and competitor activity', true, 'growth')
ON CONFLICT DO NOTHING;

-- Done! Verify with:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'squad_chat';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'cron_jobs';
