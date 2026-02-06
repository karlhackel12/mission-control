#!/bin/bash
#
# Mission Control Auto-Logger
# 
# Source this script in your agent's environment to enable auto-logging.
#
# Setup:
#   1. Set MC_URL to your Convex HTTP endpoint
#   2. Set MC_AGENT to your agent name
#   3. Source this script: source mc-autolog.sh
#
# Usage:
#   mc_log "Developer" "task_completed" "Finished feature" "Added 3 files"
#   mc_task_done "Implemented login" "Added OAuth support"
#   mc_error "API call failed" "Status 500"
#   mc_session "agent:developer:main" "active"
#
# Environment variables:
#   MC_URL    - Convex HTTP endpoint (required)
#   MC_AGENT  - Default agent name (optional, can be passed to functions)
#

# Default URL - override with your Convex deployment URL
MC_URL="${MC_URL:-https://reminiscent-leopard-896.convex.site}"

# Log activity to Mission Control
# Args: agent_name, type, action, [details]
mc_log() {
  local agent_name="${1:-${MC_AGENT:-Unknown}}"
  local type="${2:-tool_call}"
  local action="${3:-action performed}"
  local details="${4}"
  
  local payload="{\"agentName\": \"$agent_name\", \"type\": \"$type\", \"action\": \"$action\""
  if [ -n "$details" ]; then
    # Escape quotes in details
    details=$(echo "$details" | sed 's/"/\\"/g')
    payload="${payload}, \"details\": \"$details\""
  fi
  payload="${payload}}"
  
  curl -s -X POST "$MC_URL/activity" \
    -H "Content-Type: application/json" \
    -d "$payload" > /dev/null 2>&1 &
  
  # Don't wait for background process
  disown 2>/dev/null || true
}

# Log task completion
# Args: action, [details]
mc_task_done() {
  mc_log "${MC_AGENT:-Unknown}" "task_completed" "$1" "$2"
}

# Log task creation
# Args: action, [details]
mc_task_new() {
  mc_log "${MC_AGENT:-Unknown}" "task_created" "$1" "$2"
}

# Log error
# Args: action, [details]
mc_error() {
  mc_log "${MC_AGENT:-Unknown}" "error" "$1" "$2"
}

# Log tool call
# Args: action, [details]
mc_tool() {
  mc_log "${MC_AGENT:-Unknown}" "tool_call" "$1" "$2"
}

# Log search
# Args: action, [details]
mc_search() {
  mc_log "${MC_AGENT:-Unknown}" "search" "$1" "$2"
}

# Log decision
# Args: action, [details]
mc_decision() {
  mc_log "${MC_AGENT:-Unknown}" "decision" "$1" "$2"
}

# Log message sent
# Args: action, [details]
mc_message() {
  mc_log "${MC_AGENT:-Unknown}" "message_sent" "$1" "$2"
}

# Log file written
# Args: action, [details]
mc_file() {
  mc_log "${MC_AGENT:-Unknown}" "file_written" "$1" "$2"
}

# Sync session status
# Args: [session_id], [status]
mc_session() {
  local session_id="${1:-agent:${MC_AGENT:-unknown}:main}"
  local status="${2:-active}"
  local channel="${3:-}"
  local model="${4:-}"
  
  local payload="{\"sessionId\": \"$session_id\", \"agentName\": \"${MC_AGENT:-Unknown}\", \"status\": \"$status\""
  if [ -n "$channel" ]; then
    payload="${payload}, \"channel\": \"$channel\""
  fi
  if [ -n "$model" ]; then
    payload="${payload}, \"model\": \"$model\""
  fi
  payload="${payload}}"
  
  curl -s -X POST "$MC_URL/session" \
    -H "Content-Type: application/json" \
    -d "$payload" > /dev/null 2>&1 &
  
  disown 2>/dev/null || true
}

# Session heartbeat
# Args: [session_id]
mc_heartbeat() {
  local session_id="${1:-agent:${MC_AGENT:-unknown}:main}"
  
  curl -s -X POST "$MC_URL/session/heartbeat" \
    -H "Content-Type: application/json" \
    -d "{\"sessionId\": \"$session_id\"}" > /dev/null 2>&1 &
  
  disown 2>/dev/null || true
}

# Start session (logs activity + syncs session)
# Args: [session_id], [channel], [model]
mc_session_start() {
  local session_id="${1:-agent:${MC_AGENT:-unknown}:main}"
  local channel="${2:-}"
  local model="${3:-}"
  
  mc_session "$session_id" "active" "$channel" "$model"
  mc_log "${MC_AGENT:-Unknown}" "session_start" "Session started" "Channel: $channel"
}

# End session
# Args: [session_id]
mc_session_end() {
  local session_id="${1:-agent:${MC_AGENT:-unknown}:main}"
  
  mc_log "${MC_AGENT:-Unknown}" "session_end" "Session ended"
  mc_session "$session_id" "terminated"
}

# Health check
mc_health() {
  curl -s "$MC_URL/health" | python3 -m json.tool 2>/dev/null || curl -s "$MC_URL/health"
}

# Only print message if sourced interactively
if [[ $- == *i* ]]; then
  echo "✅ Mission Control auto-logger loaded"
  echo "   MC_URL: $MC_URL"
  echo "   MC_AGENT: ${MC_AGENT:-<not set>}"
  echo ""
  echo "   Available commands:"
  echo "     mc_log, mc_task_done, mc_task_new, mc_error, mc_tool"
  echo "     mc_search, mc_decision, mc_message, mc_file"
  echo "     mc_session, mc_heartbeat, mc_session_start, mc_session_end"
  echo ""
fi
