#!/bin/bash
# Sync cron runs from OpenClaw to Mission Control
# Run this periodically to keep cron health data in sync

MC_URL="${CONVEX_SITE_URL:-https://reminiscent-leopard-896.convex.site}"
CRON_RUNS_DIR="${HOME}/.openclaw/cron/runs"

# Process all jsonl files from last 24h
find "$CRON_RUNS_DIR" -name "*.jsonl" -mtime -1 2>/dev/null | while read -r file; do
  job_id=$(basename "$file" .jsonl)
  
  # Get the last line (most recent run) of each file
  last_run=$(tail -1 "$file" 2>/dev/null)
  
  if [ -n "$last_run" ]; then
    status=$(echo "$last_run" | jq -r '.status // "unknown"')
    run_at=$(echo "$last_run" | jq -r '.runAtMs // 0')
    duration=$(echo "$last_run" | jq -r '.durationMs // 0')
    summary=$(echo "$last_run" | jq -r '.summary // ""')
    
    # Map status to Mission Control format
    case "$status" in
      "ok") mc_status="success" ;;
      "error"|"fail") mc_status="failure" ;;
      *) mc_status="running" ;;
    esac
    
    # Post to Mission Control
    curl -s -X POST "$MC_URL/cron-run" \
      -H "Content-Type: application/json" \
      -d "{
        \"openclawId\": \"$job_id\",
        \"status\": \"$mc_status\",
        \"runAtMs\": $run_at,
        \"durationMs\": $duration,
        \"summary\": \"$summary\"
      }" > /dev/null
  fi
done

echo "Cron runs synced at $(date)"
