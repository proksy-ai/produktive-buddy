#!/usr/bin/env bash
# Serve each Kairo UI style variant on its own port (bash 3.2 compatible).
set -eu
cd "$(dirname "$0")"

PAIRS="01-claymorphism:4101 02-neubrutalism:4102 03-glassmorphism:4103 04-bento-minimal:4104 05-aurora:4105 06-y2k:4106 07-cyberpunk:4107 08-soft-ui:4108 09-oled:4109 10-editorial:4110"

pkill -f "http.server 410" 2>/dev/null || true
sleep 1

for pair in $PAIRS; do
  dir="${pair%%:*}"
  port="${pair##*:}"
  ( cd "$dir" && nohup python3 -m http.server "$port" --bind 127.0.0.1 >/dev/null 2>&1 & )
  echo "Serving $dir on http://localhost:$port"
done

echo "All variant servers started."
