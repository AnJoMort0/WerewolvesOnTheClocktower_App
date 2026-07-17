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

* [ ] Remove Sleepwalker from Drunkard in DOCS
* [ ] Decide: Should the Vampire Werewolf be webbed?

## Critical Fixes

* [x] In the rulebook the images are draggable which makes it super hard to scroll up/down on mobile devices
  <!-- Codex 2026-07-17: Rulebook card and index images now render as non-draggable and opt out of webkit image dragging so mobile scroll gestures do not grab the cards. -->
  <!-- Codex 2026-07-17: Follow-up: quick-list shortcut links also render as non-draggable and opt out of link dragging. -->

## Fixes

* [ ] 

## Balance Changes

* [ ] 

## Additions

* [x] Add a skinpack system:
  <!-- Codex 2026-07-17: Added local per-device skinpack selection, Vite-glob asset discovery for skin pack folders, seasonal date resolution, rulebook previews, and scoped dynamic flexible skins. Dynamic skins are contextual objective art and remain limited to the player's own role card plus GM circle/list; seasonal role skins and Thiercelieux role skins take priority when present. Portuguese label now uses only "Aldeia Velha"; the global selector is a fixed SKINS dropdown button with card icons only inside the menu, and rulebook preview dropdowns use native generated-HTML event handling. -->
  * [x] Each user controls which skinpack their device uses
  * [x] The skinpack inpacts everytime an character card is shown, player role, rulebook, etc.
  * [x] The players can choose their skinpack from a dropdown menu accessible in everypage, including in the rulebook
  * [x] Moreover, in the rulebook, every character that has an alternative skin has a dropdown menu to (as long as that page is open, see an alternative skin)
  * [x] When a skinpack is selected but a card has no skins in that pack, the default asset is used
  * [x] For the dropdown menu, maybe using a card as an icon to represent the skinpack would be good. Use e04.
  * [x] The choices for now are
    * [x] Default (with seasonals)
      * [x] e04_halloween for the dropdown image
      * [x] This is the default for players devices
      * [x] Seasonals change some roles only around certain times of the year
        * [x] Carnival during the week before and after Shrove Tuesday
        * [x] Christmas during Advent up to the 6th of January (included)
        * [x] Easter during easter time, from Holy Week to Pentecost (included)
        * [x] Halloween, during the week before and after Halloween
        * [x] New Years, during the week before and after 1st January
      * [x] When a player gets or sees a card with a seasonal skin, a visible box on top of the page warns them that "This is a seasonal skin, not a different card. You can change the skins on [top righ corner or wherever it is]". You can use "skin" for Portuguese and French, I think that's the most commonly used name, if there's another more commonly used term, use tha instead. This box has a (x) to close it permanenty during this game
    * [x] Default
      * [x] Default e04 for the icon
      * [x] This the default for the GM
      * [x] All the default assets
    * [x] Thiercelieux/Miller's Hollow/Find the most used name for EU Portuguese
      * [x] e04.thiercelieux for the icon
      * [x] Replaces all the roles with the cards in the Thiercelieux folder
  * [x] Since changing skins are being added, we also designed dynamic skins for the characters that can change objectives
    * [x] They can be found in the dynamic_flexibles folder
    * [x] These dynamic skins should only be used in the player's assigned role in their own device, and in the GM's player circle and player list, nowhere else, specifically not in modals, since no outside player is supposed to know the objectives of the flexible players in game
    * [x] Seasonals and Thiercelieux (and future skinpacks) overide these flexible characters
    * [x] These flexible skins also appear as options to see under the character's cards in the rulebook
  
## Future Plans

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
