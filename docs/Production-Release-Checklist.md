# Production Release Checklist

## Release Definition

Current product status:

- Public paid product

Officially supported for the public production release:

- Windows 10
- Windows 11
- Chrome
- Edge
- QZ Tray
- Brother TD-4000 as the first tested printer

Planned later:

- iPad
- Android
- additional certified printers

Receipt printing remains the P0 release blocker until direct QZ cashier printing is reliable for one print job per voucher, with correct cutting and readable Brother TD-4000 layout.

## Production Readiness Audit

Repository audit status:

- No hardcoded `eventbon.vercel.app` reference found.
- No hardcoded Vercel preview URL found.
- `localhost` remains only in development documentation or local environment examples.
- `https://eventbons.com` is documented as the production domain.
- `NEXT_PUBLIC_APP_URL` is the public URL source for helper links, QR codes, and password reset redirects.
- Technical diagnostics remain available in collapsed details where needed.
- Mock data remains only as developer fallback when Supabase environment variables are missing.
- The printer test lab remains available but must not be prominent for ordinary organizer workflows.

Open production assumptions to verify before production:

- Vercel production environment variables match `.env.example`.
- Supabase Auth redirect URLs include `https://eventbons.com/reset-password`.
- Supabase production schema migrations are executed in order.
- QZ Tray is installed and trusted on Windows devices.

## Vercel Production Configuration

- Production domain points to `https://eventbons.com`.
- `NEXT_PUBLIC_APP_URL=https://eventbons.com`.
- Supabase URL and publishable key are configured for production.
- No protected preview URL is used for helper invitations.
- Production build succeeds.

## Supabase Production Configuration

- All SQL migrations are applied.
- `save_completed_sale` RPC signature matches the frontend payload.
- Storage bucket `product-images` exists and is configured for the intended production access model.
- RLS/security posture is reviewed for public production release use.
- Full production RLS/security review remains required for the public product.

## Authentication And Password Reset

- Organizer registration works.
- Organizer login works.
- Logout works.
- Password reset email uses `https://eventbons.com/reset-password`.
- Recovery links open the reset password form.
- User-facing auth errors are friendly.
- Technical auth details are collapsed.

## Organizer Flow

- Organizer reaches Meine Veranstaltungen only after login.
- Empty state shows no events and the new event action.
- Organizer can create an event.
- Organizer can open event workspace.
- Organizer can reach Verkauf, Dashboard, Produkte, Helfer, Speisekarte, Bondrucker, and Einstellungen.
- Footer shows product name, system requirements, support through Problem melden, and legal/support links.

## Helper Flow

- Organizer can create helper invitation.
- Helper invitation link uses `https://eventbons.com` when configured.
- Helper can open link or enter access code.
- Helper enters only name.
- Helper enters only the assigned event sales terminal.
- Helper does not see organizer event selection, dashboard, billing, or other events.

## Sales Persistence

- Cash sale saves atomically.
- Manual card sale saves atomically.
- Sale items use name and price snapshots.
- No sale remains without sale_items if item insert fails.
- Save failure blocks printing and shows a user-friendly error with collapsed diagnostics.

## Recent Sales And Reprint

- Recent Sales shows only sales from the current terminal/device.
- The newest sale appears immediately after successful print.
- Reprint is available only from Recent Sales detail.
- Reprint does not create a new sale or sale_items.
- Reprint updates only print tracking fields.

## Dashboard And Export

- Dashboard shows all event sales, not only terminal-scoped sales.
- Payment summary uses canonical payment methods.
- Excel export includes expected sales data.
- Export remains a reporting aid, not accounting or tax output.

## QZ Tray Installation

- Device-local printer settings are stored in browser localStorage.
- Selected profile ID, Windows/QZ printer name, output mode, test confirmation, and last test date survive reloads on the same device.
- The modular printer setup wizard can be cancelled, restarted, and completed.
- The selected printer profile status is visible to the organizer/device operator.
- QZ Tray is installed on each Windows device.
- Browser can connect to QZ Tray.
- Selected printer name matches the installed Brother TD-4000 printer name.
- QZ connection error messages are understandable.
- Browser print fallback remains available for diagnostics.
- Cashier QZ mode does not open the browser print preview or call the browser print dialog.
- Einzelbons are submitted as one sequential QZ print job per voucher.
- Sammelbon is submitted as one QZ print job containing all sale items.
- If one voucher job fails, the saved sale is not duplicated and the same completed sale can be retried.

## Brother TD-4000 Test

- Brother TD-4000 is installed in Windows.
- Correct media is loaded.
- eventBon profile is selected.
- Test print is readable.
- 1 x Bier in Einzelbons mode prints 1 job, 1 label, and 1 cut.
- 3 x Bier in Einzelbons mode prints 3 jobs, 3 labels, and 3 cuts.
- 2 x Bier plus 1 x Gulaschsuppe in Sammelbon mode prints 1 job, 1 label, and 1 cut where possible.
- Reprint from Recent Sales prints the existing sale, marks the output as Nachdruck, and does not create a new sale.
- Cut behavior is verified as Windows/Brother driver behavior at job boundaries.
- This checklist item is complete only after real Brother TD-4000 hardware testing with the 58 x 60 mm configured medium.

## MUNBYN 80 mm Pending Test

- Profile is visible as Test ausstehend.
- UI does not claim official support.
- Exact MUNBYN model is recorded after delivery.
- Windows driver installation is documented.
- QZ Tray discovers the printer or the exact Windows printer name is documented.
- EventBon test Bon prints with readable typography.
- German special characters and euro sign print correctly.
- Cutter behavior is verified.
- 1 x product in Einzelbons mode prints one job and one Bon.
- 3 x product in Einzelbons mode prints three jobs and three Bons.
- Sammelbon prints one combined Bon where possible.
- Reprint from Letzte Verkaeufe does not create a new sale.
- Browser fallback is tested.
- Only after all checks pass may the status move from Test ausstehend to Getestet.

## Legal Pages

- Impressum route exists.
- Datenschutz route exists.
- Nutzungsbedingungen route exists.
- Problem melden route exists.
- Legal production texts are present.
- Final legal review remains required as the product evolves.
- Organizer responsibility notice is visible.

## Support Process

- Support contact for support problem reports is present.
- Support issue report format is defined.
- Emergency contact is defined for live events.
- Printer setup problems have a triage path.

## Backup And Recovery

- Supabase backup process is confirmed.
- Recovery process is documented for operators.
- Export fallback is verified.
- Incident notes capture event, time, terminal, and helper context.

## Production Feedback Procedure

- Each live event records device, browser, printer, QZ Tray, paper, and print result.
- Organizer feedback is collected after setup and after event completion.
- Helper/cashier feedback is collected during or immediately after the event.
- Printing issues are tagged separately from UX and data issues.
- Product Backlog is updated after each live event.
