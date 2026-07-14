# EventBon QZ Trust Setup

Interne Anleitung für den kostenlosen produktiven QZ-Trust-Weg von EventBon.

Ziel:

`https://www.eventbons.com` soll über QZ Tray und den Brother TD-4000 ohne wiederkehrende Sicherheitswarnungen drucken.

Dieser Ordner erzeugt und installiert keine Geheimnisse automatisch. Die Skripte werden erst ausgeführt, wenn die verantwortliche Person dies ausdrücklich bestätigt.

## Zielarchitektur

EventBon verwendet:

- ein eigenes selbst signiertes EventBon Root-CA-Zertifikat
- ein separates EventBon-Signaturzertifikat
- einen privaten Signaturschlüssel nur in Vercel
- QZ Tray Custom Trusted Root auf jedem Windows-Druck-PC
- serverseitige Signatur über `/api/qz/sign`
- keine anonymen Fallbacks
- keine deaktivierten QZ-Sicherheitsfunktionen

Zertifikatskette:

```text
EO-SOL EventBon Root CA
  -> EventBon signing certificate
      SAN: eventbons.com, www.eventbons.com
```

## Dateien

```text
tools/qz/
  README.md
  generate-eventbon-qz-certificates.ps1
  verify-eventbon-qz-certificates.ps1
  install-eventbon-qz-trust.ps1
  generated/                         # gitignoriert
```

Erwartete Ausgabedateien in `generated/`:

```text
eventbon-root-ca.crt
eventbon-root-ca-private-key.pem
digital-certificate.txt
private-key.pem
```

`tools/qz/generated/` ist in `.gitignore` eingetragen. Zusätzlich ignoriert das Repository `*.pem`.

## Zertifikate Erzeugen

Nicht ohne ausdrückliche Freigabe ausführen.

Falls bereits ein fehlerhafter oder alter Ordner existiert, nicht wiederverwenden:

```powershell
Rename-Item .\tools\qz\generated ("generated-invalid-" + (Get-Date -Format "yyyyMMdd-HHmmss"))
```

Danach neu erzeugen:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\qz\generate-eventbon-qz-certificates.ps1
```

Das Skript:

- prüft OpenSSL
- erzeugt eine selbst signierte EventBon Root CA
- erzeugt ein separates EventBon-Signaturzertifikat
- signiert das Signaturzertifikat mit der Root CA
- verwendet RSA 2048 Bit
- erzeugt `private-key.pem` als unverschlüsselten PKCS#8-PEM-Schlüssel
- erzeugt Root-Key, Signing-Key, CSR und Signing-Zertifikat in einem temporären Staging-Verzeichnis
- verschiebt die Dateien erst nach erfolgreichen OpenSSL-Befehlen in `generated/`
- verweigert die Ausgabe in einen nicht leeren Ordner
- gibt keine Schlüssel aus

Identität:

- Organization: `EO-SOL GmbH`
- Common Name Root: `EO-SOL EventBon Root CA`
- Common Name Signing Certificate: `EventBon`
- SAN: `eventbons.com`, `www.eventbons.com`

## Zertifikate Prüfen

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\qz\verify-eventbon-qz-certificates.ps1
```

Das Prüfsystem kontrolliert:

- `digital-certificate.txt` ist ein gültiges X.509-Zertifikat
- `private-key.pem` ist unverschlüsseltes PKCS#8
- Signaturzertifikat und privater Schlüssel passen zusammen
- Signaturzertifikat wurde von `EO-SOL EventBon Root CA` ausgestellt
- Subject, Issuer und SAN enthalten die erwarteten Werte
- die Zertifikatskette ist gültig

Es werden nur öffentliche Metadaten ausgegeben. Private Key-Inhalte werden nicht ausgegeben.

## Dateien Für Vercel

In Vercel werden gesetzt:

```text
QZ_TRAY_DIGITAL_CERTIFICATE = Inhalt von tools/qz/generated/digital-certificate.txt
QZ_TRAY_PRIVATE_KEY         = Inhalt von tools/qz/generated/private-key.pem
```

Wichtig:

- `private-key.pem` nur in Vercel Secrets speichern.
- Niemals in Git committen.
- Niemals mit `NEXT_PUBLIC_` prefixen.
- Niemals auf Veranstalter- oder Druck-PCs kopieren.

## Dateien Für Den Windows-Druck-PC

Auf Druck-PCs wird nur installiert:

```text
eventbon-root-ca.crt
```

Nicht installieren:

```text
private-key.pem
eventbon-root-ca-private-key.pem
```

`eventbon-root-ca-private-key.pem` dient nur zur kontrollierten Ausstellung oder Erneuerung von EventBon-Signaturzertifikaten und muss offline gesichert werden.

## Internes QZ Trust Setup Auf Windows

Nicht ohne ausdrückliche Freigabe ausführen.

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\qz\install-eventbon-qz-trust.ps1
```

Das Installationsskript:

- prüft Administratorrechte
- findet das QZ Tray Installationsverzeichnis
- sichert vorhandene QZ-Konfiguration
- kopiert `eventbon-root-ca.crt` als `override.crt` in das QZ Tray Verzeichnis
- setzt `authcert.override=<absoluter Pfad zu override.crt>` in `qz-tray.properties`
- beendet und startet QZ Tray neu
- installiert niemals private Schlüssel

QZ Tray lädt das Custom Trusted Root über:

```text
C:\Program Files\QZ Tray\override.crt
qz-tray.properties -> authcert.override=<Pfad>
```

Das entspricht dem offiziellen QZ-Weg für Custom Trusted Root Certificates.

## Administratorrechte

Benötigt:

- QZ Tray systemweit installieren
- Dateien unter `C:\Program Files\QZ Tray` ändern
- `override.crt` setzen
- `qz-tray.properties` ändern
- QZ Tray sauber neu starten

Ohne Administratorrechte möglich:

- EventBon öffnen
- Bondrucker auswählen
- Testbon auslösen
- QZ Tray verwenden, wenn Trust und QZ Tray bereits eingerichtet sind

## Rollback

Das Installationsskript legt ein Backup an:

```text
tools/qz/generated/qz-backup-YYYYMMDD-HHMMSS/
```

Rollback:

1. QZ Tray beenden.
2. `override.crt` und `qz-tray.properties` aus dem Backup zurückkopieren.
3. Alternativ `override.crt` löschen und die Zeile `authcert.override=...` aus `qz-tray.properties` entfernen.
4. QZ Tray neu starten.

## Manueller Testplan

1. Frischer Windows-PC ohne QZ Tray.
2. QZ Tray installieren.
3. EventBon Root-Zertifikat installieren.
4. QZ Tray neu starten.
5. `https://www.eventbons.com` öffnen.
6. Bondrucker auswählen.
7. Testbon drucken.
8. Zweiten Testbon drucken.
9. Prüfen, dass keine wiederholte QZ-Warnung erscheint.
10. Browser neu starten.
11. QZ Tray neu starten.
12. Windows neu starten.
13. `https://www.eventbons.com` erneut öffnen.
14. Regulären Verkaufsbon drucken.
15. Prüfen, dass eine fremde Website nicht still drucken darf.

## Sicherheitsregeln

- Der private Signaturschlüssel liegt niemals auf dem Veranstalter-PC.
- Der Root-CA-private-key liegt niemals auf dem Veranstalter-PC.
- Nur das öffentliche Root-Zertifikat wird lokal vertraut.
- QZ-Sicherheitswarnungen werden nicht global deaktiviert.
- Nur EventBon-signierte QZ-Anfragen werden vertraut.
- Zertifikatsfingerprints sollten nach Erzeugung intern dokumentiert werden.

## Zertifikatswechsel

Bei Ablauf:

- neues Signaturzertifikat ausstellen
- Vercel-Secrets aktualisieren
- Druck-PCs kontrolliert mit neuer Trust-Kette testen

Bei Verlust oder Kompromittierung des privaten Signaturschlüssels:

- altes Zertifikat nicht weiterverwenden
- neues Schlüsselpaar erzeugen
- Vercel-Secrets austauschen
- lokale Trust-Installation erneuern

Bei Verlust der Root-CA:

- neue Root CA erzeugen
- alle Druck-PCs neu provisionieren

Bei neuem Windows-Benutzer, neuem PC oder QZ-Neuinstallation:

- Trust-Installation erneut ausführen
