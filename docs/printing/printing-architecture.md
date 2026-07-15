# Printing Architecture v1

## Reference Status

The productive Bon printing path was successfully tested on 2026-07-15 with:

- `https://www.eventbons.com`
- QZ Tray
- Brother TD-4000
- server-side QZ signing
- EventBon signing certificate
- EventBon Root certificate
- no browser print dialog in the cashier flow
- no recurring QZ security prompt after trust was granted
- automatic Bon printing

This is the EventBon printing architecture v1 reference implementation.

Future changes to this architecture are limited to bug fixes, additional printer model support, UX improvements, and documentation. Major printing architecture changes require an explicit product decision.

## Two Print Worlds

Bondruck is the cashier path for single Bons, combined Bons, and reprints. It uses QZ Tray and the selected local Bon printer.

Seitendruck is used for organizer and administration output such as Speisekarten, product lists, price lists, reports, and PDFs. It uses normal browser or Windows printing and is not routed through the Bon printer.

## Architecture Flow

```text
Browser
  |
  v
EventBon Web App
  |
  v
/api/qz/certificate
  |
  v
/api/qz/sign
  |
  v
QZ Tray
  |
  v
Windows printer driver
  |
  v
Bon printer
```

## Data Flow

The browser runs EventBon at `https://www.eventbons.com`. After a sale is completed, EventBon stores the sale and asks the PrintService to produce a Bon print job.

`/api/qz/certificate` returns the public EventBon QZ certificate. `/api/qz/sign` signs QZ payloads server-side with the private signing key. QZ Tray verifies the signed request against the trusted certificate and sends the job to the selected Windows printer.

For the Brother TD-4000 reference setup, Windows and the Brother driver handle device communication and cut behavior at print-job boundaries.

## Print Job Rules

Single voucher mode sends one voucher as one QZ print job. A sale with multiple individual Bons creates sequential QZ jobs.

Combined voucher mode sends one QZ print job containing all sale items and quantities.

Reprints print an existing sale only. They do not create a new sale and do not create new sale items.

## API Endpoints

### `GET /api/qz/certificate`

Returns the public QZ certificate configured in:

```text
QZ_TRAY_DIGITAL_CERTIFICATE
```

### `POST /api/qz/sign`

Signs QZ payloads server-side with:

```text
QZ_TRAY_PRIVATE_KEY
```

The private key must never be exposed as a `NEXT_PUBLIC_` variable, committed to Git, stored in localStorage, or installed on a printing PC.

## Reference Device

Brother TD-4000 is the first tested reference Bon printer and is documented as `Getestetes Bestandsgerät`.

MUNBYN remains `Test ausstehend` until practical end-to-end testing is complete.
