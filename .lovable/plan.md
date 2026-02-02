

# Settings Module Implementation

## Overview
Build a comprehensive Settings module for Group Admins to manage organization-wide configurations, master data lists (departments, cost centers), and view system audit logs.

---

## Architecture

### New Files to Create

| File | Purpose |
|------|---------|
| `src/pages/Settings.tsx` | Main settings page with tabbed interface |
| `src/hooks/useSettings.ts` | Hook for fetching/updating settings data |
| `src/components/settings/GeneralSettings.tsx` | Organization info and defaults |
| `src/components/settings/DepartmentSettings.tsx` | Manage departments list |
| `src/components/settings/CostCenterSettings.tsx` | Manage cost centers list |
| `src/components/settings/AuditLogs.tsx` | View system audit trail |
| `src/components/settings/DepartmentDialog.tsx` | Add/edit department dialog |
| `src/components/settings/CostCenterDialog.tsx` | Add/edit cost center dialog |

### Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add `/settings` route |

### Database Migration

Create two new tables to properly manage departments and cost centers:

```sql
-- Departments table
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Cost Centers table  
CREATE TABLE public.cost_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  department_id UUID REFERENCES departments(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- System Settings (key-value store for org settings)
CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- RLS Policies
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Read access for all authenticated users
CREATE POLICY "Authenticated users can read departments" 
  ON departments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read cost_centers" 
  ON cost_centers FOR SELECT TO authenticated USING (true);

-- Write access only for admins
CREATE POLICY "Admins can manage departments" 
  ON departments FOR ALL TO authenticated 
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage cost_centers" 
  ON cost_centers FOR ALL TO authenticated 
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage system_settings" 
  ON system_settings FOR ALL TO authenticated 
  USING (public.is_admin(auth.uid()));
```

---

## Settings Sections

### 1. General Settings Tab
- **Organization Name**: Company display name
- **Default Location**: Pre-selected location for new requests
- **Request Number Prefix**: Customize TR prefix (e.g., "LGH-")
- **Timezone**: System timezone setting
- **Date Format**: DD/MM/YYYY or MM/DD/YYYY

### 2. Departments Tab
- Full CRUD for departments list
- Table with columns: Name, Code, Status, Actions
- Used in user profiles and request filtering
- Bulk import/export capability

### 3. Cost Centers Tab
- Full CRUD for cost centers
- Link cost centers to departments (optional)
- Table with columns: Code, Name, Department, Status, Actions
- Used for expense tracking and reporting

### 4. Audit Logs Tab
- Read-only view of system activities
- Filters: Date range, Action type, User, Table
- Columns: Timestamp, User, Action, Table, Record, Changes
- Export to CSV option

---

## UI Design

### Main Settings Page Layout

```text
+--------------------------------------------------+
|  Settings                                         |
|  Configure system preferences and master data     |
+--------------------------------------------------+
|                                                   |
|  [General] [Departments] [Cost Centers] [Audit]   |
|  ────────────────────────────────────────────────|
|                                                   |
|  ┌─────────────────────────────────────────────┐ |
|  │  Tab Content Area                           │ |
|  │                                             │ |
|  │  (Forms, Tables, or Logs depending on tab) │ |
|  │                                             │ |
|  └─────────────────────────────────────────────┘ |
|                                                   |
+--------------------------------------------------+
```

### General Settings Tab

```text
┌─────────────────────────────────────────────────┐
│  Organization Settings                          │
│  ─────────────────────────────────────────────  │
│                                                 │
│  Organization Name    [LGH Fleet Management  ] │
│  Request Prefix       [TR-                   ] │
│  Default Location     [Select location    ▼  ] │
│                                                 │
│                              [Save Changes]    │
└─────────────────────────────────────────────────┘
```

### Departments Tab

```text
┌─────────────────────────────────────────────────┐
│  Departments                    [+ Add Dept]    │
│  ─────────────────────────────────────────────  │
│  ┌───────────────────────────────────────────┐  │
│  │ Name           │ Code  │ Status │ Actions │  │
│  ├───────────────────────────────────────────│  │
│  │ IT Department  │ IT    │ Active │  ⋮      │  │
│  │ HR Department  │ HR    │ Active │  ⋮      │  │
│  │ Finance        │ FIN   │ Active │  ⋮      │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Audit Logs Tab

```text
┌─────────────────────────────────────────────────┐
│  Audit Trail                    [Export CSV]    │
│  ─────────────────────────────────────────────  │
│  [Date Range: Last 7 days ▼] [Action ▼] [User▼] │
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │ Time      │ User  │ Action │ Table │ Desc │  │
│  ├───────────────────────────────────────────│  │
│  │ 2m ago    │ Admin │ UPDATE │ users │ ...  │  │
│  │ 15m ago   │ Admin │ CREATE │ vehic │ ...  │  │
│  │ 1h ago    │ Coord │ UPDATE │ alloc │ ...  │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## Component Structure

```text
Settings.tsx
├── Tabs
│   ├── GeneralSettings
│   │   └── Form (org name, defaults)
│   ├── DepartmentSettings
│   │   ├── Search + Add Button
│   │   ├── DataTable
│   │   └── DepartmentDialog (create/edit)
│   ├── CostCenterSettings
│   │   ├── Search + Add Button
│   │   ├── DataTable
│   │   └── CostCenterDialog (create/edit)
│   └── AuditLogs
│       ├── Filters (date, action, user)
│       ├── DataTable
│       └── Export Button
```

---

## Technical Implementation

### Settings Hook

```typescript
// src/hooks/useSettings.ts
export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data } = await supabase
        .from('departments')
        .select('*')
        .order('name');
      return data;
    }
  });
}

export function useCostCenters() {
  return useQuery({
    queryKey: ['cost_centers'],
    queryFn: async () => {
      const { data } = await supabase
        .from('cost_centers')
        .select('*, department:departments(name)')
        .order('code');
      return data;
    }
  });
}

export function useAuditLogs(filters: AuditFilters) {
  return useQuery({
    queryKey: ['audit_logs', filters],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters.action) {
        query = query.eq('action', filters.action);
      }
      
      const { data } = await query;
      return data;
    }
  });
}
```

### Mutation Hooks

```typescript
export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dept: { name: string; code?: string }) => {
      const { data, error } = await supabase
        .from('departments')
        .insert(dept)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Department created');
    }
  });
}
```

---

## Access Control

- Settings page: `group_admin` only (already configured in DashboardLayout)
- Departments/Cost Centers: Read by all authenticated, write by admin
- Audit Logs: Read by admin only
- System Settings: Read/write by admin only

---

## Implementation Phases

### Phase 1: Foundation
1. Create database migration for departments, cost_centers, system_settings tables
2. Create `Settings.tsx` page with tab structure
3. Add `/settings` route to App.tsx
4. Create `useSettings.ts` hook with basic queries

### Phase 2: Departments & Cost Centers
1. Implement `DepartmentSettings.tsx` with CRUD table
2. Implement `CostCenterSettings.tsx` with CRUD table
3. Create dialog components for add/edit

### Phase 3: General Settings & Audit
1. Implement `GeneralSettings.tsx` with org config form
2. Implement `AuditLogs.tsx` with filtering and table
3. Add CSV export for audit logs

### Phase 4: Integration
1. Update user creation to use departments dropdown
2. Update request forms to use cost centers dropdown
3. Add empty states and loading states

---

## Testing Checklist

1. Verify only group_admin can access Settings page
2. Test creating, editing, and deactivating departments
3. Test creating cost centers linked to departments
4. Verify audit logs display with proper filtering
5. Test CSV export functionality
6. Verify departments/cost centers appear in related forms

