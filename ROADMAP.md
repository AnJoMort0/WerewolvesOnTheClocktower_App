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

* [x] Add rulebook links to the "generate characters only screen"
* [x] The timer changed defaults should be room based and not device based (the default day is 5min, tribunal 3min), if the GM changes it, it becomes the default for that room, not everytime he opens the app
  * Codex note 2026-06-30: Added room-level `timer_defaults` JSONB storage and wired GM timer duration edits to Supabase instead of device `localStorage`.

## Balance Changes


## Additions


## Future Plans

* [x] Add messages copy-paste app into this one as an alternative with a button
  * Codex note 2026-06-30: Added the small "only generate characters" button on the home page with app role assignment, role cards, per-player copy, and copy-all options.
* [ ] Add new character `m06` to app and docs
* [ ] Add new character `v24` to app and docs
* [x] Add rulebook pages inside the app instead of linking to external HTML pages.
  * Codex note 2026-06-30: Added in-app full rulebook and per-character rulebook modals using structured text in `src/lib/rulebookContent.ts`, then removed the local FR/PT markdown files from the app workflow.
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
