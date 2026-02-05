# Icons Folder Guide

## Purpose
This folder contains icon files used throughout the CCTV Repair Notification Website.

## Icon Categories

### System Icons
```
public/icons/system/
├── navigation/       # Menu, close, expand, collapse
├── actions/          # Add, edit, delete, save
├── status/           # Online, offline, warning, error
└── social/          # Share, export, print
```

### Device Icons
```
public/icons/devices/
├── cctv/            # Camera icons
├── nvr/             # Network video recorder icons
├── server/           # Server and infrastructure icons
└── network/          # Network and connectivity icons
```

### UI Icons
```
public/icons/ui/
├── arrows/           # Directional arrows
├── controls/         # Play, pause, stop, record
├── indicators/       # Loading, progress, success
└── overlays/         # Close, maximize, minimize
```

## Icon Formats

### SVG (Recommended)
- **File**: `.svg`
- **Size**: Scalable
- **Use**: UI elements, logos, simple graphics
- **Benefits**: Infinite scaling, small file size

### PNG
- **File**: `.png`
- **Size**: Fixed dimensions
- **Use**: Complex icons with transparency
- **Sizes**: 16x16, 24x24, 32x32, 48x48, 64x64

### WebP
- **File**: `.webp`
- **Size**: Fixed dimensions
- **Use**: Modern browsers, better compression
- **Benefits**: Smaller file size than PNG

## Current Icon Usage

The application currently uses Lucide React icons:
```typescript
import { 
  Wifi,        // ONU status
  Server,      // NVR status
  HardDrive,   // HDD status
  Eye,         // Camera status
  LogIn,       // Login status
  AlertTriangle, // Warning
  CheckCircle,  // Success
  XCircle,      // Error
  TrendingUp,   // Positive trend
  TrendingDown, // Negative trend
  BarChart3,    // Chart view
  List,         // Table view
  Calendar      // Date picker
} from "lucide-react";
```

## Custom Icon Integration

### 1. Create Custom Icon Component
```typescript
// src/components/icons/CustomIcon.tsx
interface CustomIconProps {
  size?: number;
  className?: string;
}

export const CustomIcon: React.FC<CustomIconProps> = ({ 
  size = 24, 
  className = "" 
}) => {
  return (
    <img 
      src="/icons/custom-icon.svg"
      alt="Custom Icon"
      width={size}
      height={size}
      className={className}
    />
  );
};
```

### 2. Use in Components
```typescript
import { CustomIcon } from '@/components/icons/CustomIcon';

// Usage
<CustomIcon size={32} className="text-blue-500" />
```

## Icon Optimization

### SVG Optimization
1. Remove unnecessary metadata
2. Optimize paths
3. Minify SVG code
4. Add viewBox attribute

### PNG Optimization
1. Use appropriate compression
2. Remove metadata
3. Use optimal color palette
4. Consider WebP format

## Naming Conventions
```
✅ Good: status-online.svg
✅ Good: nvr-device-24.png
✅ Good: arrow-left-small.webp

❌ Avoid: icon.svg
❌ Avoid: IMG_1234.png
❌ Avoid: final-icon.png
```

## Recommended Tools
- **SVG Optimizer**: SVGO
- **PNG Optimizer**: TinyPNG
- **Icon Generator**: Figma, Adobe Illustrator
- **Format Converter**: Squoosh, CloudConvert
