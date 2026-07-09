# Printer Setup Wizard

## Purpose

The Printer Setup Wizard is a major product feature for eventBon.

Goal:

A non-technical organizer or device operator can configure a receipt printer without reading a manual.

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
- The first implementation uses browser printing.
- Future direct ESC/POS or native printing may be added later.

## Supported Printer Profiles

Initial profiles:

- Generic 58 mm receipt printer
- Generic 80 mm receipt printer
- Brother TD-4000
- Generic A4 test printer

The Brother TD-4000 is the first real thermal printer reference device for beta validation.

The Brother QL-720NW may be useful for label experiments, but it is not the main Bon printer reference device.

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
- Brother TD-4000
- Generic A4 test printer
- later Epson profile
- later Star profile

The wizard explains that the selected profile controls the Bon layout, not the operating system printer installation.

### Step 2: Paper Selection

The user selects or confirms:

- paper width
- receipt or label roll mode
- tear or cut spacing
- optional top and bottom margin

For beta, recommended paper sizes should be documented per profile.

Brother TD-4000 beta profile:

- use as the primary real thermal printer reference
- optimize for readable Bons
- test cut or tear spacing
- document the exact driver and browser settings used during beta

### Step 3: Browser Print Check

The wizard explains:

- printer must already be installed in the operating system
- browser print dialog will open
- user must select the physical printer there
- margins and scaling should match the profile recommendation

The wizard should avoid technical terms where possible and use short, concrete instructions.

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

## Future Direct ESC/POS Support

Future versions may add direct printer communication.

Possible future paths:

- ESC/POS printing
- WebUSB
- WebSerial
- local helper application
- native desktop bridge
- printer vendor SDK integration

Direct printing may later support:

- fewer browser print dialog steps
- automatic cut commands
- faster printing
- printer status feedback

This is not part of the browser-print foundation.

Before direct printer support is added, eventBon should first validate real event printing with browser printing and the Brother TD-4000 reference device.

## Beta Strategy

Beta starts with browser printing and guided setup.

Reference device:

- Brother TD-4000

Beta goals:

- verify that a non-technical organizer can complete setup
- verify readable Bons on real thermal paper
- verify reliable workflow during active sales
- collect driver, browser, and paper setting notes
- document known-good settings

The beta should record:

- operating system
- browser
- printer driver version if available
- selected eventBon profile
- paper size
- browser print settings
- observed print result
- troubleshooting needed

## Later Printer Certification

After beta validation, eventBon can certify additional devices.

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
