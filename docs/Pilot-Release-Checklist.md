# Pilot Release Checklist

## Release Definition

Current release name:

- eventBon Windows Pilot

Officially supported for the closed pilot:

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

Open production assumptions to verify before pilot:

- Vercel production environment variables match `.env.example`.
- Supabase Auth redirect URLs include `https://eventbons.com/reset-password`.
- Supabase production schema migrations are executed in order.
- QZ Tray is installed and trusted on pilot Windows devices.

## Vercel Production Configuration

- Production domain points to `https://eventbons.com`.
- `NEXT_PUBLIC_APP_URL=https://eventbons.com`.
- Supabase URL and publishable key are configured for production.
- No protected preview URL is used for helper invitations.
- Production build succeeds.

## Supabase Production Configuration

- All SQL migrations are applied.
- `save_completed_sale` RPC signature matches the frontend payload.
- Storage bucket `product-images` exists and is configured for the intended pilot access model.
- RLS/security posture is reviewed for closed pilot use.
- Full production RLS/security review remains required before public production.

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
- Footer shows Windows Pilot label, support placeholder, system requirements, and legal/support links.

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

- QZ Tray is installed on each Windows pilot device.
- Browser can connect to QZ Tray.
- Selected printer name matches the installed Brother TD-4000 printer name.
- QZ connection error messages are understandable.
- Browser print fallback remains available for diagnostics.

## Brother TD-4000 Test

- Brother TD-4000 is installed in Windows.
- Correct media is loaded.
- eventBon profile is selected.
- Test print is readable.
- Single vouchers print all vouchers.
- Combined voucher prints one voucher where possible.
- Cut or tear behavior is verified.

## Legal Pages

- Impressum route exists.
- Datenschutz route exists.
- Nutzungsbedingungen route exists.
- Support / Problem melden route exists.
- Placeholder TODOs are clearly marked.
- Final legal review remains required before public production.
- Organizer responsibility notice is visible.

## Support Process

- Support contact placeholder is replaced before external pilot invitations.
- Pilot issue report format is defined.
- Emergency contact is defined for live pilot events.
- Printer setup problems have a triage path.

## Backup And Recovery

- Supabase backup process is confirmed.
- Recovery process is documented for pilot operators.
- Export fallback is verified.
- Incident notes capture event, time, terminal, and helper context.

## Pilot Feedback Procedure

- Each pilot event records device, browser, printer, QZ Tray, paper, and print result.
- Organizer feedback is collected after setup and after event completion.
- Helper/cashier feedback is collected during or immediately after the event.
- Printing issues are tagged separately from UX and data issues.
- Beta backlog is updated after each pilot.
