
# Link Public Form Links to Departments

## Overview

This feature will allow administrators to associate each public form link with a specific department. When a guest submits a request through a public link, the department association will be carried over to the travel request.

## Current State

- `public_form_links` table has no `department_id` column
- Public form links can specify a default approver but not a department
- Travel requests have a `cost_center` field (text) but rely on the requester's profile for department context
- Departments are managed in Settings with `id`, `name`, `code`, and `is_active` fields

## Implementation Plan

### 1. Database Schema Update

Add a `department_id` column to the `public_form_links` table:

| Column | Type | Description |
|--------|------|-------------|
| department_id | UUID (nullable) | Foreign key to departments table |

### 2. Update Create Form Link Dialog

Add a department selector in `CreateFormLinkDialog.tsx`:

```text
+------------------------------------------+
| Link Name *                              |
| [HR Department Requests        ]         |
+------------------------------------------+
| Department                               |
| [Select department           v]          |
|   - General Secretariat                  |
|   - Governance                           |
|   - IT Pillar                            |
+------------------------------------------+
| Default Approver                         |
| [Select an approver          v]          |
+------------------------------------------+
| Expiry Date                              |
| [No expiry                   v]          |
+------------------------------------------+
```

### 3. Update Public Form Links Table Display

Show the associated department in the links table:

| Name | Department | Link | Submissions | Expires | Status | Actions |
|------|------------|------|-------------|---------|--------|---------|

### 4. Update Hooks

**`usePublicRequest.ts`:**
- Add `department_id` to the create mutation input
- Include department in form links query with join

### 5. Update Edge Function (Optional Enhancement)

**`submit-public-request/index.ts`:**
- Fetch the department name from the linked department
- Store department info on the travel request (if department field exists) or in notes

### 6. Update Travel Request Submission

When a request is submitted via a public form link with a department, the department association can be:
- Stored in a notes/metadata field on the request
- Used for reporting and filtering purposes

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/migrations/` | Add `department_id` column to `public_form_links` |
| `src/integrations/supabase/types.ts` | Auto-regenerated after migration |
| `src/components/settings/CreateFormLinkDialog.tsx` | Add department selector |
| `src/components/settings/PublicFormLinks.tsx` | Display department column |
| `src/hooks/usePublicRequest.ts` | Include department in queries and mutations |
| `supabase/functions/submit-public-request/index.ts` | Pass department to request (optional) |

## Technical Details

### Database Migration

```sql
-- Add department_id to public_form_links
ALTER TABLE public.public_form_links
ADD COLUMN department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX idx_public_form_links_department ON public.public_form_links(department_id);
```

### Form Link Query with Department

```typescript
const { data, error } = await supabase
  .from('public_form_links')
  .select('*, department:departments(id, name, code)')
  .order('created_at', { ascending: false });
```

### Create Form Link with Department

```typescript
await supabase.from('public_form_links').insert({
  name: values.name,
  description: values.description,
  default_approver_id: values.default_approver_id,
  department_id: values.department_id, // NEW
  expires_at: values.expires_at,
  created_by: user.id,
});
```

### UI Component Update (CreateFormLinkDialog)

```typescript
// Add department field to form schema
department_id: z.string().optional(),

// Add departments query
const { data: departments } = useDepartments();

// Add department selector in form
<FormField
  name="department_id"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Department</FormLabel>
      <Select onValueChange={field.onChange} value={field.value}>
        <SelectTrigger>
          <SelectValue placeholder="Select department" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No department</SelectItem>
          {departments?.filter(d => d.is_active).map(dept => (
            <SelectItem key={dept.id} value={dept.id}>
              {dept.name} {dept.code && `(${dept.code})`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormItem>
  )}
/>
```

## Benefits

1. **Better Organization**: Links can be categorized by department
2. **Reporting**: Filter and analyze requests by department
3. **Access Control**: Future enhancement to restrict approvers by department
4. **Clarity**: Admins can quickly see which department each link serves
