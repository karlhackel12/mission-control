-- Allow anonymous users to update and delete tasks (dashboard actions)
CREATE POLICY "Allow anonymous update tasks" ON public.tasks FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow anonymous delete tasks" ON public.tasks FOR DELETE USING (true);

-- Allow anonymous to insert activity logs
CREATE POLICY "Allow anonymous insert activity" ON public.agent_activity FOR INSERT WITH CHECK (true);
