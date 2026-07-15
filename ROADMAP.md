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

* [ ] v24 and l06 cannot be drag-dropped from the player list (I have maybe not be checking all the drag-drops options, but drag-drops should be able to be done from:
  script -> circle || player list
  circle -> circle || player list
  player list -> circle || player list
so make sure that's the case for every drag-drop action)
* [ ] In the analog page, not all mistakes are warned (all the wrong character balances from the main GM page, like double character, werewolf count etc should be warned in this page too, using the same logic.) And therefore they don't have a fix tied to them either when they should.

## Fixes

* [ ] 

## Balance Changes

* [ ] 

## Additions

* [ ] Add functionality a03:
  * [ ] In his script line he has an eye icon. The eye icon makes a modal in the GM and player device with a random card in game, dead or alive from the MIME_COPY_ROLES list.
    If the GM closes the modal, it stays on in the player device because, the player's device modal as a check or "ok" button, when they press that button, the modal closes, their card gets replaced with the shown card until dawn with a small mime card at the bottom (like the Actor does), same in GM device.
    A difference with the Actor is that the Mime keeps his objective (always villager).
    The mime script line is replaced with the script line of the shown character but in paranthesis, drag-drop actions, eye icon actions, etc will trigger the powers of the copied card.
    Here's a few special case scenarios:
      There's no limited uses for any power and the Mime can copy powers that have been fully used up
      e03 and other characters that have their script line tied to redX characters can only appear to the Mime when there are redX characters
      a01: shows the a01 card with a small corner card for the role he is replacing. The mime will act as the replaced role receiving poisoned results excatly like the drunkard would
      a02: Only shows when the dog is copying an owner. Shows the a02 card with a corner owner card. Mime acts as the owner.
      a05: Targets a redX character and changes cards with them (the redX becomes a mime, the mime becomes the target). Use the dug_up_mime.png for the switch.
      e01/v08: must just kill a player of the mime's choice straight away
      v10: can choose to kill a player straight away
      m01: the mime can choose to get full immunity for a day and night
      m02: can choose to save the victim of the werewolves and sees their card
      s01: can give the immunity to the lovers
      v02/v05/v20: receives the information as if he is the tamer/maid
      v12: just poisons himself if he steals the poison, no double vote abilities tied to it
      v15: can only show if it there is a vote_innocent player
      v18: can only appear if there are permadead players. can choose to save one of them that gets ressurected at dawn
    If the Mime kills someone regardless of the power he is copying, the little girl will see the Mime card.
    If poisoned act as the copied abilities poisoned effect.

    -->
    Uncaught ReferenceError: onMimeReveal is not defined
    at index-DFO1nZY4.js:461:60322
    at Array.map (<anonymous>)
    at index-DFO1nZY4.js:461:59480
    at Array.map (<anonymous>)
    at A7 (index-DFO1nZY4.js:461:59308)
    at cw (index-DFO1nZY4.js:38:17029)
    at ij (index-DFO1nZY4.js:40:44058)
    at rj (index-DFO1nZY4.js:40:39790)
    at IM (index-DFO1nZY4.js:40:39718)
    at op (index-DFO1nZY4.js:40:39570)
  
## Future Plans

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
