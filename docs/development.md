# Development and Maintenance Guide

This document is for the project owner and maintainers. It collects the technical information needed to understand, run, test, deploy, and maintain the companion while keeping the public README focused on the game itself.

## Contents

- [Project scope](#project-scope)
- [Technology](#technology)
- [Repository structure](#repository-structure)
- [Requirements](#requirements)
- [First-time setup](#first-time-setup)
- [Commands and local development](#commands-and-local-development)
- [Publishing the Windows LAN download](#publishing-the-windows-lan-download)
- [Publishing the standalone rulebook](#publishing-the-standalone-rulebook)
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

For measured asset/database sizes, Realtime message estimates, free-tier capacity, and outstanding reliability work, see the [free-tier audit](free-tier-audit.md).

- Frontend: React, TypeScript, Vite, Tailwind CSS, and shadcn/ui
- Package manager: npm with `package-lock.json`
- Backend and shared data: Supabase Cloud
- Realtime synchronization: Supabase Realtime
- Hosted deployment: Cloudflare Pages connected to GitHub
- Local development: Vite dev server on the GM computer

The normal Vite development/preview servers use Supabase Cloud and require internet. For fully offline games, use `npm run lan` after preparing the app, or the portable Windows launcher. See the [offline LAN guide](offline-lan.md) for detailed instructions.

## Repository structure

- `src/pages/Index.tsx`: create a room or enter a room code
- `src/pages/GMRoom.tsx`: Game Master interface
- `src/pages/JoinRoom.tsx`: player name entry
- `src/pages/PlayerView.tsx`: player phone interface
- `src/components/game`: game-specific interface components
- `src/components/game/GameModal.tsx`: shared reveal dialog shell, heading, scrolling body, and fixed footer
- `src/components/game/RevealCardGallery.tsx`: shared single-card and multiple-card layout, artwork, role links, copied-card badges, and charge markers
- `src/lib`: roles, localisation, night script, rulebook content, and join URL helpers
- `src/test`: automated tests grouped to mirror the application folders, plus shared test setup
- `scripts`: maintenance scripts, including artwork optimisation
- `server/lan`: offline room storage, event relay, and static app server
- `docs`: development and maintenance documentation
- `src/integrations/supabase`: Supabase client and generated types
- `src/assets/roles`: editable original character artwork
- `src/assets/display`: generated 512px WebP cards/skins and 128px icons used by the application
- `src/assets/extras`: extra rulebook card artwork used by the in-app reference
- `supabase/migrations`: reproducible database migrations
- `public/_redirects`: Cloudflare Pages single-page-app fallback
- `docs/README.md`: player-facing description and launch instructions; GitHub displays it on the repository homepage
- `docs/ROADMAP.md`: owner-maintained roadmap and playtest notes
- `config`: Vite, Vitest, ESLint, Tailwind, PostCSS, and application/tool TypeScript configuration
- `.build`: ignored generated application, standalone rulebook, portable LAN kit, release ZIP, and downloaded runtime

The root retains npm's manifests, the editor's `tsconfig.json`, shadcn's `components.json`, application `index.html`, environment/version settings, and the double-click launcher. These files serve their tools' standard discovery or the player's launch flow. Original artwork is kept as editable source; optimised display assets are used by the game and rulebook. `node_modules` remains ignored in the location npm requires.

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

After adding or changing original artwork in `src/assets/roles`,
`src/assets/extras`, or `src/assets/icons`, run `npm run assets:optimize` and commit the generated
`src/assets/display` copies. The app imports these smaller WebP files; the
original PNGs remain available for editing. The README uses the optimised copies. The script preserves
aspect ratios and transparency, avoids enlarging small images, and caps each
edge at 512 pixels for cards and 128 pixels for icons. No image processing runs in a player's browser.

### Automated tests

Tests are for everyone maintaining the app. They check game rules and interface behaviour and help catch regressions after changes. They are run by Vitest with `npm test`; they are not part of the player-facing application.

All test files live under `src/test`, mirroring the source folders:

```text
src/test/
  components/game/  # Game interface tests
  hooks/            # Hook and realtime coordination tests
  lib/              # Game rules and utility tests
    i18n/           # Localisation tests
  pages/            # Page tests
  setup.ts          # Shared browser test setup
```

For example, `src/lib/colossus.ts` is tested by `src/test/lib/colossus.test.ts`. Add new `.test.ts` or `.test.tsx` files in the corresponding test folder. Use `@/` imports to refer to application code so imports stay clear and independent of the test directory depth.

Run a single file with `npm test -- src/test/lib/colossus.test.ts`, or use `npm run test:watch` while making changes.

### Computer-only development

```sh
npm run dev
```

Open:

```text
http://localhost:8080
```

### Local Wi-Fi playtest with phones

This development command still uses the hosted Supabase backend. For a game with no internet, use the [offline LAN setup](offline-lan.md).

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

## Publishing the Windows LAN download

Generated outputs belong under the ignored `.build` directory: `app`, `rulebook`, `lan-kit`, `release`, and `runtime`. Saved games in `.lan` and legacy `.lan-runtime` caches are also ignored. None of these belongs in source control. GitHub releases distribute the ready-to-play binary separately from the source history, as recommended in [GitHub's large-file guidance](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github).

### Build a ZIP locally

On Windows with x64 Node 22 and its bundled `LICENSE` beside `node.exe`:

```sh
npm ci
npm run lan:release
```

This builds `.build/lan-kit` and creates `.build/release/WerewolvesOnTheClocktower-LAN-Windows-x64.zip` plus its `.sha256` checksum. The ZIP contains a portable Node runtime, the app, server, double-click launcher, illustrated player guide, LAN instructions, and licences. It excludes saved games and runtime caches. The build clears the owner's hosted URL and Supabase configuration, and replaces the kit's generated `dist` so obsolete bundles cannot enter a new release. Packaging refuses to replace a kit containing `.lan`; move that used kit to a backup location first.

On GitHub, open **Releases → Draft a new release**, choose a new tag such as `lan-v0.1.0`, add a short description, and attach the ZIP and checksum before publishing. The README links to the releases page and names this exact ZIP. GitHub's automatically supplied **Source code** downloads use the first-time setup launcher instead.

### Let GitHub build and attach it

After committing and pushing `.github/workflows/lan-release.yml` together with the application changes:

1. Open **Releases → Draft a new release**, choose a new tag targeting that commit, describe the changes, and publish it.
2. The **Windows LAN download** workflow installs the pinned Node version on a Windows runner, runs the automated tests and TypeScript check, and builds the ZIP.
3. When the workflow succeeds, it attaches the ZIP and checksum to that release. Until then, the release has only GitHub's source archives; their first-time launcher setup is explained in the offline LAN guide.

Alternatively, open **Actions → Windows LAN download → Run workflow** to build without publishing. Download the **Windows-LAN-download** artifact after success and extract that artifact to obtain the game ZIP. This manual run does not create or change a release. Only the release-upload job receives repository write permission; the build uses read permission. No account tokens need to be added to the project.

Before recommending a release, extract its game ZIP into a new folder and double-click the launcher, then test a phone joining on the intended network. Never include a used kit's game data in a public download.

## Publishing the standalone rulebook

The rulebook has its own HTML and React entry in `src/rulebook`. It uses the shared rules, translations, artwork, skin previews, and lore explanations. Its build includes no game lobby, GM/player screens, database client, LAN server, service worker, or hosted game link. Readers can choose English, Portuguese, or French without downloading or joining a game.

### Enable GitHub Pages once

1. Commit and push the application and `.github/workflows/rulebook-pages.yml` to the repository's `main` branch.
2. On GitHub, open **Settings → Pages**. Under **Build and deployment**, set **Source** to **GitHub Actions**. Do not select the `docs` folder as a branch publishing source; this rulebook requires its own build.
3. Open **Actions → Publish rulebook → Run workflow**, select `main`, and run it. Later pushes to `main` rebuild and publish automatically. If the default branch has another name, update the workflow's `branches` setting.
4. When the deployment succeeds, open the URL shown by the workflow's **github-pages** environment. For this repository it is **https://anjomort0.github.io/WerewolvesOnTheClocktower_App/**. The player README already links to this address with `?lang=en`.

Use `?lang=pt` or `?lang=fr` for the other languages. Character links use ordinary page anchors, for example `?lang=en#v27`; they survive refreshes without SPA route redirects. Only the `.build/rulebook` artifact is published. No Supabase secrets, Node server, custom domain, or other website configuration is required. The workflow uses the Pages base path reported by GitHub, so assets work at the repository subpath. GitHub Pages must be available for the repository under the owner's plan and visibility settings.

These steps follow [GitHub's Pages publishing-source guide](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) and [custom workflow guide](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages). Moving the README into `docs` still allows GitHub to show it on the repository homepage, as described in [GitHub's README guide](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes).

### Preview before publishing

```sh
npm ci
npm run rulebook:build
npm run rulebook:preview
```

Open the preview URL with `/WerewolvesOnTheClocktower_App/` appended and `?lang=en`. The output is `.build/rulebook`; normal app builds use `.build/app`. On another repository or domain, set `RULEBOOK_BASE_PATH` to its URL path, including leading and trailing slashes, when building and previewing. The Pages workflow handles this automatically. Changes to rulebook wording require editing only the shared content and rebuilding.

After building, `npm run test:rulebook-browser` checks the real artifact under the Pages subpath in headless Edge: character anchors and refresh, three languages, lore, artwork, and fonts, with external app requests blocked. It requires Node 22 and an installed Chromium browser; set `LAN_BROWSER` to its executable if Edge is not at the default Windows location. It shares the browser helper with the LAN smoke test and leaves no test data behind.

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

Production hosting uses Cloudflare Pages connected to GitHub. Cloudflare Pages builds the Vite application and publishes `.build/app` automatically. The deploy command must remain blank.

### Cloudflare Pages settings

```text
Framework preset: Vite
Production branch: main
Install command: npm ci
Build command: npm run build
Build output directory: .build/app
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
