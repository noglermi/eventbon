# Roadmap

## Product Rule

The roadmap must protect the mission:

Sell vouchers.

Calculate change.

Print vouchers.

Generate a simple sales summary.

Nothing else.

## Phase 1: MVP

Scope:

- single active event
- editable sales tiles inside the sales terminal
- tile groups: Drinks, Food, Desserts, Other
- shopping cart
- cash change helper
- manual card confirmation
- browser voucher printing
- simple statistics
- CSV export

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
- tenant onboarding flow
- event setup guardrails
- audit-friendly sale history
- safer CSV export options
- improved image handling for sales tiles

These improvements should not add accounting, inventory, or POS complexity.

## Phase 3: Payment Integrations

Payment integration candidates:

- Stripe
- SumUp

The goal is payment confirmation inside the eventBon flow while keeping the terminal simple.

Provider-specific setup and status handling should remain hidden from event staff during active sales whenever possible.

Stripe-ready architecture must also support eventBon rental purchases separately from Bon sales. A future booking model can define:

- preparation period
- event period
- post-event access period
- optional paid extension

Stripe must later be able to support duration-based access, paid extensions, renewal/extension flow, invoice/payment handling outside the Bon sales workflow, and a license activation token for future offline use.

eventBon must not process event visitor payments as a cash register.

## Phase 3b: Future Offline License Readiness

A future offline-capable version must represent the booked event usage period as a local license period.

During the booked time window, the offline version must be able to run without internet. After expiry:

- sales terminal becomes inactive
- statistics and export remain read-only for a defined grace period
- paid extension can reactivate access

This phase is documentation and architecture readiness only until offline mode is explicitly planned. It does not add offline mode to the MVP.

## Phase 4: Multi-Event Support

The architecture is multi-tenant by design, but the MVP focuses on a single event.

Future multi-event support may include:

- event list
- event duplication
- archived events
- per-event summaries

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
