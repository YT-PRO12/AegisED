#!/usr/bin/env bash
# Called by a root-owned systemd timer. No payloads, tokens or database URLs logged.
set -euo pipefail
cd /opt/aegised/infra/aws-staging
exec 9>/run/aegised-monitor.lock
flock -n 9 || exit 0
ready=0
if docker compose exec -T api node -e "fetch('http://127.0.0.1:5000/api/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" >/dev/null 2>&1; then ready=1; fi
ml=0
if docker compose exec -T ml python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health',timeout=3)" >/dev/null 2>&1; then ml=1; fi
memory=$(awk '/MemTotal/{t=$2}/MemAvailable/{a=$2}END{printf "%.2f",100*(t-a)/t}' /proc/meminfo)
disk=$(df -P / | awk 'NR==2 {gsub(/%/,"",$5);print $5}')
aws cloudwatch put-metric-data --region ap-southeast-2 --namespace AegisED/Staging --metric-data \
  "MetricName=APIReady,Value=$ready,Unit=Count" \
  "MetricName=MLReady,Value=$ml,Unit=Count" \
  "MetricName=MemoryUsed,Value=$memory,Unit=Percent" \
  "MetricName=DiskUsed,Value=$disk,Unit=Percent"
