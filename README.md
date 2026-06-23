# Werewolves on the Clocktower App

**Werewolves on the Clocktower** is a private, non-commercial companion app for
running a custom hidden-role party game inspired by *Werewolf of the Miller's
Hollow* and selected ideas from *Blood on the Clocktower*.

The tabletop game is designed to feel familiar to players who know classic
Werewolf, while giving every player a more interesting role and keeping people
involved even after death. It has 40+ characters, EU Portuguese and French
rulebooks, day discussions, tribunal votes, night actions, ghost interactions,
bluffing, deduction, and a lot of communication.

This web app is mainly an adaptive script and control panel for the Game Master
or host. The GM can create a room, share a room code or QR code, seat players,
assign roles, run the night script, track status effects, send role reveals to
the right player screens, move through day and tribunal phases, and keep the
game state visible while the session is running.

Players use their own phones. They join with a room code or QR code, enter a
display name, and see their own role and the public table state on their device.
The app assumes a fair-play friend group or small event and is built to make
normal honest play smooth.

The project started in Lovable and is now maintained directly from this GitHub
repository with Codex/local code edits. Lovable is not required to build, run,
deploy, or maintain the app.

## Current Languages

- EU Portuguese
- French

Future plans may include English rulebooks and UI text.

Reference rule documents:

- Portuguese rules: <https://docs.google.com/document/d/1aV9II9br_8ln4zrA7wgHRByBLqyb8EzkOqc2ltHGCes/edit?usp=sharing>
- French rules: <https://docs.google.com/document/d/1Jd6N6Us3eo_LdNMcFmwEd3A5IbOAB332adSVViu7Na0/edit?tab=t.0#heading=h.dy2z3kn1r3as>

Official tier list:

- <https://tiermaker.com/create/werewolves-on-the-clocktower---official-teir-list-17406677>

Creator contact:

- <https://linktr.ee/anjomorto>

## What The App Uses

- Frontend: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- Package manager: npm, using `package-lock.json`
- Backend/data: Supabase Cloud
- Hosted deployment target: Cloudflare Pages Free
- Local mode: Vite dev server on the GM computer

The app can run locally, but it still needs internet access because it uses
Supabase Cloud for room/player data and realtime updates.

## Repository Structure

- `src/pages/Index.tsx`: create or join a room
- `src/pages/GMRoom.tsx`: GM screen
- `src/pages/JoinRoom.tsx`: player name entry
- `src/pages/PlayerView.tsx`: player phone interface
- `src/components/game`: game-specific UI
- `src/lib`: roles, i18n, night script, join URL helpers
- `src/integrations/supabase`: Supabase client and generated types
- `supabase/migrations`: reproducible database migrations
- `public/_redirects`: Cloudflare Pages SPA fallback
- `CODEX_NEEDS_NEXT.md`: deployment handoff notes and temporary info checklist
- `ROADMAP.md`: owner-maintained roadmap and playtest notes

## Required Software

- Node.js 20 or 22. `.nvmrc` pins the project to Node 22.
- npm 10 or newer. npm is installed together with Node.js.
- Optional: Supabase CLI, only needed when applying database migrations from
  your computer.

## First-Time Setup On A Computer

You only need to do this once per computer.

1. Install Node.js from <https://nodejs.org/>.

   Choose the LTS version. Restart your terminal after installing.

2. Download or clone this repository from GitHub.

3. Open a terminal in the project folder.

   On Windows:

   - Open the project folder in File Explorer.
   - Click the folder path bar at the top.
   - Type `powershell`.
   - Press Enter.

4. Install the app:

   ```sh
   npm install
   ```

5. Create a local `.env` file.

   - Make a copy of `.env.example`.
   - Rename the copy to `.env`.
   - Fill in:

   ```sh
   VITE_SUPABASE_URL=https://PROJECT_REF.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
   ```

   Optional for hosted deployments:

   ```sh
   VITE_PUBLIC_APP_URL=https://your-cloudflare-pages-host.pages.dev
   ```

## Run On The GM Computer Only

Use this when you are testing alone on the same computer.

```sh
npm run dev
```

Open:

```text
http://localhost:8080
```

## Run On Local Wi-Fi For Players' Phones

Use this when players are in the same room and connected to the same Wi-Fi.
This mode still needs internet access because Supabase Cloud stores the room
data.

1. Connect the GM computer and all phones to the same Wi-Fi.

2. Open a terminal in the project folder.

3. Start the app in LAN mode:

   ```sh
   npm run dev:lan
   ```

4. Wait for the terminal to show something like:

   ```text
   Local:   http://localhost:8080/
   Network: http://YOUR-LAN-IP:8080/
   ```

5. Use the `Network` address, not `localhost`.

   The exact number will be different on each Wi-Fi network. Common examples
   look like:

   ```text
   http://192.168.x.x:8080/
   http://10.x.x.x:8080/
   ```

6. Open that `Network` address on the GM computer.

7. Create a room.

8. Open the QR code popup on the GM screen.

9. Players scan the QR code or manually open the same `Network` address and
   enter the room code.

10. If the QR code accidentally uses `localhost`, type the `Network` address
    into the join-link box in the QR popup.

11. Keep the terminal open while playing. Closing it stops the local app.

If phones cannot open the page:

- Make sure phones are on Wi-Fi, not mobile data.
- Make sure the phones use the `Network` URL from the terminal.
- If Windows asks about Node.js/firewall access, click allow.
- If the Wi-Fi has a guest mode or device isolation mode, turn that off or use a
  normal private Wi-Fi network.

## Production Build Preview On The LAN

This checks the final built version before deploying.

```sh
npm run build
npm run preview:lan
```

## Routes

- `/`: create room or enter a room code
- `/host`: alias for the home/create screen
- `/host/:roomId`: GM room alias
- `/gm/:roomId`: existing GM room route
- `/join?room=ROOMCODE`: QR-friendly player join route
- `/join/:code`: existing player join route
- `/play/:playerId`: player interface

Direct refresh on deployed routes is supported by `public/_redirects`.

## Supabase Setup

The committed Supabase project ref is:

```text
ahbkwclivorvwndnmblz
```

Link the project locally:

```sh
supabase login
supabase init
supabase link --project-ref ahbkwclivorvwndnmblz
```

Apply migrations:

```sh
supabase db push
```

No Edge Functions are currently present in this repository.

Important database note: the current schema is represented by migrations, but
the live project should still be compared before destructive production changes:

```sh
supabase db diff --linked
```

## Free Hosted Deployment

The intended free hosted setup is Cloudflare Pages connected to GitHub.

Use these settings:

```text
Framework preset: Vite
Production branch: main
Install command: npm ci
Build command: npm run build
Build output directory: dist
Node version: 22
```

Cloudflare environment variables:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_PUBLIC_APP_URL
```

After the first deploy, Cloudflare gives the project a free `pages.dev` URL.
Put that full URL into `VITE_PUBLIC_APP_URL` so hosted QR codes use the hosted
site address.

For click-by-click setup and temporary information Codex may need, see
`CODEX_NEEDS_NEXT.md`.

## Updating the Application

```sh
git pull
npm install
npm test
npm run build
```

Merge changes into `main` to trigger the Cloudflare Pages deployment.

## Database Backup and Restore

Use the Supabase dashboard for simple backups on the free tier, or the CLI:

```sh
supabase db dump --linked --file supabase-backup.sql
```

Restore only after verifying the target project and data:

```sh
psql "postgresql://..." < supabase-backup.sql
```

Do not paste database passwords into GitHub, README files, issues, or commits.

## Cleanup of Old Rooms

The additive migration `20260623130000_lovable_independence_baseline.sql`
adds `last_activity_at`, `completed_at`, player readiness/last-seen metadata,
indexes, and `cleanup_old_rooms(retention interval)`.

Manual cleanup from Supabase SQL editor:

```sql
select public.cleanup_old_rooms('24 hours');
```

This avoids paid cron or queue services.

## Project Notes

Framework and commands:

- Framework: Vite, React, TypeScript
- Package manager: npm
- Development: `npm run dev`, `npm run dev:lan`
- Build: `npm run build`
- Tests: `npm test`
- Lint: `npm run lint`

Environment variables:

- Required browser-safe: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
- Optional browser-safe: `VITE_PUBLIC_APP_URL`
- Unused in code: `VITE_SUPABASE_PROJECT_ID`

Lovable references:

- Removed from runtime/build: `lovable-tagger` package and Vite plugin
- Removed from visible metadata: Lovable author/Twitter/GPT Engineer image tags
- Remaining tracked Lovable references: none outside documentation explaining
  the project history

Supabase:

- Tables: `rooms`, `players`
- Realtime: `rooms` and `players` added to `supabase_realtime`
- No storage buckets or Edge Functions are present in this repo

Player screen behaviour:

- Player phones are designed to show the player's own role and public table
  state by default.
- Role-specific information appears when the GM triggers the relevant reveal.
- This is a trusted-group/fair-play app.

## Current Workflow Map

GM flow:

1. Create a room from `/`.
2. Share the room code, QR code, or join link.
3. Players join the lobby.
4. GM seats players, assigns roles, sends roles, and controls phases/actions.
5. Realtime updates player role and public phase/timer state.

Player flow:

1. Join through `/join?room=CODE`, `/join/CODE`, or manual code entry.
2. Enter display name.
3. Store player ID/token in localStorage for refresh/rejoin.
4. See assigned role and public player circle after the GM sends roles.

Known incomplete or fragile areas:

- GM reload persistence for many derived game states is still mostly local.
- Duplicate player names are checked client-side but not enforced by a unique DB
  constraint because existing live data must be checked first.
- Voting and many role actions are GM-mediated rather than fully player-submitted
  and backend-validated.

## Troubleshooting

Realtime:

- Confirm both `rooms` and `players` are in the Supabase Realtime publication.
- Confirm the browser can reach `https://PROJECT_REF.supabase.co`.
- Check Supabase free-tier limits if many test rooms are left active.

Players unable to connect locally:

- Use the GM computer LAN IP, not `localhost`.
- Ensure phone and computer are on the same Wi-Fi.
- Allow Node/Vite through the firewall.
- Confirm the dev server was started with `npm run dev:lan`.

Mobile route refresh:

- Cloudflare Pages needs `public/_redirects` deployed.
- Local Vite dev already handles SPA fallback.

## Manual Test Checklist

- Create a room.
- Create enough player entries to start a game.
- Verify room-code collision handling by temporarily forcing duplicate codes in
  development.
- Join from a phone using `/join?room=CODE`.
- Join from a phone by scanning the QR code.
- Join from a phone using the copied join link.
- Refresh a player phone and confirm it rejoins the same player.
- Refresh the GM screen and confirm the room still loads.
- Confirm players appear in the GM lobby without manual refresh.
- Assign and send roles.
- Confirm each player receives their own role.
- Confirm player screens show only their own role during normal play.
- Advance night/day/tribunal phases and confirm players update.
- Trigger role reveal broadcasts and confirm only intended UI modals open.
- Complete or manually stop a game.
- Run `npm test`.
- Run `npm run build`.
- Deploy to Cloudflare Pages and refresh `/gm/...`, `/host/...`, `/join?room=...`,
  and `/play/...` directly.

## Deployment Report

This repository is now configured to build and deploy independently of Lovable.
Cloudflare Pages plus the existing Supabase project are sufficient for the free
hosted mode. Local Wi-Fi mode works through Vite and Supabase Cloud.

Steps that still require dashboard clicks:

- Add this GitHub repo to Cloudflare Pages.
- Set the Cloudflare Pages build settings and env vars.
- Confirm the Supabase project env values.
- Apply migrations to the live Supabase project after reviewing `db diff`.

## Credits

All art is digitally hand-drawn by L_PT_1463. The cards are original or
reinterpretations of *Werewolf of the Miller's Hollow* cards inspired by:

- <https://www.loups-garous-en-ligne.com/>
- <https://loupgarou.fandom.com/fr/wiki/Wiki_Loup-Garou>

The goal of recreating the cards in a unified original art style is visual
consistency while keeping the designs close enough to the classic game that new
players can understand the transition.

## Disclaimer

This project is provided as-is. Use or modification is at your own risk.

## AI Transparency

This project was made in large part as a vibe-coding project. The game
mechanics, role interactions, priorities, and corrections are requested and
directed by a human. The app implementation side has used AI assistance: it
started with Lovable and later moved to Codex so the human maintainer can use
their own web-programming knowledge to inspect, change, and correct the code
instead of fully relying on AI to fix AI-generated code.

All images are human-created. This project will always refuse to use
AI-generated art.
