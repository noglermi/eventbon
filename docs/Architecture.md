# Architecture

## Overview

eventBon uses a simple user experience on top of a scalable hosted architecture.

Core stack:

- Next.js for the application.
- Supabase for all data storage.
- Vercel for deployment.

The system is multi-tenant by design and integration-ready for Stripe and SumUp.

## Architectural Principles

- Keep the sales flow simple.
- Store all persistent data in Supabase.
- Keep tenant boundaries explicit in the data model.
- Design payment handling as an abstraction from the beginning.
- Avoid local-only state for business records.
- Prefer small, understandable modules over broad platform abstractions.

## Application Shape

The MVP application centers on one primary experience:

- Sales terminal for a single event.

Supporting capabilities exist only where they are required by that terminal:

- Editable sales tiles.
- Shopping cart.
- Cash change helper.
- Manual card confirmation.
- Browser voucher printing.
- Simple statistics.
- CSV export.

There is no dashboard in the MVP.

## Multi-Tenant Design

eventBon must support multiple tenants even if the MVP interface exposes only a single event flow.

Tenant-aware records should include a tenant reference. Event, tile, order, payment, voucher, and summary data should be scoped to the owning tenant.

Tenant separation should be enforced at the data access layer and, where applicable, by Supabase row-level security.

## Supabase

All application data is stored in Supabase.

Supabase responsibilities:

- tenants
- events
- sales tiles
- sales orders
- order items
- payment confirmations
- printed voucher records
- summary and export data

Supabase should be treated as the source of truth for sales and voucher records.

## Vercel

Vercel hosts the Next.js application.

Deployment should remain simple:

- environment-based Supabase configuration
- production deployment on Vercel
- preview deployments for validation

## Event Booking And Usage Period

eventBon can be booked for a defined event usage period.

The booking defines:

- preparation period
- event period
- post-event access period
- optional paid extension

The booked usage period controls access to eventBon as a product rental. It does not change the Bon sales workflow and does not make eventBon a cash register for event visitor payments.

## Future Offline License Period

For a future offline-capable version, the booked usage period must also be represented as a local license period.

The offline version must be able to run without internet during the booked time window. The local license period should cover the same access phases as the online booking:

- preparation period
- event period
- post-event access period
- optional paid extension

After the local license expires:

- sales terminal becomes inactive
- statistics and export remain read-only for a defined grace period
- paid extension can reactivate access

This is an architectural readiness requirement only. The MVP does not implement offline mode or local license enforcement.

## Payment Readiness

The MVP supports:

- cash payments with a change helper
- manual card confirmation

The architecture must remain ready for:

- Stripe
- SumUp

Payment providers should be modeled as replaceable adapters. The sales terminal should not depend directly on provider-specific logic.

Stripe readiness is for eventBon rental and account access, separate from Bon sales. Stripe must later support:

- event rental purchase
- duration-based access
- paid extension
- license activation token for offline use
- renewal/extension flow
- invoice/payment handling outside the Bon sales workflow

eventBon still does not process event visitor payments as a cash register.

## Printing

The MVP uses browser voucher printing.

Printing should be generated from recorded sales data so the printed result can be traced back to the order and event.

## Explicit Exclusions

The architecture should not introduce systems for:

- invoices
- receipts
- taxes
- accounting
- inventory management
- restaurant table service
- ERP workflows
