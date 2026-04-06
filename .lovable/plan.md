

# Regenerate Temporary Password for Existing Users

## Summary
Add a "Reset Password" action to the Users page dropdown menu that calls a new edge function to generate a fresh temporary password server-side and displays it to the admin in a secure dialog.

## Changes

### 1. New Edge Function: `supabase/functions/reset-user-password/index.ts`
- Accepts `{ user_id: string }` in the request body
- Validates JWT, checks caller is `group_admin` (same pattern as `admin-create-user`)
- Uses `adminClient.auth.admin.updateUserById(user_id, { password: newPassword })` to set a new CSPRNG 16-character password
- Returns `{ temporary_password }` in the response
- Reuses the same `generateSecurePassword()` logic from `admin-create-user`

### 2. `src/hooks/useUsers.ts`
- Add `useResetUserPassword()` mutation hook that invokes the new edge function and returns the generated password

### 3. `src/pages/Users.tsx`
- Add a `KeyRound` icon "Reset Password" item to the user action dropdown menu
- On click, show a confirmation dialog ("Are you sure you want to reset this user's password?")
- On confirm, call the mutation; on success, show the same secure password display dialog used in `CreateUserDialog` (with copy/show/hide and "won't be shown again" warning)

### 4. Fix existing build errors (while editing these files)
- `src/components/settings/PublicFormLinks.tsx` line 184: cast `unknown` to `ReactNode`
- `src/hooks/useChangeRequests.ts` line 135: fix the insert call shape

## Files to modify/create
| File | Change |
|------|--------|
| `supabase/functions/reset-user-password/index.ts` | New edge function |
| `src/hooks/useUsers.ts` | Add `useResetUserPassword()` hook |
| `src/pages/Users.tsx` | Add reset password action + confirmation/display dialogs |
| `src/components/settings/PublicFormLinks.tsx` | Fix TS2322 build error |
| `src/hooks/useChangeRequests.ts` | Fix TS2769 build error |

