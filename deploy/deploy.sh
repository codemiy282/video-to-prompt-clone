#!/usr/bin/env bash
# Deploy tự động: pull code mới -> rebuild -> restart container -> dọn image rác.
# Dùng:  bash deploy/deploy.sh
set -euo pipefail

# Chuyển về thư mục gốc của repo (nơi chứa docker-compose.yml)
cd "$(dirname "$0")/.."

echo "==> Pull latest code"
git pull --ff-only

echo "==> Rebuild & restart"
docker compose up -d --build

echo "==> Prune dangling images"
docker image prune -f

echo "==> Done. Frontend: https://$(grep -m1 server_name deploy/nginx/next.conf | awk '{print $2}' | tr -d ';')"
