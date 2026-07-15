# QZ Certificate Backup And Recovery

## Purpose

Productive Bon printing depends on the EventBon QZ certificate chain and the server-side signing key. These files must be recoverable without exposing secrets.

## Backup Scope

Back up offline and securely:

- `eventbon-root-ca-private-key.pem`
- `eventbon-root-ca.crt`
- `digital-certificate.txt`
- `private-key.pem`

Use encrypted offline storage or a secure company secret vault. Do not use email attachments, chat uploads, unencrypted cloud folders, or support tickets.

## Restore Vercel Signing

If Vercel environment variables are lost:

1. Restore `digital-certificate.txt`.
2. Set it as `QZ_TRAY_DIGITAL_CERTIFICATE`.
3. Restore `private-key.pem`.
4. Set it as `QZ_TRAY_PRIVATE_KEY`.
5. Redeploy or restart the production environment.
6. Verify `/api/qz/certificate`.
7. Print a QZ test Bon.

## Restore Printing PC Trust

If a printing PC loses trust:

1. Restore `eventbon-root-ca.crt`.
2. Install it as QZ Tray custom trusted root.
3. Restart QZ Tray.
4. Open EventBon.
5. Print a test Bon.

## Lost Root Private Key

If `eventbon-root-ca-private-key.pem` is lost, existing trusted devices may continue to work, but no new signing certificates can be issued from that Root CA.

Recovery requires a new Root CA, a new signing certificate, updated Vercel secrets, and installing the new root certificate on all affected printing PCs.

## Compromised Signing Key

If `private-key.pem` is compromised:

1. Remove the compromised key from Vercel.
2. Generate a new signing certificate and key.
3. Update `QZ_TRAY_DIGITAL_CERTIFICATE`.
4. Update `QZ_TRAY_PRIVATE_KEY`.
5. Test QZ printing.
6. Review access logs and secret handling.

## Compromised Root Private Key

If `eventbon-root-ca-private-key.pem` is compromised:

1. Treat the whole QZ trust chain as compromised.
2. Generate a new Root CA.
3. Generate a new signing certificate.
4. Update Vercel environment variables.
5. Replace the trusted root certificate on every printing PC.
6. Revoke trust for the old root where possible.
7. Document the incident.

## Verification After Recovery

Run:

```powershell
.\tools\qz\verify-eventbon-qz-certificates.ps1
```

Then test QZ connection, printer discovery, test Bon, regular Bon from the Sales Terminal, and reprint from Recent Sales.
