# Roadmap

This file is intentionally human-owned. Codex can add items, reorganize items, or add notes, but only the human owner should remove items after real playtests or direct confirmation. Only human should add things to "Human Tests to Do", "Other changes Outside of the Repo" and "Future Plans".

## Human Tests to Do

* [ ] Check English translations
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

* [x] Looks like if a player is killed first (red-x) and then given imunity (of course check type as well to not add imunities when not needed) the player still dies
  <!-- Codex 2026-09-07: All immunity application paths now resolve pending red-X deaths using the attack type, including before dawn/night transitions. Covers Cupid and linked Lover suicides, one-use shields, copied attacks, and the Big Bad Wolf execution exception; permanently dead players are not revived. Added 22 regression tests; all 154 tests pass. -->

## Fixes

<!-- Codex 2026-09-08: Compacted the game log into collapsible phase sections with dense actor/action/target rows, direct participant highlighting, timestamps, and a collapsed-by-default final circle. -->
<!-- Codex 2026-09-08: On wide displays, log phases now use two columns with larger rows, cards, status icons, labels, and controls for better distance readability. The player victory-log control now shares the aligned header button row. -->
* [x] Character cards images take a while to load when the website opens for the first time, I guess it's because of the size of the file. I believe the final website does not need to have the image resolution so big, so can we make like a downscale version of the assets, or some other method to make it faster to load, and not use useless ressources?
* [x] Add a mirrored modal to the GM screen to see what the Werewolves votes are looking like, when pressing the open hunt mode button
* [x] Clicking the action button to open on phones, should tick the script line for the modals that do not need action from the player side (like werewolves seeing the allies), and tick the script line when the action is over for the ones requiring the player to act, like witch poisoning someone, shaman saving someone, etc
<!-- Codex 2026-09-17: Implemented the three items below, pending owner playtests. App cards, extra cards, and all skins now use generated <=512px WebP display copies (122 files: 120.95 MiB -> 2.92 MiB); original PNG artwork is retained. Opening phone hunt mode also opens a live, read-only GM map with individual votes and consensus approval. Allies lines complete on successful opening; Witch/Shaman/hunt lines complete by exact session line key after confirmation, Shaman ignore, or GM hunt acceptance. Manual cancellation and hunt denial do not complete a line. -->

## Balance Changes

<!-- Codex 2026-09-17: Implemented documented randomizer eligibility and weighted selection in roles.ts. White Wolf requires exactly four wolves (16-19 players). Little Girl requires two alternate-death characters; Puppeteer needs 12 players; Lamplighter needs three limited-use powers; Spy needs two characters without unconditional recurring night lines. Drunkard keeps one sober INFO character plus an INFO replacement chosen during automatic GM setup. Enabled advanced roles have 2x weight; cards with active seasonal artwork in the selected seasonal pack have 1.25x weight. Simple cards/families participate at 0.6x base weight, and families always occupy complete groups. No advanced or seasonal card is guaranteed. -->

* [x] Update the random character's assignement rules to better balance (also add notes to every rule in the roles.ts to easily reread the rules that are being applied for future balance changes and patches)
  * [x] v01 should only appear when there are at least 2 extra characters that introduce possible causes of death other than werewolves
  * [x] v06 only when there's at least 12 players
  * [x] v21 only when there's at least 3 characters with limited uses
  * [x] s02 only when there's 4 werewolves total (including himself) (so 16 players if my calculations are correct)
  * [x] f02 only when there are at least 2 characters that don't have a unconditional (always visible when in game) script line
  * [x] a01 only when there's at least 2 INFO_ROLES in total (including the one he is replacing)
  * [x] when Advanced Characters mode is on, bias the rules so there's a bigger chance of at least one advance character to be included (don't fully force one in, but just higher chance)
  * [x] when Characters have their seasonal variant activated, bias the rules so there's a slight bigger change of being included in the lot (don't fully force one, just slightly increase the odds)

## Additions

* [x] Adding phone interactions:
  <!-- Codex 2026-09-08: Added GM-controlled, reconnectable phone sessions for group hunting, ally identification, Witch poisoning, and Shaman saving. Actor, Dog-Wolf, Drunkard, and Mime copies use their own player identity and power state; kills, poison owners, resurrection charges, and logs go through the existing GM action paths. Covered by rules, multi-device synchronization, script integration, and browser smoke tests. -->
  <!-- Codex 2026-09-08: Follow-up visual pass aligned phone action screens, script controls, shared modals, cards, and overlays with the game's compact parchment/blood UI. Hunt vote synchronization no longer flashes the final-action waiting message. -->
  <!-- Codex 2026-09-08: Phone action maps now fit their device width without horizontal scrolling; larger groups expand vertically and use equal-distance ellipse placement to keep player targets legible. -->
  <!-- Codex 2026-09-08: Replaced the generic script phone glyph with thematic hunt/allies/poison/save icons and aligned all script actions, including reveal eyes, immediately before the completion checkbox. -->
  * [x] In the Werewolves script line there's a "phone" icon button. When the GM clicks that button the Werewolves devices chante to group hunt mode (change aesthetics), if a werewolf selects a player in the circle, a small icon appears over that player in every werewolf device and when all werewolves have the same player selected the GM receives a pop-up to confirm ro deny the kill. In the map, all werewolves are red with the werewolf icon. (all of these interactions include the Pupetteer too, since he is pretending to be a werewolf) The GM can remove that screen from players at anytime by clicking the phone button again in the script line.
  * [x] In the Werewolves wake up to see the alies script line, make it so there's the phone icon and when clicked the werewolve's devices change to a mode where they can see all the players, with all the evil beings appearing red and with the evil being icon, werewolves appear with the werewolf icon.
  * [x] In the Bruxa script line there is a "phone" icon button. When the GM clicks that button the Witch player device changes to poison mode (change aesthetics --> green), so he can click on a player on the circle that he wants to poison and there's a confirm of do you want to poison "player" ? And if he confirms, that player is poisoned and the poison mode turns off and the player can't do any more actions, same thing if the GM clicks off in the phone button in the script, it turns off the mode in the player's device.
  * [x] The chaman also has the phone icon and when clicked he enters his magic mode, where he can see the red x players in his circle and click on one of them and then clicked "save", otherwise he can just click "ignore" and that closes his mode with no action. GM can also close as always.
  * [x] Since the log is tracking the time of actions, could we also add a small addition to the header stating "current game run time: xxh:yymin" the clock stops counting when there's a game over (and keeps counting if the game continues after a game over)
    <!-- Codex 2026-09-17: Implemented a persistent runtime in GM and log headers in PT/FR/EN. Starts when roles are sent, freezes at game over, resumes accumulated play time if play continues, survives browser refresh, and resets with the room. Final runtime is included in the player post-game log snapshot. -->
  
## Future Plans

* [ ] Add the new 25th aniversary WoMH cards
* [ ] Add evil being that requests anonymous votes
* [ ] Adding phone interactions
* [ ] Small beautifying of the page: Make all the pages (GM and Players) change colours during the day/night (at night keep the current dark theme, during the day change it to light theme but in the same aesthetic and during the Tribunal change it to a more mysterious late of day type vibe), make the code future proof so we can also add small features to it in the future (for example, if there are no deaths in the morning, it's more bright, but if there were deaths in the morning, it becomes more dark/bloodied/bad weather, stuff like that, to make it fun and dynamic)
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
