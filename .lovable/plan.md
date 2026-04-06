

# Auto-Generate Temporary Password on User Creation

## Approach
Remove the password field from the form entirely. Generate a cryptographically secure temporary password server-side in the edge function, return it in the response, and display it to the admin in a confirmation dialog with a copy button. This follows NIST SP 800-63B guidelines (server-generated initial secrets, forced change on first login).

## Changes

### 1. `supabase/functions/admin-create-user/index.ts`
- Remove `password` from required fields validation
- Generate a 16-character password server-side using `crypto.getRandomValues()` with uppercase, lowercase, digits, and symbols (meets OWASP complexity requirements)
- Return the generated password in the response so the admin can share it with the user

### 2. `src/components/users/CreateUserDialog.tsx`
- Remove the password field from both `emailSchema` and `phoneSchema`
- Remove the password `<Input>` from the form
- After successful creation, show a confirmation dialog displaying the generated password with a "Copy to Clipboard" button and a warning that it won't be shown again
- Remove `password` from the mutation payload

### 3. `src/hooks/useUsers.ts`
- Remove `password` from `CreateUserData` type
- Update the mutation call to not send password

## Password Generation (server-side)
```
Characters: A-Z, a-z, 0-9, !@#$%&*
Length: 16 characters
Method: crypto.getRandomValues() (CSPRNG)
Guarantees: At least 1 uppercase, 1 lowercase, 1 digit, 1 symbol
```

## UX Flow
1. Admin fills form (no password field)
2. Clicks "Create User"
3. Edge function generates password, creates user, returns password
4. Dialog shows: "User created successfully. Temporary password: `••••••••` [Copy] [Show]"
5. Admin copies and shares password securely with the user

## Files to modify
| File | Change |
|------|--------|
| `supabase/functions/admin-create-user/index.ts` | Generate password server-side, return in response |
| `src/components/users/CreateUserDialog.tsx` | Remove password field, add post-creation password display |
| `src/hooks/useUsers.ts` | Remove password from CreateUserData type |

