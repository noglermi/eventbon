# Product Backlog

## P0

- QZ direct cashier printing: implemented in app, pending real Brother TD-4000 hardware validation.
- One print job per voucher: implemented for QZ Einzelbons, pending hardware validation.
- Cut after every voucher: expected through Windows/Brother driver job boundaries, pending hardware validation.
- Optimized Brother TD-4000 typography and layout: implemented for 58 x 60 mm configured medium, pending hardware validation.
- QZ installation wizard and modular printer setup wizard.
- Production RLS/security review.

The QZ/Brother printing items may only be marked complete after a real Brother TD-4000 test confirms:

- 1 x Bier in Einzelbons mode prints one job, one label, one cut.
- 3 x Bier in Einzelbons mode prints three jobs, three labels, three cuts.
- 2 x Bier plus 1 x Gulaschsuppe in Sammelbon mode prints one job and one label where possible.
- Reprints are marked Nachdruck and do not create new sales.
- QZ unavailable or failed voucher jobs show a friendly error and allow retry or explicit browser fallback.

MUNBYN 80 mm thermal receipt printer remains Test ausstehend. It may not be treated as supported until a practical test confirms Windows installation, QZ discovery, exact printer name, special characters, euro sign, cutter behavior, single vouchers, combined vouchers, reprint, and fallback behavior.

## Commercial P0

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
- Move MUNBYN from Test ausstehend to Getestet only after documented successful hardware testing.

## Current production Boundary

The public production release is eventBon production release.

Supported:

- Windows 10
- Windows 11
- Chrome
- Edge
- QZ Tray
- Brother TD-4000

Planned later:

- iPad
- Android
- Stripe activation
- additional certified printers
