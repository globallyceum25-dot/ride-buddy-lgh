
# User Management Page - Implementation Plan

## Overview
Create a comprehensive user management interface that allows Group Admins to create new user accounts, view all users, edit profiles, and manage role assignments.

---

## Architecture

### Backend: Supabase Edge Function
Since user creation requires the Admin API (service role key), we need an edge function to securely create users.

**Function: `admin-create-user`**
- Validates that the caller is a group_admin (using JWT verification)
- Creates auth user with `supabase.auth.admin.createUser()`
- The existing database trigger `handle_new_user` auto-creates the profile
- Inserts role assignments to `user_roles` table
- Optionally assigns primary location

### Frontend Components

```text
src/
├── pages/
│   └── Users.tsx                    # Main user management page
├── components/
│   └── users/
│       ├── CreateUserDialog.tsx     # Create user form (calls edge function)
│       ├── EditUserDialog.tsx       # Edit profile form
│       └── RoleManagementDialog.tsx # Role assignment dialog
└── hooks/
    └── useUsers.ts                  # React Query hooks
```

---

## Database Considerations

**No schema changes required** - existing tables support all features:
- `profiles` - User profile data
- `user_roles` - Role assignments (separate table as required)
- `user_locations` - Location assignments

**RLS policies already in place:**
- Group admins can manage all profiles, roles, and location assignments
- Users can view their own data

---

## Implementation Details

### 1. Edge Function: `admin-create-user`

**Request Body:**
```typescript
{
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  employee_id?: string;
  department?: string;
  cost_center?: string;
  roles: AppRole[];           // Array of roles to assign
  primary_location_id?: string;
}
```

**Security:**
- Verifies JWT token from Authorization header
- Checks caller has `group_admin` role using `is_admin()` database function
- Returns 403 if unauthorized

**Process:**
1. Validate request body with zod
2. Create auth user with `supabase.auth.admin.createUser()`
3. Update profile with additional fields (trigger creates basic profile)
4. Insert roles into `user_roles` table
5. Insert location assignment to `user_locations` if provided
6. Return created user data

### 2. React Query Hook: `useUsers.ts`

**Queries:**
- `useUsers()` - Fetch all users with profiles, roles, and locations
  - Joins: profiles + user_roles + user_locations + locations
  - Returns aggregated data per user

**Mutations:**
- `useCreateUser()` - Calls edge function to create user
- `useUpdateProfile()` - Updates profile via Supabase client
- `useAddUserRole()` - Inserts role into user_roles
- `useRemoveUserRole()` - Deletes role from user_roles
- `useToggleUserActive()` - Sets is_active on profile

### 3. Users Page: `src/pages/Users.tsx`

**Features:**
- Data table with columns: Name, Email, Roles, Location, Department, Status, Actions
- Search by name, email, or employee ID
- Filter by role (dropdown)
- Filter by status (active/inactive)
- Add User button opens CreateUserDialog
- Row actions: Edit, Manage Roles, Deactivate/Reactivate

**Empty State:**
- Icon, message, and CTA to add first user

### 4. CreateUserDialog Component

**Form Fields (with zod validation):**
- Email (required, valid email format)
- Temporary Password (required, min 8 chars)
- Full Name (required)
- Phone (optional)
- Employee ID (optional)
- Department (optional)
- Cost Center (optional)
- Roles (multi-select checkboxes)
- Primary Location (dropdown from locations)

**Behavior:**
- Calls edge function on submit
- Shows loading state
- Displays success/error toast
- Closes and refreshes user list on success

### 5. EditUserDialog Component

**Form Fields:**
- Full Name, Phone, Employee ID, Department, Cost Center
- Active toggle (for deactivation)
- Note: Email cannot be changed (auth identifier)

**Behavior:**
- Pre-populates with existing data
- Updates directly via Supabase client (RLS allows group_admin)
- Shows toast on success/error

### 6. RoleManagementDialog Component

**Display:**
- User name and email at top
- List of all available roles with checkboxes
- Current roles are pre-checked

**Behavior:**
- Toggle roles on/off immediately (optimistic updates)
- Direct insert/delete on user_roles table
- Shows role descriptions for clarity

---

## Route Registration

Add to `src/App.tsx`:
```tsx
<Route
  path="/users"
  element={
    <ProtectedRoute allowedRoles={['group_admin']}>
      <Users />
    </ProtectedRoute>
  }
/>
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/admin-create-user/index.ts` | Edge function for secure user creation |
| `src/pages/Users.tsx` | Main user management page |
| `src/hooks/useUsers.ts` | React Query data hooks |
| `src/components/users/CreateUserDialog.tsx` | Create user form dialog |
| `src/components/users/EditUserDialog.tsx` | Edit profile dialog |
| `src/components/users/RoleManagementDialog.tsx` | Role assignment dialog |

## Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add `/users` protected route |

---

## Security Checklist

- Edge function validates admin role server-side (not client-side)
- Service role key only used in edge function (never exposed to client)
- All client-side operations go through RLS-protected tables
- Input validation with zod on both client and server
- No sensitive data logged to console
- Password requirements enforced (min 8 characters)

---

## UI/UX Notes

- Follow existing patterns from Locations/Vehicles pages
- Use StatusBadge component for active/inactive status
- Role badges with distinct colors (already defined in DashboardLayout)
- Clear empty states with helpful CTAs
- Toast notifications for all actions
- Loading states during async operations
