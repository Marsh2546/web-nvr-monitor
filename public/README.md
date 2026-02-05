# CCTV Repair Notification Website - Public Assets

This folder contains static assets for the CCTV Repair Notification Website.

## Folder Structure:
- `images/` - Store all image files here
- `icons/` - Store icon files here  
- `logos/` - Store logo files here

## Usage:
Images in this folder can be imported in React components using relative paths from the public folder.

Example:
```typescript
// In React component
<img src="/logos/company-logo.png" alt="Company Logo" />
```

## Notes:
- All files in this folder will be available at the root URL
- Use absolute paths starting with `/` when referencing
- Optimize images for web before adding to this folder
