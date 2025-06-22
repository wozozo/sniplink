#!/bin/bash

# Generate icon placeholders for Chrome extension
# You'll need to replace these with actual icon designs

# Create SVG icon
cat > icons/icon.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="16" fill="#4285F4"/>
  <path d="M32 48 L64 32 L96 48 L96 80 L64 96 L32 80 Z" fill="white" stroke="none"/>
  <circle cx="64" cy="64" r="8" fill="#4285F4"/>
</svg>
EOF

echo "Icon placeholder created at icons/icon.svg"
echo "Please create proper icons with your design tool and export as:"
echo "- icon16.png (16x16)"
echo "- icon48.png (48x48)"
echo "- icon128.png (128x128)"
echo ""
echo "For Chrome Store listing, also create:"
echo "- icon440x280.png (promotional tile)"
echo "- icon1280x800.png (screenshot size)"