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

* [ ] Adding phone interactions for each character, making sure they are compatible with copying characters, illusionist when needed and their poison effects:
    * [x] v08 and soldier should have the assassinate modal in their script lines, s02 to kill other werewolves
    * [x] add modal to apply effects applied by: v09, v11, v17, v19, v24 (can also choose to ignore), m05 (pick enemies line), s01 (pick lovers line), f01, a02 (choose an owner), a04 (choose an idol), a05 (only red-x players), a06, as01b (show whether the selected target is correct), l02 (choose dad), l06 (only red-x players)
  
## Future Plans

* [ ] Add the new 25th aniversary WoMH cards
  * [x] Singe Savant
  * [ ] Marionnettiste
  * [x] Colosse
  * [ ] Puissante Mère des Loups
* [ ] Add character that requests anonymous votes (maybe solo, flexible or evil)
* [ ] Small beautifying of the page: Make all the pages (GM and Players) change colours during the day/night (at night keep the current dark theme, during the day change it to light theme but in the same aesthetic and during the Tribunal change it to a more mysterious late of day type vibe), make the code future proof so we can also add small features to it in the future (for example, if there are no deaths in the morning, it's more bright, but if there were deaths in the morning, it becomes more dark/bloodied/bad weather, stuff like that, to make it fun and dynamic)
* [ ] Add screenshots to the README after the UI stabilizes.

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
