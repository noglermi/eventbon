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

The product deliberately avoids back-office complexity. There is no dashboard in the MVP, no separate article management, no invoices, no receipts, no taxes, and no accounting.

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
