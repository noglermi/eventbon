# Data Model

## Purpose

This document describes the conceptual MVP data model. It is not an implementation schema.

All persistent data belongs in Supabase.

The core business object is a booked event. The organizer account may own multiple booked events over time, but each event carries its own usage period, print active period, post-event access period, status, products, groups, and helper access.

## Core Entities

### Tenant

Represents an organizer account or organization using eventBon.

Suggested fields:

- id
- name
- created_at

### Event

Represents a booked event where vouchers are configured, sold, printed, and later reviewed.

Suggested fields:

- id
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

Each event belongs to one organizer or tenant. Bon printing should only be allowed during the active print window or another explicitly activated usage window. Before the event, product and setting configuration may be allowed without active Bon printing. After the event, the sales terminal becomes inactive while statistics and export remain available during the post-event access period.

### Event Helper Access

Represents a helper or volunteer invited to a booked event.

Suggested fields:

- id
- tenant_id
- event_id
- user_id
- role
- permissions
- invited_at
- accepted_at
- created_at

Helpers can access only the booked event they were invited to. They can use the sales terminal for that event, cannot change booking, payment, or license data, and may have restricted permissions.

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
- sort_order
- is_active
- created_at
- updated_at

Allowed groups:

- Drinks
- Food
- Desserts
- Other

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

## Future Integration Readiness

Stripe and SumUp readiness can be supported by reserving a payment reference model later.

The MVP should avoid hard-coding provider details into sales records. Provider-specific data should be isolated when payment integrations are added.

Stripe later handles event booking, organizer payment, paid extension, and invoice/payment handling outside the Bon sales workflow. This is separate from visitor payments and Bon sales.

Offline license tokens must represent the booked event and its allowed usage period. A future offline version must enforce preparation mode, active sales and printing mode, read-only post-event mode, expiry, and paid extension.
