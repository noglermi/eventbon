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

From there, the organizer opens a booked event and enters the organizer event workspace for that event.

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

## Organizer Event Workspace

The organizer event workspace is the central organizer-only area for one booked event.

Workspace navigation:

- Übersicht
- Verkauf
- Dashboard
- Produkte
- Helfer
- Speisekarte
- Bondrucker
- Einstellungen

The workspace does not duplicate business functionality. It organizes existing modules into one coherent event management area:

- Verkauf opens the existing Sales Terminal.
- Dashboard opens the existing organizer analytics dashboard.
- Produkte are managed through the existing editable tile workflow in the Sales Terminal.
- Helfer uses the existing helper invitation workflow.
- Speisekarte opens the existing Menu Designer.
- Bondrucker uses the existing device-local receipt printer setup.
- Einstellungen shows event configuration context without adding new business rules.

The overview page summarizes the selected event with title, date, lifecycle, product count, helper count, sales count, revenue, and quick actions for sales and dashboard.

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

## Event Settings And Device Settings

eventBon separates event-specific settings from device-specific settings.

Event settings belong to the booked event and are shared by all terminals working at that event:

- Products
- Helpers
- Menu
- Dashboard and statistics

Device settings belong to the local browser or terminal and are never event-specific:

- Receipt printer
- Zoom
- Device language

One event may be used from multiple terminals. Each terminal has exactly one configured receipt printer and stores its own local configuration in localStorage. This keeps setup predictable at the event floor while allowing different sales points to use different printers, zoom levels, and device languages.

## Multi-Tenant Design

eventBon must support multiple tenants even if the MVP interface exposes only a single event flow.

Tenant-aware records should include a tenant reference. Booked event, product, sale, payment, voucher, helper access, and summary data should be scoped to the owning tenant.

Tenant separation should be enforced at the data access layer and, where applicable, by Supabase row-level security. Full production-grade RLS hardening is intentionally scheduled for RC-4 after successful field operation and production operation, because the production database schema, RPC signatures, helper workflow, printing, dashboard, and organizer workflow are still evolving.

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

The canonical production domain is `https://eventbons.com`. The same domain will host the public landing page, organizer login, and sales application.

Public application URLs must be generated from `NEXT_PUBLIC_APP_URL` where appropriate. In production this value is `https://eventbons.com`; local development may override it with a localhost URL in `.env.local`.

Helper invitation links, helper QR codes, and organizer password recovery redirects must use `NEXT_PUBLIC_APP_URL` so production links do not point to protected Vercel preview URLs.

## Windows Production Scope

The current supported operating scope is Windows production use.

Officially supported:

- Windows 10
- Windows 11
- Chrome
- Edge
- QZ Tray
- Brother TD-4000 as the first tested printer

Planned later:

- iPad
- Android
- additional certified printers

This Windows production scope is intentionally narrow. It avoids spreading support across mobile operating systems before the Windows receipt-printing path is stable.

Receipt printing remains the P0 release blocker. The target production behavior is direct QZ cashier printing, one print job per voucher, cutting after every voucher where supported, and an optimized Brother TD-4000 typography/layout profile.

The printer test lab is a diagnostic tool for setup and support and should not be prominent in ordinary organizer workflows.

Legal and support surfaces are part of the public product. Impressum, Datenschutz, Nutzungsbedingungen, and Problem melden use product text and must remain legally reviewed as the product evolves.

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

Helper invitation links and QR codes must use the public application URL. The app resolves this from `NEXT_PUBLIC_APP_URL` first and falls back to the current browser origin for local development. For production, `NEXT_PUBLIC_APP_URL` must be `https://eventbons.com`, not a protected Vercel preview URL that requires Vercel login.

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

Stripe readiness is for eventBon event booking, organizer payment, paid extension, and account access, separate from Bon sales. Stripe rental and payment handling must remain outside the Bon sales workflow. Stripe must support:

- event booking payment
- event activation after successful payment
- duration-based access
- paid extension
- license activation token for offline use
- renewal/extension flow
- invoice and payment handling for the organizer outside the Bon sales workflow

Stripe is never used for Bon sales to visitors. Visitor payments remain outside Stripe unless a future SumUp integration confirms payment externally. eventBon still does not process event visitor payments as a cash register.

## Printing

eventBon remains a web app. Reliable production receipt printing targets a local print bridge. Browser and CSS printing are acceptable for setup, test prints, and fallback, but they are not the final cashier workflow.

Real Brother TD-4000 testing confirmed that Windows and browser printing can reach the printer, but browser print preview caused repeated labels, incomplete single-voucher output, and too much cashier friction. Receipt printing is therefore a release blocker. Production operation requires direct or near-direct printing so the cashier can complete a sale without a disruptive preview step.

The printer engine foundation separates the Sales Terminal from printer details.

Target receipt-printing architecture:

- eventBon Web App
- PrintService
- PrintJob IR
- Renderer Adapters
- Output Adapters

The Sales Terminal requests Print Bon. It does not know paper widths, print CSS, printer commands, cutter spacing, output target, or printer-specific layout values.

The PrintJob IR is the internal print representation. It contains:

- voucher lines
- print mode
- paper profile
- printer profile
- cut mode
- reprint marker
- helper or terminal context if needed

Renderer Adapters turn the PrintJob IR into output-specific print data:

- Browser CSS renderer
- ESC/POS renderer
- Raster/PDF label renderer
- Vendor SDK renderer later

Output Adapters deliver the rendered job:

- Browser Print fallback
- Local Print Bridge
- Epson ePOS network adapter
- Star webPRNT network adapter

Technology decision:

- Primary future path: local print bridge
- Fast current candidate: QZ Tray
- Fallback: browser/CSS print
- Printer-specific adapters: ESC/POS for Epson and Star, Brother label/raster or Brother SDK through the bridge, Epson ePOS, and Star webPRNT

The internal print flow distinguishes:

- setupPrintPreview
- cashierDirectPrintCandidate

Browser printing remains the setup, test, and explicit fallback path. The normal Windows production release cashier path uses QZ Tray when the device-local output adapter is set to QZ Tray direct print. In QZ mode the Sales Terminal must not call `window.print()`, must not open the browser print preview, and must not show the legacy browser print modal unless the user explicitly chooses the browser fallback after a QZ failure.

The PrintService selects the active device-local printer profile, creates the PrintJob IR, chooses a renderer adapter, and sends the rendered result to an output adapter. The Printer Profile defines paper width, margins, font scaling, cutter or tear-off behavior, and profile-specific layout values.

Supported foundation profiles:

- Generic 58 mm Receipt
- Generic 80 mm Receipt
- Brother TD-4000 58 x 60 mm
- MUNBYN 80 mm thermal receipt printer
- Epson Receipt
- Star Receipt

The Brother TD-4000 58 x 60 mm profile targets the current fixed-size configured test medium. It is an abstraction only at this stage and does not implement Brother-specific commands or direct device support.

Printer profiles are central typed configuration, not database records during the production. A profile contains manufacturer, model, display name, support status, description, paper dimensions, printer type, connection options, cutter behavior, supported platforms, required software, driver hint, installation guide, test status, last tested date, tested eventBon version, notes, recommended settings, QZ printer hints, and active/inactive availability.

Support states are explicit: supported, production, testing_pending, legacy, and not_recommended. The Brother TD-4000 is a legacy/tested existing device. The MUNBYN 80 mm profile is testing_pending until the physical printer is tested and documented. eventBon must not claim MUNBYN support before that practical test.

For QZ Tray cashier printing, eventBon uses a dedicated QZ-compatible HTML/pixel renderer instead of the browser CSS renderer. Single-voucher mode sends one voucher as one separate QZ print job. A sale with `3 x Bier` in Einzelbons mode therefore produces three sequential QZ jobs, each containing one `1 x Bier` voucher. Combined-voucher mode sends exactly one QZ job containing all sale items and quantities.

For the Brother TD-4000 configured profile, cutting is handled by the Windows/Brother printer driver at print-job boundaries. eventBon deliberately does not send raw Brother cutter commands in this phase. This means individual vouchers must not be bundled into one multi-page QZ job, because the driver cut behavior depends on separate job boundaries.

Sales completion in QZ mode happens only after all required QZ jobs have been submitted successfully. If a later voucher fails, the sale remains stored once, the cart is not silently cleared, the failed voucher number is shown, and the same completed sale can be retried or printed through the explicit browser fallback without creating another sale or changing statistics.

This implementation is not marked fully complete until it has been verified on real Brother TD-4000 hardware with the 58 x 60 mm configured medium.

The receipt printer setup foundation stores device-local printer settings in localStorage. These include profile ID, output mode, Windows/QZ printer name, paper/profile options, test confirmation, and last test date. These settings are intentionally not event data and are not stored in Supabase.

Each sales terminal or device uses exactly one configured printer. There is no multi-printer routing per terminal. Multiple terminals at one event are supported by configuring each terminal/device with its own local printer settings.

Initial tested printer profiles:

- Generic 58 mm receipt printer
- Generic 80 mm receipt printer
- Brother TD-4000
- Generic A4 test printer

The organizer or device operator must install the printer in the operating system first for browser-print fallback and for bridge-based output where the bridge uses installed printers. eventBon then applies the selected printer profile for width, density, and tear/cut spacing. Browser printing is acceptable for setup and testing, but it is not the final cashier workflow.

Printing should be generated from recorded sales data so the printed result can be traced back to the order and event.

Bon printing is an event-period capability. Outside the active event period or an explicitly enabled usage window, printing should be inactive even if product setup and read-only statistics access are still available.

The architecture explicitly does not make WebUSB, WebSerial, or WebHID the core printer architecture. These browser device APIs may be explored for special cases, but they are too dependent on browser, platform, permissions, and device support to be the product foundation.

The architecture also does not make Electron the primary product. A native shell may be revisited only if the web app plus local print bridge cannot satisfy field requirements.

eventBon should stop treating Chrome print preview as the production cashier workflow. The preview path remains for setup, test prints, and fallback only.

Product-based printer routing, kitchen printer routing, and multiple printers per terminal are not part of the MVP. This keeps event-floor printing simple, predictable, and easier to support.

## Release Candidate Architecture Priorities

The Release Candidate roadmap is ordered around production learning first and production hardening later.

### RC-1 Product completion

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
- local print bridge as target production architecture
- QZ Tray as fast current candidate
- generic thermal printer support
- Brother TD-4000 reference implementation
- Epson and Star reference paths
- ESC/POS renderer path for Epson and Star
- Brother label/raster or Brother SDK path through the bridge
- browser print fallback
- print testing
- print documentation

### RC-3 Production Rollout

Focus:

- five real live events
- feedback collection
- UX fixes
- no major architecture changes

Typical live events:

- Reitturnier
- Feuerwehrfest
- Musikverein
- Sportveranstaltung
- Weihnachtsmarkt

### RC-4 Security Hardening

Full production security hardening happens only after successful production operation.

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

Until RC-4, avoid major architecture refactoring unless required for a release blocker. Allowed work includes bug fixes, UX improvements, printing, and product workflow improvements. Avoid large security rewrites, large database redesigns, and unnecessary RPC redesigns.

## Icon And Image Assets

Product icons and images must have clear commercial usage rights.

Default product symbols should use commercially usable open-source icon libraries. Preferred examples are Lucide, Tabler Icons, Heroicons, and Material Symbols. The exact library and license must be verified and documented for production use.

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
