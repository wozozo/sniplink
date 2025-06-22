#!/bin/bash

# Generate icon files from original1.png using macOS sips command

echo "🎨 Generating icons from original1.png..."

# Check if original1.png exists
if [ ! -f "icons/original1.png" ]; then
    echo "Error: icons/original1.png not found!"
    exit 1
fi

# Generate 16x16 icon
sips -z 16 16 icons/original1.png --out icons/icon16.png
echo "✓ Created icon16.png (16x16)"

# Generate 48x48 icon
sips -z 48 48 icons/original1.png --out icons/icon48.png
echo "✓ Created icon48.png (48x48)"

# Generate 128x128 icon
sips -z 128 128 icons/original1.png --out icons/icon128.png
echo "✓ Created icon128.png (128x128)"

echo ""
echo "✅ Icon generation complete!"