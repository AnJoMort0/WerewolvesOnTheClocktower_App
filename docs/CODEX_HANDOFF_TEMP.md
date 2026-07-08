# Temporary Codex Handoff

Last updated: 2026-07-09

This is a temporary inheritance document for moving development to another
device and another Codex session. Read it before changing the current
worktree. Delete it only after the new agent has absorbed the context and the
current patch has been committed or otherwise preserved.

## Immediate State

- Repository: `https://github.com/AnJoMort0/WerewolvesOnTheClocktower_App`
- Current branch: `main`
- Current base commit: `9e57ab4 Update - Role assets`
- The work described below is local and uncommitted.
- `ROADMAP.md` is intentionally human-owned. Codex may check completed items
  and add notes, but should not delete the owner's requests or playtest history.
- `src/assets/roles/a07.png` was already deleted by the user before the current
  patch began. Do not restore it unless the user explicitly asks.
- No deployment, commit, or push was performed during this patch.

Start on the new device with:

```powershell
git status --short
git diff --check
git diff --stat
```

Review the current diff before rebasing, pulling, committing, or switching
branches. Preserve unrelated user changes.

## Current Patch

The current ROADMAP batch has been implemented and marked complete in code.
The remaining uncertainty is real-device and multi-client behavior, which is
listed under `Human Tests to Do` in `ROADMAP.md`.

### Rules and GM behavior

- A Fortune Teller reveal now uses the poison state of the player actually
  receiving the information. This fixes GM-side results for a poisoned
  Fortune Teller and Dog-as-Fortune-Teller.
- The House Maid receives the circular distance to every poisoned player,
  including the Dog copying that power.
- A poisoned Werewolf pack cannot drag a victim. The normal Werewolf card and
  script line are both non-draggable while the pack is poisoned.
- Vampire Werewolf and Werewolf Seer lines require a current Werewolf victim,
  and stale revealed-victim state is cleared between nights.
- An Evil Being Sister who becomes poisoned automatically changes to `e01`,
  loses the Evil Being status, syncs to players, and records the role change.
- The first Actor Idol choice costs no use. The Actor then has two changes.

Relevant files:

- `src/pages/GMRoom.tsx`
- `src/lib/gameRules.ts`
- `src/lib/actor.ts`
- `src/components/game/PlayerCircle.tsx`
- `src/components/game/NightScript.tsx`

### Dog-Wolf and Actor behavior

- Repeated owner-role names in one Dog script line are all replaced with Dog.
- When the Dog chooses the Actor as owner, the copied Actor prompt does not
  appear during the same night. On the following night it displays a
  parenthesized, localized Narrator/Meneur notice asking the Dog to choose an
  Idol.
- The Owner status remains visible after Dog-as-Actor becomes independent.
- Dog state now stores `ownerSelectedNight`. Existing snapshots remain valid
  because state normalization merges persisted values with defaults.
- When Dog-as-Actor copies a role, the player's large card is the copied role.
  A Dog-Wolf card appears in its corner, with a smaller Actor card on the Dog
  card. If the copied identity is the Drunkard, the hidden replacement role is
  still shown instead of revealing the Drunkard.

Relevant files:

- `src/lib/dogWolf.ts`
- `src/lib/playerCharacter.ts`
- `src/pages/PlayerView.tsx`
- `src/pages/GMRoom.tsx`
- `src/components/game/NightScript.tsx`

The nested player-card presentation needs a phone/reconnect playtest. Do not
redesign it before checking the actual player screen.

### Rulebook script cleanup

- The old prose copies of the PT and FR night scripts were removed from
  `RULEBOOK_TEXT`.
- `RULEBOOK_NIGHT_SCRIPT` is now the only night-script source inside
  `rulebookContent.ts`.
- Script IDs use `first-role`, `second-role`, or `normal-role`. Repeated lines
  for the same role and phase use `.1`, `.2`, and so on.
- `rulebook.ts` now renders the dynamic script at the end of the full rulebook.

There are still intentionally two script systems in the app:

- Live GM script lines are localized in `src/lib/i18n/pt.ts` and `fr.ts`.
- Full rulebook and analog-room script content lives in
  `RULEBOOK_NIGHT_SCRIPT` in `src/lib/rulebookContent.ts`.

The cleanup removed duplication within `rulebookContent.ts`; it did not merge
the live interactive GM script with the rulebook source.

## Architecture That Matters

### Stack

- React 18, TypeScript, Vite, Tailwind CSS
- Supabase database and Realtime
- Vitest and Testing Library
- Cloudflare Pages production hosting
- Node 20 or 22 and npm 10

### Game state

`src/pages/GMRoom.tsx` is the main game orchestrator and authoritative GM
client. It owns room state, phases, role assignments, effects, transformations,
logs, private reveal payloads, and most Supabase synchronization.

Be careful to distinguish these concepts:

- Base role: the physical/externally visible identity.
- Effective role: the role currently displayed or followed by transformations.
- Ability role: the power whose script and action logic a player performs.
- Objective role: the team/victory logic a player follows.

Actor, Drunkard, and Dog-Wolf deliberately make those identities differ.
Avoid replacing this model with a single role lookup.

Core mechanic modules:

- `src/lib/roles.ts`: role definitions and role metadata.
- `src/lib/actor.ts`: Actor state and copied-role helpers.
- `src/lib/drunkard.ts`: Drunkard replacement rules.
- `src/lib/dogWolf.ts`: Dog owner, independent copied state, charges, and
  objective helpers.
- `src/lib/gameRules.ts`: shared rule predicates and calculations.
- `src/lib/playerCharacter.ts`: metadata encoded into private player character
  values so transformed identities survive synchronization/reconnection.

Status effects may have source-specific meaning. The Dog and owner can be
poisoned independently, and some copied powers need independent information.
Check the source player ID before reusing a result or effect.

### Scripts and localization

- `src/lib/i18n/types.ts`: localization interfaces.
- `src/lib/i18n/pt.ts` and `fr.ts`: UI text and live GM scripts.
- `src/components/game/NightScript.tsx`: filters, transforms, renders, and
  completes live script lines.
- `src/lib/rulebookContent.ts`: editable rulebook text, character text, and
  the analog/full-rulebook night script.
- `src/lib/rulebook.ts`: converts structured rulebook content into renderable
  sections.

When adding a localization key, update the interface and both languages in the
same patch.

### Realtime and private player data

The GM persists and broadcasts state through Supabase. Player pages also parse
private character metadata. A UI that works before refresh may still fail
after reconnecting if a new transformation field is not included in:

1. metadata encoding,
2. metadata parsing,
3. GM synchronization, and
4. player rendering.

The current patch follows that path for `dogActorCopy`.

## Tests and Verification

The complete test suite currently passes:

```text
16 test files
99 tests
```

The 43 focused tests most relevant to this patch also pass. They cover shared
game rules, Actor Idol uses, private player metadata, rulebook script
rendering, Dog repeated-name replacement, delayed Dog-as-Actor prompting, and
poisoned Werewolf drag prevention.

Run the final checks on the new device:

```powershell
npm.cmd install
npx.cmd tsc --noEmit
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

At handoff creation time, TypeScript, `git diff --check`, all 99 tests, lint,
and the production build were green. Lint reports only the two existing Fast
Refresh warnings listed below. The production build also reports the existing
large-chunk and outdated Browserslist-data warnings.

Known non-blocking warnings before this patch:

- React Fast Refresh warnings in `PlayerStatusPopover.tsx` and
  `RevealModal.tsx`.
- Node may print a `punycode` deprecation warning during Vitest.
- npm may be unable to write its debug log in the old device's user cache;
  this does not indicate a project test failure.

## Manual Playtest Priorities

Use at least one GM browser and one phone:

1. Poison the real Fortune Teller, then Dog-as-Fortune-Teller, and compare the
   GM and player reveal modals.
2. Poison multiple players and verify both House Maid variants receive every
   circular distance.
3. Poison the Werewolf pack. Confirm there is no victim drag, Vampire
   Werewolf wake-up, or Werewolf Seer wake-up.
4. Select an Actor Idol. Confirm no checkbox is consumed, then change the Idol
   twice and confirm both uses are consumed.
5. Make the Dog choose Actor on night 2. Confirm the special Dog Idol prompt
   first appears on night 3 and the Owner status remains.
6. Kill the Dog's Idol and inspect the player phone before and after reload.
   Confirm copied role, Dog badge, and nested Actor badge.
7. Give Sister both Evil Being and poison. Confirm she changes to Werewolf on
   GM, player, display, script, and log views.
8. Open the built-in rulebook in PT and FR. Confirm there is exactly one night
   script at the end and analog-room checkbox state still uses stable IDs.

## Backend and Deployment

- Supabase project ref: `ahbkwclivorvwndnmblz`
- Cloudflare Pages project: `werewolves-on-the-clocktower-app`
- Production URL:
  `https://werewolves-on-the-clocktower-app.pages.dev`
- GitHub remote:
  `https://github.com/AnJoMort0/WerewolvesOnTheClocktower_App`

Do not put keys in this handoff. Local configuration belongs in `.env`, using
`.env.example` as the template.

Current migrations, in order:

```text
20260305212923_2c90afae-bd51-46c8-b34e-938379fe7735.sql
20260409091404_b57c8b43-4591-4e9c-a45b-7d36f9cb97cd.sql
20260513064124_b3973bd2-1619-49e4-ba1b-54e1183ca2d1.sql
20260623130000_lovable_independence_baseline.sql
20260623170000_public_api_grants.sql
20260627010000_room_live_state.sql
20260627134436_fix_abandoned_room_cleanup.sql
20260630090000_room_timer_defaults.sql
```

The current patch adds no database migration.

## Recommended Resume Order

1. Read `ROADMAP.md`, this file, and `docs/development.md`.
2. Inspect `git status` and the current diff. Preserve the deleted `a07.png`.
3. Run the verification commands above.
4. Perform the manual tests most relevant to the next requested mechanic.
5. Commit the current patch before starting a large new role implementation.
6. Push and let Cloudflare deploy only after the owner approves the patch.

The next major work should be selected from the unchecked ROADMAP, not inferred
from old chat history. Dog-Wolf combinations have the largest interaction
surface, so changes there should include focused tests and a reconnect check.
