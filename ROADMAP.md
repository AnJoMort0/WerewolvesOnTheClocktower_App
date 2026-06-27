# Roadmap

This file is intentionally human-owned. Codex can add items, reorganize items, or add notes, but only the human owner should remove items after real playtests or direct confirmation.

## Human Tests to Do

* [ ] Human-test local Wi-Fi mode with at least one phone.
* [ ] Human-test hosted mode with at least one phone.
* [ ] Confirm QR codes use the correct hosted or LAN URL.
* [ ] Find out what "Clear previous rooms" button does.
* [ ] Check the README file.

## Other Changes Outside of the Repo

* [ ] DOCS + ALMANAC: Once per game, on daytime, `v23` can change who is webbed
* [ ] DOCS + ALMANAC: Add the new (Were)Wolf Tamer card
* [ ] DOCS + ALMANAC: Add the new Vintner card
* [ ] DOCS + ALMANAC: Update the Saviour so full immunity lasts for only one night
* [ ] DOCS + ALMANAC: Update the Spy so a character gains the `Spied On` status when called by the Narrator; regular Werewolves all gain it when the Werewolves are called
* [ ] DOCS + ALMANAC: Once per game, during daytime, `v23` Spider Tamer can change who is webbed even if the current target is still alive
* [ ] DOCS + ALMANAC: Update the Illusioner so Pedro sees an illusory Werewolf as innocent when he accuses them
* [ ] DOCS + ALMANAC: Rearrange cards by affinity instead of ID; place the Spider Tamer beside the other Tamers and separate Werewolves from their allies

## Critical Fixes


## Fixes

* [x] The Portuguese word "Esgotado" is hard coded and needs to be moved to i18n
* [x] Changes for the v01 pop-up: If it's a soldier that killed, it's still shows the capitain card but "soldier" in the text instead of capitain. If there werewolves killes it says werewolves plural.
* [x] Add the timer controls to the hidden mode in the GM screen.
* [x] Players did not always see the timer on their screens, when the timer is in the GM screen, it should appear in the players devices.
  * Codex note 2026-06-27: Timer, phase, and Game Over state now have a durable room-state fallback in addition to realtime broadcasts. Apply `20260627010000_room_live_state.sql` to Supabase before deploying this version.
* [x] Lovable version: Some players who initially joined through the iPhone Camera app could not reconnect after disconnecting. The Camera app sometimes did not open the link in the default browser I guess, so the reconnecting session did not have access to the original persistent `localStorage` data (I don't know if there's a possibility to fix this somehow, if there isn't just tell me)
  * Codex note 2026-06-27: Separate iPhone browser contexts cannot share `localStorage`. The join screen now recovers an existing player by matching the same room and player name when the local session is unavailable.
* [x] Check whether old or unnecessary `localStorage` values accumulate over time.
  * Codex note 2026-06-23: Old GM snapshots are pruned after 7 days. Other browser session keys still need a cleanup policy.
  * Codex note 2026-06-27: GM snapshot retention is now one day, stale matching advanced-mode values are removed, and obsolete GM token values are pruned when a room is created.
* [x] Ensure mostly one-time or obsolete `localStorage` data is removed instead of being kept indefinitely and gradually filling the computer's storage.
  * Codex note 2026-06-23: Same as above; GM snapshots now have retention cleanup, but player/browser session data still needs a deliberate cleanup design.
  * Codex note 2026-06-27: Player reconnect data now uses one current-session value with a rolling 24-hour expiry instead of accumulating per-room and per-player keys.
--> for these two last ones, a new game at least a day apart could overight old data if that is something that is doable and the easiest way to implement it

## Additions

* [x] Every script line has a tickeable box, when ticked it strikesthroughs for the GM to follow where they are. Drag-dropping a character (from the script, player circle or player list), or using the player's power (checkboxes) it also ticks the script line. This will also help with another automation, when a character that gives a status effect that stays until applied to someone else (e02, v09, etc) dies, the status effect is removed from the target when the GM checks a script line that is after the one of the deceased character
* [x] Add automatic victory-condition detection and game-over handling.
  * Codex note 2026-06-23: Manual Game Over sending was added. Automatic detection and repeated-prompt timing still need implementation.
  * Codex note 2026-06-27: Automatic detection now reuses the manual Game Over delivery path. A declined result is suppressed for the current game-state signature and reconsidered after the next relevant change.

### Automatic Victory Conditions

* [x] **Village victory:** Trigger when all werewolf characters have been eliminated. All non-evil beings and non-solo characters win. Evil beings, solo characters, `s01`, `s02`, `as01b`, and characters tagged `Namorado` lose.
* [x] **Werewolf victory:** Trigger when only evil beings remain. All evil beings win. Every other character, including solo characters, loses.
* [x] **Lovers and Cupid victory:** Trigger when only characters tagged `Namorado` remain. `s01` may be dead or alive for this condition to count. This victory condition cannot occur if one of the lovers is `as01b`. `s01` and all characters tagged `Namorado` win; everyone else loses.
* [x] **White Werewolf victory:** Trigger when only `s02` remains. `s02` wins and everyone else loses.
* [x] **Secret Lover victory:** Trigger when only `as01b` and one other character tagged `Namorado` remain. `as01b` wins and everyone else loses.
* [x] When an automatic victory condition is met, show the GM a popup asking whether to end the game.
* [x] If the GM accepts, send every player a removable Game Over popup showing either a victory or defeat title. After dismissing it, players must still be able to access their character and the player circle so they can discuss the game.
  * Codex note 2026-06-23: This behavior exists for the manual Game Over path. It still needs to be connected to automatic victory acceptance.
  * Codex note 2026-06-27: Automatic victory acceptance is now connected to that delivery path.
* [x] If the GM declines, do not immediately show the same prompt again. Recalculate the victory conditions after the next night, day, tribunal, or other relevant game-state update, and show the prompt again if the condition is still valid.

## Future Plans

* [ ] Add new character `m06` to app and docs
* [ ] Add new character `v24` to app and docs
* [ ] Add rulebook pages inside the app instead of linking to external HTML pages.
* [ ] Add a logs of the games for easy recap at the end of the game
* [ ] Add the fonctionnality for the complex characters not yet deployed
* [ ] Remove any useless files or deprecated lines of code, vestiges of old versions, etc
* [ ] Add an English rulebook and English UI.
* [ ] Support more complete player-submitted actions from phones.
* [ ] Add better role-selection presets for different player counts and play styles (also better balance).
* [ ] Add screenshots to the README after the UI stabilizes.

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
