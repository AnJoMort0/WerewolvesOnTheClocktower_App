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

* [x] Make the rulebook script lines more readable by making them a proper list with "-" or a dot before
  * Codex note 2026-07-12: Rulebook night-script lines now render as a proper bulleted list.

## Fixes

* [x] Is it possible to change in fr.ts and pt.ts the lines : "requires: ["e01", "m01", "m02", "m03", "m06", "s02"]" to "requires: WEREWOLF_ROLES" from roles.ts? And also in rulebookContents.ts "refs: ["e01", "m01", "m02", "m03", "m06", "s02"]"
  * Codex note 2026-07-12: Shared werewolf refs now use WEREWOLF_ROLES.
* [x] For consistency all the names for the characters used in code should use the english names not the portuguese names, for example: onMeninaReveal --> onLittleGirlReveal. (for long names, abbreviations can be used, like Little Red Riding Hood --> RedHood). I added en.ts that just include the character names for now, for reference.
  * Codex note 2026-07-12: Role-facing identifiers, callbacks, condition keys, reveal channels, actor power fields, and the FortuneTeller modal file were renamed to English. Legacy Portuguese snapshot aliases are retained only in restore helpers for compatibility.
* [x] If possible, make it so the manual character selection list follows the RULEBOOK_CHARACTER_ORDER

## Balance Changes

* [ ] 

## Additions

* [x] Implement the new characters features (add their script lines present in Rulebookcontent to the GM script too, in the correct placement):
  * Codex note 2026-07-12: Implemented v24 poison/immunity, v25 asleep script state, l05 werewolf-night block, l06 red-X resurrection/sacrifice, and m06 hidden werewolf behavior.
  * [ ] v24: Every night can poison someone (same rules for poison removal after death like the witch). The target also get full immunity for that night and the next day (unlike the Saviour that only lasts for that night). If poisoned another random player gets the effect instead.
  * [ ] v25: Just add the script line. When poisoned, he doesn't wake up, so strickthrogh and priestAsleep
  * [ ] l05: No script line, the werewolves just don't wake up the night after his death. Same effect as werewolves poisoned.
  * [ ] l06: Can be drag-dropped on a redX player, if so, the redX player will ressurect, but the l06 will become redX. If poisoned this doensn't work.
  * [ ] m06: Acts as a normal werewolf character but every character that knows about evil beings and werewolves will never count this card (example, the bear will not roar, the crow will not count him, etc)
  


## Future Plans

* [ ] Add the fonctionnality for the complex characters not yet deployed
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
