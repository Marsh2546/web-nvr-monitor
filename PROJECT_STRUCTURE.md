# CCTV NVR Monitor - Project Structure

## 📁 Cleaned Up Project Structure

```
src/
├── app/
│   ├── App.tsx                    # Main application component
│   ├── components/
│   │   ├── index.ts              # Main components export
│   │   ├── PageRegistry.tsx      # Page registration system
│   │   ├── PageWrappers.tsx      # Page wrapper classes
│   │   ├── pages/                # 📄 Page Components
│   │   │   ├── index.ts          # Pages export
│   │   │   ├── Dashboard.tsx     # Repair dashboard (unused but kept)
│   │   │   ├── NVRDashboard.tsx  # Main NVR dashboard
│   │   │   ├── NVRStatusPage.tsx # NVR status page
│   │   │   └── CriticalIssuesAnalysis.tsx
│   │   ├── shared/               # 🔄 Reusable Components
│   │   │   ├── index.ts          # Shared components export
│   │   │   ├── StatusIcon.tsx    # Status indicator component
│   │   │   ├── ComponentStatusIndicator.tsx
│   │   │   └── Pagination.tsx    # Reusable pagination
│   │   └── ui/                   # 🎨 UI Components (Only used ones)
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── input.tsx
│   │       ├── select.tsx
│   │       ├── sonner.tsx
│   │       ├── tabs.tsx
│   │       └── utils.ts
│   ├── data/
│   │   └── nvrData.ts            # NVR mock data
│   ├── services/
│   │   ├── nvrService.ts          # NVR API service
│   │   └── nvrHistoryService.ts  # NVR history service
│   ├── types/
│   │   ├── common.ts              # Common type definitions
│   │   └── nvr.ts                 # NVR type definitions
│   └── utils/                    # 🛠️ Shared Utilities
│       ├── index.ts              # Utils export
│       ├── AnimatedNumber.tsx    # Animated number component
│       ├── cn.ts                 # Classname utility
│       └── nvrStatusHelpers.ts   # NVR status calculation logic
├── lib/
│   └── storage.ts                # Storage utilities
└── types/
    └── repair.ts                 # Repair types
```

## 🗑️ Removed Files

### Unused Components Removed:
- `AdminPage.tsx` - Not referenced anywhere
- `Navigation.tsx` - Not used in current structure
- `StatCard.tsx` - Not imported anywhere
- `StatusTracking.tsx` - Not used
- `RepairList.tsx` - Only used in removed RepairStatusPage
- `RepairStatusPage.tsx` - Not integrated with main app
- `figma/ImageWithFallback.tsx` - Not used

### Unused Data Files Removed:
- `src/app/data/mockData.ts` - Duplicate of lib/mockData.ts
- `src/lib/mockData.ts` - Not used in current implementation

### Unused UI Components Removed (40+ files):
- accordion, alert-dialog, alert, aspect-ratio, avatar, breadcrumb, calendar, carousel, chart, checkbox, collapsible, command, context-menu, drawer, dropdown-menu, form, hover-card, input-otp, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, separator, sheet, sidebar, skeleton, slider, switch, table, textarea, toggle-group, toggle, tooltip, use-mobile

## ✅ Benefits Achieved

1. **Reduced Bundle Size** - Removed ~40 unused UI components
2. **Better Organization** - Logical grouping of pages, shared components, and utilities
3. **Cleaner Imports** - Centralized exports through index files
4. **DRY Principle** - Eliminated duplicate code and utilities
5. **Type Safety** - Proper TypeScript types and interfaces
6. **Maintainability** - Clear file structure and separation of concerns

## 🔄 Current Active Pages

1. **Dashboard** (`NVRDashboard.tsx`) - Main monitoring dashboard
2. **Status** (`NVRStatusPage.tsx`) - Detailed NVR status page

## 📦 Key Dependencies

- **React** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Recharts** - Charts
- **Sonner** - Toast notifications
- **React Day Picker** - Date picker

## 🚀 Next Steps

The project is now clean, organized, and ready for development. All duplicate code has been removed, unused files deleted, and the structure is optimized for maintainability.
