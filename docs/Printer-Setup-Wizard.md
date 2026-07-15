# Printer Setup Wizard

## Purpose

The printer setup wizard is a major product feature for EventBon.

Goal:

A non-technical Veranstalter can configure a Bon printer and print the first test Bon in under two minutes.

The wizard is optimized for:

- fewer clicks
- fewer decisions
- fewer technical terms
- clear progress
- immediate test output

The normal setup flow is not a printer laboratory. It is a short Bon printer setup for active event operation.

## Two Print Worlds

EventBon separates printing into two different worlds.

### Bondruck

Bondruck is the standard event-floor printing path.

It is used for:

- Bons
- single vouchers
- combined vouchers
- reprints from recent sales

Bondruck uses:

- QZ Tray
- the selected local Bon printer

All Bonierungen use this path. The cashier workflow must not depend on browser print preview.

### Seitendruck

Seitendruck is used only for organizer and administration output.

Examples:

- Speisekarten
- Produktlisten
- Preislisten
- Auswertungen
- PDF
- Berichte

Seitendruck uses the normal Windows system printer through browser/PDF printing. These outputs are not routed through the Bon printer.

## QZ Tray Message

QZ Tray should be explained positively and briefly:

> EventBon verwendet QZ Tray für den sicheren und schnellen Bondruck.

The user does not need to understand printer protocols, browser printing, ESC/POS, drivers, or print bridge architecture during normal setup.

## QZ Trust And Signing

EventBon must use QZ Tray's official trust architecture.

The product must not:

- send anonymous QZ requests
- disable QZ security
- bypass the QZ trust dialog with unsafe workarounds
- expose the private signing key in the browser

Current cause of `Anonymous request`:

QZ Tray shows anonymous/untrusted requests when the application connects or prints without a configured certificate promise and signature promise. A plain `qz.websocket.connect()` plus `qz.print()` is not enough for product operation.

Required pieces:

- EventBon QZ public certificate
- matching private signing key
- client-side `setCertificatePromise`
- client-side `setSignaturePromise`
- server-side signing endpoint
- secure environment variable storage

EventBon signing flow:

1. Browser loads the QZ Tray library.
2. EventBon configures QZ security before connecting.
3. QZ Tray requests the EventBon certificate.
4. Browser fetches the public certificate from `/api/qz/certificate`.
5. QZ Tray asks EventBon to sign each QZ message.
6. Browser sends the message to `/api/qz/sign`.
7. The server signs with `QZ_TRAY_PRIVATE_KEY`.
8. Browser returns the base64 signature to QZ Tray.
9. QZ Tray validates the request against the trusted certificate.

Required environment variables:

- `QZ_TRAY_DIGITAL_CERTIFICATE`
- `QZ_TRAY_PRIVATE_KEY`

The public certificate may be delivered to the browser. The private key must stay server-side and must never be exposed with `NEXT_PUBLIC_`, localStorage, source code, or client bundles.

First trust decision:

On first use, QZ Tray shows the EventBon certificate and asks the user to trust it. The user can allow and remember this trust decision. QZ Tray stores that decision locally. Future print jobs from the same trusted EventBon certificate should not show repeated security dialogs.

## Supported Bon Printer Model Status

Visible status terms:

- Unterstützt
- Getestet
- Test ausstehend
- Bestandsgerät
- Nicht empfohlen

Current visible models:

- Brother TD-4000: Getestetes Bestandsgerät
- MUNBYN: Test ausstehend
- Weitere: for future model selection

EventBon must not claim that a printer is supported or tested until a practical end-to-end test has been completed.

## Simplified Setup Flow

The normal Bon printer assistant contains only four steps.

### Step 1: Bondruckermodell auswählen

The Veranstalter selects the model:

- Brother TD-4000
- MUNBYN
- Weitere

The selected model controls the Bon layout and test output.

### Step 2: QZ Tray installiert?

The wizard asks whether QZ Tray is installed.

Options:

- Ja
- Nein

If QZ Tray is not installed, the wizard shows:

- a short explanation
- the button `QZ Tray herunterladen`
- a short instruction to install QZ Tray and continue setup afterwards

No long technical explanation is shown in the normal wizard.

### Step 3: Bondrucker auswählen

EventBon connects to QZ Tray and lists the printers found on the device.

The user selects the Bon printer from the list.

There is no separate visible "Windows printer" step in the normal wizard. The local printer mapping remains an implementation detail.

### Step 4: Testbon drucken

The user prints a test Bon.

The test Bon contains:

- eventBon
- Testdruck
- selected Bon printer model
- paper information
- date and time

If the test Bon prints correctly, setup is complete:

> Einrichtung abgeschlossen.

The successful test stores the device-local Bon printer settings in localStorage.

## Removed From Normal Setup

The following concepts do not belong in the normal Bon printer assistant:

- browser test print
- browser print preview
- Windows printer explanation as a separate step
- printer architecture explanation
- ESC/POS explanation
- driver concept explanation
- manual technical printer mapping
- Drucker Testlabor

These topics may exist in internal documentation or advanced support tooling, but they must not slow down the standard setup path.

## Advanced Printer Settings

Advanced tooling may later live under:

`Einstellungen -> Erweiterte Druckereinstellungen`

Possible advanced tools:

- QZ Tray connection diagnostics
- printer discovery details
- raw test output
- support diagnostics
- future renderer tests

This area is separate from the normal setup assistant.

## Device-Local Settings

Printer settings are local to the current device/browser.

They belong to:

- the tablet
- the notebook
- the checkout terminal
- the browser profile

They do not belong to:

- the event
- the Veranstalter account
- the helper invitation
- the product catalog

Reason:

One event may have multiple terminals. A drinks terminal and a kitchen terminal may use different devices and printers.

## Architecture Note

EventBon remains a web app.

The target receipt printing path is:

EventBon Web App

-> PrintService

-> PrintJob IR

-> QZ Tray output

-> Bon printer

Browser/PDF printing remains available for Seitendruck only.

Future printer-specific work may add more renderer and output adapters, but the normal Veranstalter setup must remain short and non-technical.

The productive Bondruck reference is documented in `docs/printing/`. The current reference path is eventbons.com -> QZ Tray -> Brother TD-4000 with server-side signing and the EventBon certificate chain.

## Troubleshooting Flow

Troubleshooting should remain action-oriented.

### QZ Tray Not Found

Message:

`QZ Tray ist auf diesem Gerät nicht erreichbar.`

Actions:

- install QZ Tray
- start QZ Tray
- reload EventBon

### Printer Not Listed

Actions:

- check printer power
- check USB or network connection
- verify that Windows sees the printer
- reconnect QZ Tray

### Test Bon Does Not Print

Actions:

- choose the correct printer
- check paper
- check printer status
- print another test Bon

### Bon Is Cut Off

Actions:

- verify the selected model
- verify the correct paper medium
- report the issue through support

## Product Rule

The setup wizard is successful when a Veranstalter can print a readable test Bon quickly.

Technical completeness is less important than a clear, reliable path to the first Bon.
