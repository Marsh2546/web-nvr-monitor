# Images Folder Guide

## Purpose
This folder contains all static images used throughout the CCTV Repair Notification Website.

## Recommended Subfolders

### Icons
```
public/images/icons/
├── status/          # Status indicators (online, offline, warning)
├── devices/          # Device icons (camera, nvr, server)
├── ui/              # UI element icons
└── brands/           # Brand and service icons
```

### Backgrounds
```
public/images/backgrounds/
├── patterns/         # Repeating patterns
├── gradients/        # Gradient backgrounds
└── textures/         # Texture images
```

### Screenshots
```
public/images/screenshots/
├── dashboard/        # Dashboard screenshots
├── status/          # Status page screenshots
└── features/         # Feature showcase
```

## Image Optimization Tips

### File Formats
- **WebP**: Best for photos and complex images
- **PNG**: Best for images with transparency
- **SVG**: Best for icons and simple graphics
- **JPEG**: Best for photographs without transparency

### Naming Conventions
Use descriptive, lowercase names with hyphens:
```
✅ Good: status-online-icon.webp
✅ Good: dashboard-overview.png
✅ Good: nvr-device-icon.svg

❌ Avoid: StatusIcon.png
❌ Avoid: IMG_1234.jpg
❌ Avoid: final_final_v2.png
```

### Size Guidelines
- **Icons**: 16x16, 24x24, 32x32, 48x48 pixels
- **Thumbnails**: 150x150 to 300x300 pixels
- **Hero Images**: 1200x600 to 1920x800 pixels
- **Full Width**: 1920px width, auto height

## Usage in React

```typescript
// Import images
import statusIcon from '/images/icons/status-online-icon.webp';
import dashboardBg from '/images/backgrounds/dashboard-pattern.svg';

// Use in components
<img src={statusIcon} alt="Online Status" />
<div style={{ backgroundImage: `url(${dashboardBg})` }}>
```

## Current External Images
The application currently uses external images that should be downloaded and localized:

1. **Company Logo** (App.tsx line 93)
   - URL: `https://multiinno.com/wp-content/uploads/2025/06/cropped-logo-e1748947128387.webp`
   - Target: `public/logos/company-logo.webp`

2. **Other External Images**
   - Check the codebase for additional external image URLs
   - Download and place in appropriate folders
