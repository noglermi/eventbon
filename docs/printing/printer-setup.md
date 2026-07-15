# Printer Setup

## Goal

A Veranstalter should configure a Bon printer and print a readable test Bon quickly, without reading printer manuals.

## Reference Setup

- Windows 10 or Windows 11
- Chrome or Microsoft Edge
- QZ Tray
- Brother TD-4000
- EventBon Root certificate installed for QZ Tray
- `https://www.eventbons.com`

## First Installation

1. Prepare the Windows sales device.
2. Install the printer driver.
3. Install and start QZ Tray.
4. Install the EventBon Root certificate for QZ Tray.
5. Open `https://www.eventbons.com`.
6. Select the Bon printer model.
7. Select the Bon printer found by QZ Tray.
8. Print a test Bon.
9. Finish setup.

## Screenshot Placeholders

```text
[Screenshot: Windows device ready]
[Screenshot: Brother TD-4000 visible in Windows printer list]
[Screenshot: QZ Tray running]
[Screenshot: EventBon Root configured for QZ Tray]
[Screenshot: EventBon Bondrucker setup]
[Screenshot: QZ printer selection]
[Screenshot: successful test Bon]
```

## Troubleshooting

### QZ Tray läuft nicht

Start QZ Tray, check the Windows tray icon, reload EventBon, and retry setup.

### Drucker nicht gefunden

Check printer power, USB or network connection, Windows printer visibility, and restart QZ Tray.

### Drucker offline

Check power, paper, printer status, and the Windows printer queue.

### Browserdruck erscheint

The cashier Bon path should not open browser print. Verify QZ Tray output is selected, printer setup is complete, and QZ Tray is reachable.

### Zertifikat fehlt

Verify the Vercel environment value `QZ_TRAY_DIGITAL_CERTIFICATE` and the `/api/qz/certificate` endpoint.

### Root-Zertifikat fehlt

Install `eventbon-root-ca.crt` as the QZ Tray custom trusted root on the printing PC and restart QZ Tray.

### Testbon funktioniert nicht

Check QZ Tray, selected printer, driver, paper, and printer status. Then print another test Bon.

### Sicherheitsdialog erscheint erneut

Confirm the EventBon Root certificate is installed for QZ Tray, the trust decision was saved, and the same EventBon certificate is still used.

### Druck erfolgt auf falschem Drucker

Open Bondrucker setup again, select the correct QZ printer, print a test Bon, and finish setup.
