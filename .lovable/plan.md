
# Fix Public Form Links 404 Error & Add Required Fields

## Problem Analysis

1. **404 Error**: The public form link route (`/request/:token`) is correctly defined in React Router, but when accessing the published domain directly with a path like `/request/abc123`, the hosting server returns a 404 because it's not configured for SPA client-side routing.

2. **Missing Fields**: The form currently has optional phone field and no employee ID field. Need to add employee ID and make both compulsory.

---

## Solution

### 1. Fix 404 Error - Add Public Route Fallback

The hosting server needs to serve `index.html` for all routes so React Router can handle them. For Lovable/Vite projects, we need to add:
- A `public/_redirects` file (for Netlify-style hosting)
- Or ensure the `index.html` serves all routes

Since Lovable uses its own hosting, the simplest fix is to ensure the app is **published** after changes. But to handle this properly, we should also add a fallback catch in the Vite config.

### 2. Database Migration - Add Employee ID

Add a new column `guest_employee_id` to the `travel_requests` table.

```sql
ALTER TABLE travel_requests 
  ADD COLUMN guest_employee_id TEXT;
```

### 3. Update Public Request Form

Modify `src/pages/PublicRequestForm.tsx`:
- Add `guest_employee_id` field (required)
- Make `guest_phone` required instead of optional
- Update form schema and UI

### 4. Update Edge Function

Modify `supabase/functions/submit-public-request/index.ts`:
- Add validation for employee ID and phone
- Store `guest_employee_id` in the database

---

## Files to Create/Modify

| File | Action | Changes |
|------|--------|---------|
| `supabase/migrations/xxx.sql` | Create | Add `guest_employee_id` column |
| `src/pages/PublicRequestForm.tsx` | Modify | Add employee ID field, make phone required |
| `supabase/functions/submit-public-request/index.ts` | Modify | Add employee ID to insert, validate phone |
| `src/hooks/usePublicRequest.ts` | Modify | Add employee_id to GuestInfo interface |
| `public/_redirects` | Create | Add SPA routing fallback for published domain |

---

## Form Schema Changes

```typescript
// Before
guest_phone: z.string().optional(),

// After  
guest_phone: z.string().min(10, 'Phone number is required'),
guest_employee_id: z.string().min(1, 'Employee ID is required'),
```

---

## Updated Form UI

```text
┌───────────────────────────────────────────┐
│ Your Information                          │
│ ─────────────────────────────────────────│
│ Full Name *       [                     ] │
│ Employee ID *     [                     ] │
│ Email *           [                     ] │
│ Phone *           [                     ] │
└───────────────────────────────────────────┘
```

All four fields will be marked as required with asterisks and validation.

---

## Testing Checklist

1. Publish the app after changes
2. Copy a form link from Settings > Form Links
3. Open the link in an incognito browser window
4. Verify form loads without 404 error
5. Try to submit without required fields - should show validation errors
6. Submit with all fields filled - should succeed
