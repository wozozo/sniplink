#!/bin/bash

# Build script for SnipLink Chrome Extension

echo "Building SnipLink extension..."

# Clean dist directory
echo "Cleaning dist directory..."
rm -rf dist
mkdir -p dist

# Copy manifest.json
echo "Copying manifest.json..."
cp manifest.json dist/

# Copy icons to dist root
echo "Copying icons..."
cp -r icons dist/

# Create src directory in dist
mkdir -p dist/src

# Build TypeScript files
echo "Building TypeScript files..."
pnpm build:tsc

# Copy JS files to dist/src
echo "Copying JavaScript files..."
cp src/*.js dist/src/

# Copy HTML files to dist/src
echo "Copying HTML files..."
cp src/*.html dist/src/

# Copy CSS files to dist/src
echo "Copying CSS files..."
cp src/*.css dist/src/

# Copy icons to dist/src/icons (referenced in HTML files)
echo "Copying icons to src/icons..."
mkdir -p dist/src/icons
cp icons/*.png dist/src/icons/

echo "Build complete! Extension files are in the dist/ directory."