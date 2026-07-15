# Printing Test Log

## 2026-07-15

### Environment

Tested with:

- `https://www.eventbons.com`
- QZ Tray
- Brother TD-4000
- server-side QZ signing
- EventBon signing certificate
- EventBon Root certificate

### Result

Productive Bon printing successful.

Confirmed:

- no browser print dialog in the cashier flow
- no recurring QZ security prompt after trust was granted
- test Bon successful
- regular Bon successful
- automatic Bon printing works through QZ Tray

### Reference Status

This test establishes the EventBon printing architecture v1 reference state.

Future work should preserve this behavior unless an explicit product decision changes the printing architecture.

## Future Entry Template

```text
Date:
Environment:
Printer:
QZ Tray version:
Browser:
Paper/media:
Test Bon:
Single voucher:
Combined voucher:
Reprint:
Security prompt behavior:
Result:
Notes:
```
