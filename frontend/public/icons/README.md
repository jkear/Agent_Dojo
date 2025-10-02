# Agent Dojo Icons

This directory contains resized icons generated from the original 1024x1024 assets.

## 📦 Icon Inventory

### Main Application Icons

- **main_frontview** - Primary app logo and branding
  - Used for: App icon, favicon, PWA icon
  - Sizes: 16x16, 32x32, 64x64, 128x128, 256x256, 512x512

### Martial Arts Equipment Icons

All icons available in 6 standard sizes (16, 32, 64, 128, 256, 512 pixels):

1. **bostaff** - Bo staff training weapon
2. **bow** - Traditional bow
3. **duelblade** - Dual blade weapons
4. **floormat** - Training floor mat
5. **gi** - Traditional martial arts uniform
6. **katana** - Japanese sword
7. **mats** - Training mats
8. **nuchaku** - Nunchaku training weapon
9. **sparringgloves** - Protective sparring gloves

## 🎯 Usage Guidelines

### Web Application

```tsx
// Import in React components
import logoSmall from '/icons/main_frontview_32x32.png';
import logoMedium from '/icons/main_frontview_128x128.png';
import logoLarge from '/icons/main_frontview_512x512.png';

// Use in img tags
<img src="/icons/main_frontview_64x64.png" alt="Agent Dojo" />
```

### Favicon

The multi-resolution `favicon.ico` is located in `/frontend/public/` and contains:

- 16x16px (small browser tabs)
- 32x32px (standard browser tabs)
- 48x48px (high-DPI browser tabs)

### PWA Manifest

Icons are referenced in `/frontend/public/manifest.json` for Progressive Web App support.

### Tauri Desktop App

For the desktop app, update `src-tauri/tauri.conf.json`:

```json
{
  "bundle": {
    "icon": [
      "../frontend/public/icons/main_frontview_32x32.png",
      "../frontend/public/icons/main_frontview_128x128.png",
      "../frontend/public/icons/main_frontview_256x256.png",
      "../frontend/public/icons/main_frontview_512x512.png"
    ]
  }
}
```

## 🔄 Regenerating Icons

To regenerate all icons from source assets:

```bash
# From project root
python scripts/resize_icons.py
```

This will:

1. Read all PNG files from `frontend/assets/`
2. Generate 6 sizes for each image (16, 32, 64, 128, 256, 512)
3. Create optimized PNG files in `frontend/public/icons/`
4. Generate a multi-resolution `favicon.ico`

## 📊 Statistics

- **Total Icons**: 60 PNG files + 1 ICO file
- **Total Size**: ~3.1 MB
- **Format**: PNG with alpha transparency
- **Optimization**: Enabled (smaller file sizes)
- **Resampling**: Lanczos (high quality)

## 🎨 Icon Naming Convention

Format: `{name}_{size}x{size}.png`

Examples:

- `main_frontview_128x128.png`
- `katana_256x256.png`
- `gi_64x64.png`

## 📝 Notes

- All icons maintain aspect ratio (square)
- RGBA color mode with alpha channel for transparency
- Optimized for both light and dark backgrounds
- Generated from high-quality 1024x1024 source images
- Suitable for web, desktop, and mobile applications
