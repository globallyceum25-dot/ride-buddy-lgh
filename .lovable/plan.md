

# Allow User Creation by Email or Phone Number

## Current State
The system only supports creating users via email + password. The edge function and form both require an email address. Supabase Auth supports phone-based authentication natively via `admin.createUser({ phone, password })`.

## Approach
Add an "identifier type" toggle (Email / Phone) to the create user form. When "Phone" is selected, the email field is replaced with a phone field, and Supabase creates the user with phone as the primary identifier. A generated placeholder email is stored in the profile for display purposes.

## Changes

### 1. `src/components/users/CreateUserDialog.tsx`
- Add a toggle/radio group at the top: "Create by Email" vs "Create by Phone"
- Use a discriminated zod schema:
  - Email mode: requires `email` (valid email) + `password`
  - Phone mode: requires `phone` (required, E.164 format) + `password`; email becomes optional
- Conditionally render the email or phone field as the primary identifier
- Pass `identifier_type: 'email' | 'phone'` to the mutation

### 2. `src/hooks/useUsers.ts`
- Update `CreateUserData` interface to include `identifier_type?: 'email' | 'phone'`
- Pass `identifier_type` to the edge function payload

### 3. `supabase/functions/admin-create-user/index.ts`
- Accept `identifier_type` field (default: `'email'`)
- When `identifier_type === 'phone'`:
  - Validate phone is present and in E.164 format
  - Call `admin.createUser({ phone, password, phone_confirm: true, email (optional), user_metadata })`
  - If no email provided, generate a placeholder like `phone_<sanitized>@noemail.local` for the profile
- When `identifier_type === 'email'` (default): keep current behavior unchanged
- Update validation to make email optional when identifier_type is phone

### 4. Supabase Auth Config
- Phone auth provider must be enabled in the Supabase dashboard for phone-based users to log in. The user creation via admin API will work regardless, but login requires the provider to be enabled.

## UI Preview
```text
┌─ Create New User ──────────────────┐
│                                    │
│  Create by:  (●) Email  ( ) Phone  │
│                                    │
│  Email *         [user@example.com]│  ← shown in email mode
│  -- OR --                          │
│  Phone Number *  [+94771234567   ] │  ← shown in phone mode
│  Email (optional)[              ]  │
│                                    │
│  Temporary Password * [••••••••]   │
│  Full Name *      [John Doe     ]  │
│  ...rest of form unchanged...      │
└────────────────────────────────────┘
```

## Files to modify
| File | Change |
|------|--------|
| `src/components/users/CreateUserDialog.tsx` | Add identifier type toggle, conditional fields |
| `src/hooks/useUsers.ts` | Add `identifier_type` to `CreateUserData` |
| `supabase/functions/admin-create-user/index.ts` | Support phone-based user creation |

