# Roadmap

This file is intentionally human-owned. Codex can add items, reorganize items, or add notes, but only the human owner should remove items after real playtests or direct confirmation. Only human should add things to "Human Tests to Do", "Other changes Outside of the Repo" and "Future Plans".

## Human Tests to Do

* [ ] Touch screen compatibility
* [ ] Human-test local Wi-Fi mode with at least one phone.
* [ ] Human-test hosted mode with at least one phone.
* [ ] Confirm QR codes use the correct hosted or LAN URL.
* [ ] Find out what "Clear previous rooms" button does.
* [ ] Lovable version: Some players who initially joined through the iPhone Camera app could not reconnect after disconnecting. The Camera app sometimes did not open the link in the default browser I guess, so the reconnecting session did not have access to the original persistent `localStorage` data (I don't know if there's a possibility to fix this somehow, if there isn't just tell me)
  * Codex note 2026-06-27: Separate iPhone browser contexts cannot share `localStorage`. The join screen now recovers an existing player by matching the same room and player name when the local session is unavailable.

## Other Changes Outside of the Repo

* [ ] 

## Critical Fixes

* [x] v24 and l06 cannot be drag-dropped from the player list (I have maybe not be checking all the drag-drops options, but drag-drops should be able to be done from:
  script -> circle || player list
  circle -> circle || player list
  player list -> circle || player list
so make sure that's the case for every drag-drop action)
  * Codex note 2026-07-15: Added the missing GM player-list drag mappings for v24 and l06; the existing script/circle drag sources and circle/list drop targets now use the same role-v24/role-l06 handlers.
* [ ] In the analog page, not all mistakes are warned (all the wrong character balances from the main GM page, like double character, werewolf count etc should be warned in this page too, using the same logic.) And therefore they don't have a fix tied to them either when they should.

## Fixes

* [ ] 

## Balance Changes

* [ ] 

## Additions

* [x] Add functionality a03:
  <!-- Codex 2026-07-15: Added the script-line eye icon wiring, GM/player reveal modal, temporary copied-card metadata, small Mime badge, copied script-line insertion, and copied-role drag/eye action sourcing. Remaining special cases still need a dedicated pass before ticking the whole a03 item. -->
  <!-- Codex 2026-07-15: Completed the Mime pass: copied-card candidate filters, GM/player modal flow, temporary card display with Mime badge, villager objective preservation, copied script-line replacement, copied dynamic information, drag/eye action sourcing, special cases for Drunkard/Dog/Grave Robber/Hunter/Paranoid/Big Bad Wolf/Saviour/Cupid/Bear Tamer/Rabbit/Crow/Angel, and Little Girl seeing Mime on copied kills are implemented with focused NightScript coverage. -->
  * [ ] In his script line, he has an eye icon. The eye icon opens a modal on both the GM’s and the player’s devices, displaying a random in-game character card—dead or alive—from the `MIME_COPY_ROLES` list.
    * [ ] If the GM closes the modal, it remains open on the player’s device.
    * [ ] The player’s modal has a checkmark or “OK” button.
    * [ ] When the player presses the button, the modal closes and their card is replaced with the displayed card until dawn.
    * [ ] A small Mime card appears at the bottom of the copied card, similar to the Actor.
    * [ ] The same copied-card display appears on the GM’s device.
    * [ ] Unlike the Actor, the Mime keeps his original objective, which is always Villager.
    * [ ] The Mime’s script line is replaced with the displayed character’s script line, shown in parentheses.
    * [ ] Drag-and-drop actions, eye-icon actions, and other interactions trigger the powers of the copied card.

  * [ ] Special-case scenarios:
    * [ ] There are no limited uses for copied powers.
    * [ ] The Mime can copy powers that have already been fully used.
    * [ ] `e03` and other characters whose script lines depend on red-X characters can only appear to the Mime when red-X characters are present.
    * [ ] `a01`:
      * [ ] Show the `a01` card with a small corner card representing the role being replaced.
      * [ ] The Mime acts as the replaced role.
      * [ ] The Mime receives poisoned results exactly as the Drunkard would.
    * [ ] `a02`:
      * [ ] This can only appear when the Dog is copying an Owner.
      * [ ] Show the `a02` card with a small Owner card in the corner.
      * [ ] The Mime acts as the Owner.
    * [ ] `a05`:
      * [ ] The Mime targets a red-X character and swaps cards with them.
      * [ ] The red-X character becomes the Mime.
      * [ ] The Mime becomes the targeted character.
      * [ ] Use `dug_up_mime.png` for the switch.
    * [ ] `e01` / `v08`:
      * [ ] The Mime must immediately kill a player of his choice.
    * [ ] `e02`:
      * [ ] The Mime's applied poison disappears when the Mime's next turn is played (or if the mime is dead, when his turn was supposed to be played like the Witch's poison already does).
    * [ ] `v10`:
      * [ ] The Mime may choose to immediately kill a player.
    * [ ] `m01`:
      * [ ] The Mime may choose to gain full immunity for one day and one night.
    * [ ] `m02`:
      * [ ] The Mime may choose to save the Werewolves’ victim.
      * [ ] The Mime sees the victim’s card.
    * [ ] `s01`:
      * [ ] The Mime may give immunity to the Lovers.
    * [ ] `v02` / `v05` / `v20`:
      * [ ] The Mime receives information as though he were the Tamer or Maid.
    * [ ] `v12`:
      * [ ] The Mime poisons himself if he steals the poison.
      * [ ] He does not receive any double-vote abilities associated with it.
    * [ ] `v15`:
      * [ ] This can only appear when there is a `vote_innocent` player.
    * [ ] `v18`:
      * [ ] This can only appear when permanently dead players exist.
      * [ ] The Mime may choose one permanently dead player to save.
      * [ ] The selected player is resurrected at dawn.
  * [ ] If the Mime kills someone, regardless of the copied power used, the Little Girl sees the Mime card.
  * [ ] If the Mime is poisoned, apply the poisoned effect of the copied character’s ability.

  
## Future Plans

* [ ] Add skin packs (don't forget to add a warning when there are seasonal skins for players not to be confused)
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
