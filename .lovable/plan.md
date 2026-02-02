

# LGH Fleet Management System - Implementation Plan

## Overview
A full-featured enterprise fleet management system supporting 10+ locations, 200+ staff users, and 50+ vehicles with sophisticated seat-pooling, automated allocation, and multi-level approval workflows.

---

## Phase 1: Foundation & Authentication

### Database Setup (Supabase)
- **User Management**: Users table with admin-created accounts, secure authentication
- **Role System**: Separate roles table (Staff, Location Coordinator, Group Admin, Driver, Approver) with permissions matrix
- **Audit Logging**: Track all actions for compliance and accountability

### Authentication & Authorization
- Admin-only account creation (no self-registration)
- Role-based dashboard routing (each role sees different interface)
- Session management with secure token handling

---

## Phase 2: Master Data Management

### Location Master
- Location profiles with addresses, operating hours, GPS coordinates
- Default pickup points per location
- Assigned coordinators

### Vehicle Master
- Vehicle registry with registration, type, capacity, fuel type
- Ownership tracking (owned/leased)
- Status management (Available/In Trip/Service/Breakdown)
- Maintenance scheduling with service reminders
- License and insurance expiry alerts

### Driver Master
- Driver profiles with license details and expiry tracking
- Availability schedules and leave management
- Location assignment (or floating pool)
- Status tracking and performance notes

### Routes & Pickup Points
- Route definitions (from/to locations)
- Standard pickup points with GPS coordinates
- Typical duration and distance estimates
- Time windows for scheduled services

### Policy & Rules Configuration
- Booking cutoff times
- Cancellation and no-show policies
- Priority rules (medical, executive, shift transport)
- Seat-sharing eligibility rules
- Approval workflow rules by request type

---

## Phase 3: Staff Request Module

### Request Submission
- Clean, intuitive request form
- Request types: One-way, Round trip
- Date/time selection with flexibility buffer
- Pickup and drop location selection
- Passenger count and special needs
- Priority flagging with reason
- Recurring request support

### Request Workflow
Draft → Submitted → Pending Approval → Approved/Rejected → Scheduled → In Progress → Completed

### Staff Dashboard
- My Requests list with status filters
- Request details and trip information
- Cancellation (within allowed window)
- Notification center

---

## Phase 4: Approval Workflow

### Approver Dashboard
- Pending approvals queue
- Request details with staff info, cost center, purpose
- Approve/Reject with mandatory reason for rejections
- Bulk approval capabilities
- Approval history and audit trail

### Approval Rules Engine
- Route approvals to correct approver (by department, cost center, or request type)
- Escalation for overdue approvals
- Auto-notification on approval status changes

---

## Phase 5: Seat Pooling & Request Merging (Core Feature)

### Merge Suggestion Engine
- Analyze requests for compatibility:
  - Same date with overlapping time windows
  - Similar pickup zones and destinations
  - Route direction alignment
  - Available seat capacity
- Score and rank merge candidates
- Respect VIP "no pooling" flags

### Coordinator Merge Interface
- "Suggest Merges" view showing grouped candidates
- Visual indicators: time overlap, route similarity, pickup proximity
- One-click merge to create Trip Groups
- Pickup order optimization (drag-and-drop)
- Split/remove requests from groups
- Capacity and conflict warnings

### Trip Groups
- Consolidated view of merged requests
- Combined pickup plan with ordered stops
- Estimated departure and arrival times
- Total passenger count tracking

---

## Phase 6: Allocation Engine

### Auto-Allocation Logic
- Match Trip Groups to suitable vehicles:
  - Smallest vehicle that fits passengers (capacity optimization)
  - Prefer vehicles at pickup location
  - Consider vehicle availability and maintenance blocks
  - Avoid driver overtime
- Match drivers based on:
  - License type compatibility
  - Availability schedule
  - Current trip conflicts
  - Location assignment

### Manual Override
- Coordinator can override auto-suggestions
- Drag-and-drop allocation board
- Conflict detection and warnings
- Lock allocations once confirmed

### Trip Sheet Generation
- Trip ID with vehicle and driver assignment
- Linked requests and pickup sequence
- Planned times and seat allocations
- Coordinator notes

---

## Phase 7: Driver Portal (Mobile Responsive)

### Driver Dashboard
- Daily trip list with details
- Accept/confirm trip assignments
- Navigation to pickup points

### Trip Execution
- Trip start/end confirmation
- Arrive at pickup notifications
- Passenger boarding check-in (per request)
- No-show marking with reason
- Odometer recording (start/end)
- Fuel top-up logging
- Toll/parking expense entry
- Incident notes

### Trip Statuses
Scheduled → Driver Assigned → Confirmed → Started → Completed (or Cancelled/Breakdown)

---

## Phase 8: Notifications System

### In-App Notifications
- Real-time notification bell with badge count
- Notification center with history
- Mark as read functionality

### Email Notifications
- Request submitted confirmation
- Approval status updates
- Trip allocation details (vehicle, driver, pickup time)
- Schedule changes and cancellations
- No-show alerts

### WhatsApp/SMS (Integration Ready)
- Structure for external messaging service integration
- Template messages for key events
- Delivery status tracking

---

## Phase 9: Dashboards & Analytics

### Location Coordinator Dashboard
- Today's requests overview
- Pending allocations
- Active trips tracker
- Vehicle utilization meter
- Driver availability status
- Alerts (maintenance due, license expiry)

### Group Admin Dashboard
- All locations summary view
- Organization-wide KPIs
- Cross-location comparisons
- Trend analysis

### Key Performance Indicators
- Request fulfillment rate
- Seat utilization percentage
- Vehicle utilization (hours/trips per day)
- On-time pickup rate
- Cancellation and no-show rates
- Cost per trip (when expense tracking enabled)
- Driver workload distribution

---

## Phase 10: Reports & Exports

### Operational Reports
- Daily trip sheet by location
- Weekly/monthly utilization reports
- Vehicle maintenance schedule
- Driver assignment history

### Administrative Reports
- No-show analysis by department/staff
- Cost center usage summary
- Approval turnaround times
- Audit trail reports

### Export Options
- Excel/CSV downloads
- PDF generation for official reports
- Scheduled report delivery

---

## User Interface Design

### Clean & Professional Theme
- Corporate color palette with clear visual hierarchy
- Data tables with sorting, filtering, pagination
- Status badges and progress indicators
- Responsive design for all screen sizes

### Role-Specific Layouts
- **Staff**: Simple request form, my requests, trip details
- **Approver**: Approval queue, decision interface
- **Coordinator**: Requests inbox, merge board, allocation calendar, fleet overview
- **Admin**: Masters management, policies, reports, audit logs
- **Driver**: Trip list, execution screens (mobile-optimized)

---

## Technical Architecture

### Backend (Supabase)
- PostgreSQL database with proper relationships
- Row-Level Security for role-based data access
- Edge Functions for allocation engine and notifications
- Real-time subscriptions for live updates

### Security & Compliance
- Complete audit trail
- Role-based access control
- Mandatory reason fields for rejections/cancellations
- Data validation at all entry points

---

## Summary

This system will provide LGH with a comprehensive fleet management solution featuring:
- ✅ Multi-location support with group-wide visibility
- ✅ Smart seat pooling to optimize vehicle usage
- ✅ Automated allocation with manual override capability
- ✅ Full approval workflow
- ✅ Real-time tracking and notifications
- ✅ Comprehensive reporting and analytics
- ✅ Mobile-responsive driver interface
- ✅ Enterprise-grade security and audit trails

