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
* [ ] **Lovers and Cupid victory:** Trigger when only characters tagged `Namorado` remain. `s01` may be dead or alive for this condition to count. This victory condition cannot occur if one of the lovers is `as01b`. `s01` and all characters tagged `Namorado` win; everyone else loses.
* [ ] **White Werewolf victory:** Trigger when only `s02` remains. `s02` wins and everyone else loses.
* [ ] **Secret Lover victory:** Trigger when only `as01b` and one other character tagged `Namorado` remain. `as01b` **and the lover wins** and everyone else loses.

## Other Changes Outside of the Repo

* [ ] DOCS + ALMANAC: Add the new (Were)Wolf Tamer card
* [ ] DOCS + ALMANAC: Add the new Vintner card
* [ ] DOCS + ALMANAC: Rearrange cards by affinity instead of ID; place the Spider Tamer beside the other Tamers and separate Werewolves from their allies

## Critical Fixes

* [ ] Didn't properly explain these winning conditions. Needs to be fixed ASAP:
* [ ] When the tagged lovers are alive, the game continues util they are killed, because even if the werewolves are killed, there's still the possibility of the lovers or the secret lover to keep killing everyone to accomplish their objective of being the last ones alive. s01 can also be alive for the lovers winning condition to work, but it's not mandatory that he is, s01 also wins when this happens. The other winning conditions will only be possible when the lovers are dead.
* [ ] Even if all non-werewolves are dead, but the s02 is still alive, the game continues in case he kills all the other werewolves to win. The werewolves only win once he is dead.
* [ ] When the GM manually sends a tie win, a list of all the possible groups appear for the GM to tick which ones tied. Can be none and therefore everyone gets a defeat, can be some or all of them.
* [ ] **Secret Lover victory:** Trigger when only `as01b` and one other character tagged `Namorado` remain. `as01b` **and the lover wins** and everyone else loses.

* [ ] Remove all code links to the 2 characters that were not yet implemented but are already showing in the app. We'll properly implement them fully later on.

## Fixes

* [ ] The v12 script line should only appear when there are poisoned characters
* [ ] Cupid normal night script line should not be drag-droppable to make lovers, that is only the first night line.

## Balance Changes

* [ ] When there are no other Werewolf characters alive, the s02 line "(A cada 3 noites) O {Lobisomem Branco} acorda e escolhe o Lobisomem que quer matar.", requires: ["s02"], conditionKey: "whitewolfNight"" changes to be "(A cada 3 noites) O {Lobisomem Branco} acorda e escolhe mais um jogador que quer matar.", requires: ["s02"], conditionKey: "whitewolfNight".

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

## Tried to fix, never worked

* [ ] Timers stop showing the player's devices when they reload the page.

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
