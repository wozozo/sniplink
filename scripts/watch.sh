#!/bin/bash

# Watch script for SnipLink Chrome Extension development

echo "Starting watch mode for SnipLink extension..."

# Function to copy CSS and HTML files
copy_assets() {
  echo "Copying CSS files..."
  cp src/*.css dist/src/ 2>/dev/null || true
  
  echo "Copying HTML files..."
  cp src/*.html dist/src/ 2>/dev/null || true
  
  echo "Assets copied."
}

# Initial build
echo "Running initial build..."
./scripts/build.sh

# Start TypeScript watch in background
echo "Starting TypeScript watch mode..."
pnpm build:tsc --watch &
TSC_PID=$!

# Watch for CSS and HTML changes
echo "Watching for CSS and HTML changes..."
while true; do
  # Use find to check for recently modified files
  if find src -name "*.css" -o -name "*.html" -newer dist/src/popup.css 2>/dev/null | grep -q .; then
    copy_assets
  fi
  sleep 2
done &
WATCH_PID=$!

# Cleanup function
cleanup() {
  echo "Stopping watch mode..."
  kill $TSC_PID 2>/dev/null
  kill $WATCH_PID 2>/dev/null
  exit
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for user to stop
echo "Watch mode running. Press Ctrl+C to stop."
wait