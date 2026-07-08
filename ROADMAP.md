# Roadmap

This file is intentionally human-owned. Codex can add items, reorganize items, or add notes, but only the human owner should remove items after real playtests or direct confirmation.

## Human Tests to Do

* [ ] Touch screen compatibility
* [ ] Human-test local Wi-Fi mode with at least one phone.
* [ ] Human-test hosted mode with at least one phone.
* [ ] Confirm QR codes use the correct hosted or LAN URL.
* [ ] Find out what "Clear previous rooms" button does.
* [ ] Check the README file.
* [ ] Playtest the Dog-Wolf with a normal action owner, an information owner, the Drunkard, and an Actor copying the Dog-Wolf.
* [ ] Confirm the Dog-Wolf owner card and objective popovers remain correct after reconnecting and after the owner changes role.
* [ ] Playtest Dog-as-Actor, Dog-as-Wild-Kid, Dog-as-Grave-Robber, Dog-as-Cupid, and Dog-as-Evil-Cupid through death and resurrection.
* [ ] Playtest an original Dog-Wolf and Actor-as-Dog together, confirming their Dog-specific status icons and charges remain independent.
* [ ] Confirm the Dog-as-Actor nested card stack on a phone after reconnecting: copied role as the large card, Dog-Wolf badge, then Actor badge.
* [ ] Confirm a poisoned Werewolf pack cannot wake or drag a victim, while an independently acting Dog-as-Werewolf remains governed by the Dog's own poison state.
* [ ] Confirm an Evil Being Sister becomes a normal Werewolf on every connected screen when she is poisoned.
* [ ] Lovable version: Some players who initially joined through the iPhone Camera app could not reconnect after disconnecting. The Camera app sometimes did not open the link in the default browser I guess, so the reconnecting session did not have access to the original persistent `localStorage` data (I don't know if there's a possibility to fix this somehow, if there isn't just tell me)
  * Codex note 2026-06-27: Separate iPhone browser contexts cannot share `localStorage`. The join screen now recovers an existing player by matching the same room and player name when the local session is unavailable.

## Other Changes Outside of the Repo

* [ ] DOCS + ALMANAC: Add the new (Were)Wolf Tamer card
* [ ] DOCS + ALMANAC: Add the new Vintner card
* [ ] DOCS + ALMANAC: Rearrange cards by affinity instead of ID; place the Spider Tamer beside the other Tamers and separate Werewolves from their allies

## Critical Fixes

* [x] In case the Dog Wolf or the Fortune Teller is poisoned, the player side modal is acting correctly, but not the GM side
* [x] The first time the Actor choses an idol doens't count for his checkboxes (he can change idol twice once the choice is made)
* [x] If there are multiple poisoned characters the House Maid gets the distance to all of them
* [x] Vampire Werewolf and Werewolf Seer should not wake up when the Werewolves are poisoned, because there's no victim

## Fixes

* [x] If the Dog-as-Actor copies a card, in the player's device, the big card becomes the copied role, with the small Dog-Wolf card, which as itself a even smaller Actor (the current owner) card to it's corner.
* [x] Dog scipt lines that have two times the original role name called, only has the name replaced once
* [x] Change to Case 1: The Actor, the Dog and the Actor's idol are alive -> when woken up with the Actor in the following night, the dog chooses his own idol, for that change the script line to be "(The Narrator (Narrador/Meneur) discretly tells the {Dog} that he needs to chose an idol). In this case the Owner tag should never disappear.
* [x] In rulebookContents there's basically the script written twice (in a list up in the file and then the dynamic one with the ids, make it only have the id based one, also reduce the id's to just be first/second/normal-role.id and have no name afterwards)
  * Codex note 2026-07-09: Rulebook script text now has one source, `RULEBOOK_NIGHT_SCRIPT`. IDs use `first-role`, `second-role`, or `normal-role`, with a numeric suffix only when the same role has multiple lines in one phase.
* [x] Normal Werewolves line should not be drag-dropeable nor Normal Werewolf should be drag-droppable when the Werewolves are poisoned (don't wake up)

## Balance Changes

* [ ] 

## Additions

* [x] If a Sister is Evil Being and Poisoned, she changes roles to become e01

## Future Plans

* [ ] Add new character `m06` to app and docs
* [ ] Add new character `v24` to app and docs
* [ ] Add the fonctionnality for the complex characters not yet deployed
* [ ] Add skin packs
* [ ] Adding phone interactions:
    * [ ] In the Bruxa script line there is a "phone" icon button. When the GM clicks that button the Witch player device screen changes to the player circle and a poison button option appears, when the player clicks that button, he is in poison mode (change aesthetics --> green), so he can click on a player on the circle that he wants to poison and there's a confirm of do you want to poison "player" ? And if he confirms, that player is poisoned and the poison mode turns off and the player can't do any more actions, same thing if the GM clicks off in the phone button in the script.
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
