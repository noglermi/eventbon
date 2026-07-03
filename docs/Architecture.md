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
- Treat the booked event as the core business object.
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

Tenant-aware records should include a tenant reference. Booked event, product, sale, payment, voucher, helper access, and summary data should be scoped to the owning tenant.

Tenant separation should be enforced at the data access layer and, where applicable, by Supabase row-level security.

The organizer account may own multiple booked events over time. Helpers and volunteers are invited into specific booked events and should not automatically gain access to other events owned by the same organizer.

## Supabase

Supabase is the central online data store for eventBon.

All hosted application data is stored in Supabase. The online version treats Supabase as the source of truth for tenants, events, products, sales, sale items, voucher records, access periods, and exportable summaries.

Supabase responsibilities:

- tenants
- events
- products
- sales
- sale items
- payment confirmations
- printed voucher records
- access extension records
- summary and export data

Supabase should be treated as the source of truth for sales and voucher records.

A future offline-capable version may use a local storage layer or local database during the booked license period. That local layer must remain separate from the online source-of-truth model and must reconcile with the hosted model only when offline mode is explicitly designed.

## Vercel

Vercel hosts the Next.js application.

Deployment should remain simple:

- environment-based Supabase configuration
- production deployment on Vercel
- preview deployments for validation

## Event Booking As Core Object

eventBon is built around booked events, not generic permanent software workspaces.

The core business object is a booked event. A customer books eventBon for a specific event and usage period. For example, a riding tournament organizer can book eventBon for a tournament from 28.07. to 30.07.

Each booked event has:

- organizer or tenant
- event name
- date range
- access period
- print active period
- post-event access period
- status
- products and groups
- invited helpers

## Event Booking And Usage Period

eventBon can be booked for a defined event usage period.

The booking lifecycle is:

- booking or purchase
- preparation period
- event period
- active Bon printing during event period
- post-event access period
- optional paid extension
- data archived under the organizer account for a defined retention period

The booked usage period controls access to eventBon as a product rental. It does not change the Bon sales workflow and does not make eventBon a cash register for event visitor payments.

Bon printing should only be allowed during the active event period or another explicitly activated usage window. Before the event, the organizer may configure products and settings, but active Bon printing is disabled unless explicitly enabled. After the event, the sales terminal becomes inactive while statistics and export remain available during the post-event access period. A paid extension can prolong access.

## Roles And Access

### Organizer

The organizer:

- books the event
- pays for the eventBon usage period
- defines event name, date range, print mode, products, groups, and access rules
- can invite helpers

### Helpers And Volunteers

Helpers and volunteers:

- can access only the booked event they were invited to
- can use the sales terminal for that event
- cannot change booking, payment, or license data
- may have restricted permissions

## Future Offline License Period

For a future offline-capable version, the booked usage period must also be represented as a local license period.

The offline version must be able to run without internet during the booked time window. The local license period should cover the same access phases as the online booking:

- preparation period
- active sales and printing period
- read-only post-event access period
- optional paid extension

After the local license expires:

- sales terminal becomes inactive
- statistics and export remain read-only for a defined grace period
- paid extension can reactivate access

Offline license tokens must represent the booked event and its allowed usage period. The offline version must enforce preparation mode, active sales and printing mode, read-only post-event mode, expiry, and paid extension.

This is an architectural readiness requirement only. The MVP does not implement offline mode or local license enforcement.

## Payment Readiness

The MVP supports:

- cash payments with a change helper
- manual card confirmation

The architecture must remain ready for:

- Stripe
- SumUp

Payment providers should be modeled as replaceable adapters. The sales terminal should not depend directly on provider-specific logic.

Stripe readiness is for eventBon event booking, organizer payment, paid extension, and account access, separate from Bon sales. Stripe rental and payment handling must remain outside the Bon sales workflow. Stripe must later support:

- event rental purchase
- duration-based access
- paid extension
- license activation token for offline use
- renewal/extension flow
- invoice and payment handling for the organizer outside the Bon sales workflow

eventBon still does not process event visitor payments as a cash register.

## Printing

The MVP uses browser voucher printing.

Printing should be generated from recorded sales data so the printed result can be traced back to the order and event.

Bon printing is an event-period capability. Outside the active event period or an explicitly enabled usage window, printing should be inactive even if product setup and read-only statistics access are still available.

## Explicit Exclusions

The architecture should not introduce systems for:

- invoices
- receipts
- taxes
- accounting
- inventory management
- restaurant table service
- ERP workflows
