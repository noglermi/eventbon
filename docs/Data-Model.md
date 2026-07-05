# Data Model

## Purpose

This document describes the conceptual MVP data model. It is not an implementation schema.

All persistent data belongs in Supabase.

The core business object is a booked event. The organizer account may own multiple booked events over time, but each event carries its own usage period, print active period, post-event access period, status, products, groups, and helper access.

User-facing product language uses Veranstalter. Internally, the data model may still use tenant and tenant_id for multi-tenant boundaries. Avoid user-facing Mandant.

Milestone 5.1 introduces Organizer as the explicit commercial owner of booked events:

- Organizer owns events.
- Events contain products.
- Events contain sales.
- Events produce statistics.

Helpers belong to individual events only. They are not the organizer and are not global users in the product concept.

The default helper model is assignment-based, not account-first. A helper belongs to one event through an invitation and only needs to enter a name in Version 1.

## Core Entities

### Organizer

Represents the commercial customer that books and owns events.

Suggested fields:

- id
- email
- name
- company
- phone
- created_at

An organizer can own multiple events over time. Later authentication should connect a Supabase Auth user to an organizer record.

### Tenant

Temporary compatibility layer for the earlier multi-tenant schema.

tenant_id should remain in the implementation until authentication, Stripe, and full tenant handling are reintroduced. User-facing product concepts should use Organizer or Veranstalter, not tenant or Mandant.

Suggested fields:

- id
- name
- created_at

### Event

Represents a booked event where vouchers are configured, sold, printed, and later reviewed.

Suggested fields:

- id
- organizer_id
- tenant_id
- name
- starts_at
- ends_at
- preparation_starts_at
- access_until
- print_active_from
- print_active_until
- post_event_access_until
- retention_until
- print_mode
- status
- created_at
- updated_at

Suggested statuses:

- booked
- preparation
- active
- post_event_read_only
- expired
- archived

Each event belongs to one organizer. tenant_id remains as a temporary compatibility layer. Bon printing should only be allowed during the active print window or another explicitly activated usage window. Before the event, product and setting configuration may be allowed without active Bon printing. After the event, the sales terminal becomes inactive while statistics and export remain available during the post-event access period.

### Event Helper Access

Represents a helper or volunteer invited to a booked event.

Suggested fields:

- id
- tenant_id
- event_id
- display_name
- invitation_method
- invitation_token
- access_code
- user_id
- role
- permissions
- invited_at
- accepted_at
- created_at

Helpers can access only the booked event they were invited to. They can use the sales terminal for that event, cannot change booking, payment, or license data, and may have restricted permissions.

Helpers are event-scoped access records, not global users across all organizer events in the product concept.

In Version 1, user_id is optional because no permanent helper account is required. A future permanent helper account may be linked to multiple event-helper assignments, but the event-helper assignment remains the primary access record.

### Sales Tile

Represents a sellable voucher tile in the terminal.

Suggested fields:

- id
- tenant_id
- event_id
- name
- price
- group
- color
- icon
- image_url
- image_crop_zoom
- image_crop_x
- image_crop_y
- position
- is_active
- created_at
- updated_at

Product images are stored durably in Supabase Storage in the product-images bucket. The products.image_url field stores the public image URL or storage reference used by the sales terminal. Browser object URLs are only local previews and must not be treated as persistent data.

The product position is persisted per event and used for stable display order. Products are loaded by group_key and then position.

Allowed persisted group_key values:

- drinks
- food
- desserts
- other

The UI may translate these keys into localized group labels such as Getränke, Speisen, Desserts, and Sonstiges.

### Sale

Represents one completed checkout.

Suggested fields:

- id
- tenant_id
- event_id
- total_amount
- payment_method
- payment_status
- cash_received_amount
- change_amount
- created_at

Payment methods:

- cash
- manual_card

### Sale Item

Represents one line in a completed sale.

Suggested fields:

- id
- tenant_id
- event_id
- sale_id
- sales_tile_id
- name_snapshot
- price_snapshot
- group_snapshot
- quantity
- line_total

Snapshot fields preserve the sold item details even if a tile is edited later.

### Voucher

Represents a voucher created for printing.

Suggested fields:

- id
- tenant_id
- event_id
- sale_id
- sale_item_id
- name_snapshot
- group_snapshot
- printed_at
- created_at

## Tenant Boundaries

Every business record should be tenant-scoped.

Tenant-aware records include:

- events
- sales tiles
- sales
- sale items
- vouchers
- helper access records
- access extensions

Tenant separation should be enforced consistently in application logic and Supabase security policies.

Event boundaries matter inside the tenant. A helper invited to one event should not automatically access another event owned by the same organizer.

The organizer-facing navigation should start from Meine Veranstaltungen: a list of booked events owned by the organizer account.

Future ownership and access should flow as:

- Supabase Auth user
- Organizer
- Events
- Event-scoped helpers

The helper access chain should flow as:

- Organizer
- Events
- Helpers
- Sales

Helpers never own events.

## Summary Data

Simple statistics can be calculated from sales, sale items, and vouchers.

Required summary views:

- total sales amount
- completed sales count
- voucher count
- totals by sales tile
- totals by group
- totals by payment method

## CSV Export

CSV export should use completed sales data and include enough information for simple event review.

Suggested columns:

- sale_id
- created_at
- payment_method
- tile_name
- group
- quantity
- unit_price
- line_total
- sale_total

The CSV export is not an invoice, receipt, tax report, or accounting export.

CSV is a temporary export format. For Version 1, an Excel export (`.xlsx`) is preferred for organizer-facing event review.

## Future Integration Readiness

Stripe and SumUp readiness can be supported by reserving a payment reference model later.

The MVP should avoid hard-coding provider details into sales records. Provider-specific data should be isolated when payment integrations are added.

Stripe later handles event booking, organizer payment, paid extension, and invoice/payment handling outside the Bon sales workflow. This is separate from visitor payments and Bon sales.

Offline license tokens must represent the booked event and its allowed usage period. A future offline version must enforce preparation mode, active sales and printing mode, read-only post-event mode, expiry, and paid extension.
