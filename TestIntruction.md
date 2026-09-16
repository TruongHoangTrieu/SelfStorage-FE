SelfStorage UI Testing & Navigation Guide
This document provides a comprehensive, step-by-step walkthrough to test all the screens, layouts, and interactive components built for the SelfStorage frontend application.

TIP

Ensure your development server is running (npm run dev) and accessible at http://localhost:3000 before beginning the test.

1. Marketing & Landing Page
URL: http://localhost:3000/

This is the public-facing storefront designed to WOW potential customers with a premium, Lemon Squeezy-inspired aesthetic.

What to Test:

Hero Section: Observe the dark-mode aesthetic with vibrant purple gradients (#1e1b4b and #7E22CE) and the stark contrast.
Navigation Bar: Scroll down the page and notice how the navbar transitions from transparent to a solid, blurred glassmorphic background.
Value Propositions: Check the interactive-looking cards detailing Climate Control, Smart Access, and Security features.
Calls to Action: Hover over buttons like "Book a Unit" or "View Locations" to see the subtle shadow and translation micro-animations.
2. Secure Login Gateway
URL: http://localhost:3000/login

A high-security, split-screen authentication portal for both customers and staff.

What to Test:

Split Layout: Notice the branding/marketing content on the left (hidden on mobile) and the clean login form on the right.
Input Fields: Click into the phone number and PIN fields. Notice the focus rings and smooth transitions.
Login Action: Clicking "Sign In Securely" visually processes the login. (Note: Currently acts as a visual frontend shell without backend routing logic).
3. Customer Dashboard & Smart Key Hub
URL: http://localhost:3000/dashboard

The primary interface for active tenants to manage their rentals and access their physical units via Bluetooth/IoT.

What to Test:

Sidebar Layout: Verify the persistent left sidebar with the user profile and navigation links.
Unit Drill-Down Flow (Crucial):
By default, you will see the "Your Storage Units" list, showing Active, Reserved, and Past units.
Click on the active unit "A-105 (Small Personal Locker)".
The interface will smoothly transition into the "Tenant Smart Key & Access Hub".
Smart Key Interface:
Check the live telemetry strip (Magnetic Sensor status, Battery level, Signal strength).
Observe the large, circular "Tap to Unlock" button and the secondary actions (Share Access Code, Payment History).
Click the "← Back to Units" button at the top left to return to the list view.
4. Unified Internal Admin Portal
URL: http://localhost:3000/admin

A massive, data-dense command center for 4 distinct internal employee roles. This portal uses an ultra-dense, Stark/Stripe-like aesthetic distinct from the consumer app.

What to Test (The Role Switcher): At the top right of the navigation bar, locate the Role Switcher Dropdown (e.g., Viewing as: Facility Manager). Changing this dropdown instantly morphs the entire page layout and sidebar to match the selected persona.

A. Facility Manager (Default)
Focus: On-the-ground unit mapping and delinquency enforcement.

KPI Ribbon: Check the live metrics for Total Units, Occupancy, and Overdue alerts.
Interactive Floor Grid: Look at the 8-column visual grid representing physical units.
Flyout Action: Click on different colored units in the grid (e.g., Green A-105, Red A-107).
Result: The right-hand "Quick Action Flyout" sidebar immediately updates to show that specific tenant's profile, lease data, hardware battery %, and context-aware action buttons.
B. Facility Staff
Focus: Daily operations and customer support.

Kanban Board Layout: Observe the 3-column layout.
Check-ins: See customers arriving today and the "Begin Handover" workflow button.
Move-outs: See units scheduled for return and inspection.
Active Tickets: View incoming customer support requests (e.g., jammed locks).
C. Business Operations
Focus: High-level analytics, pricing, and system rules.

Unit Tier & Rate Matrix: Review the detailed data table showing all Unit Types, their base pricing per month, dimensions, and visual occupancy bars.
Enforcement Rules Sidebar: On the right, check the policy configuration form (Grace Period Days, Daily Fine %, Security Deposit Multipliers).
Revenue Analytics Chart: Review the stacked bar chart at the bottom visualizing income streams (Base Lease vs Deposits vs Fines).
D. System Administrator
Focus: Security, audits, and identity management.

Access Control Matrix: Review the table listing internal staff, their roles, and facility access permissions.
Live Audit Stream: Scroll through the terminal-style log window at the bottom showing raw system events (auth, policy changes).
