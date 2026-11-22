#!/usr/bin/env bash
# Starts a local web server and opens Teleprompter Studio in your browser.
cd "$(dirname "$0")" || exit 1
URL="http://localhost:8000"
echo "Teleprompter Studio is running at $URL  (Ctrl+C to stop)"
(
  sleep 1.5
  if command -v xdg-open >/dev/null; then xdg-open "$URL"
  elif command -v open >/dev/null; then open "$URL"
  fi
) >/dev/null 2>&1 &
python3 -m http.server 8000
