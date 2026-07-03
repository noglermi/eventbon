# Roadmap

## Product Rule

The roadmap must protect the mission:

Sell vouchers.

Calculate change.

Print vouchers.

Generate a simple sales summary.

Nothing else.

eventBon is event-booking based. The customer books eventBon for a specific event and usage period; the booked event is the core business object, not a generic permanent software workspace.

The organizer-facing navigation starts with Meine Veranstaltungen, not a generic dashboard. User-facing language uses Veranstalter; tenant and tenant_id remain internal data model terms only.

Booking lifecycle:

- booking or purchase
- preparation period
- active sales and printing period
- post-event statistics and export period
- optional paid extension
- data archived under the organizer account for a defined retention period

## Phase 1: MVP

Scope:

- Meine Veranstaltungen entry screen
- single active event
- event setup for a booked event
- editable sales tiles inside the sales terminal
- tile groups: Drinks, Food, Desserts, Other
- shopping cart
- cash change helper
- manual card confirmation
- browser voucher printing
- simple statistics
- CSV export

Conceptual access rules:

- before the event, the organizer can configure products and settings
- Bon printing is only allowed during the active event period or an explicitly activated usage window
- after the event, the sales terminal becomes inactive
- statistics and export remain available during the post-event access period

Exclusions:

- dashboard
- separate article management
- invoices
- receipts
- taxes
- accounting
- inventory management
- POS features
- restaurant workflows

## Phase 2: Operational Hardening

Potential improvements after the MVP:

- clearer print layouts
- better mobile and tablet terminal behavior
- organizer onboarding flow
- event setup guardrails
- event-scoped helper invitations
- audit-friendly sale history
- safer CSV export options
- improved image handling for sales tiles

These improvements should not add accounting, inventory, or POS complexity.

## Milestone 3: Event Setup

Goal:

A user can create a usable event in less than 3 minutes.

Scope:

- event name
- event date or date range
- access and usage period concept
- print active period concept
- event-level print mode
- default tile groups
- direct tile editing in the sales terminal
- icon or image per tile
- price per tile
- group assignment
- immediate transition to selling Bons

Milestone 3 keeps setup close to the sales terminal. It does not introduce a separate article management area, dashboard, accounting workflow, or cash register behavior.

The setup model prepares each event to become a booked event with organizer ownership, helper access, an active print window, post-event access, and later archiving.

## Phase 3: Payment Integrations

Payment integration candidates:

- Stripe
- SumUp

The goal is payment confirmation inside the eventBon flow while keeping the terminal simple.

Provider-specific setup and status handling should remain hidden from event staff during active sales whenever possible.

Stripe-ready architecture must also support eventBon event booking purchases separately from Bon sales. A future booking model can define:

- preparation period
- event period
- post-event access period
- optional paid extension

Stripe must later be able to support event booking, organizer payment, duration-based access, paid extensions, renewal/extension flow, invoice/payment handling outside the Bon sales workflow, and a license activation token for future offline use.

eventBon must not process event visitor payments as a cash register.

## Phase 3b: Future Offline License Readiness

A future offline-capable version must represent the booked event usage period as a local license period.

During the booked time window, the offline version must be able to run without internet. After expiry:

- sales terminal becomes inactive
- statistics and export remain read-only for a defined grace period
- paid extension can reactivate access

Offline license tokens must represent the booked event and its allowed usage period. The offline version must enforce preparation mode, active sales and printing mode, read-only post-event mode, expiry, and paid extension.

This phase is documentation and architecture readiness only until offline mode is explicitly planned. It does not add offline mode to the MVP.

## Phase 4: Multi-Event Support

The architecture is multi-tenant by design, but the MVP focuses on a single event.

Future multi-event support may include:

- event list
- event duplication
- archived events
- per-event summaries
- organizer account with multiple booked events over time
- helper invitations scoped to individual booked events

This phase should still avoid dashboards unless a focused event selection screen becomes necessary.

## Permanent Non-Roadmap Items

The following are outside the eventBon product direction:

- cash register functionality
- POS platform features
- accounting
- tax calculation
- invoices
- receipts
- inventory management
- ERP workflows
- restaurant management
