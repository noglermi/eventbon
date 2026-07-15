# QZ Certificates

## Purpose

EventBon uses the official QZ Tray trust and signing workflow for productive Bon printing.

Goals:

- no anonymous QZ requests
- no security bypass
- server-side signatures
- a trusted EventBon certificate
- one durable trust decision per printing PC

## Certificate Chain

```text
EO-SOL EventBon Root CA
  |
  v
EventBon Signing Certificate
  |
  v
QZ Tray signed requests
```

## Files

| File | Destination | Notes |
| --- | --- | --- |
| `eventbon-root-ca.crt` | Windows printing PC / QZ Tray trusted root | Public root certificate only |
| `eventbon-root-ca-private-key.pem` | Offline secure backup | Never distribute |
| `digital-certificate.txt` | Vercel secret `QZ_TRAY_DIGITAL_CERTIFICATE` | Public signing certificate |
| `private-key.pem` | Vercel secret `QZ_TRAY_PRIVATE_KEY` | Server-side signing key only |

## Security Rules

`private-key.pem` must never be committed to Git, exposed in the browser, placed in `NEXT_PUBLIC_*`, installed on printing PCs, shared with organizers, or uploaded to support tickets.

`eventbon-root-ca-private-key.pem` must never be distributed. It should be stored offline and backed up securely.

Only `eventbon-root-ca.crt` is installed on a Windows printing PC.

Only `digital-certificate.txt` and `private-key.pem` belong in Vercel environment secrets.

## Git Rule

Generated certificate material belongs under:

```text
tools/qz/generated/
```

That directory is ignored by Git. No generated private key or certificate output should be committed.

## Verification

Use:

```powershell
.\tools\qz\verify-eventbon-qz-certificates.ps1
```

The verification checks that the signing certificate and private key match, the signing certificate was issued by the EventBon Root CA, certificate metadata is correct, `digital-certificate.txt` is valid X.509 material, and `private-key.pem` is PKCS#8.
