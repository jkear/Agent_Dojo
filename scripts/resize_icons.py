#!/usr/bin/env python3
"""
Resize frontend assets to create app icons in multiple sizes.

This script processes all PNG images in frontend/assets/ and creates
resized versions suitable for:
- Web app icons (favicon, PWA)
- Desktop app icons (Tauri)
- UI components (various sizes)

Standard icon sizes: 16x16, 32x32, 64x64, 128x128, 256x256, 512x512
"""

import os
import sys
from pathlib import Path
from typing import List, Tuple

try:
    from PIL import Image, ImageOps
except ImportError:
    print("❌ Pillow not installed. Installing...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])
    from PIL import Image, ImageOps


# Standard icon sizes for web and desktop apps
ICON_SIZES = [16, 32, 64, 128, 256, 512]

# Project paths
PROJECT_ROOT = Path(__file__).parent.parent
ASSETS_DIR = PROJECT_ROOT / "frontend" / "assets"
ICONS_DIR = PROJECT_ROOT / "frontend" / "public" / "icons"


def ensure_directory_exists(directory: Path) -> None:
    """Create directory if it doesn't exist."""
    directory.mkdir(parents=True, exist_ok=True)
    print(f"✓ Directory ready: {directory.relative_to(PROJECT_ROOT)}")


def resize_image(
    input_path: Path,
    output_path: Path,
    size: int,
    optimize: bool = True
) -> bool:
    """
    Resize an image to a square size with high quality.
    
    Args:
        input_path: Source image path
        output_path: Destination image path
        size: Target size (width and height)
        optimize: Apply optimization for smaller file size
    """
    try:
        with Image.open(input_path) as img:
            # Convert RGBA to RGB if saving as JPEG, otherwise keep RGBA
            if output_path.suffix.lower() in ['.jpg', '.jpeg']:
                if img.mode == 'RGBA':
                    # Create white background
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    background.paste(img, mask=img.split()[3] if len(img.split()) == 4 else None)
                    img = background
                else:
                    img = img.convert('RGB')
            elif img.mode != 'RGBA':
                img = img.convert('RGBA')
            
            # Use high-quality Lanczos resampling
            img_resized = img.resize((size, size), Image.Resampling.LANCZOS)
            
            # Save with optimization
            if output_path.suffix.lower() == '.png':
                img_resized.save(output_path, 'PNG', optimize=optimize)
            elif output_path.suffix.lower() in ['.jpg', '.jpeg']:
                img_resized.save(output_path, 'JPEG', quality=95, optimize=optimize)
            else:
                img_resized.save(output_path, optimize=optimize)
            
        return True
    except Exception as e:
        print(f"  ❌ Error resizing {input_path.name}: {e}")
        return False


def process_image(input_path: Path, base_name: str) -> Tuple[int, int]:
    """
    Process a single image, creating all icon sizes.
    
    Args:
        input_path: Source image path
        base_name: Base name for output files (without extension)
    
    Returns:
        Tuple of (successful_count, failed_count)
    """
    successful = 0
    failed = 0
    
    print(f"\n📸 Processing: {input_path.name}")
    
    for size in ICON_SIZES:
        output_filename = f"{base_name}_{size}x{size}.png"
        output_path = ICONS_DIR / output_filename
        
        if resize_image(input_path, output_path, size):
            file_size = output_path.stat().st_size / 1024  # KB
            print(f"  ✓ {size}x{size} → {file_size:.1f} KB")
            successful += 1
        else:
            failed += 1
    
    return successful, failed


def create_favicon(source_image: Path) -> bool:
    """
    Create a multi-size favicon.ico file.
    
    Args:
        source_image: Source PNG image
    
    Returns:
        True if successful
    """
    try:
        favicon_path = PROJECT_ROOT / "frontend" / "public" / "favicon.ico"
        
        with Image.open(source_image) as img:
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            
            # Create multiple sizes for ICO (16, 32, 48)
            sizes = [(16, 16), (32, 32), (48, 48)]
            images = []
            
            for size in sizes:
                img_resized = img.resize(size, Image.Resampling.LANCZOS)
                images.append(img_resized)
            
            # Save as ICO with multiple sizes
            images[0].save(
                favicon_path,
                format='ICO',
                sizes=sizes,
                append_images=images[1:]
            )
        
        print(f"\n🌟 Created favicon.ico (16, 32, 48 px)")
        return True
    except Exception as e:
        print(f"\n❌ Error creating favicon: {e}")
        return False


def main():
    """Main execution function."""
    print("=" * 60)
    print("🎨 Agent Dojo Icon Resizer")
    print("=" * 60)
    
    # Ensure output directory exists
    ensure_directory_exists(ICONS_DIR)
    
    # Find all PNG images in assets directory
    image_files = list(ASSETS_DIR.glob("*.png"))
    
    if not image_files:
        print(f"\n❌ No PNG images found in {ASSETS_DIR.relative_to(PROJECT_ROOT)}")
        return 1
    
    print(f"\n📁 Found {len(image_files)} images to process")
    
    total_successful = 0
    total_failed = 0
    
    # Process each image
    for image_path in sorted(image_files):
        # Remove _adojo suffix and file extension for base name
        base_name = image_path.stem.replace('_adojo', '').replace('-', '_')
        successful, failed = process_image(image_path, base_name)
        total_successful += successful
        total_failed += failed
    
    # Create favicon from main logo
    main_logo = ASSETS_DIR / "main-frontview_adojo.png"
    if main_logo.exists():
        create_favicon(main_logo)
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Summary")
    print("=" * 60)
    print(f"✅ Successfully created: {total_successful} icons")
    if total_failed > 0:
        print(f"❌ Failed: {total_failed} icons")
    print(f"📁 Output directory: {ICONS_DIR.relative_to(PROJECT_ROOT)}")
    print(f"📁 Icon sizes: {', '.join(f'{s}x{s}' for s in ICON_SIZES)}")
    
    # Calculate total size
    total_size = sum(f.stat().st_size for f in ICONS_DIR.glob("*.png")) / 1024
    print(f"💾 Total size: {total_size:.1f} KB")
    
    return 0 if total_failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
