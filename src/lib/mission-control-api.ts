/**
 * Mission Control API Client
 * 
 * Utility for logging activities and syncing sessions from OpenClaw agents.
 * 
 * Usage in OpenClaw:
 * ```bash
 * # Log activity
 * curl -X POST "https://YOUR_CONVEX_URL/activity" \
 *   -H "Content-Type: application/json" \
 *   -d '{"agentName": "Developer", "type": "task_completed", "action": "Finished implementing feature", "details": "Added session persistence to Convex"}'
 * 
 * # Sync session
 * curl -X POST "https://YOUR_CONVEX_URL/session" \
 *   -H "Content-Type: application/json" \
 *   -d '{"sessionId": "agent:developer:main", "agentName": "developer", "status": "active", "channel": "whatsapp"}'
 * ```
 */

export interface LogActivityParams {
  agentId?: string;
  agentName?: string;
  type: string;
  action: string;
  details?: string;
  metadata?: Record<string, unknown>;
}

export interface UpsertSessionParams {
  sessionId: string;
  agentName: string;
  channel?: string;
  status: 'active' | 'idle' | 'sleeping' | 'terminated';
  model?: string;
  metadata?: Record<string, unknown>;
}

export interface RecordTaskRunParams {
  name: string;
  success: boolean;
  error?: string;
  nextRunAt?: number;
}

/**
 * Activity types for reference
 */
export const ACTIVITY_TYPES = {
  TOOL_CALL: 'tool_call',
  MESSAGE_SENT: 'message_sent',
  TASK_CREATED: 'task_created',
  TASK_COMPLETED: 'task_completed',
  FILE_WRITTEN: 'file_written',
  SEARCH: 'search',
  DECISION: 'decision',
  ERROR: 'error',
  CRON_RUN: 'cron_run',
  SESSION_START: 'session_start',
  SESSION_END: 'session_end',
} as const;

/**
 * Create a Mission Control API client
 */
export function createMissionControlClient(baseUrl: string) {
  const api = {
    /**
     * Log an activity
     */
    async logActivity(params: LogActivityParams): Promise<{ success: boolean; activityId?: string; error?: string }> {
      try {
        const response = await fetch(`${baseUrl}/activity`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        });
        return await response.json();
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },

    /**
     * Upsert session state
     */
    async upsertSession(params: UpsertSessionParams): Promise<{ success: boolean; id?: string; error?: string }> {
      try {
        const response = await fetch(`${baseUrl}/session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        });
        return await response.json();
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },

    /**
     * Send session heartbeat
     */
    async heartbeat(sessionId: string): Promise<{ success: boolean; id?: string; error?: string }> {
      try {
        const response = await fetch(`${baseUrl}/session/heartbeat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
        return await response.json();
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },

    /**
     * Health check
     */
    async health(): Promise<{ status: string; timestamp: number }> {
      const response = await fetch(`${baseUrl}/health`);
      return await response.json();
    },
  };

  return api;
}

/**
 * Bash script generator for OpenClaw auto-logging
 * 
 * Use this to generate a script that can be sourced in agent workspaces
 */
export function generateAutoLogScript(convexUrl: string): string {
  return `#!/bin/bash
# Mission Control Auto-Logger
# Source this in your agent's shell: source mc-autolog.sh

MC_URL="${convexUrl}"

# Log activity to Mission Control
mc_log() {
  local agent_name="\${1:-\${MC_AGENT:-Unknown}}"
  local type="\${2:-tool_call}"
  local action="\${3:-action performed}"
  local details="\${4}"
  
  local payload="{\"agentName\": \"\$agent_name\", \"type\": \"\$type\", \"action\": \"\$action\""
  if [ -n "\$details" ]; then
    payload="\${payload}, \"details\": \"\$details\""
  fi
  payload="\${payload}}"
  
  curl -s -X POST "\$MC_URL/activity" \\
    -H "Content-Type: application/json" \\
    -d "\$payload" > /dev/null 2>&1 &
}

# Log task completion
mc_task_done() {
  mc_log "\${MC_AGENT:-Unknown}" "task_completed" "\$1" "\$2"
}

# Log error
mc_error() {
  mc_log "\${MC_AGENT:-Unknown}" "error" "\$1" "\$2"
}

# Sync session status
mc_session() {
  local session_id="\${1:-agent:\${MC_AGENT:-unknown}:main}"
  local status="\${2:-active}"
  
  curl -s -X POST "\$MC_URL/session" \\
    -H "Content-Type: application/json" \\
    -d "{\"sessionId\": \"\$session_id\", \"agentName\": \"\${MC_AGENT:-Unknown}\", \"status\": \"\$status\"}" > /dev/null 2>&1 &
}

# Session heartbeat
mc_heartbeat() {
  local session_id="\${1:-agent:\${MC_AGENT:-unknown}:main}"
  curl -s -X POST "\$MC_URL/session/heartbeat" \\
    -H "Content-Type: application/json" \\
    -d "{\"sessionId\": \"\$session_id\"}" > /dev/null 2>&1 &
}

echo "Mission Control auto-logger loaded. Set MC_AGENT to your agent name."
`;
}
