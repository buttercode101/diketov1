#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Diketo PWA Icon Generator
Generates 192x192 and 512x512 PNG icons for the Diketo game

Requirements:
    pip install pillow

Usage:
    python generate-icons.py
"""

import os
import sys

try:
    from PIL import Image, ImageDraw
except ImportError:
    print("[ERROR] PIL/Pillow not installed!")
    print("   Install with: pip install pillow")
    sys.exit(1)

# Diketo color palette
PALETTE = {
    'bg': '#1A0E05',        # Dark brown background
    'arena': '#3D2317',     # Dirt pit
    'arena_stroke': '#5C3A28',
    'hole': '#2D1810',
    'stone': '#E8D5B7',     # Cream/white stones
    'gho': '#FFD700',       # Golden throwing stone
    'gho_stroke': '#B8860B',
    'accent': '#8B4513',
    'text': '#E8D5B7',
}

def draw_diketo_icon(draw, size):
    """Draw the Diketo game icon on the given ImageDraw context."""
    scale = size / 512
    center_x = size // 2
    
    # Background
    draw.rectangle([0, 0, size, size], fill=PALETTE['bg'])
    
    # Arena circle (dirt pit)
    arena_center_y = int(280 * scale)
    arena_radius = int(140 * scale)
    draw.ellipse(
        [
            center_x - arena_radius,
            arena_center_y - arena_radius,
            center_x + arena_radius,
            arena_center_y + arena_radius
        ],
        fill=PALETTE['arena'],
        outline=PALETTE['arena_stroke'],
        width=max(1, int(6 * scale))
    )
    
    # Hole positions (6 holes in circular pattern)
    hole_positions = [
        (256, 220),  # Top center
        (210, 250),  # Top left
        (302, 250),  # Top right
        (210, 310),  # Bottom left
        (302, 310),  # Bottom right
        (256, 340),  # Bottom center
    ]
    
    hole_radius = int(25 * scale)
    stone_radius = int(12 * scale)
    
    # Draw holes and some stones
    for i, (hx, hy) in enumerate(hole_positions):
        hx_scaled = int(hx * scale)
        hy_scaled = int(hy * scale)
        
        # Draw hole
        draw.ellipse(
            [
                hx_scaled - hole_radius,
                hy_scaled - hole_radius,
                hx_scaled + hole_radius,
                hy_scaled + hole_radius
            ],
            fill=PALETTE['hole'],
            outline=PALETTE['arena_stroke'],
            width=max(1, int(4 * scale))
        )
        
        # Draw stones in first 3 holes
        if i < 3:
            draw.ellipse(
                [
                    hx_scaled - stone_radius,
                    hy_scaled - stone_radius,
                    hx_scaled + stone_radius,
                    hy_scaled + stone_radius
                ],
                fill=PALETTE['stone']
            )
    
    # Draw gho (throwing stone) in motion - positioned above arena
    gho_y = int(140 * scale)
    gho_radius = int(18 * scale)
    draw.ellipse(
        [
            center_x - gho_radius,
            gho_y - gho_radius,
            center_x + gho_radius,
            gho_y + gho_radius
        ],
        fill=PALETTE['gho'],
        outline=PALETTE['gho_stroke'],
        width=max(1, int(3 * scale))
    )
    
    # Motion trail for gho
    trail_y = int(130 * scale)
    trail_rx = int(8 * scale)
    trail_ry = int(4 * scale)
    draw.ellipse(
        [
            center_x - trail_rx,
            trail_y - trail_ry,
            center_x + trail_rx,
            trail_y + trail_ry
        ],
        fill=PALETTE['gho']
    )
    
    # Score markers
    marker_y = int(180 * scale)
    marker_radius = int(8 * scale)
    draw.ellipse(
        [int(180 * scale) - marker_radius, marker_y - marker_radius,
         int(180 * scale) + marker_radius, marker_y + marker_radius],
        fill=PALETTE['accent']
    )
    draw.ellipse(
        [int(332 * scale) - marker_radius, marker_y - marker_radius,
         int(332 * scale) + marker_radius, marker_y + marker_radius],
        fill=PALETTE['accent']
    )

def generate_icon(size, output_path):
    """Generate a PNG icon of the specified size."""
    # Create image
    img = Image.new('RGB', (size, size), color=PALETTE['bg'])
    draw = ImageDraw.Draw(img)
    
    draw_diketo_icon(draw, size)
    
    # Save as PNG
    img.save(output_path, 'PNG', optimize=True)
    print(f"[OK] Generated {output_path}")
    return output_path

def main():
    """Main function to generate all icons."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    icons_dir = os.path.join(script_dir, 'public', 'icons')
    
    # Ensure icons directory exists
    os.makedirs(icons_dir, exist_ok=True)
    
    print('[INFO] Generating Diketo PWA icons...\n')
    
    try:
        generate_icon(192, os.path.join(icons_dir, 'icon-192.png'))
        generate_icon(512, os.path.join(icons_dir, 'icon-512.png'))
        print('\n[SUCCESS] Icons generated successfully!')
        return 0
    except Exception as e:
        print(f'\n[ERROR] Error generating icons: {e}')
        print('\n[TIP] Try: Open generate-icons.html in a browser')
        return 1

if __name__ == '__main__':
    sys.exit(main())
