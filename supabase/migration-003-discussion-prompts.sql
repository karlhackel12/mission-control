-- Migration 003: Discussion Prompts for Agent Collaboration
-- Before executing complex tasks, agents can post discussion prompts
-- Other agents respond, and after N responses or timeout, execution proceeds
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/lwjxjixgxqahruygshrb/sql

-- 1. Create discussion_prompts table
CREATE TABLE IF NOT EXISTS public.discussion_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  requester_agent TEXT NOT NULL,
  prompt_message TEXT NOT NULL,
  required_responses INT NOT NULL DEFAULT 2,
  timeout_minutes INT NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'collecting', 'resolved', 'timed_out', 'cancelled')),
  collected_context JSONB DEFAULT '[]'::jsonb,
  squad_chat_id UUID REFERENCES public.squad_chat(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add discussion_prompt_id to squad_chat for linking responses
ALTER TABLE public.squad_chat ADD COLUMN IF NOT EXISTS discussion_prompt_id UUID REFERENCES public.discussion_prompts(id) ON DELETE SET NULL;

-- 3. Add message_type to squad_chat to distinguish prompt messages
ALTER TABLE public.squad_chat ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'message' CHECK (message_type IN ('message', 'discussion_prompt', 'discussion_response', 'system'));

-- 4. Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS discussion_prompts_task_id_idx ON public.discussion_prompts(task_id);
CREATE INDEX IF NOT EXISTS discussion_prompts_status_idx ON public.discussion_prompts(status);
CREATE INDEX IF NOT EXISTS discussion_prompts_requester_agent_idx ON public.discussion_prompts(requester_agent);
CREATE INDEX IF NOT EXISTS squad_chat_discussion_prompt_id_idx ON public.squad_chat(discussion_prompt_id);
CREATE INDEX IF NOT EXISTS squad_chat_message_type_idx ON public.squad_chat(message_type);

-- 5. Enable RLS on discussion_prompts
ALTER TABLE public.discussion_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read" ON public.discussion_prompts FOR SELECT USING (true);
CREATE POLICY "Allow all for authenticated" ON public.discussion_prompts FOR ALL USING (auth.role() = 'authenticated');
-- Allow anonymous insert/update for agents
CREATE POLICY "Allow anonymous insert" ON public.discussion_prompts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON public.discussion_prompts FOR UPDATE USING (true);

-- 6. Function to check if prompt should be resolved (N responses or timeout)
CREATE OR REPLACE FUNCTION public.check_discussion_prompt_resolution()
RETURNS TRIGGER AS $$
DECLARE
  prompt_record RECORD;
  response_count INT;
  responses JSONB;
BEGIN
  -- Only process discussion responses
  IF NEW.discussion_prompt_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get the prompt record
  SELECT * INTO prompt_record 
  FROM public.discussion_prompts 
  WHERE id = NEW.discussion_prompt_id AND status = 'collecting';
  
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;
  
  -- Count responses and collect them
  SELECT 
    COUNT(*),
    jsonb_agg(jsonb_build_object(
      'agent', agent_name,
      'message', message,
      'is_human', COALESCE(is_human, false),
      'created_at', created_at
    ) ORDER BY created_at)
  INTO response_count, responses
  FROM public.squad_chat
  WHERE discussion_prompt_id = NEW.discussion_prompt_id
    AND message_type = 'discussion_response';
  
  -- Check if we have enough responses
  IF response_count >= prompt_record.required_responses THEN
    UPDATE public.discussion_prompts
    SET 
      status = 'resolved',
      collected_context = responses,
      resolved_at = timezone('utc'::text, now())
    WHERE id = NEW.discussion_prompt_id;
  ELSE
    -- Update collected context even if not resolved yet
    UPDATE public.discussion_prompts
    SET collected_context = responses
    WHERE id = NEW.discussion_prompt_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger to auto-check resolution on new responses
DROP TRIGGER IF EXISTS check_prompt_resolution_trigger ON public.squad_chat;
CREATE TRIGGER check_prompt_resolution_trigger
  AFTER INSERT ON public.squad_chat
  FOR EACH ROW
  EXECUTE FUNCTION public.check_discussion_prompt_resolution();

-- 8. Function to timeout stale prompts (call via cron or manually)
CREATE OR REPLACE FUNCTION public.timeout_stale_discussion_prompts()
RETURNS INT AS $$
DECLARE
  timed_out_count INT;
BEGIN
  UPDATE public.discussion_prompts
  SET 
    status = 'timed_out',
    resolved_at = timezone('utc'::text, now())
  WHERE status = 'collecting'
    AND created_at + (timeout_minutes * INTERVAL '1 minute') < timezone('utc'::text, now());
  
  GET DIAGNOSTICS timed_out_count = ROW_COUNT;
  RETURN timed_out_count;
END;
$$ LANGUAGE plpgsql;

-- Done! Verify with:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'discussion_prompts';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'squad_chat' ORDER BY column_name;
