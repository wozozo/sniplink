#!/usr/bin/env python3
"""
Create PNG icon placeholders for Chrome extension
Requires: pip install pillow
"""

try:
    from PIL import Image, ImageDraw
except ImportError:
    print("Error: Pillow is not installed.")
    print("Please install it with: pip install pillow")
    exit(1)

# Define sizes
sizes = {
    'icon16.png': 16,
    'icon48.png': 48,
    'icon128.png': 128
}

# Create icons
for filename, size in sizes.items():
    # Create new image with RGBA
    img = Image.new('RGBA', (size, size), color=(66, 133, 244, 255))  # Google Blue
    draw = ImageDraw.Draw(img)
    
    # Draw a simple link icon
    margin = size // 8
    line_width = max(1, size // 16)
    
    # Draw two chain links
    # First link
    x1 = margin
    y1 = size // 3
    x2 = size // 2 - margin // 2
    y2 = size * 2 // 3
    draw.rectangle([x1, y1, x2, y2], outline='white', width=line_width)
    
    # Second link (overlapping)
    x1 = size // 2 + margin // 2
    y1 = size // 3
    x2 = size - margin
    y2 = size * 2 // 3
    draw.rectangle([x1, y1, x2, y2], outline='white', width=line_width)
    
    # Save
    img.save(f'icons/{filename}')
    print(f"Created {filename}")

print("\nIcon placeholders created successfully!")
print("For production, please create professional icons with your design tool.")