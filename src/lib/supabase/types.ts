export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      agents: {
        Row: {
          id: string
          name: string
          emoji: string
          color: string
          role: string
          badge: 'LEAD' | 'INT' | 'SPC'
          whatsapp_group: string | null
          openclaw_agent_id: string
          created_at: string
        }
        Insert: {
          id: string
          name: string
          emoji: string
          color: string
          role: string
          badge?: 'LEAD' | 'INT' | 'SPC'
          whatsapp_group?: string | null
          openclaw_agent_id?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          emoji?: string
          color?: string
          role?: string
          badge?: 'LEAD' | 'INT' | 'SPC'
          whatsapp_group?: string | null
          openclaw_agent_id?: string
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          emoji: string
          color: string
          jira_project: string | null
          analytics_tool: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          emoji: string
          color: string
          jira_project?: string | null
          analytics_tool?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          emoji?: string
          color?: string
          jira_project?: string | null
          analytics_tool?: string | null
          created_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          product_id: string
          title: string
          description: string | null
          status: 'inbox' | 'assigned' | 'in_progress' | 'review' | 'done'
          priority: 'low' | 'normal' | 'high' | 'urgent'
          assignee_type: 'agent' | 'human' | null
          assignee_id: string | null
          assignee_name: string | null
          deliverable_url: string | null
          deliverables: string[] | null
          context: string | null
          seo_alignment: string | null
          linked_refs: { type: string; url: string; title: string }[] | null
          completion_note: string | null
          completed_at: string | null
          tags: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          title: string
          description?: string | null
          status?: 'inbox' | 'assigned' | 'in_progress' | 'review' | 'done'
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          assignee_type?: 'agent' | 'human' | null
          assignee_id?: string | null
          assignee_name?: string | null
          deliverable_url?: string | null
          deliverables?: string[] | null
          context?: string | null
          seo_alignment?: string | null
          linked_refs?: { type: string; url: string; title: string }[] | null
          completion_note?: string | null
          completed_at?: string | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          title?: string
          description?: string | null
          status?: 'inbox' | 'assigned' | 'in_progress' | 'review' | 'done'
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          assignee_type?: 'agent' | 'human' | null
          assignee_id?: string | null
          assignee_name?: string | null
          deliverable_url?: string | null
          deliverables?: string[] | null
          context?: string | null
          seo_alignment?: string | null
          linked_refs?: { type: string; url: string; title: string }[] | null
          completion_note?: string | null
          completed_at?: string | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      agent_activity: {
        Row: {
          id: string
          agent_name: string
          task_id: string | null
          action: string
          content: string | null
          created_at: string
        }
        Insert: {
          id?: string
          agent_name: string
          task_id?: string | null
          action: string
          content?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          agent_name?: string
          task_id?: string | null
          action?: string
          content?: string | null
          created_at?: string
        }
      }
      squad_chat: {
        Row: {
          id: string
          agent_name: string
          message: string
          task_ref: string | null
          reply_to_id: string | null
          is_human: boolean
          created_at: string
        }
        Insert: {
          id?: string
          agent_name: string
          message: string
          task_ref?: string | null
          reply_to_id?: string | null
          is_human?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          agent_name?: string
          message?: string
          task_ref?: string | null
          reply_to_id?: string | null
          is_human?: boolean
          created_at?: string
        }
      }
      cron_jobs: {
        Row: {
          id: string
          name: string
          schedule: string
          description: string | null
          enabled: boolean
          last_run: string | null
          product_id: string | null
          agent_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          schedule: string
          description?: string | null
          enabled?: boolean
          last_run?: string | null
          product_id?: string | null
          agent_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          schedule?: string
          description?: string | null
          enabled?: boolean
          last_run?: string | null
          product_id?: string | null
          agent_id?: string | null
          created_at?: string
        }
      }
      cron_runs: {
        Row: {
          id: string
          job_id: string
          job_name: string
          status: 'success' | 'failed' | 'running'
          output_summary: string | null
          ran_at: string
        }
        Insert: {
          id?: string
          job_id: string
          job_name: string
          status: 'success' | 'failed' | 'running'
          output_summary?: string | null
          ran_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          job_name?: string
          status?: 'success' | 'failed' | 'running'
          output_summary?: string | null
          ran_at?: string
        }
      }
      integrations: {
        Row: {
          id: string
          name: string
          type: string
          status: 'connected' | 'disconnected' | 'error'
          last_check: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          type: string
          status?: 'connected' | 'disconnected' | 'error'
          last_check?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: string
          status?: 'connected' | 'disconnected' | 'error'
          last_check?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Agent = Database['public']['Tables']['agents']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type AgentActivity = Database['public']['Tables']['agent_activity']['Row']
export type SquadChat = Database['public']['Tables']['squad_chat']['Row']
export type CronJob = Database['public']['Tables']['cron_jobs']['Row']
export type CronRun = Database['public']['Tables']['cron_runs']['Row']
export type Integration = Database['public']['Tables']['integrations']['Row']

// New tables
export type Document = {
  id: string
  title: string
  content: string | null
  type: 'deliverable' | 'research' | 'protocol' | 'report' | 'other'
  task_id: string | null
  agent_name: string
  file_path: string | null
  created_at: string
}

export type Notification = {
  id: string
  mentioned_agent: string
  from_agent: string
  content: string
  task_id: string | null
  delivered: boolean
  created_at: string
}
