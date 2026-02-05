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
          status: 'backlog' | 'in_progress' | 'review' | 'done'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          assignee_type: 'agent' | 'human' | null
          assignee_id: string | null
          assignee_name: string | null
          deliverable_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          title: string
          description?: string | null
          status?: 'backlog' | 'in_progress' | 'review' | 'done'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          assignee_type?: 'agent' | 'human' | null
          assignee_id?: string | null
          assignee_name?: string | null
          deliverable_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          title?: string
          description?: string | null
          status?: 'backlog' | 'in_progress' | 'review' | 'done'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          assignee_type?: 'agent' | 'human' | null
          assignee_id?: string | null
          assignee_name?: string | null
          deliverable_url?: string | null
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
          created_at: string
        }
        Insert: {
          id?: string
          agent_name: string
          message: string
          task_ref?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          agent_name?: string
          message?: string
          task_ref?: string | null
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
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          schedule: string
          description?: string | null
          enabled?: boolean
          last_run?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          schedule?: string
          description?: string | null
          enabled?: boolean
          last_run?: string | null
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

export type Product = Database['public']['Tables']['products']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type AgentActivity = Database['public']['Tables']['agent_activity']['Row']
export type SquadChat = Database['public']['Tables']['squad_chat']['Row']
export type CronJob = Database['public']['Tables']['cron_jobs']['Row']
export type CronRun = Database['public']['Tables']['cron_runs']['Row']
export type Integration = Database['public']['Tables']['integrations']['Row']
