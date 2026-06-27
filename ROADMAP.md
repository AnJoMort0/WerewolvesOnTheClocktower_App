# Roadmap

This file is intentionally human-owned. Codex can add items, reorganize items, or add notes, but only the human owner should remove items after real playtests or direct confirmation.

## Human Tests to Do

* [ ] Human-test local Wi-Fi mode with at least one phone.
* [ ] Human-test hosted mode with at least one phone.
* [ ] Confirm QR codes use the correct hosted or LAN URL.
* [ ] Find out what "Clear previous rooms" button does.
* [ ] Check the README file.
* [ ] Lovable version: Some players who initially joined through the iPhone Camera app could not reconnect after disconnecting. The Camera app sometimes did not open the link in the default browser I guess, so the reconnecting session did not have access to the original persistent `localStorage` data (I don't know if there's a possibility to fix this somehow, if there isn't just tell me)
  * Codex note 2026-06-27: Separate iPhone browser contexts cannot share `localStorage`. The join screen now recovers an existing player by matching the same room and player name when the local session is unavailable.
* [ ] **Village victory:** Trigger when all werewolf characters have been eliminated. All non-evil beings and non-solo characters win. Evil beings, solo characters, `s01`, `s02`, `as01b`, and characters tagged `Namorado` lose.
* [ ] **Werewolf victory:** Trigger when only evil beings remain. All evil beings win. Every other character, including solo characters, loses.
* [ ] **Lovers and Cupid victory:** Trigger when only characters tagged `Namorado` remain. `s01` may be dead or alive for this condition to count. This victory condition cannot occur if one of the lovers is `as01b`. `s01` and all characters tagged `Namorado` win; everyone else loses.
* [ ] **White Werewolf victory:** Trigger when only `s02` remains. `s02` wins and everyone else loses.
* [ ] **Secret Lover victory:** Trigger when only `as01b` and one other character tagged `Namorado` remain. `as01b` wins and everyone else loses.

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
* [x] The Tribunal timer is lagging, it's constantly flipping between 03:00 and 05:00 (even when start button is clicked), seems to auto fix if the restart button is clicked, still unintended behaviour, fix that.
* [x] Werewolf poisoned warning is blank, I did update some names of texts to not have portuguese names in the code, but only use english and some of them may not have updated everywhere properly, please check that.
* [x] A dead character that was ressurected that had a script line ticked, gets the script line still ticked when ressurected. Every night all the script lines should get unticked, even if hidden to make sure this does not happen.
* [x] Winning conditions should be on player's perma-dead not red-X

## Fixes

* [x] Timer controls in the hidden mode of the GM screen should be the same as the non hidden mode (the cogwheel to fine tune minutes and seconds not a +/- minutes).
* [x] Timers stop showing the player's devices when they reload the page.

## Additions
* [ ]


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
