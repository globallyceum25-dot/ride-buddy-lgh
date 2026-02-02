
# Fix Public Form Link Authentication Issue

## Problem Identified

When users navigate to `/request/:token` (public form link), they are being redirected to `/auth` even though this route is NOT wrapped in `ProtectedRoute`. Testing confirmed this - the browser shows the login page instead of the travel request form.

## Root Cause

The issue is likely related to how React Router handles the initial route during the auth loading state. When `isLoading` is `true` in the AuthContext, the app might be defaulting to the root path `/` which then redirects to `/dashboard`, triggering the ProtectedRoute redirect to `/auth`.

## Solution

Restructure the App to ensure public routes are rendered without any authentication checks blocking them.

### Changes Required

| File | Change |
|------|--------|
| `src/App.tsx` | Move public route outside of the main Routes block or add early-exit check |
| `src/pages/PublicRequestForm.tsx` | Add safeguard to prevent auth-related interference |

### Implementation

**Option 1 - Preferred: Render public form route independently**

Move the `/request/:token` route to render completely outside of any auth-dependent logic:

```tsx
const App = () => {
  const location = window.location.hash;
  
  // Handle public form route directly - no auth check needed
  if (location.startsWith('#/request/')) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <HashRouter>
            <Routes>
              <Route path="/request/:token" element={<PublicRequestForm />} />
              <Route path="*" element={<Navigate to="/request/" replace />} />
            </Routes>
          </HashRouter>
        </TooltipProvider>
      </QueryClientProvider>
    );
  }
  
  // Regular app with auth
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        ...existing routes...
      </AuthProvider>
    </QueryClientProvider>
  );
};
```

**Option 2 - Alternative: Add loading guard in PublicRequestForm**

Ensure the PublicRequestForm doesn't wait for auth state:

```tsx
export default function PublicRequestForm() {
  // Don't use any auth-related hooks
  const { token } = useParams<{ token: string }>();
  // ...rest of form logic
}
```

## Why This Fixes the Issue

1. The public form route is evaluated BEFORE any authentication logic runs
2. No dependency on AuthProvider's loading state
3. Users can access the form immediately without any redirects

## Testing Steps

1. Deploy changes
2. Open a public form link in incognito/private browsing
3. Verify the form loads without redirect to login
4. Submit a test request
5. Verify it's created in the database with guest information
