# What Codex Needs Next

This file is a temporary handoff/scratchpad for deployment and follow-up work.
Add details here when Codex asks for them. After Codex uses a temporary value,
it should remove that value from this file.

Do not put database passwords, private Supabase keys, Cloudflare API keys,
GitHub personal access keys, or any private account passwords here.

## Cloudflare Pages Setup

Cloudflare's current React/Vite Pages guidance uses:

- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`

Cloudflare's build-configuration docs also list React/Vite as:

- Build command: `npm run build`
- Build directory: `dist`

Official references:

- <https://developers.cloudflare.com/pages/framework-guides/deploy-a-react-site/>
- <https://developers.cloudflare.com/pages/configuration/build-configuration/>
- <https://developers.cloudflare.com/pages/configuration/redirects/>

## Click-By-Click Cloudflare Setup

1. Log in to Cloudflare.
2. Open **Workers & Pages**.
3. Choose **Create application**.
4. Choose **Pages**.
5. Choose **Import an existing Git repository**.
6. Connect GitHub if Cloudflare asks.
7. Select this repository:

   ```text
   AnJoMort0/WerewolvesOnTheClocktower_App
   ```

8. Use these build settings:

   ```text
   Project name: werewolves-on-the-clocktower-app
   Production branch: main
   Framework preset: Vite
   Install command: npm ci
   Build command: npm run build
   Build output directory: dist
   Root directory: leave empty / repository root
   Node version: 22
   ```

9. Add environment variables in Cloudflare Pages:

   ```text
   VITE_SUPABASE_URL=https://ahbkwclivorvwndnmblz.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=the Supabase publishable/anon key
   VITE_PUBLIC_APP_URL=https://your-project-name.pages.dev
   ```

10. Deploy.
11. After Cloudflare gives the real `pages.dev` URL, update
    `VITE_PUBLIC_APP_URL` to that exact URL if it differs from the first guess.
12. Redeploy after changing environment variables.
13. Test:

    - Open `/`.
    - Create a room.
    - Open `/join?room=ROOMCODE`.
    - Refresh the GM and player URLs directly.

## Temporary Values Codex May Ask For

Add values here only when needed, then let Codex remove them after use.

### Cloudflare

- Pages project name:
- Final `pages.dev` URL:
- Production branch:
- Any Cloudflare build error text:

### Supabase

- Supabase project ref: `ahbkwclivorvwndnmblz`
- Supabase URL:
- Supabase publishable key:
- Confirmation that migrations were applied:
- Any Supabase error text:

### GitHub

- Repository owner/name:
- Branch to deploy from:
- Pull request URL:
- GitHub Actions or Cloudflare build URL:

## Current Local Verification

Update this when tests are re-run:

- `npm test`:
- `npm run lint`:
- `npm run build`:
- Local LAN test:
- Hosted Cloudflare test:

## Notes For Codex

- Keep the app free-tier friendly.
- Keep the docs understandable for a non-technical owner.
- Keep the player-facing default screens clean and appropriate for normal
  fair-play use.
- Prefer small fixes that preserve the existing GM flow.
