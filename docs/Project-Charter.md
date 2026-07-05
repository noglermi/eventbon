# Project Charter

## Product

eventBon is the simplest voucher printing system for events.

It helps event teams sell vouchers, calculate cash change, print vouchers in the browser, and produce a simple sales summary.

eventBon is event-booking based. The customer books eventBon for a specific event and usage period instead of primarily subscribing to a generic permanent software workspace.

The commercial user model starts with a registered organizer user. The organizer account owns events, can create multiple events over time, and pays separately for each new event before that event becomes active. eventBon is pay-per-event first, not primarily a subscription model.

The user-facing product language is centered on the Veranstalter. Internally, the data model may still use tenant and tenant_id, but user-facing concepts should avoid Mandant. The main organizer-facing entry point is Meine Veranstaltungen.

The organizer is the commercial customer. The product ownership structure is:

- Organizer owns events.
- Events contain products.
- Events contain sales.
- Events produce statistics.

Helpers belong to individual events only. They are not the organizer and do not own booked events.

Helper access should be deliberately lightweight. The product concept is:

- Organizer books an event.
- Organizer invites helpers.
- Helpers work only for this event.

In Version 1, helper registration should take less than one minute. Helpers can join through a QR code, invitation link, or event access code and only enter their name. No email and no password are required in Version 1.

## Mission

Sell vouchers.

Calculate change.

Print vouchers.

Generate a simple sales summary.

Nothing else.

## Non-Goals

eventBon is not:

- a cash register
- POS software
- accounting software
- inventory management
- ERP
- restaurant software

The product must not drift into general point-of-sale, finance, stock, restaurant, or enterprise operations features.

## Target Use Case

eventBon is for a single event where staff sell voucher products from a simple terminal. A voucher product can represent a drink, food item, dessert, or other event item. Staff build a cart, confirm the payment method, print vouchers, and continue serving the next guest.

eventBon itself can be booked for a defined event usage period. That booking may include a preparation period, event period, post-event access period, and optional paid extension.

Example:

- a riding tournament organizer books eventBon for a tournament from 28.07. to 30.07.
- before the event, the organizer configures products, groups, print mode, helpers, and access rules
- during the active event period, Bons can be sold and printed
- after the event, the sales terminal becomes inactive while statistics and export remain available during the post-event access period

The eventBon rental payment is separate from Bon sales. eventBon does not process event visitor payments as a cash register.

Stripe is used only for event booking payment, event activation, paid extension, and invoices or payment handling for the organizer. Stripe is never used for Bon sales to visitors. Visitor payments remain outside Stripe unless a future SumUp integration confirms payment externally.

## Roles

### Organizer

The organizer books the event, pays for the eventBon usage period, defines event name, date range, print mode, products, groups, and access rules, and can invite helpers.

An organizer can own multiple booked events over time. Each booked event has its own lifecycle, configuration, helpers, and access periods.

The organizer is the commercial customer and future payment owner for booked event usage.

The organizer's past events remain visible in Meine Veranstaltungen according to archive and retention rules, so the organizer can return to previous event records without turning eventBon into a permanent POS workspace.

### Helpers And Volunteers

Helpers and volunteers can access only the booked event they were invited to. They can use the sales terminal for that event, cannot change booking, payment, or license data, and may have restricted permissions.

Helpers are event-scoped in the product concept. They are not global users across all organizer events.

Helpers can open the assigned event, sell Bons, and print Bons. They cannot manage subscriptions, change organizer information, access other events, or manage billing.

Later, helpers may optionally create permanent accounts if they work at several events, the same club uses eventBon repeatedly, or helper activity needs to be tracked over time. This must remain optional; the default flow remains QR code or invitation link, enter name, and start working.

## Event Lifecycle

Each booked event moves through:

- preparation period
- active sales and printing period
- post-event statistics and export period
- archive or retention period
- optional paid extension

## Design Principles

### Simple for the User

The sales terminal is the product. Users should not need training, setup knowledge, or back-office navigation during active sales.

### Scalable in the Architecture

The system should remain small in the interface while being prepared for multi-tenant operation, hosted deployment, and future payment integrations.

### Invisible Complexity

Tenant separation, storage, deployment, permissions, and payment readiness belong in the architecture. They should not make the selling flow harder.

Future offline readiness also belongs in the architecture. If an offline-capable version is introduced, the booked usage period must be represented as a local license period so the app can run without internet during the booked time window. After expiry, sales access should stop while statistics and export can remain read-only for a defined grace period.

## Scope Control

Every proposed feature should be checked against the mission:

- Does it help sell vouchers?
- Does it help calculate change?
- Does it help print vouchers?
- Does it help generate a simple sales summary?

If the answer is no, the feature is outside the product scope.
