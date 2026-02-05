-- Mission Control Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Products table
create table public.products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  emoji text not null,
  color text not null,
  jira_project text,
  analytics_tool text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tasks table
create table public.tasks (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references public.products(id) on delete cascade not null,
  title text not null,
  description text,
  status text not null default 'backlog' check (status in ('backlog', 'in_progress', 'review', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  assignee_type text check (assignee_type in ('agent', 'human')),
  assignee_id text,
  assignee_name text,
  deliverable_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Agent Activity table
create table public.agent_activity (
  id uuid primary key default uuid_generate_v4(),
  agent_name text not null,
  task_id uuid references public.tasks(id) on delete set null,
  action text not null,
  content text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Squad Chat table
create table public.squad_chat (
  id uuid primary key default uuid_generate_v4(),
  agent_name text not null,
  message text not null,
  task_ref text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Cron Jobs table
create table public.cron_jobs (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  schedule text not null,
  description text,
  enabled boolean default true not null,
  last_run timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Cron Runs table
create table public.cron_runs (
  id uuid primary key default uuid_generate_v4(),
  job_id uuid references public.cron_jobs(id) on delete cascade not null,
  job_name text not null,
  status text not null check (status in ('success', 'failed', 'running')),
  output_summary text,
  ran_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Integrations table
create table public.integrations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text not null,
  status text not null default 'disconnected' check (status in ('connected', 'disconnected', 'error')),
  last_check timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes
create index tasks_product_id_idx on public.tasks(product_id);
create index tasks_status_idx on public.tasks(status);
create index agent_activity_created_at_idx on public.agent_activity(created_at desc);
create index squad_chat_created_at_idx on public.squad_chat(created_at desc);
create index cron_runs_job_id_idx on public.cron_runs(job_id);
create index cron_runs_ran_at_idx on public.cron_runs(ran_at desc);

-- Trigger for updated_at on tasks
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger tasks_updated_at
  before update on public.tasks
  for each row execute function public.handle_updated_at();

-- Enable Row Level Security (RLS)
alter table public.products enable row level security;
alter table public.tasks enable row level security;
alter table public.agent_activity enable row level security;
alter table public.squad_chat enable row level security;
alter table public.cron_jobs enable row level security;
alter table public.cron_runs enable row level security;
alter table public.integrations enable row level security;

-- RLS Policies (allow all for authenticated users - single user app)
create policy "Allow all for authenticated" on public.products for all using (auth.role() = 'authenticated');
create policy "Allow all for authenticated" on public.tasks for all using (auth.role() = 'authenticated');
create policy "Allow all for authenticated" on public.agent_activity for all using (auth.role() = 'authenticated');
create policy "Allow all for authenticated" on public.squad_chat for all using (auth.role() = 'authenticated');
create policy "Allow all for authenticated" on public.cron_jobs for all using (auth.role() = 'authenticated');
create policy "Allow all for authenticated" on public.cron_runs for all using (auth.role() = 'authenticated');
create policy "Allow all for authenticated" on public.integrations for all using (auth.role() = 'authenticated');

-- Also allow anonymous access for now (demo mode)
create policy "Allow anonymous read" on public.products for select using (true);
create policy "Allow anonymous read" on public.tasks for select using (true);
create policy "Allow anonymous read" on public.agent_activity for select using (true);
create policy "Allow anonymous read" on public.squad_chat for select using (true);
create policy "Allow anonymous read" on public.cron_jobs for select using (true);
create policy "Allow anonymous read" on public.cron_runs for select using (true);
create policy "Allow anonymous read" on public.integrations for select using (true);

-- Seed data
insert into public.products (id, name, emoji, color, jira_project, analytics_tool) values
  ('11111111-1111-1111-1111-111111111111', 'goLance', '🚀', '#3B82F6', 'GO', 'mixpanel'),
  ('22222222-2222-2222-2222-222222222222', 'TransForce', '🚚', '#F97316', 'TF', 'mixpanel'),
  ('33333333-3333-3333-3333-333333333333', 'HelloPeople', '👋', '#10B981', 'HP', null),
  ('44444444-4444-4444-4444-444444444444', 'Manuai', '🤖', '#8B5CF6', null, null);
