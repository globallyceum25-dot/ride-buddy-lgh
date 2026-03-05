

# Add Monthly Hailing Service Spend Widget to Dashboard

## Overview
Add a new dashboard card for admins showing this month's total hailing service spend, with a percentage trend compared to last month.

## Changes

### 1. New hook: `useHailingSpendStats()` in `useDashboardData.ts`
- Query `allocations` where `hailing_service IS NOT NULL` for current month and previous month
- Sum `fare_amount` for each period
- Return: `thisMonthSpend`, `lastMonthSpend`, `tripCount`, `percentChange`

### 2. New widget in `Dashboard.tsx`
- Add a card in the admin stats grid area (below existing 4-stat row)
- Shows: total hailing spend (LKR formatted), trip count, and trend badge (up/down arrow with % change vs last month)
- Uses green/red coloring for trend direction
- Only visible to admin users (`isAdmin`)
- Links to Reports page Hailing Costs tab on click

### 3. Visual design
- Compact card matching existing stat card style
- Icon: `Banknote` or `Receipt` from lucide-react
- Subtitle: "X trips this month" with trend indicator

