# Development Notes

This file is for the owner/maintainer. It keeps setup and deployment details out of the public-facing README while preserving the practical information needed to run and maintain the app.

## Requirements

- Node.js 20 or 22. `.nvmrc` pins the project to Node 22.
- npm 10 or newer.
- Optional: Supabase CLI, only needed when applying database migrations from a computer.

## First-Time Setup

1. Install Node.js from <https://nodejs.org/>.
2. Open a terminal in the project folder.
3. Install dependencies:

   ```sh
   npm install
   ```

4. Copy `.env.example` to `.env` and fill in:

   ```sh
   VITE_SUPABASE_URL=https://PROJECT_REF.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
   ```

5. For hosted deployments or fixed QR-code base URLs, optionally set:

   ```sh
   VITE_PUBLIC_APP_URL=https://your-hosted-app.example
   ```

## Local Run

Computer-only test:

```sh
npm run dev
```

Open:

```text
http://localhost:8080
```

Local Wi-Fi test with phones:

```sh
npm run dev:lan
```

Use the `Network` URL printed by Vite, not `localhost`. Keep the terminal open while playing.

If phones cannot open the page, confirm the phone and computer are on the same Wi-Fi, mobile data is not being used, Node/Vite is allowed through the firewall, and the Wi-Fi network does not isolate devices from each other.

## Production Preview

```sh
npm run build
npm run preview:lan
```

## Routes

- `/`: create room or enter a room code
- `/host`: alias for the home/create screen
- `/host/:roomId`: GM room alias
- `/gm/:roomId`: GM room route
- `/join?room=ROOMCODE`: QR-friendly player join route
- `/join/:code`: player join route
- `/play/:playerId`: player interface

Direct refresh on deployed routes is supported by `public/_redirects`.

## Supabase

The current Supabase project ref is `ahbkwclivorvwndnmblz`.

Link and apply migrations:

```sh
supabase login
supabase link --project-ref ahbkwclivorvwndnmblz
supabase db push
```

Before destructive production changes, compare the live project:

```sh
supabase db diff --linked
```

Manual backup:

```sh
supabase db dump --linked --file supabase-backup.sql
```

The schema uses `rooms` and `players`, Supabase Realtime, row-level security policies, and the manual cleanup helper `cleanup_old_rooms(retention interval)`.

## Hosted Deployment

Hosted deployment uses Cloudflare Pages connected to GitHub. Keep the deploy command blank; Cloudflare Pages builds the Vite app and deploys `dist` automatically.

Cloudflare Pages settings:

```text
Framework preset: Vite
Production branch: main
Install command: npm ci
Build command: npm run build
Build output directory: dist
Deploy command: leave blank
Node version: 22
```

Cloudflare environment variables:

```text
VITE_SUPABASE_URL=https://ahbkwclivorvwndnmblz.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=the Supabase publishable key for this project
VITE_PUBLIC_APP_URL=the hosted app base URL
```

After changing Cloudflare environment variables, trigger a fresh deployment.

## Troubleshooting

Cloudflare failure after `vite build` succeeds usually means a deploy command such as `npx wrangler deploy` is set. Remove the deploy command.

Hosted room creation with `401 (Unauthorized)` usually means the Cloudflare publishable key is wrong, the environment variables were changed without redeploying, or Supabase migrations/grants/RLS policies are missing. Check the failed Network response body: `Invalid API key` means key mismatch, `permission denied for table rooms` means grants are missing, and `new row violates row-level security policy` means the live RLS insert policy is missing.

Realtime issues: confirm `rooms` and `players` are in the Supabase Realtime publication, the browser can reach Supabase, and free-tier limits have not been hit by many old test rooms.

## Smoke Test

- Create a room.
- Join from a phone or private browser window using `/join?room=CODE`.
- Confirm the player appears in the GM lobby and shows as ready/connected.
- Assign and send roles.
- Confirm each player receives only their own role during normal play.
- Refresh the GM page and confirm the local GM snapshot restores the running state.
- Refresh a player phone and confirm it rejoins the same player.
- Open the QR popup on short and tall screens and confirm it is not cropped.
- Trigger Vidente/Menina/Faroleiro/Lobisomem Vidente/Spider/Spy reveal popups and confirm only intended player screens show them.
- Use the GM manual game-over flow and confirm players receive victory/defeat popups.
- Run `npm test`.
- Run `npm run build`.

## Cleanup

The GM screen includes a manual cleanup action for old lobby/finished rooms. The underlying SQL helper can also be called from the Supabase SQL editor:

```sql
select public.cleanup_old_rooms('24 hours');
```

Do not paste database passwords, private keys, Cloudflare API keys, GitHub tokens, or account passwords into the repository.
