# Beta Backlog

## P0

- QZ direct cashier printing: implemented in app, pending real Brother TD-4000 hardware validation.
- One print job per voucher: implemented for QZ Einzelbons, pending hardware validation.
- Cut after every voucher: expected through Windows/Brother driver job boundaries, pending hardware validation.
- Optimized Brother TD-4000 typography and layout: implemented for 58 x 60 mm pilot medium, pending hardware validation.
- QZ installation wizard.
- Production RLS/security review.

The QZ/Brother printing items may only be marked complete after a real Brother TD-4000 test confirms:

- 1 x Bier in Einzelbons mode prints one job, one label, one cut.
- 3 x Bier in Einzelbons mode prints three jobs, three labels, three cuts.
- 2 x Bier plus 1 x Gulaschsuppe in Sammelbon mode prints one job and one label where possible.
- Reprints are marked Nachdruck and do not create new sales.
- QZ unavailable or failed voucher jobs show a friendly error and allow retry or explicit browser fallback.

## P1

- Stripe pay-per-event activation.
- Event title correction.
- Paid date extension.
- Menu PDF.
- Allergen completion.

## P2

- iPad.
- Android.
- Station-level analytics.
- Additional printer certification.

## Current Pilot Boundary

The closed pilot is eventBon Windows Pilot.

Supported:

- Windows 10
- Windows 11
- Chrome
- Edge
- QZ Tray
- Brother TD-4000

Not part of the current pilot:

- iPad
- Android
- Stripe activation
- additional certified printers
