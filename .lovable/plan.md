
# Public Request Form Implementation

## Overview
Create a shareable link system that allows external users (guests) to submit travel requests without logging in. Admins can generate unique form links with configurable settings like default approver and expiry date.

---

## Architecture

### New Files to Create

| File | Purpose |
|------|---------|
| `src/pages/PublicRequestForm.tsx` | Public-facing request submission page |
| `src/hooks/usePublicRequest.ts` | Hook for public form data and submission |
| `src/components/settings/PublicFormLinks.tsx` | Admin UI to manage shareable links |
| `src/components/settings/CreateFormLinkDialog.tsx` | Dialog to create new form links |
| `supabase/functions/submit-public-request/index.ts` | Edge function to handle public submissions |

### Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add public route `/request/:token` |
| `src/pages/Settings.tsx` | Add "Form Links" tab |

---

## Database Changes

### New Table: `public_form_links`

```sql
CREATE TABLE public.public_form_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  name TEXT NOT NULL,
  description TEXT,
  default_approver_id UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  submission_count INTEGER DEFAULT 0
);

-- RLS Policies
ALTER TABLE public_form_links ENABLE ROW LEVEL SECURITY;

-- Admins can manage links
CREATE POLICY "Admins can manage form links" 
  ON public_form_links FOR ALL TO authenticated 
  USING (public.is_admin(auth.uid()));

-- Anyone can read active non-expired links (for public form validation)
CREATE POLICY "Public can read active links" 
  ON public_form_links FOR SELECT TO anon
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));
```

### Modify `travel_requests` Table

Add fields for guest requester info:

```sql
ALTER TABLE travel_requests 
  ADD COLUMN guest_name TEXT,
  ADD COLUMN guest_email TEXT,
  ADD COLUMN guest_phone TEXT,
  ADD COLUMN form_link_id UUID REFERENCES public_form_links(id),
  ADD COLUMN is_guest_request BOOLEAN DEFAULT false;
```

### RLS Policy for Public Submissions

```sql
-- Allow anon users to insert requests via public form
CREATE POLICY "Allow public request submissions"
  ON travel_requests FOR INSERT TO anon
  WITH CHECK (is_guest_request = true AND form_link_id IS NOT NULL);
```

---

## User Flow

### Admin Creates Form Link

```text
Settings > Form Links > Create New Link
    ↓
┌─────────────────────────────────────┐
│  Create Shareable Form Link         │
│  ─────────────────────────────────  │
│  Name:        [Department Request ] │
│  Description: [For HR department  ] │
│  Approver:    [Select approver  ▼ ] │
│  Expires:     [Optional date      ] │
│                                     │
│              [Create Link]          │
└─────────────────────────────────────┘
    ↓
Link Generated: https://app.com/request/a1b2c3d4e5f6
    ↓
Admin shares link via email/chat
```

### Guest Submits Request

```text
Guest opens shared link
    ↓
┌─────────────────────────────────────┐
│  🚗 Travel Request Form             │
│  Submit a travel request            │
│  ─────────────────────────────────  │
│                                     │
│  Your Information                   │
│  Name:  [John Doe              ]    │
│  Email: [john@example.com      ]    │
│  Phone: [+1 234 567 8900       ]    │
│                                     │
│  Trip Details                       │
│  (Same fields as internal form)     │
│                                     │
│  [Submit Request]                   │
└─────────────────────────────────────┘
    ↓
Success: "Request TR-2026-0045 submitted!"
    ↓
Email notification sent to approver
```

---

## Component Structure

### PublicRequestForm.tsx

```text
PublicRequestForm
├── Token Validation (check link exists & active)
├── Error States (expired, invalid, inactive)
├── Guest Info Section
│   ├── Name (required)
│   ├── Email (required)
│   └── Phone (optional)
├── Trip Details Section
│   ├── Trip Type
│   ├── Pickup/Dropoff locations
│   ├── Date/Time pickers
│   ├── Purpose
│   └── Passenger count
├── Passenger Details (optional)
└── Submit Button → Edge Function
```

### Admin Form Links Management

```text
Settings > Form Links Tab
├── Create Link Button
├── Active Links Table
│   ├── Name
│   ├── Link URL (copy button)
│   ├── Submissions count
│   ├── Expiry status
│   └── Actions (edit, deactivate, delete)
└── CreateFormLinkDialog
```

---

## Edge Function: submit-public-request

```typescript
// supabase/functions/submit-public-request/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const { token, requestData, guestInfo } = await req.json();

  // Use service role to bypass RLS
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // 1. Validate form link
  const { data: formLink } = await supabase
    .from('public_form_links')
    .select('*')
    .eq('token', token)
    .eq('is_active', true)
    .maybeSingle();

  if (!formLink) {
    return new Response(JSON.stringify({ error: 'Invalid or expired link' }), {
      status: 400
    });
  }

  // 2. Create travel request
  const { data: request, error } = await supabase
    .from('travel_requests')
    .insert({
      ...requestData,
      guest_name: guestInfo.name,
      guest_email: guestInfo.email,
      guest_phone: guestInfo.phone,
      form_link_id: formLink.id,
      is_guest_request: true,
      requester_id: formLink.created_by, // Link creator is the "owner"
      approver_id: formLink.default_approver_id,
      status: 'pending_approval',
    })
    .select('request_number')
    .single();

  // 3. Increment submission count
  await supabase.rpc('increment_form_submissions', { link_id: formLink.id });

  // 4. Log to history
  await supabase.from('request_history').insert({
    request_id: request.id,
    action: 'Public request submitted',
    to_status: 'pending_approval',
    notes: `Submitted by ${guestInfo.name} (${guestInfo.email})`,
  });

  return new Response(JSON.stringify({ 
    success: true, 
    requestNumber: request.request_number 
  }));
});
```

---

## UI Design

### Public Form Page

```text
┌─────────────────────────────────────────────────┐
│  🚗 Fleet Management                            │
│  Travel Request Form                            │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │ Your Information                          │  │
│  │ ─────────────────────────────────────────│  │
│  │ Full Name *    [                        ] │  │
│  │ Email *        [                        ] │  │
│  │ Phone          [                        ] │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │ Trip Details                              │  │
│  │ ─────────────────────────────────────────│  │
│  │ Trip Type      [One Way            ▼   ] │  │
│  │ Pickup         [Enter address          ] │  │
│  │ Pickup Date    [Select date         📅 ] │  │
│  │ Pickup Time    [09:00                  ] │  │
│  │ Destination    [Enter address          ] │  │
│  │ Purpose *      [Business purpose       ] │  │
│  │ Passengers     [1                      ] │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│           [Submit Request]                      │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Form Links Management (Settings)

```text
┌─────────────────────────────────────────────────┐
│  Form Links                    [+ Create Link]  │
│  ─────────────────────────────────────────────  │
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │ Name      │ URL        │ Subs │ Exp │ Act │  │
│  ├───────────────────────────────────────────│  │
│  │ HR Dept   │ [📋 Copy]  │  12  │ --  │ ✓  │  │
│  │ External  │ [📋 Copy]  │  45  │ 7d  │ ✓  │  │
│  │ Event     │ [📋 Copy]  │  8   │ Exp │ ✗  │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Database & Backend
1. Create `public_form_links` table with migration
2. Add guest fields to `travel_requests` table
3. Create `submit-public-request` edge function
4. Add RLS policies for public access

### Phase 2: Public Form
1. Create `PublicRequestForm.tsx` page
2. Create `usePublicRequest.ts` hook
3. Add public route to `App.tsx`
4. Implement form validation and submission

### Phase 3: Admin Management
1. Add "Form Links" tab to Settings page
2. Create `PublicFormLinks.tsx` component
3. Create `CreateFormLinkDialog.tsx` for link creation
4. Add copy-to-clipboard functionality

### Phase 4: Polish
1. Add success/confirmation page after submission
2. Add email notification to approver (optional)
3. Handle expired/invalid link errors gracefully
4. Add link usage analytics

---

## Security Considerations

1. **Token-based access**: Random 32-character hex tokens prevent guessing
2. **Expiry dates**: Links can be time-limited
3. **Rate limiting**: Edge function can implement submission limits
4. **Validation**: All inputs validated server-side
5. **No auth bypass**: Guest requests clearly marked, can't access internal data
6. **Audit trail**: All submissions logged with guest info

---

## Testing Checklist

1. Create a form link as admin
2. Open link in incognito (no auth)
3. Submit a request as guest
4. Verify request appears in admin's approval queue
5. Test expired link handling
6. Test deactivated link handling
7. Verify submission count increments
8. Test copy link functionality
