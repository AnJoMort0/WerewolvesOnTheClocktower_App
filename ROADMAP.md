# Roadmap

This file is intentionally human-owned. Codex can add items, reorganize items, or add notes, but only the human owner should remove items after real playtests or direct confirmation.

## Tests to Do

* [ ] Human-test local Wi-Fi mode with at least one phone.
* [ ] Human-test hosted mode with at least one phone.
* [ ] Confirm QR codes use the correct hosted or LAN URL.
* [ ] Find out what "Clear previous rooms" button does.
* [ ] Check this: "Add a production smoke-test checklist for Cloudflare deployments. - Codex note 2026-06-23: Added to `docs/development.md`."

## Critical Fixes

* [x] Once player is dead, they no longer recieve updates, including ressurection or card switch (except Grave Robber, which is working fine)
  * Codex note 2026-06-26: Added a player-sync broadcast/refetch fallback after life and character updates so dead devices receive resurrection and card-switch changes.
* [x] Players shouldn't be able to click out of information pop-ups (if on GM screen always also show on player's device)
  * Codex note 2026-06-26: Player-side information popups are non-dismissible and stay visible until the GM closes the matching popup.
* [x] All intense blurs on GM screen should instead be a blank background to hide information
* [x] Saviour's immunity should only last for the night
  * Codex note 2026-06-26: Salvador immunity is cleared at dawn; m01 disguise immunity still lasts through the following day and clears at the next night.
* [x] When a card appears in the script, it should receive the "Spied On" status effect (when the werewolves are called, all `e01` are marked as spied on)
* [x] Once per game, on daytime, `v23` can change who is webbed (needs a checkbox for `v21`)
  * Codex note 2026-06-26: Added a once-per-game daytime Spider web-change charge, visible on GM controls and included in Faroleiro/v21 limited-use reveal.
* [x] Clicking on card image on player device pop-ups doesn't work (`v01`, `v21`, `f02`)
* [x] `v03` should only have the confused line when an Evil Being is an illusion
* [x] `v22` : when a player is set as accused, it first as the vote_accused_last_nigt icon instead of the vote_accused icon. After the GM clicks the End Night button, instead of removing the icon, change it to be the vote_accused icon permantly (or until manually removed). If v22 is drag-dropped onto someone, that player gets the accused status effect. v22 is never caught by the spiderweb (add a data-driven list of characters that cannot be caught by the web)
  * Codex note 2026-06-26: `acusado_next` converts to `acusado` at dawn, and `WEB_IMMUNE_ROLES` prevents v22 from being caught.
* [x] `a05` should be drag-and-dropped onto a red-x character, to give them the dug up effect using the `dug_up.png` icon. If a red-x character with the dug up effect permanently dies, he loses dug up effect and  switches cards with `a05`. Dug up effect is cleared at the end of the night.
* [x] French capitals should still have accents. "Ação" instead of "Acão".
* [x] f02: dead characters not tagged with spied_on should still appear for him
* [x] v04: change the checkbox to look like the target of the Lobisomem Vampiro. These checkboxes don't appear to the v21
* [x] m01 checkboxes are not appearing in the player circle. Also clicking on the checkboxes in the script is not giving him immunity like it should (and the checkboxes in the player list do)
* [x] Add a Hide Screen option to the GM interface. In this mode, show only the circle, player names, and the day/tribunal timer. Hide all characters and other critical information so players can safely approach and talk to the GM. This should also hide the script and side panels, but keep dev tools (QR code, room controls)
  * Codex note 2026-06-26: Hide Screen hides roles, status markers, script, side panels, validation warnings, and interactions while keeping room controls, QR access, the circle names, and a safe timer readout.

## Fixes

* [ ] Remove strange manually added line breaks from the README, this file, and similar files. Do not be afraid to keep an entire paragraph on one line.
  * Codex note 2026-06-23: README was cleaned and development docs were split out. This ROADMAP still intentionally keeps some nested note formatting for readability.
* [x] Rewrite the README so it is readable and useful to people visiting the GitHub repository who want to understand the project.
* [x] Do not make the current deployed app URL or current app name easily visible in the public-facing README, because it should not attract unnecessary access.
* [x] Move development-focused, internal, or visitor-unfriendly README content into a file such as `dev_log.md`, `docs/development.md`, or another appropriately named internal information file.
  * Codex note 2026-06-23: Moved setup, deployment, smoke-test, and maintenance notes into `docs/development.md`.

## Corrections to Verify

* [ ] Verify role-assignment counts for an almost unlimited number of players, even though a real game is unlikely to exceed 35–40 players.
  * Codex note 2026-06-23: Added automated coverage for werewolf counts up to 60 players. Full role-mix balance for very high player counts still needs design/playtest confirmation.
* [ ] Check that GM screen controls remain usable on a tablet.
* [ ] Check that reloading a player phone keeps the same player session.
* [ ] Check that reloading the GM screen preserves the complete session state.
  * Codex note 2026-06-23: Partial GM snapshot persistence was added. Needs playtest confirmation, especially timers and recovery after browser/device changes.
* [ ] Check whether old or unnecessary `localStorage` values accumulate over time.
  * Codex note 2026-06-23: Old GM snapshots are pruned after 7 days. Other browser session keys still need a cleanup policy.
* [ ] Ensure mostly one-time or obsolete `localStorage` data is removed instead of being kept indefinitely and gradually filling the computer's storage.
  * Codex note 2026-06-23: Same as above; GM snapshots now have retention cleanup, but player/browser session data still needs a deliberate cleanup design.

## Additions

* [ ] Add screenshots to the README after the UI stabilizes.
* [ ] Add new character `m06` to app and docs
* [ ] Add new character `v24` to app and docs
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

## Future Plans

* [ ] Add rulebook pages inside the app instead of linking to external HTML pages.
* [ ] Add a logs of the games for easy recap at the end of the game
* [ ] Add the fonctionnality for the complex characters not yet deployed
* [ ] Add an English rulebook and English UI.
* [ ] Support more complete player-submitted actions from phones.
* [ ] Add better role-selection presets for different player counts and play styles (also better balance).

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
