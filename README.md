# SelfStorage OS - Frontend Interface

A premium, role-based frontend application for managing a modern, automated self-storage business. This project provides a fully responsive, high-end consumer experience alongside an ultra-dense, data-rich internal operations portal.

## Overview

SelfStorage OS modernizes the physical storage industry. It replaces traditional padlocks and clipboards with digital reservations, Bluetooth-enabled Smart Keys, and real-time facility telemetry. 

The application is split into two distinct visual identities:
1. **Public/Consumer App**: Employs a modern, vibrant, and spacious aesthetic (inspired by Lemon Squeezy and Stripe) to drive conversions and provide a seamless tenant experience.
2. **Internal Admin Portal**: Employs an ultra-dense, high-contrast, data-rich aesthetic optimized for facility managers and business operations teams to monitor thousands of units simultaneously.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Library**: React 19
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Fonts**: Inter (UI) & JetBrains Mono (Data/Metrics)

## Key Features & Architecture

### 1. Consumer Experience
- **Marketing Landing Page (`/`)**: High-conversion hero section, feature spotlights (Climate Control, Smart Security), and dynamic location pricing cards.
- **Authentication Gateway (`/login`)**: A secure, split-screen login portal supporting OTP/PIN entry flows.
- **Tenant Dashboard (`/dashboard`)**: 
  - **Unit Roster**: Displays all active, reserved, and past rental units.
  - **Smart Key & Access Hub**: A drill-down view simulating a Bluetooth/IoT interface. Tenants can view real-time battery status, lock states, and tap a massive digital button to unlock their physical unit.

### 2. Unified Admin Portal (`/admin`)
The admin interface is built as a Single Page Application (SPA) shell utilizing a **Role Switcher**. A single unified portal dynamically morphs its sidebar, dashboard, and interaction patterns based on one of four distinct internal roles:

1. **Facility Manager**: 
   - *Architecture*: Real-time operational grid.
   - *Features*: Live KPI ribbon, an interactive 8-column floor plan grid mapped to physical storage units. Clicking a unit opens a "Quick Action Flyout" to assign reservations or trigger manual overlocks.
2. **Facility Staff**: 
   - *Architecture*: Daily task Kanban board.
   - *Features*: Ground-level operational tracking for daily move-ins, move-outs, unit inspections, and handling active customer support tickets (e.g., lost access cards).
3. **Business Operations**: 
   - *Architecture*: HQ Analytics and Policy Engine.
   - *Features*: High-level financial KPIs (MRR, Yield), multi-stream revenue charts, a comprehensive unit pricing matrix, and a global policy editor (adjusting grace periods, daily fines, and deposit multipliers).
4. **System Administrator**: 
   - *Architecture*: Security & Auditing.
   - *Features*: Role-Based Access Control (RBAC) matrix for staff and a live, terminal-style audit stream tracking system-wide mutations.

## Getting Started

First, run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
src/
├── app/
│   ├── admin/       # Unified Internal Portal
│   ├── book/        # Customer Booking Flow (Stub)
│   ├── dashboard/   # Tenant Smart Key Hub
│   ├── locations/   # Facility Locator
│   ├── login/       # Authentication Gateway
│   ├── globals.css  # Tailwind & Base Styles
│   └── page.tsx     # Marketing Landing Page
├── components/      # Reusable UI Components
│   ├── Navbar.tsx
│   ├── Hero.tsx
│   ├── CustomerDashboard.tsx
│   └── FacilityList.tsx
└── public/          # Static Assets & Images
```
