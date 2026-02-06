#!/bin/bash
# Seed agent heartbeats for Mission Control
# Run this after deploying to populate initial agent lastSeenAt timestamps

ENDPOINT="https://reminiscent-leopard-896.convex.site/agent-heartbeat"

# All Product Squad agents
AGENTS=("main" "work" "developer" "scout" "metrics" "marketing" "finance" "infra")

echo "🔄 Seeding agent heartbeats..."

for agent in "${AGENTS[@]}"; do
  echo -n "  → $agent: "
  response=$(curl -s -X POST "$ENDPOINT" \
    -H "Content-Type: application/json" \
    -d "{\"agentId\": \"$agent\", \"status\": \"active\"}")
  
  # Parse success from response
  if echo "$response" | grep -q '"success":true'; then
    if echo "$response" | grep -q '"found":true'; then
      echo "✅ updated"
    else
      echo "⚠️  not found (check agent name/openclawId)"
    fi
  else
    echo "❌ error: $response"
  fi
done

echo ""
echo "✨ Done! Check Mission Control dashboard for agent status."
