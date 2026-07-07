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

- Stripe later handles event booking, organizer payment, paid extension, and invoice/payment handling outside the Bon sales workflow.
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

The exact icon library and license must be documented before production release.

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

## ADR-014 Organizer and Device Language Preferences

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

## ADR-015 Release Candidate Roadmap

### Decision

The official Release Candidate roadmap is prioritized as:

P0:

- Complete internationalization.
- Receipt printer integration.
- Printer setup wizard.

P1:

- Menu generation.
- Allergen management.
- Printable menu PDF.

P2:

- Stripe pay-per-event.
- Booking activation.
- Event extension.

### Reason

Beta readiness depends first on a consistent event-floor experience. Organizers, helpers, cashiers, dashboards, and exports must speak one selected language without mixed UI text. Physical voucher printing is the next operational risk. Menu, allergen, and printable menu support are useful event-adjacent features, but they should follow the core selling flow. Stripe pay-per-event and booking activation are commercial automation and should not block operational validation.

### Implications

- The first P0 implementation step is a full internationalization audit and cleanup.
- Receipt printer integration and the printer setup wizard are P0 priorities, but are not implemented until after the i18n pass.
- Stripe remains separate from Bon sales and stays in P2 for the Release Candidate phase.
- P1 menu and allergen work must not turn eventBon into inventory, accounting, or restaurant management software.
