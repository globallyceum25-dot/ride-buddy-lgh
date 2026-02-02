
# Add Multi-Stop Locations Feature

## Overview

When users select "Multi Stop" as the trip type, they should be able to add multiple intermediate stops between the pickup and final destination. This feature needs to be implemented in both the internal request form (for authenticated users) and the public request form (for guest users).

## Current State

- Both forms (`RequestDialog.tsx` and `PublicRequestForm.tsx`) allow selecting "Multi Stop" as a trip type
- No UI exists to add intermediate stops
- No database structure exists to store stops

## Implementation Plan

### 1. Database Schema

Create a new table to store intermediate stops for multi-stop trips:

```text
request_stops
├── id (UUID, Primary Key)
├── request_id (UUID, Foreign Key → travel_requests)
├── location (TEXT, the stop address)
├── stop_order (INTEGER, sequence of stops)
└── created_at (TIMESTAMPTZ)
```

### 2. Update Internal Request Form (`RequestDialog.tsx`)

Add a "Stops" section that appears when `trip_type === 'multi_stop'`:

| Element | Description |
|---------|-------------|
| Stops Section | Appears between Pickup and Dropoff fields |
| Add Stop Button | Button to add a new intermediate stop |
| Stop Input | Text input for each stop location |
| Remove Button | Trash icon to remove a stop |
| Stop Order | Automatic numbering (Stop 1, Stop 2, etc.) |

**UI Flow:**
```text
┌─────────────────────────────────────┐
│ Trip Type: [Multi Stop ▼]           │
├─────────────────────────────────────┤
│ Pickup Location: [___________]      │
├─────────────────────────────────────┤
│ Intermediate Stops        [+ Add]   │
│ ┌─────────────────────────────────┐ │
│ │ Stop 1: [Location A    ] [🗑]   │ │
│ │ Stop 2: [Location B    ] [🗑]   │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ Final Destination: [___________]    │
└─────────────────────────────────────┘
```

### 3. Update Public Request Form (`PublicRequestForm.tsx`)

Same UI pattern as the internal form - show stops section when multi_stop is selected.

### 4. Update Hooks and Submission Logic

**`useRequests.ts`:**
- Add `stops` to the request creation input
- Insert stops into `request_stops` table after creating the travel request
- Fetch stops when loading request details

**`usePublicRequest.ts`:**
- Add `stops` to the request data interface

### 5. Update Edge Function

**`submit-public-request/index.ts`:**
- Accept `stops` array in the request body
- Insert stops into `request_stops` table for guest submissions

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/migrations/` | New migration for `request_stops` table |
| `src/components/requests/RequestDialog.tsx` | Add stops state, UI section, and submission logic |
| `src/pages/PublicRequestForm.tsx` | Add stops state and UI section |
| `src/hooks/useRequests.ts` | Update types and mutation to handle stops |
| `src/hooks/usePublicRequest.ts` | Update interface to include stops |
| `supabase/functions/submit-public-request/index.ts` | Handle stops insertion |

## Technical Details

### Form Schema Update (RequestDialog.tsx)

Add stops to the form schema using local state (similar to passengers):

```typescript
const [stops, setStops] = useState<string[]>([]);

const addStop = () => setStops([...stops, '']);
const removeStop = (index: number) => setStops(stops.filter((_, i) => i !== index));
const updateStop = (index: number, value: string) => {
  const updated = [...stops];
  updated[index] = value;
  setStops(updated);
};
```

### Database Migration

```sql
CREATE TABLE public.request_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.travel_requests(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  stop_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (request_id, stop_order)
);

ALTER TABLE public.request_stops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view stops of requests they can view"
  ON public.request_stops FOR SELECT
  USING (public.can_view_request(auth.uid(), request_id));

CREATE POLICY "Users can insert stops for their own requests"
  ON public.request_stops FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.travel_requests
      WHERE id = request_id AND requester_id = auth.uid()
    )
  );
```

### Submission Logic

On form submit, after creating the travel request, insert stops:

```typescript
// After creating request
if (stops.length > 0) {
  await supabase.from('request_stops').insert(
    stops.map((location, index) => ({
      request_id: newRequest.id,
      location,
      stop_order: index + 1,
    }))
  );
}
```
