#!/bin/zsh
# Rebuilds the production bundle and restarts `next start` on port 3100.
cd "${0:A:h}/.."
mkdir -p qa/output
pkill -f "next start -p 3100" 2>/dev/null
NEXT_TELEMETRY_DISABLED=1 npx next build > qa/output/build.log 2>&1 || { tail -30 qa/output/build.log; exit 1; }
(NEXT_TELEMETRY_DISABLED=1 nohup npx next start -p 3100 > qa/output/server.log 2>&1 &)
for i in {1..30}; do curl -s -o /dev/null http://localhost:3100/ && break; sleep 0.5; done
echo "rebuilt and serving on :3100"
