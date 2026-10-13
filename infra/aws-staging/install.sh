#!/usr/bin/env bash
# Run on the approved EC2 instance, after configure.py and DNS setup.
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo 'Run with sudo on the staging host'; exit 1; }
cd /opt/aegised/infra/aws-staging
[[ -f .env ]] || { echo 'Run configure.py first'; exit 1; }
docker compose config --quiet
# Sequential builds reduce peak RAM on a 2 GiB demo host.
docker compose build api
docker compose build ml
docker compose up -d --wait --wait-timeout 300
docker compose exec -T -e DEMO_SEED=true api npm run seed
install -m 0755 monitor.sh /usr/local/sbin/aegised-monitor
cat >/etc/systemd/system/aegised-monitor.service <<'EOF'
[Unit]
Description=AegisED staging readiness and host metrics
After=docker.service network-online.target
[Service]
Type=oneshot
ExecStart=/usr/local/sbin/aegised-monitor
TimeoutStartSec=60
EOF
cat >/etc/systemd/system/aegised-monitor.timer <<'EOF'
[Unit]
Description=Monitor AegisED staging every five minutes
[Timer]
OnBootSec=5min
OnUnitActiveSec=5min
[Install]
WantedBy=timers.target
EOF
systemctl daemon-reload
systemctl enable --now aegised-monitor.timer
echo 'Containers started. Verify external HTTPS and authenticated workflows before claiming deployment success.'
