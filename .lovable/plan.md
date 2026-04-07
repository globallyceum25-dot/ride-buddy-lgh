

# Generate Shareable Request Links from the Requests Page

## Problem
The "Generate Public Form Link" feature currently lives only in **Settings > Public Form Links**, accessible only to admins. Regular users (requesters) cannot generate shareable links to let external guests submit travel requests on their behalf.

## Approach
Add a "Share Request Form" button on the Requests page that allows **admin users** to quickly generate a public form link without navigating to Settings. This reuses the existing `CreateFormLinkDialog` and `useCreateFormLink` hook, and displays the generated link with a copy button — all within the Requests page context.

Since public form links control who can submit requests to the organization (a security-sensitive action per OWASP A01), link generation remains restricted to admin users only. Non-admin users will not see the button.

## Changes

### 1. `src/pages/Requests.tsx`
- Import `useAuth` to check admin status, `Link2` icon from lucide-react
- Import `CreateFormLinkDialog` from settings
- Add a "Share Form Link" button next to the existing "New Request" button (visible to admins only)
- Add state for the dialog open/close
- After successful creation, show a toast with the generated link and a copy-to-clipboard action

### 2. `src/components/settings/CreateFormLinkDialog.tsx`
- Add an optional `onSuccess` callback prop so the Requests page can receive the created link data (token) and display it
- Currently the dialog calls `queryClient.invalidateQueries` and closes — extend to also call `onSuccess` with the created link

### 3. Add a `GeneratedLinkDisplay` inline component
- After link creation, show a small card/alert on the Requests page with:
  - The full shareable URL
  - A "Copy Link" button
  - Link name and expiry info
- Auto-dismiss after user copies or clicks away

## Security Considerations
- Only admins can generate links (enforced by RLS on `public_form_links` INSERT and by UI gating via `isAdmin()`)
- Generated tokens are cryptographically random (32-character hex from `gen_random_bytes(16)`)
- Links respect expiry dates and active/inactive status
- Guest submissions are validated against active, non-expired `form_link_id` via RLS

## Files to modify
| File | Change |
|------|--------|
| `src/pages/Requests.tsx` | Add "Share Form Link" button for admins, integrate CreateFormLinkDialog |
| `src/components/settings/CreateFormLinkDialog.tsx` | Add `onSuccess` callback prop |

