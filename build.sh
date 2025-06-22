#!/bin/bash

# Build script for Chrome Web Store release

echo "🚀 Building SnipLink for Chrome Web Store..."

# Clean previous builds
echo "Cleaning previous builds..."
rm -rf dist/
rm -f sniplink.zip

# Create dist directory
mkdir -p dist

# Build TypeScript
echo "Building TypeScript..."
pnpm build

# Copy necessary files to dist
echo "Copying files to dist..."
cp manifest.json dist/
mkdir -p dist/src
cp src/*.js dist/src/ 2>/dev/null || true
cp src/*.html dist/src/ 2>/dev/null || true
mkdir -p dist/icons
cp icons/*.png dist/icons/ 2>/dev/null || true

# Create icons if they don't exist (temporary placeholders)
if [ ! -f dist/icons/icon16.png ]; then
  echo "⚠️  Warning: Icon files not found. Please add proper icon files:"
  echo "  - icons/icon16.png (16x16)"
  echo "  - icons/icon48.png (48x48)"
  echo "  - icons/icon128.png (128x128)"
fi

# Create zip file
echo "Creating zip file..."
cd dist
zip -r ../sniplink.zip . -x "*.ts" -x "*.test.js" -x "*test/*" -x "icons/*.sh" -x "icons/*.py" -x "icons/*.svg"
cd ..

echo "✅ Build complete! Extension packaged as sniplink.zip"
echo ""
echo "📋 Checklist before uploading to Chrome Web Store:"
if [ ! -f dist/icons/icon16.png ]; then
  echo "  [ ] Add proper icon files (16x16, 48x48, 128x128)"
else
  echo "  [✓] Icon files added"
fi
echo "  [ ] Create screenshots (1280x800 or 640x400)"
echo "  [✓] Author name updated in manifest.json"
echo "  [✓] Homepage URL updated in manifest.json"
echo "  [ ] Update support email in store listing"
echo "  [ ] Test the extension locally"
echo ""
echo "📦 Upload sniplink.zip to https://chrome.google.com/webstore/devconsole"