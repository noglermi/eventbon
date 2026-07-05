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
