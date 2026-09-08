# Roadmap

This file is intentionally human-owned. Codex can add items, reorganize items, or add notes, but only the human owner should remove items after real playtests or direct confirmation. Only human should add things to "Human Tests to Do", "Other changes Outside of the Repo" and "Future Plans".

## Human Tests to Do

* [ ] Check English translations
* [ ] Touch screen compatibility
* [ ] Human-test local Wi-Fi mode with at least one phone.
* [ ] Human-test hosted mode with at least one phone.
* [ ] Confirm QR codes use the correct hosted or LAN URL.
* [ ] Find out what "Clear previous rooms" button does.
* [ ] Lovable version: Some players who initially joined through the iPhone Camera app could not reconnect after disconnecting. The Camera app sometimes did not open the link in the default browser I guess, so the reconnecting session did not have access to the original persistent `localStorage` data (I don't know if there's a possibility to fix this somehow, if there isn't just tell me)
  * Codex note 2026-06-27: Separate iPhone browser contexts cannot share `localStorage`. The join screen now recovers an existing player by matching the same room and player name when the local session is unavailable.

## Other Changes Outside of the Repo

* [ ] Remove Sleepwalker from Drunkard in DOCS
* [ ] Decide: Should the Vampire Werewolf be webbed?

## Critical Fixes

* [x] Looks like if a player is killed first (red-x) and then given imunity (of course check type as well to not add imunities when not needed) the player still dies
  <!-- Codex 2026-09-07: All immunity application paths now resolve pending red-X deaths using the attack type, including before dawn/night transitions. Covers Cupid and linked Lover suicides, one-use shields, copied attacks, and the Big Bad Wolf execution exception; permanently dead players are not revived. Added 22 regression tests; all 154 tests pass. -->

## Fixes

* [ ] 

## Balance Changes

* [ ] 

## Additions

* [x] Adding phone interactions:
  <!-- Codex 2026-09-08: Added GM-controlled, reconnectable phone sessions for group hunting, ally identification, Witch poisoning, and Shaman saving. Actor, Dog-Wolf, Drunkard, and Mime copies use their own player identity and power state; kills, poison owners, resurrection charges, and logs go through the existing GM action paths. Covered by rules, multi-device synchronization, script integration, and browser smoke tests. -->
  <!-- Codex 2026-09-08: Follow-up visual pass aligned phone action screens, script controls, shared modals, cards, and overlays with the game's compact parchment/blood UI. Hunt vote synchronization no longer flashes the final-action waiting message. -->
  * [x] In the Werewolves script line there's a "phone" icon button. When the GM clicks that button the Werewolves devices chante to group hunt mode (change aesthetics), if a werewolf selects a player in the circle, a small icon appears over that player in every werewolf device and when all werewolves have the same player selected the GM receives a pop-up to confirm ro deny the kill. In the map, all werewolves are red with the werewolf icon. (all of these interactions include the Pupetteer too, since he is pretending to be a werewolf) The GM can remove that screen from players at anytime by clicking the phone button again in the script line.
  * [x] In the Werewolves wake up to see the alies script line, make it so there's the phone icon and when clicked the werewolve's devices change to a mode where they can see all the players, with all the evil beings appearing red and with the evil being icon, werewolves appear with the werewolf icon.
  * [x] In the Bruxa script line there is a "phone" icon button. When the GM clicks that button the Witch player device changes to poison mode (change aesthetics --> green), so he can click on a player on the circle that he wants to poison and there's a confirm of do you want to poison "player" ? And if he confirms, that player is poisoned and the poison mode turns off and the player can't do any more actions, same thing if the GM clicks off in the phone button in the script, it turns off the mode in the player's device.
  * [x] The chaman also has the phone icon and when clicked he enters his magic mode, where he can see the red x players in his circle and click on one of them and then clicked "save", otherwise he can just click "ignore" and that closes his mode with no action. GM can also close as always.
  
## Future Plans

* [ ] Add the new 25th aniversary WoMH cards
* [ ] Add evil being that requests anonymous votes
* [ ] Adding phone interactions
* [ ] Small beautifying of the page: Make all the pages (GM and Players) change colours during the day/night (at night keep the current dark theme, during the day change it to light theme but in the same aesthetic and during the Tribunal change it to a more mysterious late of day type vibe), make the code future proof so we can also add small features to it in the future (for example, if there are no deaths in the morning, it's more bright, but if there were deaths in the morning, it becomes more dark/bloodied/bad weather, stuff like that, to make it fun and dynamic)
* [ ] Add an English rulebook and English UI.
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
