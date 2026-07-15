# Supported Printers

## Status Terms

| Status | Meaning |
| --- | --- |
| Unterstützt | Supported for the stated production path |
| Getestet | Practical end-to-end test completed |
| Test ausstehend | Visible or planned, but not yet practically tested |
| Bestandsgerät | Existing device supported as a practical reference |
| Nicht empfohlen | Known limitations or unsuitable for the current product path |

EventBon must not claim support or successful testing before a practical end-to-end test is complete.

## Current Printer Table

| Printer | Status | Notes |
| --- | --- | --- |
| Brother TD-4000 | Getestetes Bestandsgerät | Productive Bon printing tested with eventbons.com, QZ Tray, server-side signing, EventBon certificate, no browser print dialog, and no recurring security prompt after trust |
| MUNBYN | Test ausstehend | Practical test still required before support can be claimed |
| Epson receipt printers | geplant | Future certification path |
| Star receipt printers | geplant | Future certification path |
| Weitere Modelle | geplant | Added only after real setup and print tests |

## Test Requirements Before Status Change

A printer can move to `Getestet` only after verifying:

- Windows installation
- QZ Tray discovery
- exact printer name
- selected EventBon printer profile
- QZ trusted certificate behavior
- German special characters
- euro sign
- readable typography
- single voucher printing
- combined voucher printing
- reprint
- cut or tear-off behavior
- error behavior when QZ or the printer is unavailable

The current regression reference is Brother TD-4000.
