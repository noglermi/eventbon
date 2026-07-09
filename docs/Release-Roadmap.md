# Release Roadmap

## Strategy

eventBon follows a beta-first release strategy.

The project intentionally postpones full production security hardening until after the first successful field beta.

Reason:

During beta the application is still evolving:

- database schema
- RPC signatures
- helper workflow
- printing
- dashboard
- organizer workflow

Implementing production-grade RLS now would create unnecessary rework and increase regression risk.

Security remains mandatory before production release. Full production hardening is scheduled for RC-4 after successful pilot operation.

## Release Candidates

### RC-1 Beta Completion

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
- QZ Tray as fast beta candidate
- generic thermal printer support
- Brother TD-4000 reference implementation
- Epson and Star reference paths
- ESC/POS renderer path for Epson and Star
- Brother label/raster or Brother SDK path through the bridge
- browser/CSS print as setup, test, and fallback
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
- Renderer adapters support Browser CSS, ESC/POS, Raster/PDF label, and later vendor SDK output
- Output adapters support Browser Print fallback, Local Print Bridge, Epson ePOS, and Star webPRNT
- Chrome print preview is not the production cashier workflow

### RC-3 Pilot Program

Focus:

- five real pilot events
- collect feedback
- fix UX issues
- no major architecture changes

Typical pilots:

- Reitturnier
- Feuerwehrfest
- Musikverein
- Sportveranstaltung
- Weihnachtsmarkt

### RC-4 Security Hardening

Only after successful pilot operation.

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

## Development Rule

Until RC-4, no major architecture refactoring unless required for a beta blocker.

Allowed:

- bug fixes
- UX improvements
- printing
- beta workflow improvements

Avoid:

- large security rewrites
- large database redesigns
- unnecessary RPC redesigns

## Sprint Planning

| Sprint | Name |
| --- | --- |
| RC1-01 | Beta Workflow |
| RC1-02 | Menu Designer |
| RC1-03 | Receipt Printing |
| RC1-04 | Beta Polish |
| RC2-01 | Pilot Events |
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
