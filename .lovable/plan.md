# Implementation Plan

Splitting the work into 6 focused passes. After approval I'll execute them in order.

## Pass 1 — i18n cleanup & quick text fixes

- `**i18n/types.ts**`: add `UIStrings.toasts` and `UIStrings.warnings` records (string templates with `{name}`, `{n}`). Add `winLabels` (village, werewolves, lovers, whiteWolf, secretLover, tie) and `gameOverTitles` (victory/defeat).
- `**pt.ts` / `fr.ts**`:
  - Translate every PT toast/warning currently hardcoded in `GMRoom.tsx`, `PlayerCircle.tsx`, `NightScript.tsx`, `AddPlayerForm.tsx`, `JoinRoom.tsx`.
  - Remove `👁️` from v23 caught-line and f02 line.
  - Move v23 "spiderWebbedDied" line to the **top** of `normalNight` (so it appears before everything else).
  - Change `amanteCheckboxLabel` to `Encontrado`/`Trouvé`.
- `**GMRoom.tsx`, `PlayerCircle.tsx`, `NightScript.tsx`, `AddPlayerForm.tsx`, `JoinRoom.tsx**`: replace every hardcoded PT string with `t(...)`. Add a tiny `format(template, vars)` helper.

## Pass 2 — Small mechanic fixes

- **as01b checkbox in circle & list** (`PlayerCircle.tsx`, `GMRoom.tsx` list row): render checkbox like Chaman charges; pass `amanteUsed` + `onAmanteToggle` down.
- **NightScript.tsx**: when `isAmanteBaseLine && amanteUsed` → **hide** the line (return null instead of strikethrough).
- **v17 immunity_full timing**: confirmed already removed only in `startNextNight`. Add an explicit comment + audit guard.
- **f02 auto-spawn `spied_on**`: in `sendRolesToPlayers`, find the f02 player and seed `spied_on` effect.
- **Poisoned v23 reveal**: pick a random in-play role that is **not** the actual caught role per slot.
- **a05 swap glitch**: rewrite swap to `await` both supabase updates atomically and update local `players` state + `roleAssignments` (also avoid the stale-fetch race by not relying on RT roundtrip for character).
- When the webbed player is an Ilusão, the v23's line should change to be "A {Aranha} está confusa."/"L'{Araignée} est confuse."

## Pass 3 — Rulebook anchor links on player popups

- `**RevealModal.tsx**`: `RevealCard` gets optional `roleId` + `lang`; wrap image in an `<a>` pointing to `Rulebook_{PT|FR}.html#{roleId}`.
- `**VidenteRevealModal.tsx**`: same treatment.
- **GMRoom broadcast payloads**: include `roleId` in spider/spy/menina/faroleiro/lv cards.

## Pass 4 — GM state persistence (reload-safe)

Persist all GM-side derived state in `localStorage` keyed by `wotct_gm_state_{roomId}`:

- `playerStatuses`, `permanentlyDead`, `poisonedPlayerId`, `illusionPlayerId`, `playerEffects`, `killSources`, `chamanCharges`, `paranoicoCharges`, `anjoCharges`, `lobisomemMauCharges`, `cupidoCharges`, `lobisomemVidenteUsed`, `lobisomemVampiroUsed`, `gameCyclePhase`, `dayPhase`, `nightNumber`, `lastNightDeadPlayerIds`, `dayKilledPlayerIds`, `amanteUsed`, `juizCharges`, `acusadorCharges`, `salvadorLastTarget`, `chefeLastTarget`, `vampireVictimKeepsPower`, `foxDisabled`, `profeciaDeadAtNight`.

Use a single `useEffect` debounced (~250 ms) to serialize Sets/Records, plus a hydration `useEffect` on mount keyed by `roomId`.

## Pass 5 — Automatic victory conditions

State + logic in `GMRoom.tsx`:

- New helpers (memoized): classify each alive player as `werewolf | lover | whiteWolf | secretLover | other`.
- New `detectedWin` memo (recalculated every time `playerStatuses` / `permanentlyDead` / `playerEffects` / `roleAssignments` change):
  - `village`: zero werewolves left (alive non-perma, treating `werewolf_turned` & `evil_being` and `WEREWOLF_ROLES` as wolves)
  - `werewolves`: only evil beings remain
  - `lovers`: only `namorado`-tagged players remain AND none of them is `as01b`
  - `whiteWolf`: only `s02` alive
  - `secretLover`: only `as01b` + one other `namorado` alive
- `pendingWin` state holds `{ kind, manual: boolean }`. When `detectedWin` flips and is not declined for this combo, open `WinConfirmModal` (GM-only).
- Modal: Accept → broadcast `game-over` to player channel with payload `{ kind, perRole: Record<RoleId, "victory"|"defeat"> }` and set `room.status = "ended"`. Decline → stash a `declinedWinSnapshot` (hash of alive-set) so the same condition doesn't re-open until state changes again.
- Manual trigger: small icon button (`Trophy` icon) in GM header; opens chooser of `village | werewolves | lovers | whiteWolf | secretLover | tie`, then same confirm modal.
- `**PlayerView.tsx**`: listen on `game-over-{roomId}` channel; render dismissable modal with localized title (e.g., "Vitória da Aldeia" / defeat). After dismissing, player can still see their role + circle.

## Pass 6 - Additional checks

- Check how the Werewolf ratio is calculated, it should go like that:
  - For every 4 players, there should be one Werewolf character:
    - <12 players there should be two e01
    - >12 start introducing special Werewolves
    - Once all special werewolves are used, start adding e01
- Check that we are not stocking useless localStorage things long term to fill up the computer's storage for mostly one-time things

## Files touched

`src/lib/i18n/types.ts`, `src/lib/i18n/pt.ts`, `src/lib/i18n/fr.ts`, `src/pages/GMRoom.tsx`, `src/pages/PlayerView.tsx`, `src/pages/JoinRoom.tsx`, `src/components/game/PlayerCircle.tsx`, `src/components/game/NightScript.tsx`, `src/components/game/RevealModal.tsx`, `src/components/game/VidenteRevealModal.tsx`, `src/components/game/PlayerStatusPopover.tsx`, `src/components/game/AddPlayerForm.tsx`, plus a new `src/components/game/WinConfirmModal.tsx` and `src/components/game/GameOverModal.tsx`.