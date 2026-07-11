# Deployment

## Production Domain

The canonical production domain is:

- `https://eventbons.com`

The production site will host:

- landing page
- organizer login
- sales application

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
