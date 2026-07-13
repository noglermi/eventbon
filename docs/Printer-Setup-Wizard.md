# Printer Setup Wizard

## Purpose

The Printer Setup Wizard is a major product feature for eventBon.

Goal:

A non-technical organizer or device operator can configure a receipt printer without reading a manual.

The production wizard runs inside `https://eventbons.com`. Local development may use localhost, but production printer setup, QZ Tray validation, and helper-facing workflows should be tested from the public production domain where possible.

The wizard supports the event-floor reality:

- printers are often installed shortly before an event
- helpers may not understand printer settings
- every terminal may use a different local printer
- printing must be reliable before active sales start

The wizard is not a cash register, fiscal printer, or POS hardware layer. It configures Bon printing for event voucher output.

## Product Principles

- One terminal or device uses one configured printer.
- Printer settings are device-local.
- Printer settings are not event data.
- Multiple terminals at one event are supported by configuring each device separately.
- Product-based printer routing is not part of the MVP.
- Multiple printers per terminal are not part of the MVP.
- The first implementation uses browser printing for setup and testing.
- Browser print preview is not acceptable as the final cashier workflow.
- Production operation requires direct or near-direct printing.
- The target production architecture is a local print bridge.
- Browser and CSS printing remain setup, test, and fallback paths.
- QZ Tray is the fast current candidate for bridge-based printing.
- WebUSB, WebSerial, and WebHID are not the core printer architecture.
- Electron is not the primary product direction.

## Printer Engine Foundation

The Printer Setup Wizard configures the active printer profile used by the printer engine.

Architecture:

- eventBon Web App
- PrintService
- PrintJob IR
- Renderer Adapters
- Output Adapters

The Sales Terminal requests Bon printing without knowing printer details.

The PrintService selects the active device-local profile and creates a PrintJob IR.

The PrintJob IR contains:

- voucher lines
- print mode
- paper profile
- printer profile
- cut mode
- reprint marker
- helper or terminal context if needed

The Printer Profile defines:

- paper width
- margins
- font scaling
- cutter or tear-off behavior
- profile-specific layout values

Renderer Adapters turn the PrintJob IR into printable output:

- Browser CSS renderer
- ESC/POS renderer
- Raster/PDF label renderer
- Vendor SDK renderer later

Output Adapters deliver the rendered job:

- Browser Print fallback
- Local Print Bridge
- Epson ePOS network adapter
- Star webPRNT network adapter

Browser Print opens the normal browser print dialog and remains the setup, test, and fallback path.

Real Brother TD-4000 testing showed that Windows and browser printing can reach the printer, but browser preview and browser pagination are not reliable enough as the final cashier workflow. Browser printing remains useful for setup, test prints, and temporary validation. Receipt printing is a release blocker because the cashier needs a fast print path without a disruptive preview step.

The primary future path is a local print bridge. QZ Tray is the fastest current candidate because it can connect the web app to installed local printers without turning eventBon into an Electron app. Later printer-specific adapters may use ESC/POS for Epson and Star printers, Brother label/raster output or the Brother SDK through the bridge, Epson ePOS, and Star webPRNT.

## Supported Printer Profiles

Initial profiles:

- Generic 58 mm Receipt
- Generic 80 mm Receipt
- Brother TD-4000 58 x 60 mm
- MUNBYN 80 mm thermal receipt printer
- Epson Receipt
- Star Receipt

Printer support is modeled through central printer profiles. Each profile defines a unique ID, manufacturer, model, display name, support status, description, paper width, optional fixed paper height, printer type, connection options, cutter or tear-off behavior, supported platforms, required software, driver hint, installation guide, test status, last tested date, tested eventBon version, known notes, recommended settings, QZ printer name hints, and whether the profile is active.

Support status labels shown in the product are:

- supported: Unterstützt
- production: Getestet
- testing_pending: Test ausstehend
- legacy: Bestandsgerät
- not_recommended: Nicht empfohlen

The Brother TD-4000 is the first real thermal printer reference device for hardware validation. It is a tested existing device and remains selectable for the Windows production release. It is not positioned as the preferred new-purchase model.

The current Brother TD-4000 configured test medium is fixed-size 58 x 60 mm label/Bon media. This is not continuous receipt paper. Each individual Bon must render as one 58 x 60 mm page. A sale with three single vouchers must print three pages or labels. A combined voucher should fit one 58 x 60 mm page where possible.

The Brother TD-4000 58 x 60 mm profile is used by both the browser fallback and the QZ Tray Windows production release path. The QZ Tray cashier path uses a dedicated QZ-compatible HTML/pixel renderer and does not rely on the browser CSS preview renderer.

In Einzelbons mode, each voucher is sent as one separate QZ print job. Example: `3 x Bier` must become three sequential jobs, each containing one `1 x Bier` voucher. In Sammelbon mode, the complete sale is sent as one QZ print job containing all items and quantities.

For the Brother TD-4000 production, cutting is handled by the Windows/Brother driver at print-job boundaries. eventBon does not send raw Brother cutter commands yet.

The Brother QL-720NW may be useful for label experiments, but it is not the main Bon printer reference device.

The MUNBYN 80 mm thermal receipt printer is documented as Test ausstehend. It may be selected for production testing only after the physical device arrives. Until a practical test confirms printing, typography, special characters, cutter behavior, QZ Tray behavior, sale flow, and reprint behavior, the MUNBYN profile must not be described as supported or successfully verified.

Later certified profiles:

- Epson receipt printers
- Star receipt printers
- additional Brother TD series devices

Certification means:

- a real device was tested
- recommended paper size is documented
- browser print settings are documented
- test print output is readable
- cut or tear spacing is acceptable
- troubleshooting notes exist

## Generic Printer Strategy

eventBon should work with many receipt printers through generic profiles before adding printer-specific integrations.

The generic strategy is:

- choose a paper width
- choose density and spacing defaults
- render a browser-printable Bon layout
- let the operating system printer driver handle the physical printer
- provide test prints and troubleshooting guidance

The organizer or device operator must install the printer in Windows, macOS, iPadOS, Android, or the browser environment before eventBon can print to it.

eventBon does not automatically discover printers in the browser-print foundation.

## Guided Setup Flow

The wizard should guide the user step by step.

### Step 1: Choose Printer Profile

The user selects:

- Generic 58 mm
- Generic 80 mm
- Brother TD-4000 58 x 60 mm
- MUNBYN 80 mm thermal receipt printer, marked Test ausstehend until verified
- later Epson profile
- later Star profile

The wizard explains that the selected profile controls the Bon layout, not the operating system printer installation.

The current modular wizard flow is:

1. Drucker auswählen.
2. Voraussetzungen prüfen: Windows 10/11, Chrome/Edge, QZ Tray, Windows driver, connected printer, loaded paper.
3. Modellspezifische Installation: driver hint, connection, paper, known notes, recommended settings.
4. Windows-Drucker auswählen: QZ printer list where available, otherwise exact manual Windows printer name.
5. Testbon drucken: eventBon, Testdruck, model, paper, date/time, special characters, euro sign, multiple font sizes, divider, cutter test.
6. Abschluss: user confirms the test result; profile, Windows/QZ printer name, output mode, test confirmation, and last test date are stored locally on the current device.

The device-local setup is stored in browser localStorage. It is not organizer data, event data, Supabase data, Stripe data, or helper data.

### Step 2: Paper Selection

The user selects or confirms:

- paper width
- receipt or label roll mode
- tear or cut spacing
- optional top and bottom margin

for production setup, recommended paper sizes should be documented per profile.

Brother TD-4000 configured profile:

- use as the primary real thermal printer reference
- current test medium is 58 x 60 mm fixed-size label/Bon media
- use one printed page per Bon
- optimize for readable Bons
- test cut or tear spacing
- document the exact driver and browser settings used While the product is evolving

### Step 3: Browser Print Check

The wizard explains:

- printer must already be installed in the operating system
- browser print dialog will open
- user must select the physical printer there
- margins and scaling should match the profile recommendation

The wizard should avoid technical terms where possible and use short, concrete instructions.

Browser print is acceptable for this setup and testing step. It is not the target production cashier flow.

### Step 4: Test Print

The wizard prints a test Bon containing:

- eventBon test heading
- selected printer profile
- paper width
- sample product lines
- sample total
- date and time
- visual cut or tear marker

The user confirms:

- text is readable
- nothing is cut off
- spacing is acceptable
- the printer cuts or tears at a usable position

### Step 5: Confirm Device Setup

After a successful test print, the wizard stores the local device settings.

Stored locally:

- printer profile
- paper width
- cut or tear spacing
- density or compactness setting
- optional browser print notes

Storage:

- localStorage on the current device
- not Supabase
- not shared with other terminals
- not tied to the event record

## Troubleshooting Flow

The wizard should include a guided troubleshooting path.

### Problem: Nothing Prints

Checks:

- Is the printer powered on?
- Is the printer connected by USB or network?
- Is the printer installed in the operating system?
- Was the correct printer selected in the browser print dialog?
- Does a normal operating system test page print?

### Problem: Bon Is Too Wide Or Cut Off

Checks:

- Choose the correct paper width profile.
- Disable browser scaling if needed.
- Use profile-recommended margins.
- Try Generic 58 mm or Generic 80 mm.

### Problem: Text Is Too Small

Checks:

- Select a wider paper profile if the physical paper supports it.
- Use the Brother TD-4000 profile if testing with that device.
- Increase Bon density or font size in the profile if available.

### Problem: Too Much Empty Paper

Checks:

- Reduce bottom margin.
- Adjust tear or cut spacing.
- Verify that the browser print dialog is not using an A4 layout by mistake.

### Problem: Wrong Printer Opens

Checks:

- Select the correct printer in the browser dialog.
- Set the desired printer as default in the operating system if useful.
- Re-run the test print.

## Per-Device Printer Settings

Printer settings are local device settings.

They belong to:

- the tablet
- the notebook
- the checkout terminal
- the browser profile

They do not belong to:

- the event
- the organizer account
- the helper invitation
- the product catalog

Reason:

One event may have multiple terminals. A drinks terminal and a kitchen terminal may use different devices and printers. Changing the printer on one terminal must not change printing on another terminal.

## Local Print Bridge Target

Reliable production receipt printing should use a local print bridge while eventBon remains a web app.

The bridge is responsible for:

- receiving print jobs from the web app
- selecting the configured local printer
- sending jobs without a disruptive browser preview
- supporting ESC/POS where the printer supports it
- supporting Brother label/raster or Brother SDK output for Brother label printers
- returning useful success or error diagnostics
- later exposing printer status where available

Target output paths:

- Local Print Bridge as the primary production path
- QZ Tray as the fast current candidate
- Browser/CSS print as setup, test, and fallback
- Epson ePOS network adapter where suitable
- Star webPRNT network adapter where suitable

Printer-specific adapter direction:

- ESC/POS for Epson and Star receipt printers
- Brother label/raster output or Brother SDK through the local bridge
- Vendor SDK renderer later if a printer family requires it

Non-decisions:

- WebUSB, WebSerial, and WebHID should not become the core architecture. They can be investigated for special cases but are too platform- and browser-dependent for the default organizer workflow.
- Electron should not become the primary product. eventBon should stay a web app unless field testing proves the bridge approach cannot meet requirements.
- Chrome print preview should not remain the production cashier workflow. It is too disruptive and unreliable for active event sales.

## production Strategy

production starts with browser printing and guided setup, but the target architecture is bridge-based production printing.

Reference device:

- Brother TD-4000

Additional pending practical test device:

- MUNBYN 80 mm thermal receipt printer

Fast production print bridge candidate:

- QZ Tray

The public production release is eventBon production release. It officially supports Windows 10, Windows 11, Chrome, Edge, QZ Tray, and Brother TD-4000 as the first tested printer.

iPad, Android, and additional certified printers are planned later and are not part of the first public production release.

Receipt printing is the remaining P0 release blocker. Before external production users operate active sales, QZ direct cashier printing must reliably produce one print job per voucher, cut after every voucher where supported, and use readable Brother TD-4000 typography and layout.

The MUNBYN profile may move from Test ausstehend to Getestet only after a documented practical test confirms Windows installation, QZ Tray discovery, exact Windows printer name, test Bon readability, special characters, euro sign, cutter behavior, Einzelbons with one job per voucher, Sammelbon behavior, reprint behavior, browser fallback behavior, and the cashier sale flow without duplicate sales.

## QZ Tray Evaluation Status

QZ Tray is the current Windows production direct print path for cashier printing.

eventBon also includes a developer-only proof-of-concept page named Drucker Testlabor.

Purpose:

- verify whether QZ Tray is installed on the current device
- connect the browser app to QZ Tray
- list locally available printers
- select the Brother TD-4000
- send a simple QZ Tray test print

The test job contains:

- eventBon
- QZ Tray Testdruck
- Brother TD-4000
- Datum/Uhrzeit

Scope:

- direct-print evaluation and cashier output option
- no replacement of the existing browser-print workflow
- Sales Terminal can use QZ Tray when the device-local print output is set to QZ Tray direct print
- Browser print remains the fallback output
- no change to printer profiles
- no silent production printing mode yet

Cashier flow:

- completed sale is saved atomically first
- if QZ Tray direct print is selected, eventBon sends vouchers directly to QZ Tray without browser preview
- single vouchers are submitted as separate sequential QZ jobs
- combined vouchers are submitted as one QZ job
- successful QZ printing clears the cart/payment state and refreshes recent sales
- if QZ Tray is not reachable or a later voucher fails, eventBon shows a friendly error, names the failed voucher number, keeps the completed sale available for retry, and offers browser print fallback
- reprints from Letzte Verkäufe use QZ Tray when selected and never create a new sale

The current QZ implementation is a Windows production release path. It must be validated on real Brother TD-4000 hardware before the receipt-printing P0 item is considered complete.

If QZ Tray is not installed or cannot be reached, the UI must show a friendly message:

- QZ Tray ist auf diesem Gerät nicht installiert.

Technical errors should remain available as developer details so setup problems can be diagnosed While the product is evolving testing.

validation goals:

- verify that a non-technical organizer can complete setup
- verify readable Bons on real thermal paper
- verify whether browser printing is sufficient only for setup or temporary operation
- validate a local print bridge path for active sales
- collect driver, browser, and paper setting notes
- document known-good settings

Hardware validation should record:

- operating system
- browser
- printer driver version if available
- selected eventBon profile
- paper size
- browser print settings
- observed print result
- troubleshooting needed

## Later Printer Certification

After hardware validation, eventBon can certify additional devices.

Priority candidates:

- Epson receipt printers
- Star receipt printers
- additional Brother TD models

Certification should produce:

- supported profile name
- recommended paper settings
- known-good browser settings
- test print checklist
- troubleshooting notes
- limitations

Certification must stay focused on Bon printing. It must not introduce cash drawer control, fiscalization, receipt accounting, or POS hardware scope.

## Adding A Printer Profile

Adding a printer profile requires code and documentation in the same release step.

Checklist:

- add a static profile with unique ID, manufacturer, model, display name, status, paper, cutter, connection, platform, required software, QZ hints, notes, and recommended settings
- mark untested hardware as Test ausstehend
- do not claim ESC/POS support until verified on the real device
- test QZ Tray discovery and printer name matching
- print the EventBon test Bon
- print single vouchers and combined vouchers from a saved sale
- test reprint from Letzte Verkäufe
- document the tested eventBon version and date
- update production checklist and Product Backlog
