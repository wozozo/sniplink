#!/bin/bash

# Create simple PNG icons using ImageMagick or base64 encoded minimal PNGs

echo "Creating simple PNG icon placeholders..."

# Check if ImageMagick is installed
if command -v convert &> /dev/null; then
    echo "Using ImageMagick to create icons..."
    
    # Create icons with ImageMagick
    convert -size 16x16 xc:'#4285F4' -fill white -draw "rectangle 2,5 7,11 rectangle 9,5 14,11" icons/icon16.png
    convert -size 48x48 xc:'#4285F4' -fill white -draw "rectangle 6,16 22,32 rectangle 26,16 42,32" icons/icon48.png
    convert -size 128x128 xc:'#4285F4' -fill white -draw "rectangle 16,42 60,86 rectangle 68,42 112,86" icons/icon128.png
    
    echo "✅ Icons created with ImageMagick"
else
    echo "ImageMagick not found. Creating minimal PNG files..."
    
    # Create minimal 1x1 PNG files as placeholders
    # These are base64 encoded 1x1 blue pixels
    echo -n 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' | base64 -d > icons/icon16.png
    echo -n 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' | base64 -d > icons/icon48.png
    echo -n 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' | base64 -d > icons/icon128.png
    
    echo "⚠️  Created minimal placeholder PNG files"
    echo "Please replace with proper icon files before publishing!"
fi

echo ""
echo "Icon files created:"
ls -la icons/*.png