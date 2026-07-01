# MVP

## Goal

The MVP proves the core eventBon workflow:

Sell vouchers, calculate change, print vouchers, and generate a simple sales summary for a single event.

## Event Scope

The MVP supports one active event.

There is no multi-event management interface in the MVP, even though the architecture remains multi-tenant by design.

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

This keeps the MVP ready for future Stripe and SumUp integrations without requiring payment provider implementation now.

## Browser Voucher Printing

After payment confirmation, eventBon prints vouchers through the browser.

Printed vouchers should represent the purchased items clearly enough for event operations.

## Simple Statistics

The MVP includes simple statistics for the active event:

- total sales amount
- number of completed sales
- number of vouchers sold
- totals by tile
- totals by group
- totals by payment method

Statistics should remain operational and simple.

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
