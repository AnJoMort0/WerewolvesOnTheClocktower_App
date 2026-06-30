# Roadmap

This file is intentionally human-owned. Codex can add items, reorganize items, or add notes, but only the human owner should remove items after real playtests or direct confirmation.

## Human Tests to Do

* [ ] Touch screen compatibility
* [ ] Human-test local Wi-Fi mode with at least one phone.
* [ ] Human-test hosted mode with at least one phone.
* [ ] Confirm QR codes use the correct hosted or LAN URL.
* [ ] Find out what "Clear previous rooms" button does.
* [ ] Check the README file.
* [ ] Lovable version: Some players who initially joined through the iPhone Camera app could not reconnect after disconnecting. The Camera app sometimes did not open the link in the default browser I guess, so the reconnecting session did not have access to the original persistent `localStorage` data (I don't know if there's a possibility to fix this somehow, if there isn't just tell me)
  * Codex note 2026-06-27: Separate iPhone browser contexts cannot share `localStorage`. The join screen now recovers an existing player by matching the same room and player name when the local session is unavailable.

## Other Changes Outside of the Repo

* [ ] DOCS + ALMANAC: Add the new (Were)Wolf Tamer card
* [ ] DOCS + ALMANAC: Add the new Vintner card
* [ ] DOCS + ALMANAC: Rearrange cards by affinity instead of ID; place the Spider Tamer beside the other Tamers and separate Werewolves from their allies

## Critical Fixes
* [ ] 

## Fixes

* [ ] Organise the GM management buttons (put all the room controlling buttons together, then winning, then log, then rulebook in a same style button to be consistent, and the hide button)
* [ ] Some places an emoji is used for the moon, some places it's a proper icon. Remove all emojis and have them be proper icons instead

* [ ] To the logging system:
  * [ ] When nothing happens just leave the section blank and compact
  * [ ]  Don't log the "change of phase"
  * [ ]  Don't log the permanent deaths (if a player gets dead and isn't ressurected/saved after, everybody knows he stayed dead)
  * [ ] Compact the whole view so more information can appear at the same time (if the screen size is enough you can even have each section in 2 columns reading left to right)
  * [ ] Use the same parameters for the circle that are used during the in-game screen because the current circle renders with all the characters overlapping
  * [ ]  Don't log the removal of poison (or any other removal that comes from a switch of target)

## Balance Changes

* [ ] 

## Additions

* [ ] Add a supporting screen (gotta find a better name). Basically the idea is, when a projector for example is available, the room will have a button to open a new window to have a full screen that is basically the hidden view of the GM screen. It will also receive the victory pop-up when the GM confirms a victory and will also let the GM open the log modal in there too, as well as the rulebook

## Future Plans

* [ ] Add new character `m06` to app and docs
* [ ] Add new character `v24` to app and docs
* [ ] Add a logs of the games for easy recap at the end of the game
* [ ] Remove any useless files or deprecated lines of code, vestiges of old versions, etc
* [ ] Add the fonctionnality for the complex characters not yet deployed
    * [ ] When the Ator is in game, there's the status option for "Ídolo" with the idol.png icon. This action is also applied when the Ator is drag-dropped onto another player. Only one player can have the idol status at the time. The Ator has two checkboxes, that get ticked when he is drag-dropped, and once both are ticked he cannot be drag-drop anymore. When a idol status character becomes perma-dead the Ator switches character to become the one that died (and therefore in this specific scenario there can be two cards that are the same at the same time). However he is still seen has the "Ator" to all other character like the Vidente when he dies, Menina if he kills anyone, or any other card that can see cards.
* [ ] Adding phone interactions:
    * [ ] In the Bruxa script line there is a "phone" icon button. When the GM clicks that button the Witch player device screen changes to the player circle and a poison button option appears, when the player clicks that button, he is in poison mode (change aesthetics --> green), so he can click on a player on the circle that he wants to poison and there's a confirm of do you want to poison "player" ? And if he confirms, that player is poisoned and the poison mode turns off and the player can't do any more actions, same thing if the GM clicks off in the phone button in the script.
* [ ] Small beautifying of the page: Make the pages (GM and Players) change colours during the day/night (at night keep the current dark theme, during the day change it to light theme but in the same aesthetic and during the Tribunal change it to a more mysterious late of day type vibe), make the code future proof so we can also add small features to it in the future (for example, if there are no deaths in the morning, it's more bright, but if there were deaths in the morning, it becomes more dark/bloodied/bad weather, stuff like that, to make it fun and dynamic)
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
