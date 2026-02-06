#!/bin/bash
# sync-activities.sh - Sync OpenClaw agent activities to Mission Control
#
# This script reads recent session logs from OpenClaw and posts them to
# the Mission Control Convex backend.
#
# Usage:
#   ./scripts/sync-activities.sh [agent_name]
#
# Environment:
#   MC_CONVEX_SITE_URL - Convex site URL (default: from .env.local)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Load Convex URL from .env.local if not set
if [ -z "$MC_CONVEX_SITE_URL" ]; then
  if [ -f "$PROJECT_DIR/.env.local" ]; then
    MC_CONVEX_SITE_URL=$(grep NEXT_PUBLIC_CONVEX_SITE_URL "$PROJECT_DIR/.env.local" | cut -d'=' -f2)
  fi
fi

# Default to the known URL
MC_CONVEX_SITE_URL="${MC_CONVEX_SITE_URL:-https://reminiscent-leopard-896.convex.site}"

ACTIVITY_ENDPOINT="${MC_CONVEX_SITE_URL}/activity"

echo "🔄 Syncing activities to: $ACTIVITY_ENDPOINT"

# Function to post activity to Convex
post_activity() {
  local agent_name="$1"
  local type="$2"
  local action="$3"
  local details="$4"

  local payload=$(cat <<EOF
{
  "agentName": "$agent_name",
  "type": "$type",
  "action": "$action",
  "details": "$details"
}
EOF
)

  response=$(curl -s -X POST "$ACTIVITY_ENDPOINT" \
    -H "Content-Type: application/json" \
    -d "$payload")

  if echo "$response" | grep -q '"success":true'; then
    echo "✅ Logged: $agent_name - $action"
  else
    echo "❌ Failed: $response"
  fi
}

# Example: Log a manual activity
if [ -n "$1" ]; then
  agent_name="$1"
  action="${2:-session started}"
  type="${3:-session}"
  details="${4:-Manual sync}"
  
  post_activity "$agent_name" "$type" "$action" "$details"
else
  echo ""
  echo "Usage: $0 <agent_name> [action] [type] [details]"
  echo ""
  echo "Examples:"
  echo "  $0 Developer 'completed task' task 'Fixed bug #123'"
  echo "  $0 Chief 'started session' session 'Morning briefing'"
  echo "  $0 Scout 'searched web' search 'Researching competitors'"
  echo ""
  echo "Or call the endpoint directly:"
  echo ""
  echo "curl -X POST '$ACTIVITY_ENDPOINT' \\"
  echo "  -H 'Content-Type: application/json' \\"
  echo "  -d '{\"agentName\": \"Developer\", \"type\": \"task\", \"action\": \"completed task\", \"details\": \"...\"}'"
fi
