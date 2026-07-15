# Architecture Decision Records

## ADR-001 Offline Capability

eventBon is online-first but offline-capable by design.

The online version remains primary. A future offline version can run locally during the booked license period.

Offline license tokens must represent the booked event and its allowed usage period. The offline version must enforce preparation mode, active sales and printing mode, read-only post-event mode, expiry, and paid extension.

After expiry:

- sales terminal becomes inactive
- statistics and export remain read-only for a defined grace period
- paid extension can reactivate access

## ADR-002 Two GUI Modes

eventBon uses one shared application with two GUI modes.

Compact Mode is for tablets and smaller notebooks. Wide Mode is for large screens.

Both modes use the same workflow. They differ by layout only.

Compact Mode is the default and primary mode.

## ADR-003 Event-Level Print Mode

Print mode is configured per event.

Options:

- single vouchers
- combined voucher

There is no per-product print mode in the MVP.

## ADR-004 No Separate Article Management

Tiles are configured directly inside the sales terminal.

Empty tiles can become products. Existing tiles can be edited in place.

There is no separate article database UI in the MVP.

## ADR-005 Bonierung, Not Cash Register

eventBon creates Bons and vouchers.

It is not a cash register.

eventBon does not create or manage:

- invoices
- receipts
- tax documents
- accounting
- POS workflows
- fiscalization

## ADR-006 Event Booking as Core Business Object

### Decision

eventBon is built around booked events, not generic permanent software workspaces.

A customer books eventBon for a specific event and usage period. The organizer account may own multiple booked events over time, but each booked event carries its own date range, access period, print active period, post-event access period, status, products, groups, and invited helpers.

### Reason

The product is rented for temporary events. This supports Stripe rental logic, offline licensing, helper access, and post-event statistics access.

### Implications

- Stripe handles event booking, organizer payment, paid extension, and invoice/payment handling outside the Bon sales workflow.
- Bon printing is allowed only during the active event period or another explicitly activated usage window.
- Before the event, the organizer may configure products and settings without active Bon printing unless explicitly enabled.
- After the event, the sales terminal becomes inactive while statistics and export remain available during the post-event access period.
- Helpers and volunteers can access only the booked event they were invited to and cannot change booking, payment, or license data.
- Offline license tokens must represent the booked event and enforce preparation, active sales and printing, read-only post-event access, expiry, and paid extension.

## ADR-007 Organizer Event Workspace

### Decision

The main organizer-facing entry point is Meine Veranstaltungen, not a generic dashboard.

User-facing product language uses Veranstalter. Internally, the data model may still use tenant and tenant_id for multi-tenant boundaries, but user-facing concepts should avoid Mandant.

### Reason

Organizers book eventBon for specific events. The UI and data model should reflect that.

### Implications

- An organizer can own multiple booked events over time.
- Helpers are invited per event and can access only the event they were invited to.
- Helpers are not global users in the product concept.
- Each booked event has a preparation period, active sales and printing period, post-event statistics and export period, archive or retention period, and optional paid extension.
- Opening an event from Meine Veranstaltungen leads into the sales terminal for that selected event.

## ADR-008 Pay-Per-Event Commercial Model

### Decision

eventBon starts with a registered organizer user. The organizer account owns events and can create multiple events over time.

Each new event requires a separate payment before it becomes active. eventBon is pay-per-event first, not primarily a subscription model.

The organizer's past events remain visible in Meine Veranstaltungen according to the configured access, archive, and retention periods.

Stripe is used only for:

- event booking payment
- event activation
- paid extension
- invoices and payment handling for the organizer

Stripe is never used for Bon sales to visitors.

### Reason

eventBon is rented for temporary events. A pay-per-event model matches the product's event lifecycle, keeps Stripe tied to organizer booking and activation, and avoids turning the sales terminal into a cash register or POS payment system.

### Implications

- Organizer accounts are long-lived, but paid access is event-specific.
- Each booked event has its own payment, active usage window, post-event access, and possible extension.
- Meine Veranstaltungen contains current and past events owned by the organizer.
- Bon sales remain separate from Stripe. Visitor payments remain outside Stripe unless a future SumUp integration confirms payment externally.

## ADR-009 Organizer Account Foundation

### Decision

eventBon introduces Organizer as the explicit commercial owner of booked events before implementing authentication.

The product hierarchy is:

- Organizer
- Events
- Products, sales, and statistics inside each event

tenant_id remains in the schema as a temporary compatibility layer until authentication, Stripe, and full tenant handling are reintroduced.

### Reason

The organizer is the customer who books and pays for eventBon usage. Helpers are invited to individual events later, but they are not the owner of events and are not global organizer accounts.

### Implications

- Events receive organizer_id.
- The event repository can query by organizer.
- The MVP can keep using a mock organizer until Supabase Auth is added.
- Future access should flow from Supabase Auth user to Organizer, then Events, then event-scoped Helpers.

## ADR-010 Helper Access Model

### Decision

Helpers should have the simplest possible access.

They are not the commercial customer. They are not permanent platform users by default. Helpers belong only to one specific event.

The product concept is:

- Organizer
- Books an event
- Invites helpers
- Helpers work only for this event

Version 1 helper access uses invitations. Possible invitation methods are:

- QR code
- invitation link
- event access code

The helper opens the invitation and only enters a name. No email and no password are required in Version 1. The helper is immediately assigned to the event.

### Reason

During events many helpers are volunteers, temporary workers, family members, or club members. Registration must take less than one minute.

### Implications

Organizers can:

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

The architecture remains:

- Organizer
- Events
- Helpers
- Sales

Helpers never own events. Helpers are always assigned to one event.

Later, a helper may optionally create a permanent account if the same helper works at several events, the same club uses eventBon repeatedly, or helper activity needs to be tracked over time. This is optional. The default helper flow remains QR code or invitation link, enter name, and start working.

Future versions may optionally support email login, Supabase Auth accounts, reusable helper accounts, permission profiles, and activity history per helper. These are not part of the MVP.

## ADR-011 Operational Sales History vs Business Analytics

### Decision

Sales have two different purposes and therefore need two separate product surfaces.

Operational sales history belongs in the Sales Terminal. It supports the cashier during the event. A later compact panel named Letzte Verkäufe should show approximately the last 10 sales. Each entry should contain:

- time
- total amount
- payment type
- number of Bons

Clicking an entry opens a read-only detail view with:

- sold products
- quantities
- payment
- change
- print mode

Sales cannot be edited. There is no delete function and no cancellation workflow in the MVP.

Sales analytics belongs on a dedicated organizer-facing analytics page. The organizer does not need to browse individual sales; the organizer needs an event-level business overview.

Suggested analytics sections:

- Overview: total revenue, number of sales, number of printed Bons, average sale value
- Top Products: product, quantity, revenue
- Payment Summary: cash and card
- Time Analysis: revenue by hour
- Filters: today, entire event, and later custom period

### Reason

Operational sales history and business analytics are two different use cases.

The cashier needs speed. The organizer needs information.

### Implications

- Recent sales should stay compact and close to the active selling workflow.
- Recent sales should help resolve customer questions, wrong payments, wrong Bon counts, and accidental double sales.
- Analytics should not clutter the Sales Terminal.
- The organizer-facing analytics page can aggregate sales, sale items, payment methods, and time data.
- CSV export remains a later separate milestone.

## ADR-012 Organizer Dashboard vs Helper Sales Terminal

### Decision

Organizer and helper navigation are separate product flows.

Organizer flow:

- Login
- Meine Veranstaltungen
- Event dashboard or statistics
- Event sales terminal
- Event settings and products

Helper flow:

- Invitation link, QR code, or event access code
- Enter name
- Directly enter the assigned event sales terminal

Helpers do not use event selection, do not see the organizer dashboard, and cannot access other events.

Dashboard, analytics, statistics, settings, products, billing, and booking management are organizer-facing surfaces. The Sales Terminal remains the focused helper and cashier surface during the event.

### Reason

Organizers need ownership, configuration, booking, and event review. Helpers need the shortest possible path to selling Bons at one assigned event.

Keeping these flows separate protects the event-floor workflow from organizer-only complexity.

### Implications

- Meine Veranstaltungen remains organizer-only.
- Event dashboards and analytics are organizer-only.
- Helpers enter directly into the assigned event terminal.
- Operational recent sales can live inside the Sales Terminal because they support cashier control during the event.
- Future helper invitations must not require a dashboard or global event selection.

## ADR-013 Icon and Image Licensing

### Decision

eventBon must only use icons and images with clear commercial usage rights.

Standard product icons must come only from commercially usable open-source icon libraries. Preferred examples are:

- Lucide
- Tabler Icons
- Heroicons
- Material Symbols

The exact icon library and license must be documented for production use.

Unicode emojis may be used as fallback or simple symbols. They are rendered by the operating system or browser.

eventBon must not ship with copied product photos from the internet. No icons or images may be copied from Google Images or other unclear sources.

Product images are uploaded by the organizer. The organizer is responsible for having the rights to uploaded images.

The product principle is:

- Default: safe open-source icon.
- Optional: organizer-uploaded image.

### Reason

eventBon is a commercial product. Product icons and images appear in the sales terminal, print workflows, and potentially organizer-facing exports or public material. Assets with unclear rights create unnecessary legal and operational risk.

### Implications

- Before public rollout, verify the chosen icon library license.
- Before public rollout, document the chosen icon library and license in the project documentation.
- Before public rollout, add a note to terms or usage guidance that organizers are responsible for uploaded images.
- Development and design work must not use copied product photos or unclear internet image sources as shipped defaults.

## ADR-014 Menu Designer as Organizer Module

### Decision

The menu is a native organizer module generated directly from event data.

The organizer-facing navigation includes Speisekarte for the selected event.

The architecture is:

- Organizer
- Event
- Products
- Menu Designer
- PDF

Products remain the single source of truth. The menu is generated automatically from event products. It is not imported from Excel and not edited in Word.

The Menu Designer is a live editor. Changes immediately update the preview.

Menu options include:

- event logo
- event title
- date
- categories
- product image or icon
- product description
- price
- allergens

The output is a PDF designed for direct printing.

### Reason

Organizers need a menu as part of event preparation, not as a technical export afterthought. Treating Speisekarte as a first-class module keeps menu creation inside the same event workflow as products, prices, images, and allergens.

### Implications

- Speisekarte is organizer-only.
- Helpers do not see or manage the Menu Designer.
- Changing a product automatically updates the Sales Terminal, Dashboard, Excel Export, and Menu.
- Allergens belong to products as structured EU allergen codes. The Menu Designer displays them but does not edit them.
- Menu Designer work must not introduce Word editing, Excel imports, inventory management, restaurant operations, or accounting scope.
- Printable menu PDF belongs to the Menu Designer workflow.

## ADR-015 Organizer and Device Language Preferences

### Decision

eventBon has two language preference levels.

Organizer-facing areas use the organizer language preference. This includes login and registration, Meine Veranstaltungen, event booking, dashboard and statistics, and later account or settings pages. For now this preference is held in the organizer UI state. A later version should persist it in the organizer profile in Supabase.

Sales terminal and helper devices use a device language preference. This preference is stored in localStorage together with other device-local view settings. It is intentionally browser-specific so different devices at the same event can use different languages.

German remains the default language.

### Reason

Organizer language is part of the organizer account experience. Terminal language is part of the device setup on the event floor. Mixing both would make helper devices unexpectedly change when an organizer changes their own preference.

### Implications

- Organizer language changes must update organizer-facing UI.
- Sales terminal language changes must remain device-local.
- Device language is not event data and must not be stored in Supabase.
- No database migration is required until organizer profile persistence is implemented.

## ADR-016 Release Candidate Roadmap

### Decision

The official Release Candidate roadmap is prioritized as:

P0:

- Complete internationalization.
- Receipt printer integration.
- Printer setup wizard.

P1:

- Menu Designer inside Organizer.
- Allergen management.
- Printable menu PDF.

Commercial model:

- Stripe pay-per-event.
- Booking activation.
- Event extension.

### Reason

product readiness depends first on a consistent event-floor experience. Organizers, helpers, cashiers, dashboards, and exports must speak one selected language without mixed UI text. Physical voucher printing is the next operational risk. Menu Designer, allergen, and printable menu PDF support are useful organizer features, but they should follow the core selling flow. Stripe pay-per-event and booking activation are commercial automation and should not block operational validation.

### Implications

- The first P0 implementation step is a full internationalization audit and cleanup.
- Receipt printer integration and the printer setup wizard are P0 priorities, but are not implemented until after the i18n pass.
- Stripe remains separate from Bon sales and belongs to the productive pay-per-event business model.
- P1 Menu Designer and allergen work must not turn eventBon into inventory, accounting, or restaurant management software.

## ADR-017 Data Access vs Active Sales Access

### Decision

eventBon separates organizer data access from active sales and Bon printing access.

The organizer always keeps access to event data, products, dashboard and statistics, Excel export, helper history, and the Menu Designer according to the configured retention rules.

Active sales and Bon printing are allowed only during paid active event days.

Meine Veranstaltungen uses the lifecycle states:

- Upcoming
- Active today
- Completed

The organizer event list separates open events from completed events. Completed events remain visible but are no longer sellable.

Paid extensions may only add today or future days. Extensions into the past are not allowed.

### Reason

Organizers need long-term access to event information and results, but eventBon is paid per event usage period. Keeping data access and active selling separate protects the commercial model while preserving useful organizer history.

### Implications

- Past events stay visible in Meine Veranstaltungen.
- Dashboard, Excel export, helper history, and menu access remain organizer-facing review tools.
- The Sales Terminal blocks new sales and Bon printing outside paid active event days.
- Upcoming events can be prepared before the event, but sales are inactive until the paid event window.
- Stripe handles paid event activation and extensions, but Stripe is still separate from Bon sales.

## ADR-018 Product First - Security Hardening After production

### Decision

eventBon prioritizes a complete, testable event workflow before production security hardening.

Production security hardening is an ongoing required workstream alongside real field operation.

Security remains mandatory for the public product.

### Reason

While the product is evolving, the application is still evolving:

- database schema
- RPC signatures
- helper workflow
- printing
- dashboard
- organizer workflow

Implementing production-grade Row Level Security too early would create unnecessary rework and increase regression risk while the workflow is still being validated with real events.

### Implications

RC-1 focuses on Product completion:

- UX
- bug fixes
- tablet optimization
- sales workflow
- password reset
- Menu Designer
- printer support
- complete event workflow

RC-2 focuses on receipt printing:

- simplified Bon printer setup wizard
- QZ Tray cashier printing
- generic thermal printer support
- Brother TD-4000 reference implementation
- Epson reference profiles
- print testing
- print documentation

RC-3 focuses on production operation:

- five real live events
- feedback collection
- UX fixes
- no major architecture changes

RC-4 focuses on security hardening:

- Full Row Level Security
- RPC security review
- storage policies
- server-side validation
- token review
- permission review
- security testing
- DSGVO review
- production hardening

Until RC-4, major architecture refactoring should be avoided unless required for a release blocker. Allowed work includes bug fixes, UX improvements, printing, and product workflow improvements. Large security rewrites, large database redesigns, and unnecessary RPC redesigns should be avoided.

## ADR-019 Guided Printer Setup

### Decision

eventBon provides a guided Printer Setup Wizard as a major product feature.

The wizard helps a non-technical Veranstalter configure Bon printing without reading a printer manual.

The normal setup flow is intentionally limited to:

1. Bondruckermodell auswählen.
2. Confirm QZ Tray or download it.
3. Select the Bon printer from the QZ Tray printer list.
4. Testbon drucken.

Visible model options start with:

- Brother TD-4000
- MUNBYN
- Weitere

The Brother TD-4000 is the first real thermal printer reference device for hardware validation. The Brother QL-720NW is not the main Bon printer reference.

Later versions may certify Epson and Star printers and may add advanced adapters behind the same simple setup concept.

### Reason

Printing is one of the highest-risk event-floor workflows. A Bon printer often has to be configured shortly before an event by people who are not technical.

A guided setup lowers support risk and makes receipt printing testable before active sales start.

The normal user does not care about browser printing, Windows printer concepts, ESC/POS, drivers, or print architecture. The wizard must therefore hide these details and optimize for the first successful test Bon.

### Consequences

- Printer setup becomes an explicit organizer/device workflow.
- The wizard must include a test print before the device is considered ready.
- Printer settings remain device-local and are stored in localStorage, not in Supabase.
- Each terminal keeps its own Bon printer profile and QZ printer selection.
- The Brother TD-4000 profile is the hardware reference for real thermal printing.
- Epson and Star profiles require later certification with real hardware.
- The printer feature must stay focused on Bon printing and must not introduce fiscalization, cash drawer control, receipt accounting, or general POS hardware scope.
- Browser test print, Windows printer setup steps, and Drucker Testlabor do not belong in the normal assistant.

See `docs/Printer-Setup-Wizard.md` for the full concept.

## ADR-020 One Terminal = One Printer, One Device = One Local Configuration

### Decision

Each sales terminal or device uses exactly one configured printer.

There is no multi-printer routing per terminal.

Each device has one local configuration. Local configuration includes:

- printer profile
- paper width
- cut mode
- zoom
- device language

These settings are never event-specific.

### Reason

eventBon must remain simple and reliable during events. Printer routing would add complexity, increase setup effort, and create additional support risk during live event operation.

One event may be used from multiple terminals. Each terminal needs local control over its printer, display zoom, and language without changing the event setup for other terminals.

### Consequences

- printer settings are device-local
- zoom settings are device-local
- device language is device-local
- each terminal can have its own printer
- multiple terminals at one event are supported
- each terminal prints to its own configured printer
- no product-based printer routing in the MVP
- no multiple printers per terminal
- local device configuration is stored in localStorage, not in Supabase
- event settings remain separate from device settings

## ADR-021 Local Print Bridge as Target Receipt Printing Architecture

### Decision

eventBon remains a web app.

Reliable production receipt printing uses a local bridge path. The current Windows path is QZ Tray.

EventBon separates two print worlds:

- Bondruck: QZ Tray plus selected Bon printer for all Bonierungen.
- Seitendruck: normal Windows/browser/PDF printing for Speisekarten, lists, reports, PDFs, and administrative output.

Target receipt-printing architecture:

- eventBon Web App
- PrintService
- PrintJob IR
- Renderer Adapters
- Output Adapters

The PrintJob IR contains:

- voucher lines
- print mode
- paper profile
- printer profile
- cut mode
- reprint marker
- helper or terminal context if needed

Renderer Adapters:

- Browser CSS renderer
- ESC/POS renderer
- Raster/PDF label renderer
- Vendor SDK renderer later

Output Adapters:

- QZ Tray output for Bondruck
- Browser/PDF output for Seitendruck
- Epson ePOS network adapter
- Star webPRNT network adapter

Technology direction:

- Primary cashier path: QZ Tray for Bondruck
- Browser/PDF printing: Seitendruck only
- Printer-specific adapters: ESC/POS for Epson and Star, Brother label/raster or Brother SDK through the bridge, Epson ePOS, and Star webPRNT

### Reason

Real Brother TD-4000 testing showed that browser printing can reach the printer, but browser preview and CSS pagination are not reliable enough for production event-floor checkout. Test prints produced repeated or cut Bons, and single-voucher sales did not reliably print every voucher.

Cashiers need a fast, predictable print path. They should not fight Chrome print preview during active sales.

A local print bridge keeps eventBon as a web app while allowing direct or near-direct access to locally installed printers, printer-specific command formats, and better diagnostics.

### Consequences

- Browser printing remains useful for Seitendruck, not as the normal Bon printer assistant path.
- The Printer Setup Wizard must support a short local device setup focused on QZ Tray and test Bon success.
- PrintService must work with a printer-independent PrintJob IR.
- Epson and Star can be supported through ESC/POS and vendor network protocols where suitable.
- Brother TD printers can be supported through label/raster output or Brother SDK integration through the bridge.
- QZ Tray is the fastest current candidate for validating bridge-based printing.

### Explicit Non-Decisions

- WebUSB, WebSerial, and WebHID are not the core architecture. They may be explored only for special cases.
- Electron is not the primary product. eventBon should remain a web app.
- Chrome print preview must not remain the production cashier workflow.

## ADR-022 Windows production scope

### Decision

The current external validation release is eventBon production release.

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

The production must include organizer-accessible pages for Impressum, Datenschutz, Nutzungsbedingungen, and Problem melden. These pages use production legal and support text and must stay legally reviewed as the product evolves.

### Reason

Receipt printing is the highest-risk product workflow. A narrow Windows production release reduces variables while validating the real event workflow with QZ Tray and the Brother TD-4000 reference printer.

### Consequences

- iPad and Android are not implemented for this production.
- Stripe pay-per-event activation belongs to the productive commercial model and remains separate from Bon sales.
- The printer test lab remains available for diagnostics but should not be prominent to ordinary organizers.
- The QZ/Brother TD-4000 Bondruck path is the printing architecture v1 reference. Future print work should preserve this behavior while adding model support, UX improvements, and documentation.
- Production RLS/security review remains P0 before broader production release.

## ADR-023 Printing Architecture v1 Reference

### Decision

The productive EventBon Bondruck architecture is frozen as printing architecture v1.

The validated reference path is:

- `https://www.eventbons.com`
- QZ Tray
- server-side QZ signing
- EventBon signing certificate
- EventBon Root certificate
- Brother TD-4000
- automatic Bon printing without browser print dialog in the cashier flow
- no recurring QZ security prompt after trust was granted

Future changes to this architecture are limited to bug fixes, support for additional printer models, UX improvements, and documentation unless a major architecture change is explicitly requested.

### Reason

The current architecture has reached the first productive reference state. EventBon should now stabilize this path instead of continuing to redesign the print architecture.

### Consequences

- Browser print remains a Seitendruck path for menus, reports, PDFs, and administrative output.
- QZ Tray remains the productive Bondruck path for the Sales Terminal.
- Brother TD-4000 is the first tested reference printer and remains the regression device for print changes.
- MUNBYN remains Test ausstehend until a practical end-to-end test is complete.
- Certificate and key handling must follow the documented QZ trust workflow.
- No anonymous or untrusted QZ printing is acceptable for product operation.
