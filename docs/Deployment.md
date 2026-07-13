# Deployment

## Production Domain

The canonical production domain is:

- `https://eventbons.com`

The production site will host:

- landing page
- organizer login
- sales application

The closed pilot release is eventBon Windows Pilot.

Officially supported during the pilot:

- Windows 10
- Windows 11
- Chrome
- Edge
- QZ Tray
- Brother TD-4000

iPad, Android, and additional certified printers are planned later.

## Environment Variables

Production must set:

```text
NEXT_PUBLIC_APP_URL=https://eventbons.com
```

This value is used for public URLs such as helper invitation links, helper QR codes, and organizer password recovery redirects.

Developers can override the value locally in `.env.local`, for example:

```text
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Localhost examples are only for development and should not be used for production or beta invitation links.

## Supabase Auth Redirects

Supabase Auth should allow the production reset URL:

- `https://eventbons.com/reset-password`

Local development may additionally allow:

- `http://localhost:3000/reset-password`

Password reset emails should use `NEXT_PUBLIC_APP_URL` as the base URL and append `/reset-password`.

## Helper Invitations

Helper invitation links and QR codes must use the public app URL.

In production this means:

- `https://eventbons.com/helper?code=...`

Protected Vercel preview URLs must not be used for event helpers because helpers should not encounter a Vercel login wall.

## Development

Local development can continue to use localhost through `.env.local`.

Production documentation, setup instructions, invitation URLs, and password recovery links should reference `https://eventbons.com`.

## Legal And Support Pages

The production app must expose organizer-accessible placeholder pages during pilot preparation:

- `/impressum`
- `/datenschutz`
- `/nutzungsbedingungen`
- `/problem-melden`

The legacy `/support` route may redirect to `/problem-melden` for compatibility.

The pages use pilot-phase legal and support text. Final legal review is required before public production.

Organizers are responsible for uploaded images, product information, prices, and allergen information.
