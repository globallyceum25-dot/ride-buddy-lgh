

# Tighten Security to International Standards

This plan addresses all 7 findings from the security scan, covering OWASP Top 10 categories: broken access control, injection, security misconfiguration, and audit integrity.

## Changes Overview

### 1. Fix Build Errors (TypeScript `error` is `unknown`)
- **`send-notification/index.ts` line 212**: Change `error.message` to `(error as Error).message`
- **`telegram-webhook/index.ts` line 97**: Same fix

### 2. Fix RLS: Drivers & Vehicles Exposed to Anonymous Users (CRITICAL)
**Migration** to drop and recreate policies scoped to `authenticated` instead of `public`:
```sql
DROP POLICY "Authenticated users can view active drivers" ON drivers;
DROP POLICY "Drivers can view their own record" ON drivers;
DROP POLICY "Admins can manage drivers" ON drivers;
CREATE POLICY "Authenticated users can view active drivers" ON drivers FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Drivers can view their own record" ON drivers FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage drivers" ON drivers FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

DROP POLICY "Authenticated users can view active vehicles" ON vehicles;
DROP POLICY "Admins can manage vehicles" ON vehicles;
CREATE POLICY "Authenticated users can view active vehicles" ON vehicles FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Admins can manage vehicles" ON vehicles FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
```

### 3. Fix send-notification: Add JWT Validation (CRITICAL)
Currently only checks `Bearer ` prefix. Add proper JWT validation:
- Create a user client with the caller's auth header
- Call `getClaims(token)` to verify the JWT is valid
- Reject if no valid user — prevents phishing via anon key

### 4. Fix request_history & audit_logs: Tighten INSERT Policies
**Migration**:
- `request_history`: Change from `{public}` to `{authenticated}`, add ownership check (user must be requester, approver, or admin of the referenced request)
- `audit_logs`: Remove `user_id IS NULL` branch — require `user_id = auth.uid()`

### 5. Fix request_stops: Scope Guest Stop Insertion
**Migration**: Drop the overly permissive `"Allow stops for guest requests"` policy on `request_stops`. The `submit-public-request` edge function already uses the service-role key to insert stops, so this anon policy is unnecessary.

### 6. Fix user_roles: Ensure No Self-Assignment
The current `ALL` policy for group_admin is correct, but add an explicit DENY for non-admins:
- Add a restrictive INSERT policy: only group_admins can insert roles (already covered by ALL policy, but make it explicit by ensuring no other path exists)

### 7. Telegram Webhook: Add Bot Token Verification
Validate incoming requests by checking a secret header or comparing the bot token, preventing spoofed webhook calls.

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/send-notification/index.ts` | Add JWT validation via `getClaims()`, fix `error` type |
| `supabase/functions/telegram-webhook/index.ts` | Add webhook secret verification, fix `error` type |
| Migration SQL | Fix 6 RLS policies across `drivers`, `vehicles`, `request_history`, `audit_logs`, `request_stops` |

## What This Achieves
- OWASP A01 (Broken Access Control): All anonymous data exposure eliminated
- OWASP A04 (Insecure Design): Notification phishing vector closed
- OWASP A07 (Authentication Failures): JWT properly validated in all edge functions
- OWASP A09 (Logging/Monitoring): Audit trail integrity restored

