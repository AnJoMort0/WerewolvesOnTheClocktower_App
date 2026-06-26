# Roadmap

This file is intentionally human-owned. Codex can add items, reorganize items, or add notes, but only the human owner should remove items after real playtests or direct confirmation.

## Tests to Do

* [ ] Human-test local Wi-Fi mode with at least one phone.
* [ ] Human-test hosted mode with at least one phone.
* [ ] Confirm QR codes use the correct hosted or LAN URL.
* [ ] Confirm player screens show only their own role during normal play.
* [ ] Confirm Vidente, Menina, Faroleiro, Lobisomem Vidente, Spider, and Spy reveal popups show the intended information during real play.

## Critical Fixes

* [ ] Preserve the complete game state when the GM reloads the page or temporarily loses the connection. Status effects, the current day or night, the current phase, used powers, timers, and other relevant state must remain saved.
  * Codex note 2026-06-23: Partial local GM snapshot persistence was added for most GM state. This still needs confirmation for tribunal timer state, cross-device recovery, and import/export recovery.
* [x] Fix Advanced Characters mode sometimes being forgotten during a game, causing Advanced Characters to disappear from the character list.
  * Codex note 2026-06-23: Persisted per room and auto-enabled when saved assignments include advanced roles.
* [x] Fix the werewolf ratio logic. There should be one werewolf-type character for every four players: 8–11 players should have 2 NORMAL werewolves, then 1 normal werwolf and the rest special werwolves: 12–15 should have 3, 16–19 should have 4, 20–23 should have 5, and so on. Special werewolves should be assigned first, followed by normal werewolves as needed.
  * Codex note 2026-06-23: Implemented as 2 normal werewolves for 8-11, then floor(player count / 4) for 12+. From 12+ there is always at least one normal werewolf, then special werewolves are assigned before extra normal werewolves. Added automated tests through 60 players.
* [x] The full-screen QR code is way too scaled up in certain screens cropping the top

## Immediate Fixes

* [x] Add a simple room reset or restart button if the current flow is clumsy during a real session.
  * Codex note 2026-06-23: Added a GM reset action that returns the room to lobby, clears characters/readiness, and clears local GM state.
* [x] Add a simple room delete or end button if old rooms become annoying.
  * Codex note 2026-06-23: Added a GM end-room action that marks the room finished, removes players, and clears local GM state.
* [ ] Remove strange manually added line breaks from the README, this file, and similar files. Do not be afraid to keep an entire paragraph on one line.
  * Codex note 2026-06-23: README was cleaned and development docs were split out. This ROADMAP still intentionally keeps some nested note formatting for readability.
* [x] Rewrite the README so it is readable and useful to people visiting the GitHub repository who want to understand the project.
* [x] Do not make the current deployed app URL or current app name easily visible in the public-facing README, because it should not attract unnecessary access.
* [x] Move development-focused, internal, or visitor-unfriendly README content into a file such as `dev_log.md`, `docs/development.md`, or another appropriately named internal information file.
  * Codex note 2026-06-23: Moved setup, deployment, smoke-test, and maintenance notes into `docs/development.md`.
* [x] Remove the checkbox for `as01b`. Instead, automatically hide or remove the character's normal night-script line whenever the character has the `Namorado` tag.
* [x] Make the `a05` switch occur only when the red-X character becomes permanently dead. A status effect may be used if that is easier to implement, using the provided `dug_up.png` icon.
  * Codex note 2026-06-23: Implemented by gating the switch to permanently dead players. I did not add the optional `dug_up.png` status effect because the permanent-death state was already available.
* [x] Make `v05` wake whenever a neighbouring player is targeted by `e02` or by a werewolf character. Ensure `v05` still wakes when the neighbouring target is immune or caught. Immunity or being caught may prevent the target from receiving a red X, but must not prevent the targeting event from being registered.
* [x] Increase the background blur behind information popups, such as the Vidente popup, so it is similar to the blur shown behind the QR-code popup. This should prevent players from seeing sensitive background information when the popup is shown to them.
* [x] Remove the eye icon from the confused Spider `v23` script line.
* [x] Move the normal-night `f02` script line so it appears immediately after the `e04` script line.

## Corrections to Verify

* [ ] Verify role-assignment counts for an almost unlimited number of players, even though a real game is unlikely to exceed 35–40 players.
  * Codex note 2026-06-23: Added automated coverage for werewolf counts up to 60 players. Full role-mix balance for very high player counts still needs design/playtest confirmation.
* [ ] Verify the complete werewolf assignment logic:
  * Codex note 2026-06-23: Automated tests now cover the requested 8+ werewolf counts and special-vs-normal werewolf ordering. Fewer than 8 players still needs intended-design confirmation.

  * Fewer than 8 players: confirm the intended minimum setup.
  * 8–11 players: 2 werewolf-type characters (in this case keep as is: 2xe01).
  * 12–15 players: 3 werewolf-type characters.
  * 16–19 players: 4 werewolf-type characters.
  * 20–23 players: 5 werewolf-type characters.
  * Continue adding one werewolf-type character for each additional group of four players.
  * Assign special werewolves first, then add normal werewolves until the required total is reached.
* [ ] Check all European Portuguese text in the UI.
  * Codex note 2026-06-23: Added several new PT UI strings, but they need human wording review.
* [ ] Check all French text in the UI.
  * Codex note 2026-06-23: Added several new FR UI strings, but they need human wording review.
* [x] Check rulebook links from role cards and reveal popups.
  * Codex note 2026-06-23: Verified code paths for player role cards and reveal popup images link to rolebook anchors.
* [ ] Check that mobile player screens have no horizontal scrolling.
* [ ] Check that GM screen controls remain usable on a tablet.
* [ ] Check that reloading a player phone keeps the same player session.
* [ ] Check that reloading the GM screen preserves the complete session state.
  * Codex note 2026-06-23: Partial GM snapshot persistence was added. Needs playtest confirmation, especially timers and recovery after browser/device changes.
* [ ] Check whether old or unnecessary `localStorage` values accumulate over time.
  * Codex note 2026-06-23: Old GM snapshots are pruned after 7 days. Other browser session keys still need a cleanup policy.
* [ ] Ensure mostly one-time or obsolete `localStorage` data is removed instead of being kept indefinitely and gradually filling the computer's storage.
  * Codex note 2026-06-23: Same as above; GM snapshots now have retention cleanup, but player/browser session data still needs a deliberate cleanup design.

## Additions

* [ ] Add better GM reload persistence for night state, status effects, used powers, timers, the current phase, the current day or night, and all other state required to resume a game.
  * Codex note 2026-06-23: Partial local GM snapshot persistence was added. Timer internals and emergency import/export still need follow-up.
* [x] Add a better lobby readiness state for players.
* [x] Add a clearer disconnected and reconnected player indication.
* [x] Add manual room cleanup from the GM screen.
* [ ] Add the ability to export and import a room-state snapshot for emergency recovery.
  * Codex note 2026-06-23: Local automatic snapshots exist now, but no export/import UI was added. Please specify the desired file format and whether imported snapshots should overwrite Supabase room/player rows.
* [x] Add a clearer success state after the GM copies a join link.
* [x] Add a small "How to join" helper to the player join page.
* [x] Add a production smoke-test checklist for Cloudflare deployments.
  * Codex note 2026-06-23: Added to `docs/development.md`.
* [ ] Add screenshots to the README after the UI stabilizes.
* [x] Whenever a character image appears on a player's device, including in popups opened through an eye icon in the script, make the image clickable. Clicking a character image on a player's device should open the rulebook at that role's specific anchor.
  * Codex note 2026-06-23: Verified player role cards and reveal modal images link to rolebook anchors.
* [ ] Add a Hide Screen option to the GM interface. In this mode, show only the circle, player names, and the day/tribunal timer. Hide all characters and other critical information so players can safely approach and talk to the GM.
  * Codex note 2026-06-23: Not implemented yet. Please confirm whether the night script, side panels, QR tools, and room controls should also disappear while this mode is active.
* [ ] Add automatic victory-condition detection and game-over handling.
  * Codex note 2026-06-23: Manual Game Over sending was added. Automatic detection and repeated-prompt timing still need implementation.

### Automatic Victory Conditions

* [ ] **Village victory:** Trigger when all werewolf characters have been eliminated. All non-evil beings and non-solo characters win. Evil beings, solo characters, `s01`, `s02`, `as01b`, and characters tagged `Namorado` lose.
* [ ] **Werewolf victory:** Trigger when only evil beings remain. All evil beings win. Every other character, including solo characters, loses.
* [ ] **Lovers and Cupid victory:** Trigger when only characters tagged `Namorado` remain. `s01` may be dead or alive for this condition to count. This victory condition cannot occur if one of the lovers is `as01b`. `s01` and all characters tagged `Namorado` win; everyone else loses.
* [ ] **White Werewolf victory:** Trigger when only `s02` remains. `s02` wins and everyone else loses.
* [ ] **Secret Lover victory:** Trigger when only `as01b` and one other character tagged `Namorado` remain. `as01b` wins and everyone else loses.
* [ ] When an automatic victory condition is met, show the GM a popup asking whether to end the game.
* [ ] If the GM accepts, send every player a removable Game Over popup showing either a victory or defeat title. After dismissing it, players must still be able to access their character and the player circle so they can discuss the game.
  * Codex note 2026-06-23: This behavior exists for the manual Game Over path. It still needs to be connected to automatic victory acceptance.
* [ ] If the GM declines, do not immediately show the same prompt again. Recalculate the victory conditions after the next night, day, tribunal, or other relevant game-state update, and show the prompt again if the condition is still valid.
* [x] Add a small, discreet GM button for manually sending the Game Over screen.
* [x] When the manual Game Over button is pressed, let the GM choose a winning condition or a tie, then show a confirmation popup before sending the result to player devices.

## Future Plans

* [ ] Add a logs of the games for easy recap at the end of the game
* [ ] Add the fonctionnality for the complex characters not yet deployed
* [ ] Add an English rulebook and English UI.
* [ ] Support more complete player-submitted actions from phones.
* [ ] Add better role-selection presets for different player counts and play styles (also better balance).
* [ ] Add rulebook pages inside the app instead of linking to external HTML pages.

## Human Playtest Notes

Add playtest notes below. Do not delete old notes until the issue is clearly fixed and tested again.

* Date: 20.06.2026

  * App version: Still in the Lovable app
  * Player count: 14
  * Language: PT
  * What went well:
  * What broke or felt confusing:

    * Players did not always see the timer on their screens.
    * Some players who initially joined through the iPhone Camera app could not reconnect after disconnecting. The Camera app sometimes did not open the link in the default browser, so the reconnecting session did not have access to the original persistent `localStorage` data.
  * Follow-up items:

    * Verify that timer updates reliably reach every connected player.
    * Make player reconnection less dependent on browser-specific `localStorage`.
    * Consider a recoverable player token, reconnect code, or another method that works when the join link opens in a different browser context.

* Date:

  * App version:
  * Player count:
  * Language:
  * What went well:
  * What broke or felt confusing:
  * Follow-up items:
