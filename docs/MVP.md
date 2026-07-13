# MVP

## Goal

The MVP proves the core eventBon workflow:

Sell vouchers, calculate change, print vouchers, and generate a simple sales summary for a single event.

## Event Scope

The MVP supports one active event.

There is no multi-event management interface in the MVP, even though the architecture remains multi-tenant by design.

The product model is still event-booking based: the active event represents a booked event with its own date range, access period, print active period, post-event access period, status, products, groups, and invited helpers. The MVP may use mock or simplified state, but the product concept is a booked event rather than a generic software workspace.

## Milestone 3: Event Setup

Goal:

A user can create a usable event in less than 3 minutes.

Setup scope:

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

Event setup should be short and operational. It should lead directly into the sales terminal instead of becoming a dashboard or back-office workflow.

The access and usage period concept prepares the product for booked event usage and future offline license periods. It does not implement offline mode in the MVP.

Before the event, the organizer may configure products and settings. Active Bon printing should only be available during the active event period or an explicitly activated usage window. After the event, the sales terminal becomes inactive while statistics and export remain available during the post-event access period.

## Roles In The MVP Concept

The organizer books the event, pays for the eventBon usage period, configures event settings, and can invite helpers in later milestones.

The organizer is the commercial customer and owner of booked events. The MVP structure is:

- Organizer
- Events owned by the organizer
- Products, sales, and statistics inside each event

Helpers and volunteers are event-scoped users. They can use the sales terminal for the booked event they were invited to, cannot change booking, payment, or license data, and may have restricted permissions.

Helpers are not the same as the organizer and do not own events.

## Event-Level Print Mode

Print mode is configured per event.

MVP print mode options:

- single vouchers
- combined voucher

There is no per-product print mode in the MVP.

## Sales Tiles

Sales tiles are edited directly inside the sales terminal.

Each tile contains:

- name
- price
- optional icon
- optional drag and drop image
- color
- group

## Tile Groups

MVP tile groups:

- Drinks
- Food
- Desserts
- Other

Groups help users scan the terminal quickly. They are not inventory categories and should not imply stock tracking.

## Sales Terminal

The sales terminal is the main screen of the MVP.

It includes:

- editable sales tiles
- tile groups
- shopping cart
- quantity changes
- order total
- cash change helper
- manual card confirmation
- browser voucher printing

## Shopping Cart

The cart collects selected voucher items before payment confirmation.

Expected cart behavior:

- add tile to cart
- increase quantity
- decrease quantity
- remove item
- show total amount
- clear cart after completed sale

## Cash Change Helper

The cash helper calculates the change due from the amount tendered.

It is a helper only. eventBon is not a cash register and does not manage cash drawer operations.

## Manual Card Confirmation

The MVP allows staff to manually confirm that a card payment was completed outside eventBon.

This keeps the MVP ready for Stripe commercial billing and possible future SumUp integration while keeping visitor payments outside EventBon.

## Browser Voucher Printing

After payment confirmation, eventBon prints vouchers through the browser.

Printed vouchers should represent the purchased items clearly enough for event operations.

Bon printing is tied to the active event period or an explicitly enabled usage window. The MVP documents this rule but does not yet implement full access enforcement.

## Simple Statistics

The MVP includes simple statistics for the active event:

- total sales amount
- number of completed sales
- number of vouchers sold
- totals by tile
- totals by group
- totals by payment method

Statistics should remain operational and simple.

After the event period, statistics and export remain available during the defined post-event access period even when the sales terminal is inactive.

## CSV Export

The MVP provides CSV export for sales summary data.

The export is for simple reporting, not accounting.

## Explicit MVP Exclusions

The MVP does not include:

- dashboard
- separate article management
- invoices
- receipts
- taxes
- accounting
- inventory management
- POS features
- restaurant workflows
