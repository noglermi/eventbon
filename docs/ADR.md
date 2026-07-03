# Architecture Decision Records

## ADR-001 Offline Capability

eventBon is online-first but offline-capable by design.

The online version remains primary. A future offline version can run locally during the booked license period.

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
