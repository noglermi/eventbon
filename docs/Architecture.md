# Architecture

## Overview

eventBon uses a simple user experience on top of a scalable hosted architecture.

Core stack:

- Next.js for the application.
- Supabase for all data storage.
- Vercel for deployment.

The system is multi-tenant by design and integration-ready for Stripe and SumUp.

## Architectural Principles

- Keep the sales flow simple.
- Store all persistent data in Supabase.
- Keep tenant boundaries explicit in the data model.
- Treat the booked event as the core business object.
- Design payment handling as an abstraction from the beginning.
- Avoid local-only state for business records.
- Prefer small, understandable modules over broad platform abstractions.

## Application Shape

The main organizer-facing entry point is:

- Meine Veranstaltungen

From there, the organizer opens a booked event and enters the sales terminal for that event.

The organizer is the commercial customer and owner of booked events. The primary product hierarchy is:

- Organizer
- Events
- Products, sales, and statistics inside each event

The MVP application still centers operational work on one primary event experience:

- Sales terminal for the selected booked event.

Supporting capabilities exist only where they are required by that event terminal:

- Editable sales tiles.
- Shopping cart.
- Cash change helper.
- Manual card confirmation.
- Browser voucher printing.
- Simple statistics.
- CSV export.

There is no dashboard in the MVP.

User-facing product language should use Veranstalter for the organizer. Internally, the data model may still use tenant and tenant_id for multi-tenant boundaries, but the user-facing product should avoid Mandant.

## Navigation Model

Organizer navigation:

- Login
- Meine Veranstaltungen
- Event dashboard or statistics
- Event sales terminal
- Event settings and products
- Speisekarte

Helper navigation:

- Invitation link, QR code, or event access code
- Enter name
- Directly enter the assigned event sales terminal

Helpers do not use event selection, do not see the organizer dashboard, and cannot access other events. Dashboard and statistics views are organizer-only. Operational recent sales can appear inside the Sales Terminal because they support the cashier during the event.

Speisekarte is an organizer-only navigation item. It opens the Menu Designer for the selected event.

## Language Preferences

Language preferences are split by product surface.

Organizer-facing areas use an organizer language preference. This includes login and registration, Meine Veranstaltungen, event booking, dashboard and statistics, and later account settings. During the current implementation this preference lives in UI state. A future organizer profile field in Supabase should persist it.

Sales terminal and helper devices use device-local language as part of local view settings. This is stored in localStorage with other device-specific presentation settings and must not be treated as event data.

This separation lets an organizer use one language while helper devices at the same event use another language.

## Multi-Tenant Design

eventBon must support multiple tenants even if the MVP interface exposes only a single event flow.

Tenant-aware records should include a tenant reference. Booked event, product, sale, payment, voucher, helper access, and summary data should be scoped to the owning tenant.

Tenant separation should be enforced at the data access layer and, where applicable, by Supabase row-level security. Full production-grade RLS hardening is intentionally scheduled for RC-4 after successful field beta and pilot operation, because the beta database schema, RPC signatures, helper workflow, printing, dashboard, and organizer workflow are still evolving.

The organizer account may own multiple booked events over time. Helpers and volunteers are invited into specific booked events and should not automatically gain access to other events owned by the same organizer. Helpers are not global users in the product concept.

The commercial account model starts with a registered organizer user. The organizer account owns events and can create multiple events over time. Past events remain visible in Meine Veranstaltungen according to their access, archive, and retention periods.

During Milestone 5.1, organizer_id is introduced as the future primary ownership link for events. tenant_id remains in the schema as a temporary compatibility layer until authentication, Stripe, and full tenant handling are reintroduced.

The future access chain is:

- Supabase Auth user
- Organizer
- Events
- Event-scoped helpers

Helpers do not own events. Helpers are assigned to one event by invitation. A future permanent helper account may link to multiple event-helper assignments, but the default event workflow must not require a permanent helper account.

## Supabase

Supabase is the central online data store for eventBon.

All hosted application data is stored in Supabase. The online version treats Supabase as the source of truth for tenants, events, products, sales, sale items, voucher records, access periods, and exportable summaries.

Supabase responsibilities:

- organizers
- tenants
- events
- products
- sales
- sale items
- payment confirmations
- printed voucher records
- access extension records
- summary and export data

Supabase should be treated as the source of truth for sales and voucher records.

Completed sales must be stored atomically. The application calls a Supabase RPC that inserts the sale and all sale_items inside one database transaction. If any sale_item insert fails, the transaction fails and no partial sale remains in the database. The print preview opens only after this transaction succeeds.

Database and frontend code must treat Supabase tables and PostgreSQL RPC functions as explicit contracts. Whenever a database table, SQL migration, RPC function, repository method, or frontend payload changes, the SQL signature and frontend call signature must be verified together.

Database Contract Checklist:

- Frontend payload keys must exactly match SQL function parameters for every RPC-related change.
- If an RPC parameter is added, removed, renamed, or reordered, the SQL migration and repository call must be updated in the same change.
- If a frontend-used table column is added, inserts, reads, dashboards, exports, and RPC functions must be checked for support.
- The corresponding Supabase migration must be executed before testing the frontend behavior.
- RPC signature mismatches must surface as errors; no silent fallback is allowed.

Sales are finalized exactly once. The active sales workflow is:

- Sale
- BONS DRUCKEN
- atomic save
- print preview
- print
- sale completed

After the initial print action, the checkout automatically returns to an empty ready state for the next customer. The previous cart, received amount, change, payment input, and current sale state are cleared. The active checkout cannot print that completed sale again.

The footer action Verkauf abbrechen is only for unfinished sales. It is active only while the cart contains products before completion and asks for confirmation before clearing the current cart and payment input.

Reprints are operational actions on an already completed sale. They are only available from Letzte Verkäufe by opening a sale detail and choosing Bon erneut drucken. A reprint never creates a new sale, never creates sale_items, and never changes analytics totals. It only increments sales.print_count and updates sales.printed_at for the existing sale. If a voucher is printed as a reprint, the voucher displays Nachdruck.

A future offline-capable version may use a local storage layer or local database during the booked license period. That local layer must remain separate from the online source-of-truth model and must reconcile with the hosted model only when offline mode is explicitly designed.

## Sales History And Analytics

Sales records support two different use cases.

Operational sales history belongs near the Sales Terminal. It helps the cashier quickly answer event-floor questions about recent sales, wrong payments, wrong Bon counts, or accidental double sales. A later terminal view should show a compact Letzte Verkäufe panel with approximately the last 10 sales. Each entry should show:

- time
- total amount
- payment type
- number of Bons

Clicking an entry should open a read-only detail view with sold products, quantities, payment, change, and print mode. Sales cannot be edited. There is no delete function and no cancellation workflow in the MVP.

Operational sales history is terminal-specific. Each browser or device running the Sales Terminal receives a persistent local terminal_id. Completed sales store this terminal_id, and Letzte Verkäufe filters by the current event and current terminal_id. This keeps the cashier view focused on the physical sales point, for example Getränke, Küche, Kaffee, or Grill.

Sales analytics is a separate organizer-facing use case. The organizer does not need to browse individual sales; the organizer needs event-level business information. A dedicated analytics page should summarize:

- total revenue
- number of sales
- number of printed Bons
- average sale value
- top products by quantity and revenue
- payment summary for cash and card
- revenue by hour
- filters for today, entire event, and later custom periods

Architecture principle: operational sales history and business analytics must remain separated. The cashier needs speed. The organizer needs information.

Business views are event-wide. Organizer dashboard, statistics, and export intentionally ignore terminal_id and include all sales for the selected event.

## Menu Designer

The menu is a first-class organizer module, not an export side effect.

Architecture:

- Organizer
- Event
- Products
- Menu Designer
- PDF

The organizer can create and manage the event menu directly inside eventBon through Speisekarte. The menu is generated automatically from the event products. It is not imported from Excel and not edited in Word.

Products remain the single source of truth. Changing a product automatically updates:

- Sales Terminal
- Dashboard
- Excel Export
- Menu

Allergens belong to products as structured EU allergen codes. The Menu Designer displays these codes, for example `(A,C,G)`, but does not provide manual allergen editing.

The Menu Designer is a live editor. Changes immediately update the preview.

Menu options:

- event logo
- event title
- date
- categories
- product image or icon
- product description
- price
- allergens

Output is a PDF designed for direct printing.

The Menu Designer creates the printable/PDF menu directly from current event data. PDF generation does not use Excel, Word, or duplicated product data. The browser print/PDF output uses the current menu title, subtitle, layout, visible categories, product names, product images or icons, descriptions when present, allergen codes, and prices.

## Vercel

Vercel hosts the Next.js application.

Deployment should remain simple:

- environment-based Supabase configuration
- production deployment on Vercel
- preview deployments for validation

## Event Booking As Core Object

eventBon is built around booked events, not generic permanent software workspaces.

The core business object is a booked event. A customer books eventBon for a specific event and usage period. For example, a riding tournament organizer can book eventBon for a tournament from 28.07. to 30.07.

Each new event requires a separate payment before it becomes active. This makes eventBon pay-per-event first, not primarily a subscription product. A registered organizer account can therefore own a history of paid, active, post-event, and archived events.

Each booked event has:

- organizer
- tenant_id as temporary compatibility layer
- event name
- date range
- access period
- print active period
- post-event access period
- archive or retention period
- status
- products and groups
- invited helpers

## Event Booking And Usage Period

eventBon can be booked for a defined event usage period.

The booking lifecycle is:

- booking or purchase
- preparation period
- active sales and printing period
- post-event statistics and export period
- optional paid extension
- data archived under the organizer account for a defined retention period

The booked usage period controls access to eventBon as a product rental. It does not change the Bon sales workflow and does not make eventBon a cash register for event visitor payments.

Bon printing should only be allowed during the active event period or another explicitly activated usage window. Before the event, the organizer may configure products and settings, but active Bon printing is disabled unless explicitly enabled. After the event, the sales terminal becomes inactive while statistics and export remain available during the post-event access period. A paid extension can prolong access.

Organizer data access and active sales access are separate.

The organizer always keeps access to event data, products, dashboard and statistics, Excel export, helper history, and the Menu Designer according to retention rules. This keeps past events useful for review and reuse without turning eventBon into a permanent POS workspace.

Active sales and Bon printing are restricted to paid active event days. The organizer event list uses lifecycle states:

- Upcoming
- Active today
- Completed

Meine Veranstaltungen is split into open events and completed events. Completed events remain visible, but their Sales Terminal cannot create new sales or print new Bons. Upcoming events can be configured before the paid event days, but selling is not active yet.

Paid extensions may add only today or future dates. An extension must never add access for days in the past.

## Roles And Access

### Organizer

The organizer:

- books the event
- pays for the eventBon usage period
- defines event name, date range, print mode, products, groups, and access rules
- can invite helpers

### Helpers And Volunteers

Helpers and volunteers:

- can access only the booked event they were invited to
- can use the sales terminal for that event
- cannot change booking, payment, or license data
- may have restricted permissions

Version 1 helper access should use the simplest possible invitation model:

- QR code
- invitation link
- event access code

The helper opens the invitation, enters only a name, and is immediately assigned to the event. No email and no password are required in Version 1.

Helper invitation links and QR codes must use the public application URL. The app resolves this from `NEXT_PUBLIC_APP_URL` first and falls back to the current browser origin for local development. For beta and production, `NEXT_PUBLIC_APP_URL` must be the public Vercel production URL, not a protected preview URL that requires Vercel login.

Helpers can open the assigned event, sell Bons, and print Bons. Helpers cannot manage subscriptions, change organizer information, access other events, or manage billing.

Future versions may optionally add email login, Supabase Auth accounts, reusable helper accounts, permission profiles, and activity history per helper. These are not part of the MVP.

## Future Offline License Period

For a future offline-capable version, the booked usage period must also be represented as a local license period.

The offline version must be able to run without internet during the booked time window. The local license period should cover the same access phases as the online booking:

- preparation period
- active sales and printing period
- read-only post-event access period
- optional paid extension

After the local license expires:

- sales terminal becomes inactive
- statistics and export remain read-only for a defined grace period
- paid extension can reactivate access

Offline license tokens must represent the booked event and its allowed usage period. The offline version must enforce preparation mode, active sales and printing mode, read-only post-event mode, expiry, and paid extension.

This is an architectural readiness requirement only. The MVP does not implement offline mode or local license enforcement.

## Payment Readiness

The MVP supports:

- cash payments with a change helper
- manual card confirmation

The architecture must remain ready for:

- Stripe
- SumUp

Payment providers should be modeled as replaceable adapters. The sales terminal should not depend directly on provider-specific logic.

Stripe readiness is for eventBon event booking, organizer payment, paid extension, and account access, separate from Bon sales. Stripe rental and payment handling must remain outside the Bon sales workflow. Stripe must later support:

- event booking payment
- event activation after successful payment
- duration-based access
- paid extension
- license activation token for offline use
- renewal/extension flow
- invoice and payment handling for the organizer outside the Bon sales workflow

Stripe is never used for Bon sales to visitors. Visitor payments remain outside Stripe unless a future SumUp integration confirms payment externally. eventBon still does not process event visitor payments as a cash register.

## Printing

The MVP uses browser Bon printing first. eventBon does not select printers automatically and does not send ESC/POS or native printer commands yet.

The printer setup foundation stores device-local browser print settings in localStorage. These settings are intentionally not event data and are not stored in Supabase.

Each sales terminal or device uses exactly one configured printer. There is no multi-printer routing per terminal. Multiple terminals at one event are supported by configuring each terminal/device with its own local printer settings.

Initial tested printer profiles:

- Generic 58 mm receipt printer
- Generic 80 mm receipt printer
- Brother TD-4000
- Generic A4 test printer

The organizer or device operator must install the printer in Windows first. eventBon then uses the browser print dialog and applies the selected profile to the Bon print CSS for width, density, and tear/cut spacing.

Printing should be generated from recorded sales data so the printed result can be traced back to the order and event.

Bon printing is an event-period capability. Outside the active event period or an explicitly enabled usage window, printing should be inactive even if product setup and read-only statistics access are still available.

Direct printing, ESC/POS support, native printer integration, and automatic printer discovery are later hardening topics and are not part of the browser-print foundation.

Product-based printer routing, kitchen printer routing, and multiple printers per terminal are not part of the MVP. This keeps event-floor printing simple, predictable, and easier to support.

## Release Candidate Architecture Priorities

The Release Candidate roadmap is ordered around beta learning first and production hardening later.

### RC-1 Beta Completion

Focus:

- UX
- bug fixes
- tablet optimization
- sales workflow
- password reset
- Menu Designer
- printer support
- complete event workflow

### RC-2 Receipt Printing

Focus:

- printer setup wizard
- generic thermal printer support
- Brother TD-4000 reference implementation
- Epson reference profiles
- browser print optimization
- print testing
- print documentation

### RC-3 Pilot Program

Focus:

- five real pilot events
- feedback collection
- UX fixes
- no major architecture changes

Typical pilots:

- Reitturnier
- Feuerwehrfest
- Musikverein
- Sportveranstaltung
- Weihnachtsmarkt

### RC-4 Security Hardening

Full production security hardening happens only after successful pilot operation.

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

Until RC-4, avoid major architecture refactoring unless required for a beta blocker. Allowed work includes bug fixes, UX improvements, printing, and beta workflow improvements. Avoid large security rewrites, large database redesigns, and unnecessary RPC redesigns.

## Icon And Image Assets

Product icons and images must have clear commercial usage rights.

Default product symbols should use commercially usable open-source icon libraries. Preferred examples are Lucide, Tabler Icons, Heroicons, and Material Symbols. The exact library and license must be verified and documented before production release.

Unicode emojis may be used as fallback or simple symbols because they are rendered by the operating system or browser.

eventBon must not ship copied product photos from the internet. No icons or images may be copied from Google Images or unclear sources.

Organizer-uploaded product images are optional. The organizer is responsible for having the rights to uploaded images.

The product principle is: default to a safe open-source icon, and allow an optional organizer-uploaded image.

## Explicit Exclusions

The architecture should not introduce systems for:

- invoices
- receipts
- taxes
- accounting
- inventory management
- restaurant table service
- ERP workflows
