# Roadmap

This file is intentionally human-owned. Codex can add items, reorganize items,
or add notes, but only the human owner should remove items after real playtests
or direct confirmation.

## Immediate Fixes

- [ ] Complete Cloudflare Pages setup and confirm the hosted `pages.dev` URL.
- [ ] Add the final Cloudflare URL to `VITE_PUBLIC_APP_URL`.
- [ ] Apply the current Supabase migrations to the live project.
- [ ] Human-test local Wi-Fi mode with at least one phone.
- [ ] Human-test hosted mode with at least one phone.
- [ ] Confirm QR codes use the correct hosted or LAN URL.
- [ ] Confirm player screens show only their own role during normal play.
- [ ] Confirm Vidente, Menina, Faroleiro, Lobisomem Vidente, Spider, and Spy
  reveal popups show the intended information during real play.
- [ ] Add a simple room reset/restart button if the current flow is clumsy in a
  real session.
- [ ] Add a simple room delete/end cleanup button if old rooms become annoying.

## Corrections To Verify

- [ ] Verify role assignment counts for 8 to 35 players.
- [ ] Verify the werewolf ratio:
  - under 12 players: 2 normal werewolves
  - 12+ players: approximately 1 werewolf-type character per 4 players
  - after special werewolves are used, add normal werewolves
- [ ] Check all EU Portuguese text in the UI.
- [ ] Check all French text in the UI.
- [ ] Check rulebook links from role cards and reveal popups.
- [ ] Check that mobile player screens have no horizontal scrolling.
- [ ] Check that GM screen controls remain usable on a tablet.
- [ ] Check that reloading a player phone keeps the same player session.
- [ ] Check that reloading the GM screen does not lose too much session state.
- [ ] Check whether old localStorage values accumulate too much over time.

## Additions

- [ ] Better GM reload persistence for night state, status effects, used powers,
  timers, and current phase.
- [ ] Better lobby readiness state for players.
- [ ] Better disconnected/reconnected player indication.
- [ ] Manual room cleanup from the GM screen.
- [ ] Export/import a room state snapshot for emergency recovery.
- [ ] Add a clearer "copy join link" success state on the GM screen.
- [ ] Add a small "how to join" helper on the player join page.
- [ ] Add a production smoke-test checklist for Cloudflare deployments.
- [ ] Add screenshots to the README after the UI stabilizes.

## Future Uncertain Plans

- [ ] English rulebook and UI.
- [ ] More complete player-submitted actions from phones.
- [ ] More automation for tribunal/voting.
- [ ] Optional offline/local-only mode if Supabase self-hosting ever becomes
  easy enough for non-technical use.
- [ ] Better role-selection presets for different player counts and play styles.
- [ ] Rulebook pages inside the app instead of linking to external HTML pages.

## Human Playtest Notes

Add playtest notes below. Do not delete old notes until the issue is clearly
fixed and tested again.

- Date: 20.06.2026 (still in the lovable app) 
  - Player count: 14
  - Language: PT
  - What went well:
  - What broke or felt confusing: players were not alwasys seeing the timer on their screens. Certain players that disconnected that had connected from the iPhone camera app could not connect back since sometimes it does not open in the default browser with permanent localStorage
  - Follow-up items:

- Date: 
  - Player count:
  - Language:
  - What went well:
  - What broke or felt confusing:
  - Follow-up items:
