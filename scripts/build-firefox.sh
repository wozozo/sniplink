#!/bin/bash

# Build Firefox extension
echo "Building Firefox extension..."

# Clean the dist directory
rm -rf dist-firefox

# Build TypeScript
pnpm build:tsc

# Create dist directory
mkdir -p dist-firefox/src
mkdir -p dist-firefox/icons

# Copy all built files
cp -r src/*.js src/*.html src/*.css dist-firefox/src/
cp -r icons/*.png dist-firefox/icons/

# Copy Firefox manifest
cp manifest.firefox.json dist-firefox/manifest.json

echo "Firefox extension build complete in dist-firefox/"