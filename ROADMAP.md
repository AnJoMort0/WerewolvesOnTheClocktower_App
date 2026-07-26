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

* [x] In the character selection screen before sending it to players, the GM player list is little too thin, making it hard to read the player's names.

## Fixes

* [x] Move the skin selection to be an icon (no text) next to the rulebook icon instead that opens the dropdown. No floating button.

## Balance Changes

* [x] Human error is a big part of the game design. The philosopy of this app is: Reduce GM human error and increase player accessibility, without giving them extra knowledge that they wouldn't have without the app. So actually we don't want the players to be able to see how many charges left they have in their device. So for the Paranoid (and any future characters) there's no x/2 or button being disabled, they can still click the button even if all the charges are fully used, choose someone, still get a "GM is confirming" for a small amount of time before disappearing automatically, doing nothing, no notification to the GM.
  * Codex note 2026-07-26: Player devices no longer display v10 charges or disable the action because of exhausted charges; exhausted attempts now show only a short local pending confirmation and do not notify the GM.

## Additions

* [x] Let's start adding player side interactions with the app (the point is that some actions rely less on needing to hide to tell things to the GM or complex GM interactions, so that the person can be less suspisious)
  * [x] v10 : In the player's device, in the character's screen, there's an "Assassinate" button with a lucide icon. When the player clicks the button, if he start has uses left, he enters killing mode, the screen changes for the player's circle, change of colour to indicate special screen, title indicating they are in assassination mode, the player can then click a person in the circle and click confirm to kill them, they can also just "exit" to close the killing mode. Once another player is selected, the GM receives a notification (in the normal GM screen if the GM is in hidden mode, it waits until it closes that mode) to confirm that he read that a player became redX by the powers of the v10
    <!-- Codex 2026-07-25: Added persisted player action state, v10 player-side assassination mode, GM-side queued confirmation outside hidden mode, and shared use-count sync so the existing v10 kill logic remains authoritative. -->
    <!-- Codex 2026-07-25: Tweaked the GM notification into explicit accept/deny choices; denying clears the request without spending a use, and player devices now clear the pending message when the GM resolves it. -->
    <!-- Codex 2026-07-26: Hardened the v10 request queue against stale realtime updates, pruned resolved/already-killed requests, and removed the redundant sent-message copy from the player screen. -->
    <!-- Codex 2026-07-26: Added direct GM-to-player resolution broadcasts plus player-side polling while a v10 request is pending, so mobile devices recover even when a room update is missed. -->

* [ ] 
  
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
