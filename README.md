# eventBon

eventBon is the simplest voucher printing system for events.

Its mission is intentionally small:

- Sell vouchers.
- Calculate change.
- Print vouchers.
- Generate a simple sales summary.

Nothing else.

## What eventBon Is Not

eventBon is not:

- a cash register
- POS software
- accounting software
- inventory management
- ERP
- restaurant software

## Product Direction

eventBon exists for event teams that need a fast, focused way to sell prepaid vouchers at a single event. The user should be able to open the sales terminal, tap sales tiles, confirm payment, print vouchers in the browser, and review a simple summary at the end.

eventBon is event-booking based. A customer does not primarily subscribe to a generic permanent software account; an organizer books eventBon for a specific event and usage period. For example, a riding tournament organizer can book eventBon for a tournament from 28.07. to 30.07.

The booked event is the core business object. The organizer account may own multiple booked events over time, but each event carries its own date range, access period, print active period, post-event access period, status, products, groups, and invited helpers.

Commercially, eventBon starts with a registered organizer user. The organizer account owns events and can create multiple events over time. Each new event requires a separate payment before it becomes active. eventBon is therefore pay-per-event first, not primarily a subscription model.

The organizer is the commercial customer and owner of booked events. The product structure is:

- Organizer
- Events owned by that organizer
- Products, sales, and statistics contained within each event

User-facing product language uses "Veranstalter" for the organizer. Internally, the data model may still use tenant and tenant_id for multi-tenant boundaries, but the user-facing product should avoid "Mandant". The main organizer-facing entry point is "Meine Veranstaltungen".

Past events remain visible in "Meine Veranstaltungen" for review according to the configured access, archive, and retention periods.

Helpers and volunteers are invited per event. They can access only the booked event they were invited to and are not global users in the product concept. Helpers are not the same as the organizer and do not own events.

Version 1 helper access should be as simple as possible. The organizer books an event, invites helpers, and helpers work only for that one event. A helper invitation may use a QR code, invitation link, or event access code. The helper enters only a name, without email or password, and can then open the assigned event, sell Bons, and print Bons.

Helpers cannot manage billing, organizer information, subscriptions, bookings, or other events. A permanent helper account may be added later, but it must remain optional and must never be required for the simple event workflow.

The event lifecycle includes preparation, active sales and printing, post-event statistics and export access, archive or retention, and optional paid extension.

Sales data has two different purposes. During the event, the cashier needs operational control: a compact "Letzte Verkäufe" panel in the Sales Terminal should later show roughly the last 10 sales with time, total amount, payment type, and number of Bons. A sale entry can open a read-only detail view with sold products, quantities, payment, change, and print mode. Sales cannot be edited, deleted, or cancelled in the MVP.

The organizer needs business information, not a list of individual sales. eventBon should therefore provide a separate analytics page for total revenue, number of sales, printed Bons, average sale value, top products, payment summary, revenue by hour, and filters such as today, entire event, and later custom periods.

The product deliberately avoids back-office complexity. There is no dashboard in the MVP, no separate article management, no invoices, no receipts, no taxes, and no accounting.

Stripe later handles event booking payment, event activation, paid extensions, and invoice/payment handling for the organizer. This remains separate from visitor payments and Bon sales. Stripe is never used for Bon sales to visitors. Visitor payments remain outside Stripe unless a future SumUp integration confirms an external payment. eventBon remains not a cash register.

## Design Principles

- Simple for the user.
- Scalable in the architecture.
- Invisible complexity.

The interface should feel immediate and obvious. The architecture should still be ready for multiple tenants, hosted deployment, and future payment integrations without exposing that complexity to event staff.

## Technology Direction

eventBon is built around:

- Next.js
- Supabase
- Vercel

The architecture is multi-tenant by design. All application data is stored in Supabase. The system should be structured so Stripe and SumUp integrations can be added later without reworking the product model.

## Documentation

- [Project Charter](docs/Project-Charter.md)
- [Architecture](docs/Architecture.md)
- [MVP](docs/MVP.md)
- [Wireframes](docs/Wireframes.md)
- [Data Model](docs/Data-Model.md)
- [Roadmap](docs/Roadmap.md)

## Contributor Note

This project may use a Next.js version with breaking changes compared with common examples. Before implementing application code, read the relevant local Next.js guide in `node_modules/next/dist/docs/` and heed deprecation notices.
