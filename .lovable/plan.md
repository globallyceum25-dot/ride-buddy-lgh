

# Fix Public Form Link for External Access

## Problem Identified
The public request form is technically accessible without login, but:
1. The "Copy Link" button generates the **preview URL** (e.g., `id-preview--xxx.lovable.app`) instead of the **published domain** (`ride-buddy-lgh.lovable.app`)
2. External users should receive a link using the published/custom domain

## Solution

### Update Link Generation in PublicFormLinks.tsx
Modify the `getPublicUrl` function to use the published domain instead of `window.location.origin`:

```typescript
const getPublicUrl = (token: string) => {
  // Use published domain for shareable links
  const baseUrl = import.meta.env.PROD 
    ? window.location.origin 
    : 'https://ride-buddy-lgh.lovable.app';
  return `${baseUrl}/request/${token}`;
};
```

Alternatively, add a hardcoded published domain or allow admins to configure it:

```typescript
const PUBLISHED_DOMAIN = 'https://ride-buddy-lgh.lovable.app';

const getPublicUrl = (token: string) => {
  return `${PUBLISHED_DOMAIN}/request/${token}`;
};
```

### Changes Required

| File | Change |
|------|--------|
| `src/components/settings/PublicFormLinks.tsx` | Update `getPublicUrl()` to use published domain |

### Testing Steps
1. Create a form link in Settings
2. Copy the link using the "Copy" button
3. Verify the link uses the published domain (not preview)
4. Open the link in an incognito browser window
5. Confirm the form loads without requiring login
6. Submit a test request and verify it appears in the system

---

## Technical Notes

The current implementation is functionally correct:
- Route `/request/:token` is correctly configured as a public route (outside ProtectedRoute)
- RLS policy `"Public can read active links"` allows anonymous SELECT access
- Edge function `submit-public-request` has `verify_jwt = false` and uses service role key
- Form submission works without authentication

The only fix needed is ensuring the copied link points to the published domain.

