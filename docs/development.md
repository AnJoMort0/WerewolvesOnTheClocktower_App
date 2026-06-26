# Development and Maintenance Guide

This document is for the project owner and maintainers. It collects the technical information needed to understand, run, test, deploy, and maintain the companion while keeping the public README focused on the game itself.

## Contents

- [Project scope](#project-scope)
- [Technology](#technology)
- [Repository structure](#repository-structure)
- [Requirements](#requirements)
- [First-time setup](#first-time-setup)
- [Commands and local development](#commands-and-local-development)
- [Application routes](#application-routes)
- [Supabase](#supabase)
- [Hosted deployment](#hosted-deployment)
- [Troubleshooting](#troubleshooting)
- [Smoke test](#smoke-test)
- [Known limitations](#known-limitations)
- [Cleanup and security](#cleanup-and-security)

## Project scope

The application is a private, non-commercial companion for a custom hidden-role party game. One Game Master runs the session while players join from their phones.

The GM interface supports room creation, room-code and QR sharing, seating, role assignment, role distribution, night-script progression, status tracking, role-specific information reveals, and movement through day, Tribunal, and night phases.

The player interface is intentionally narrower. During normal play, a player should see only their own role, public table state, phase and timer information, and reveal popups explicitly sent to them by the GM.

### Session flow

**GM flow:** create a room, share its code or QR link, seat players, assign and send roles, run the night/day/Tribunal flow, trigger private reveals, and finish the game.

**Player flow:** join through a room code or QR link, enter a display name, keep the same browser available for the session, and use the phone interface for private role information and public game state.

### Implementation history

The project began in Lovable and is now maintained directly from this repository with local code changes. Lovable is not required to build, run, deploy, or maintain the application.

AI-assisted development has been used for implementation, first through Lovable and later through Codex. The game mechanics, role interactions, priorities, corrections, and creative direction remain human-led. All visual assets are human-created.

## Technology

- Frontend: React, TypeScript, Vite, Tailwind CSS, and shadcn/ui
- Package manager: npm with `package-lock.json`
- Backend and shared data: Supabase Cloud
- Realtime synchronization: Supabase Realtime
- Hosted deployment: Cloudflare Pages connected to GitHub
- Local development: Vite dev server on the GM computer

The application can run from a local development server, but it still requires internet access because room and player data and realtime updates use Supabase Cloud.

## Repository structure

- `src/pages/Index.tsx`: create a room or enter a room code
- `src/pages/GMRoom.tsx`: Game Master interface
- `src/pages/JoinRoom.tsx`: player name entry
- `src/pages/PlayerView.tsx`: player phone interface
- `src/components/game`: game-specific interface components
- `src/lib`: roles, localisation, night script, and join URL helpers
- `src/integrations/supabase`: Supabase client and generated types
- `src/assets/roles`: character artwork used by the application and README
- `supabase/migrations`: reproducible database migrations
- `public/_redirects`: Cloudflare Pages single-page-app fallback
- `Rulebook_PT.md`: Portuguese rules and character reference
- `Rulebook_FR.md`: French rules and character reference
- `CODEX_NEEDS_NEXT.md`: temporary deployment handoff notes and information checklist
- `ROADMAP.md`: owner-maintained roadmap and playtest notes

## Requirements

- Node.js 20 or 22. `.nvmrc` pins the project to Node 22.
- npm 10 or newer.
- Optional: Supabase CLI, needed only when applying or inspecting database migrations from a computer.

## First-time setup

1. Install Node.js from <https://nodejs.org/>.
2. Open a terminal in the project folder.
3. Install dependencies:

   ```sh
   npm install
   ```

4. Copy `.env.example` to `.env` and provide the Supabase values:

   ```sh
   VITE_SUPABASE_URL=https://PROJECT_REF.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
   ```

5. For hosted deployments or a fixed base URL in generated QR codes, optionally set:

   ```sh
   VITE_PUBLIC_APP_URL=https://your-hosted-app.example
   ```

## Commands and local development

Common verification commands:

```sh
npm install
npm test
npm run build
```

### Computer-only development

```sh
npm run dev
```

Open:

```text
http://localhost:8080
```

### Local Wi-Fi playtest with phones

```sh
npm run dev:lan
```

Use the `Network` URL printed by Vite rather than `localhost`. Keep the terminal open for the duration of the session.

When a phone cannot open the page, confirm that:

- the phone and computer are connected to the same Wi-Fi network;
- the phone is not silently using mobile data;
- Node or Vite is allowed through the computer firewall; and
- the Wi-Fi network does not isolate connected devices from one another.

### Production preview on the local network

```sh
npm run build
npm run preview:lan
```

## Application routes

- `/`: create a room or enter a room code
- `/host`: alias for the home/create screen
- `/host/:roomId`: GM room alias
- `/gm/:roomId`: GM room route
- `/join?room=ROOMCODE`: QR-friendly player join route
- `/join/:code`: player join route
- `/play/:playerId`: player interface

Direct refreshes on deployed routes are supported by `public/_redirects`.

## Supabase

The current Supabase project reference is:

```text
ahbkwclivorvwndnmblz
```

### Link the local project and apply migrations

```sh
supabase login
supabase link --project-ref ahbkwclivorvwndnmblz
supabase db push
```

### Compare local migrations with the live project

Before destructive production changes, inspect the difference:

```sh
supabase db diff --linked
```

### Create a manual backup

```sh
supabase db dump --linked --file supabase-backup.sql
```

The schema uses `rooms` and `players`, Supabase Realtime, row-level security policies, and the manual cleanup helper `cleanup_old_rooms(retention interval)`.

## Hosted deployment

Production hosting uses Cloudflare Pages connected to GitHub. Cloudflare Pages builds the Vite application and publishes `dist` automatically. The deploy command must remain blank.

### Cloudflare Pages settings

```text
Framework preset: Vite
Production branch: main
Install command: npm ci
Build command: npm run build
Build output directory: dist
Deploy command: leave blank
Node version: 22
```

### Cloudflare environment variables

```text
VITE_SUPABASE_URL=https://ahbkwclivorvwndnmblz.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=the Supabase publishable key for this project
VITE_PUBLIC_APP_URL=the hosted app base URL
```

Trigger a fresh deployment after changing Cloudflare environment variables.

## Troubleshooting

### Cloudflare reports failure after `vite build` succeeds

A deploy command such as `npx wrangler deploy` is probably configured. Remove the deploy command and allow Cloudflare Pages to publish the build output itself.

### Hosted room creation returns `401 (Unauthorized)`

Likely causes include:

- the Cloudflare publishable key does not match the Supabase project;
- environment variables were changed without a fresh deployment; or
- database migrations, grants, or row-level security policies are missing from the live project.

Inspect the failed request body in the browser Network panel:

- `Invalid API key`: the key does not match the project.
- `permission denied for table rooms`: required grants are missing.
- `new row violates row-level security policy`: the live insert policy is missing or incorrect.

### Realtime updates do not arrive

Confirm that:

- `rooms` and `players` are included in the Supabase Realtime publication;
- the browser can reach Supabase;
- the configured Supabase URL and publishable key are correct; and
- free-tier limits have not been exhausted by accumulated test rooms or excessive connections.

## Smoke test

Run this checklist before a release or an important play session:

- Create a room.
- Join from a phone or private browser window through `/join?room=CODE`.
- Confirm the player appears in the GM lobby and is shown as ready and connected.
- Assign and send roles.
- Confirm each player receives only their own role during normal play.
- Refresh the GM page and confirm the local GM snapshot restores the running state.
- Refresh a player phone and confirm it rejoins the same player.
- Open the QR popup on short and tall screens and confirm it is not cropped.
- Trigger Vidente/Menina/Faroleiro/Lobisomem Vidente/Spider/Spy reveal popups and confirm only the intended player screens receive them.
- Use the GM manual game-over flow and confirm players receive the correct victory or defeat popup.
- Run `npm test`.
- Run `npm run build`.

## Known limitations

- Many role actions are still mediated manually by the GM.
- Complete backend validation is intentionally limited for this private, trusted-group use case.
- Some advanced recovery, automation, and rules-interaction features remain on the roadmap.
- Players should normally keep the same browser available throughout a session so the stored player identity can be reused after a refresh.

Track active priorities and playtest findings in [ROADMAP.md](ROADMAP.md).

## Cleanup and security

The GM screen includes a manual cleanup action for old lobby and finished rooms. The underlying helper can also be called from the Supabase SQL editor:

```sql
select public.cleanup_old_rooms('24 hours');
```

Never commit or paste any of the following into the repository:

- database passwords;
- private Supabase keys;
- Cloudflare API keys;
- GitHub personal access tokens;
- account passwords; or
- generated production backups containing private data.
