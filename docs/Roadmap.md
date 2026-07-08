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

The commercial model starts with a registered organizer user. The organizer account owns events, can create multiple events over time, and each new event requires a separate payment before it becomes active. eventBon is pay-per-event first, not primarily a subscription model. Past events remain visible in Meine Veranstaltungen according to access, archive, and retention rules.

The organizer is the commercial customer. The product hierarchy is Organizer -> Events -> Products, Sales, and Statistics. Helpers are event-scoped and are not the same as the organizer.

Helper access starts simple: QR code, invitation link, or event access code; helper enters a name and works only in the assigned event. No helper email, password, or permanent helper account is required in Version 1.

Organizer navigation is login, Meine Veranstaltungen, event dashboard or statistics, event sales terminal, event settings or products, and Speisekarte. Helper navigation is invitation link, QR code, or event access code, enter name, then directly into the assigned event sales terminal. Helpers do not see event selection, organizer dashboard, Speisekarte, or other events. Dashboard, analytics, and the Menu Designer remain organizer-only.

Booking lifecycle:

- booking or purchase
- preparation period
- active sales and printing period
- post-event statistics and export period
- optional paid extension
- data archived under the organizer account for a defined retention period

## Release Candidate Roadmap

The Release Candidate phase prioritizes beta readiness, field learning, and then production hardening.

Full production security hardening is intentionally postponed until after the first successful field beta. During beta, the database schema, RPC signatures, helper workflow, printing, dashboard, and organizer workflow are still evolving. Implementing production-grade RLS now would create unnecessary rework and increase regression risk.

Security remains mandatory before production release.

### RC-1 Beta Completion

Focus:

- UX
- bug fixes
- tablet optimization
- sales workflow
- password reset
- organizer event workspace
- Menu Designer
- printer support
- complete event workflow

Organizer event workspace:

- central organizer-only area for one booked event
- navigation: Übersicht, Verkauf, Dashboard, Produkte, Helfer, Speisekarte, Bondrucker, Einstellungen
- overview with event title, date, lifecycle badge, product count, helper count, sales count, and revenue
- quick actions to open sales and dashboard
- existing modules are reused instead of duplicating functionality

### RC-2 Receipt Printing

Focus:

- printer setup wizard
- generic thermal printer support
- Brother TD-4000 reference implementation
- Epson reference profiles
- browser print optimization
- print testing
- print documentation

Product rule:

- one terminal/device uses one configured printer
- each terminal can have its own device-local printer settings
- multiple terminals at one event are supported
- no product-based printer routing in the MVP
- no multiple printers per terminal

Device settings concept:

- event settings: products, helpers, menu, dashboard
- device settings: receipt printer, zoom, device language
- device settings are local to the terminal and are not stored as event data
- a future Dieses Gerät area may group receipt printer, zoom, and language settings

### RC-3 Pilot Program

Focus:

- five real pilot events
- typical pilots: Reitturnier, Feuerwehrfest, Musikverein, Sportveranstaltung, Weihnachtsmarkt
- collect feedback
- fix UX issues
- no major architecture changes

### RC-4 Security Hardening

Only after successful pilot operation.

Focus:

- Full Row Level Security
- RPC security review
- storage policies
- server-side validation
- token review
- permission review
- security testing
- DSGVO review
- production hardening

### Development Rule

Until RC-4, do not make major architecture refactors unless required for a beta blocker.

Allowed:

- bug fixes
- UX improvements
- printing
- beta workflow improvements

Avoid:

- large security rewrites
- large database redesigns
- unnecessary RPC redesigns

### Sprint Planning

| Sprint | Name |
| --- | --- |
| RC1-01 | Beta Workflow |
| RC1-02 | Menu Designer |
| RC1-03 | Receipt Printing |
| RC1-04 | Beta Polish |
| RC2-01 | Pilot Events |
| RC3-01 | Security Hardening |

Release Candidate quality gate:

- Database/API contract synchronization is mandatory for every table, migration, RPC, repository, and frontend payload change.
- RPC changes must verify `frontend payload keys == SQL function parameters`.
- Frontend validation for database-backed changes must happen only after the matching Supabase migration has been executed.
- RPC signature mismatches must show a real error and must not fall back silently.

Organizer event lifecycle UX:

- Meine Veranstaltungen separates open events from completed events.
- Event cards use calm lifecycle badges instead of large technical status blocks.
- Organizer data access remains available for all events according to retention rules.
- Active sales and Bon printing are available only on paid active event days.
- Completed events remain visible and reviewable, but not sellable.
- Paid extensions may only add today or future days.

## Menu Designer Roadmap

The menu is a first-class organizer feature.

Organizer flow:

- Organizer
- Event
- Products
- Menu Designer
- PDF

The organizer opens Speisekarte for a selected event and manages the menu directly in eventBon. The menu is generated automatically from the event products. It is not imported from Excel and not edited in Word.

The Menu Designer is a live editor. Changes immediately update the preview.

Products remain the single source of truth. Changing a product automatically updates:

- Sales Terminal
- Dashboard
- Excel Export
- Menu

Menu options:

- event logo
- event title
- date
- categories
- product image or icon
- product description
- price
- allergens

Output:

- PDF export
- designed for direct printing

## Phase 1: MVP

Scope:

- Meine Veranstaltungen entry screen
- single active event
- event setup for a booked event
- editable sales tiles inside the sales terminal
- tile groups: Drinks, Food, Desserts, Other
- persisted product groups and product positions
- product images stored in Supabase Storage
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
- organizer profile settings, including persisted organizer language preference
- event setup guardrails
- event-scoped helper invitations
- audit-friendly sale history
- safer CSV export options
- improved image handling for sales tiles beyond the current Supabase Storage foundation

These improvements should not add accounting, inventory, or POS complexity.

Before public rollout:

- verify the chosen product icon library license
- document the chosen icon library and license
- add terms or usage guidance noting that organizers are responsible for uploaded product images
- ensure shipped default assets do not include copied product photos or unclear internet sources

## Helper Access Version 1

Goal:

Helpers can start working at an event in less than one minute.

Organizer can:

- book events
- configure products
- manage helpers
- access statistics
- extend bookings

Helpers can:

- open the assigned event
- sell Bons
- print Bons

Helpers cannot:

- manage subscriptions
- change organizer information
- access other events
- manage billing

Invitation methods:

- QR code
- invitation link
- event access code

The helper enters only a name. No email and no password are required in Version 1.

Future versions may optionally support email login, Supabase Auth accounts, reusable helper accounts, permission profiles, and activity history per helper. These are not part of the MVP.

## Milestone 5.1: Organizer Account Foundation

Goal:

Introduce the organizer structure without implementing authentication.

Scope:

- Organizer domain type
- organizers table
- organizer_id on events
- tenant_id retained as temporary compatibility layer
- mock organizer Dr. Michael Nogler
- event repository prepared to query by organizer
- no Supabase Auth UI
- no helper invitation implementation
- no Stripe

Future architecture:

- Supabase Auth user
- Organizer
- Events
- Event-scoped helpers

## Milestone 5.2: Persist Sales

Goal:

Completed sales are stored in Supabase before printing.

Scope:

- sales
- sale items
- product name and price snapshots
- existing print preview flow
- no statistics UI
- no CSV export

## Milestone 5.3: Organizer Authentication Foundation

Goal:

Organizers can register, log in, log out, and reach Meine Veranstaltungen.

Scope:

- Supabase Auth registration and login
- authenticated organizer workspace
- organizer-owned events
- no helper invitation implementation
- no Stripe
- no SumUp
- no sales analytics dashboard

## Milestone 5.4: Recent Sales

Goal:

Cashiers can review the latest completed sales inside the Sales Terminal.

Scope:

- last 10 sales for the current event
- time, total amount, payment method, and number of Bons
- read-only sale detail dialog
- sold products, quantities, total, payment method, received amount, change, and created_at
- no edit
- no delete
- no cancellation workflow

This is an operational helper/cashier feature. It is not the organizer analytics dashboard.

## Milestone 5.5: Sales Analytics Dashboard

Goal:

Organizers can understand event business performance without browsing individual sales.

Suggested sections:

- Overview: total revenue, number of sales, number of printed Bons, average sale value
- Top Products: product, quantity, revenue
- Payment Summary: cash and card
- Time Analysis: revenue by hour
- Filters: today, entire event, custom period later

The analytics dashboard is separate from the Sales Terminal recent sales panel.

## Milestone 5.6: CSV Export

Goal:

Organizers can export event sales data for simple review outside eventBon.

The CSV export remains a reporting aid, not an invoice, receipt, tax report, or accounting export.
CSV is temporary; Version 1 should prefer Excel export (`.xlsx`) for organizer-facing event review.

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

Stripe must later be able to support event booking payment, event activation, organizer payment handling, duration-based access, paid extensions, renewal/extension flow, invoice/payment handling outside the Bon sales workflow, and a license activation token for future offline use.

Stripe is never used for Bon sales to visitors. Visitor payments remain outside Stripe unless a future SumUp integration confirms payment externally. eventBon must not process event visitor payments as a cash register.

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
