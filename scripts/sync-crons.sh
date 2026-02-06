#!/bin/bash
# sync-crons.sh - Sync OpenClaw cron jobs to Mission Control Convex
# Usage: ./sync-crons.sh [--verbose]

set -e

JOBS_FILE="$HOME/.openclaw/cron/jobs.json"
CONVEX_URL="https://reminiscent-leopard-896.convex.site/cron-sync"
VERBOSE=""

# Parse args
if [[ "$1" == "--verbose" || "$1" == "-v" ]]; then
  VERBOSE=1
fi

# Check if jobs file exists
if [[ ! -f "$JOBS_FILE" ]]; then
  echo "❌ Error: Jobs file not found at $JOBS_FILE"
  exit 1
fi

# Extract jobs array from the file
JOBS=$(jq '.jobs' "$JOBS_FILE")

if [[ -z "$JOBS" || "$JOBS" == "null" ]]; then
  echo "❌ Error: No jobs found in $JOBS_FILE"
  exit 1
fi

JOB_COUNT=$(echo "$JOBS" | jq 'length')

if [[ "$VERBOSE" ]]; then
  echo "📋 Found $JOB_COUNT cron jobs in $JOBS_FILE"
  echo "🔄 Syncing to $CONVEX_URL..."
fi

# Send to Convex endpoint
RESPONSE=$(curl -s -X POST "$CONVEX_URL" \
  -H "Content-Type: application/json" \
  -d "{\"jobs\": $JOBS}" \
  -w '\n{"http_code":%{http_code}}')

# Parse response - last line is http_code JSON
HTTP_CODE=$(echo "$RESPONSE" | tail -1 | jq -r '.http_code')
BODY=$(echo "$RESPONSE" | sed '$d')

if [[ "$HTTP_CODE" -eq 200 ]]; then
  SYNCED=$(echo "$BODY" | jq -r '.synced // 0')
  TOTAL=$(echo "$BODY" | jq -r '.total // 0')
  ERRORS=$(echo "$BODY" | jq -r '.errors // empty')
  
  echo "✅ Synced $SYNCED/$TOTAL cron jobs to Mission Control"
  
  if [[ -n "$ERRORS" && "$ERRORS" != "null" ]]; then
    echo "⚠️  Errors:"
    echo "$ERRORS" | jq -r '.[]'
  fi
else
  echo "❌ Sync failed with HTTP $HTTP_CODE"
  echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
  exit 1
fi
