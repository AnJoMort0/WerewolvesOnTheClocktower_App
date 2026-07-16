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

* [ ] In the analog page, not all mistakes are warned (all the wrong character balances from the main GM page, like double character, werewolf count etc should be warned in this page too, using the same logic.) And therefore they don't have a fix tied to them either when they should.

## Fixes

* [x] vote_against, vote_double and vote_revoked should be removed at the end of the tribunal/start of night
* [x] In the manual character selection dropdown menu, the id should also be shown (like "id. Character Name")
* [x] s01 should only wake up if there is at least one alive lover

## Balance Changes

* [x] Remove the Sleepwalker from the list of characters that the Drunkard can replace (in the app, alongside with the things that make it work, as well as in the rulebooks)

## Additions

* [x] There's already icons and visual effects (shine red) for characters that turn evil or werewolves. As more characters are introduced and bigger groups of players play, it becomes harder to distinguish to characters objective in a glance. Can you add the icons and visual effects to the charcters that are werewolves/evil beings by default too?
* [x] When v12 is drag-dropped onto a poisoned character, she gets the poisoned effect from that character (so she inherits the poison that knows the owner of the poisoning) and that character loses the poison

* [x] Add functionality a03:
  <!-- Codex 2026-07-15: Added the script-line eye icon wiring, GM/player reveal modal, temporary copied-card metadata, small Mime badge, copied script-line insertion, and copied-role drag/eye action sourcing. Remaining special cases still need a dedicated pass before ticking the whole a03 item. -->
  <!-- Codex 2026-07-15: Completed the Mime pass: copied-card candidate filters, GM/player modal flow, temporary card display with Mime badge, villager objective preservation, copied script-line replacement, copied dynamic information, drag/eye action sourcing, special cases for Drunkard/Dog/Grave Robber/Hunter/Paranoid/Big Bad Wolf/Saviour/Cupid/Bear Tamer/Rabbit/Crow/Angel, and Little Girl seeing Mime on copied kills are implemented with focused NightScript coverage. -->
  <!-- Codex 2026-07-16: Completed remaining Mime logging/candidate cleanup: copy events are logged, a01/a02/s01 candidates are filtered by valid state, e02 stale poison is cleared at night start when the source line cannot be ticked, and v12 poison stealing works for Mime copies without double-vote effects. -->
  * [X] In his script line, he has an eye icon. The eye icon opens a modal on both the GM’s and the player’s devices, displaying a random in-game character card—dead or alive—from the `MIME_COPY_ROLES` list.
  * [x] Add the mime's copied role to the game's logs

  * [x] Special-case scenarios:
    * [x] `a01`:
      * [x] Show the `a01` card with a small corner card representing the role being replaced.
      * [x] The Mime acts as the replaced role.
      * [x] The Mime receives poisoned results exactly as the Drunkard would.
      * [x] He should only be able to appear if the card replaced is in `MIME_COPY_ROLES`
    * [x] `a02`:
      * [x] This can only appear when the Dog is copying an Owner that is in `MIME_COPY_ROLES`.
      * [x] Show the `a02` card with a small Owner card in the corner.
      * [x] The Mime acts as the Owner.
    * [x] `e02`:
      * [x] The Mime's applied poison disappears when the Mime's next turn is played (or if the mime is dead, when his turn was supposed to be played like the Witch's poison already does).
      * [x] Fix: If there are no script lines to tick when in the case of the mime dying while the poison is active, ending the night should remove the poison, since it happens after the mime's line. Check if the same thing is coded correctly for the Witch as well
    * [x] `s01`:
      * [x] Should only appear when there is at least one alive lover
      * [x] The Mime may give immunity to the Lovers.
    * [x] `v12`:
      * [x] The Mime poisons himself if he steals the poison.
      * [x] He does not receive any double-vote abilities associated with it.

  
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
