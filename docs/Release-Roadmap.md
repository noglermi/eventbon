# Release Roadmap

## Strategy

eventBon follows a product-first release strategy.

The project continues production security hardening while validating the event workflow in real field operation.

The canonical production domain is `https://eventbons.com`. Release validation must ensure that public app URLs, helper invitations, QR codes, and password reset links use this domain through `NEXT_PUBLIC_APP_URL`. Developers may override the value locally for localhost development.

Reason:

While the product is evolving, the application is still changing in these areas:

- database schema
- RPC signatures
- helper workflow
- printing
- dashboard
- organizer workflow

Implementing production-grade RLS now would create unnecessary rework and increase regression risk.

Security remains mandatory for the public product. Full production hardening is scheduled for RC-4 after successful production operation.

## Release Candidates

## Windows Production Scope

Current product status:

- Public paid product

Officially supported:

- Windows 10
- Windows 11
- Chrome
- Edge
- QZ Tray
- Brother TD-4000 as first tested printer

Planned later:

- iPad
- Android
- additional certified printers

P0 release blocker:

- reliable receipt printing through QZ Tray for the cashier workflow
- one print job per voucher
- cut after every voucher where supported
- optimized Brother TD-4000 typography and layout
- QZ installation wizard
- production RLS/security review

Commercial P0:

- Stripe pay-per-event activation
- event title correction
- paid date extension
- menu PDF
- allergen completion

P2:

- iPad
- Android
- station-level analytics
- additional printer certification

### RC-1 Product completion

Focus:

- UX
- bug fixes
- tablet optimization
- sales workflow
- password reset
- Menu Designer
- printer support
- complete event workflow

### RC-2 Receipt Printing

Focus:

- printer setup wizard
- local print bridge as target production architecture
- QZ Tray as cashier Bondruck path
- generic thermal printer support
- Brother TD-4000 reference implementation
- Epson and Star reference paths
- ESC/POS renderer path for Epson and Star
- Brother label/raster or Brother SDK path through the bridge
- browser/PDF print as Seitendruck for menus, lists, reports, and PDFs
- print testing
- print documentation

Product rule:

- one terminal/device uses one configured printer
- each terminal can have its own device-local printer settings
- multiple terminals at one event are supported
- no product-based printer routing in the MVP
- no multiple printers per terminal

Device settings concept:

- event settings: products, helpers, menu, dashboard
- device settings: receipt printer, zoom, device language
- device settings are local to the terminal and are not stored as event data
- a future Dieses Gerät area may group receipt printer, zoom, and language settings

Receipt printing architecture:

- eventBon remains a web app
- reliable production printing targets a local print bridge
- PrintService creates a PrintJob IR
- Renderer adapters support QZ-compatible Bon output, Browser/PDF Seitendruck output, ESC/POS, Raster/PDF label, and later vendor SDK output
- Output adapters support QZ Tray for Bondruck, Browser/PDF for Seitendruck, Epson ePOS, and Star webPRNT
- Chrome print preview is not the cashier Bondruck workflow

### RC-3 Production Rollout

Focus:

- five real live events
- collect feedback
- fix UX issues
- no major architecture changes

Typical live events:

- Reitturnier
- Feuerwehrfest
- Musikverein
- Sportveranstaltung
- Weihnachtsmarkt

### RC-4 Security Hardening

Only after successful production operation.

Focus:

- Full Row Level Security
- RPC security review
- storage policies
- server-side validation
- token review
- permission review
- security testing
- DSGVO review
- production hardening

Production hardening includes verifying the `eventbons.com` deployment, Supabase Auth redirect URLs, helper invitation URLs, password recovery redirects, and public environment variable configuration.

## Development Rule

Until RC-4, no major architecture refactoring unless required for a release blocker.

Allowed:

- bug fixes
- UX improvements
- printing
- product workflow improvements

Avoid:

- large security rewrites
- large database redesigns
- unnecessary RPC redesigns

## Sprint Planning

| Sprint | Name |
| --- | --- |
| RC1-01 | product workflow |
| RC1-02 | Menu Designer |
| RC1-03 | Receipt Printing |
| RC1-04 | Product Polish |
| RC2-01 | Live Events |
| RC3-01 | Security Hardening |

## Release Candidate Lifecycle UX

The organizer event workspace separates data access from active sales access.

Organizer data access remains available according to retention rules:

- event data
- products
- dashboard and statistics
- Excel export
- helper history
- Menu Designer

Active sales and Bon printing are restricted to paid active event days.

Event lifecycle states:

- Upcoming
- Active today
- Completed

Meine Veranstaltungen is split into:

- Open events
- Completed events

Completed events remain visible and reviewable, but cannot create new sales or print new Bons.

Paid extensions may only add today or future days. Extensions into the past are not allowed.
