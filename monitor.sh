#!/bin/bash

RAILWAY_URL="${1:-https://your-app.railway.app}"

echo "🔍 Monitoring Refuge Backend"
echo "URL: $RAILWAY_URL"
echo ""

while true; do
  clear
  echo "=== Refuge Backend Monitoring ==="
  echo "Timestamp: $(date)"
  echo ""
  
  echo "📊 Metrics:"
  curl -s $RAILWAY_URL/metrics | jq '{
    totalRequests: .totalRequests,
    totalErrors: .totalErrors,
    errorRate: .errorRate,
    avgResponseTimeMs: .avgResponseTimeMs,
    uptime: .uptime
  }'
  
  echo ""
  echo "❤️ Health:"
  curl -s $RAILWAY_URL/health | jq '{
    status: .status,
    database: .database,
    redis: .redis
  }'
  
  echo ""
  echo "Press Ctrl+C to exit. Refreshing in 5s..."
  sleep 5
done
