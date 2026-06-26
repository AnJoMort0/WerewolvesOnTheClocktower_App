# Private Hidden-Role Game Companion

This is a private, non-commercial companion app for running a custom hidden-role party game inspired by classic Werewolf-style social deduction games. It is built for a trusted friend group or small event where one Game Master runs the session and players use their phones.

The app gives the GM a control panel for creating a room, sharing a code or QR link, seating players, assigning roles, running the night script, tracking status effects, revealing role-specific information, and moving through day and tribunal phases. Player phones show only the information each player should normally see: their own role, public table state, phase information, timers, and GM-triggered reveal popups.

The project began in Lovable and is now maintained directly from this repository with local code edits. Lovable is not required to build, run, deploy, or maintain it.

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

## Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- Package manager: npm, using `package-lock.json`
- Backend/data: Supabase Cloud
- Hosted deployment target: Cloudflare Pages
- Local mode: Vite dev server on the GM computer

The app can run locally, but it still needs internet access because it uses Supabase Cloud for room/player data and realtime updates.

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

## Maintainer Notes

Setup, local Wi-Fi testing, deployment details, database notes, troubleshooting, and smoke-test checklists are in [docs/development.md](docs/development.md). The active owner-maintained roadmap is in [ROADMAP.md](ROADMAP.md).

Common commands:

```sh
npm install
npm test
npm run build
npm run dev
```

Important environment variables are `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and optional `VITE_PUBLIC_APP_URL`. Do not commit database passwords, private Supabase keys, Cloudflare API keys, GitHub personal access keys, or account passwords.

## Workflow

GM flow: create a room, share the code or QR link, seat players, assign roles, send roles, run the night/day/tribunal flow, and trigger reveal popups when needed.

Player flow: join through a room code or QR link, enter a display name, keep the same browser open for the session, and use the phone view for role and public table state.

Known limits: many role actions are still GM-mediated, complete backend validation is intentionally minimal, and some advanced recovery/automation features are still on the roadmap.

## Credits

All art is digitally hand-drawn by L_PT_1463. The cards are original or reinterpretations of *Werewolf of the Miller's Hollow* cards inspired by:

- <https://www.loups-garous-en-ligne.com/>
- <https://loupgarou.fandom.com/fr/wiki/Wiki_Loup-Garou>

The goal of recreating the cards in a unified original art style is visual consistency while keeping the designs close enough to the classic game that new players can understand the transition.

## Disclaimer

This project is provided as-is. Use or modification is at your own risk.

## AI Transparency

This project was made in large part as a vibe-coding project. The game mechanics, role interactions, priorities, and corrections are requested and directed by a human. The app implementation side has used AI assistance: it started with Lovable and later moved to Codex so the human maintainer can use their own web-programming knowledge to inspect, change, and correct the code instead of fully relying on AI to fix AI-generated code.

All images are human-created. This project will always refuse to use
AI-generated art.
