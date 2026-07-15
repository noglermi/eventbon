# Printing Roadmap

## Reference State

The current productive reference is:

- eventbons.com
- QZ Tray
- server-side signing
- EventBon certificate
- EventBon Root certificate
- Brother TD-4000
- automatic Bon printing without browser print dialog

This reference is stable as printing architecture v1.

## Next Steps

### MUNBYN Test

Run a practical end-to-end test before changing status from `Test ausstehend`.

Required checks include Windows driver installation, QZ Tray discovery, exact QZ printer name, test Bon, German special characters, euro sign, single voucher printing, combined voucher printing, reprint, and cut or tear-off behavior.

### Additional Bon Printers

Add more models only after practical tests.

Candidate families:

- Epson receipt printers
- Star receipt printers
- additional Brother TD models
- MUNBYN models after delivery and test

### Automatic Printer Detection

Future improvement:

- suggest likely Bon printers from the QZ printer list
- still allow manual selection
- keep support diagnostics available

### Installation Assistant

Continue improving the normal setup path with fewer steps, clearer wording, better completion state, and more practical troubleshooting.

### Windows Installer

Future option:

- install or verify QZ Tray
- configure EventBon Root certificate
- open eventbons.com
- guide printer test

No installer should disable QZ security.

### QR Code And Logo On Bons

Future options:

- QR code on Bons
- EventBon or event logo on Bons

Both must preserve readability and print speed.

## Non-Goals

Do not add cash drawer control, fiscalization, accounting receipt logic, product-based kitchen routing, or multiple Bon printers per terminal.

The product rule remains:

```text
One terminal = one configured Bon printer.
```
