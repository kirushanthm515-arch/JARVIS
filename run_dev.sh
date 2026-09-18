#!/usr/bin/env bash
# Starts the backend and frontend together for the demo.
set -e
cd "$(dirname "$0")"
(cd backend && python3 app.py) &
BACK=$!
trap "kill $BACK" EXIT
cd frontend && npm run dev
