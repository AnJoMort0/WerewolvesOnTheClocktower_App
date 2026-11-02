# Roadmap

This file is intentionally human-owned. Codex can add items, reorganize items, or add notes, but only the human owner should remove items after real playtests or direct confirmation. Only human should add things to "Human Tests to Do", "Other changes Outside of the Repo" and "Future Plans".

## Human Tests to Do

* [ ] Touch screen compatibility
* [ ] Find out what "Clear previous rooms" button does.

## Decisions

* [ ] Should the Vampire Werewolf be webbed?

## Critical Fixes

* [ ] 

## Fixes

* [ ] 

## Balance Changes

* [ ] 

## Additions

* [ ] First time mode: A base game mode with a limited selection of characters mostly based on Miller's Hollow but that still introduced some of the most advanced features of WOTCT, for new players trying the game for the first time
  * [ ] Should have a rulebook version of this mode available in both the normal app and in the github pages version that can be linked and send to people to read (a button to open a new page maybe?)
  * [ ] When creating a new game, LAN, online or analogue, there should be a toggle to activate "Beginner Mode" or "First Time Game" or whatever the name should be
  * [ ] The characters in this beginner mode should still explain their normal rules but omit the travellers and only have the following selection of characters:
    * [ ] e01, e02, e03, e04, v01, v02, v03, v06, v07, v08, v10, v11, v13, v14, v17, v18, m01, m02, m04, s01, s02, f01, f02, l01, l02, l04, l05, l06 with the same random assignement rules of the normal game
    * [ ] the extras in the rulebook should be x01, x02, x02.1, x03, x.s01
  * [ ] When playing the game in this mode the GM can still add all travellers since that is in control of the GM (and so their entry ust show up when clicking on them in game), but when opening the rulebook, clicking on characters to see them and then click on view all, selecting characters to send to players, etc, there should only have the Beginner Mode selection of characters.
  
## Future Plans

* [ ] Add the new 25th aniversary WoMH cards
  * [x] Singe Savant
  * [ ] Marionnettiste
  * [x] Colosse
  * [x] Puissante Mère des Loups
* [ ] New characters as the art is created
* [ ] Small beautifying of the page: Make all the pages (GM and Players) change colours during the day/night (at night keep the current dark theme, during the day change it to light theme but in the same aesthetic and during the Tribunal change it to a more mysterious late of day type vibe), make the code future proof so we can also add small features to it in the future (for example, if there are no deaths in the morning, it's more bright, but if there were deaths in the morning, it becomes more dark/bloodied/bad weather, stuff like that, to make it fun and dynamic)

## Tried to fix, never worked

* [ ] Timers stop showing the player's devices when they reload the page, or sometimes randomly.

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
