#!/usr/bin/env bash
# Kills whatever holds :4000, starts the server fresh, waits for it to answer.
# Dev convenience for testing the ported routes; not used in production.
set -u
PORT="${PORT:-4000}"

powershell.exe -NoProfile -Command "
  \$c = Get-NetTCPConnection -LocalPort $PORT -State Listen -ErrorAction SilentlyContinue
  if (\$c) { \$c | ForEach-Object { Stop-Process -Id \$_.OwningProcess -Force -ErrorAction SilentlyContinue } }
" >/dev/null 2>&1

sleep 0.5
cd "$(dirname "$0")"
node src/server.js > /tmp/be.log 2>&1 &

for _ in $(seq 1 40); do
  if curl -s -o /dev/null "http://localhost:$PORT/api/health"; then
    echo "server up on :$PORT"; exit 0
  fi
  sleep 0.25
done

echo "server failed to start:"; cat /tmp/be.log; exit 1
