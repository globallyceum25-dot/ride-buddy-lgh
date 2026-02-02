

# Fix Public Form Links 404 Error

## Root Cause

The `_redirects` file (Netlify-style) may not be supported by Lovable's hosting infrastructure. When a user visits `https://ride-buddy-lgh.lovable.app/request/abc123` directly, the server doesn't know to serve `index.html` for client-side routing.

## Solution: Use HashRouter

The most reliable fix that works regardless of hosting configuration is to use `HashRouter` instead of `BrowserRouter`. This changes URLs from:
- `https://domain.com/request/abc123` 
- to `https://domain.com/#/request/abc123`

Hash-based URLs work because everything after `#` is handled client-side and never sent to the server.

## Changes Required

| File | Change |
|------|--------|
| `src/App.tsx` | Replace `BrowserRouter` with `HashRouter` |
| `src/components/settings/PublicFormLinks.tsx` | Update URL generation to include `#` |

## Code Changes

### 1. src/App.tsx
```typescript
// Change import
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";

// Change component
<HashRouter>
  <Routes>
    ...
  </Routes>
</HashRouter>
```

### 2. src/components/settings/PublicFormLinks.tsx
```typescript
const getPublicUrl = (token: string) => {
  return `${publishedDomain}/#/request/${token}`;
};
```

## Alternative: Keep BrowserRouter (if preferred)

If you prefer cleaner URLs without the `#`, we can try adding a `vercel.json` configuration file or contact Lovable support about SPA routing configuration for the published domain.

## After Implementation

1. Publish the app after changes
2. Generate a new form link (it will now include `/#/`)
3. Test the link in an incognito browser - it should work without 404

