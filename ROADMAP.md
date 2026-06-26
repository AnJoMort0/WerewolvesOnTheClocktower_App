# Roadmap

This file is intentionally human-owned. Codex can add items, reorganize items, or add notes, but only the human owner should remove items after real playtests or direct confirmation.

## Human Tests to Do

* [ ] Human-test local Wi-Fi mode with at least one phone.
* [ ] Human-test hosted mode with at least one phone.
* [ ] Confirm QR codes use the correct hosted or LAN URL.
* [ ] Find out what "Clear previous rooms" button does.
* [ ] Check this: "Add a production smoke-test checklist for Cloudflare deployments. - Codex note 2026-06-23: Added to `docs/development.md`."
* [ ] Check the README file.

## Other Changes Outside of the Repo

* [ ] DOCS + RULEBOOKS: Once per game, on daytime, `v23` can change who is webbed
* [ ] See patch notes to do the other stuff written there

## Critical Fixes

* [x] v04 Has the new checkbox - good. However, This checkbox should not appear for the v21 power
* [x] v04's checkbox should not appear in the first night
* [x] Players that were dead and ressurected stay marked as dead in the players' devices. Fix that
* [x] s01 : It's missing the checkboxes in the player circle. When a checkbox is ticked it gives cupid immunity to the lovers. Cupid Immunity should be removed at dawn. When one of the lovers is red-x, the other lover is also red-x (if not immune). The v01 will see the second lover's murder as the cupid card but the text will say "suicide".
* [x] Poison seems to be broken for some characters (it was working on the Lovable build so it may not have transfered properly). Most characters that drag-drop poisonned should only aim at a character they didn't target. Animal tamers should only get the wrong information ("O Urso não rosna" even it should for example)
  * Codex note 2026-06-26: wrong-target powers now exclude the intended target; powers documented as failing while poisoned still fail. Automated Bear, Crow, and Rabbit information is guaranteed to be wrong rather than randomly possibly correct.
* [x] Fix in the poisoned v01: Should show only wrong answers but from the following list: Soldier, Suicide, Hunter, Paranoid, Pyromaniac, Rusted Knight, Mime, Actor, Werewolves, White Werewolf


## Fixes

* [ ] Remove strange manually added line breaks from the README, this file, and similar files. Do not be afraid to keep an entire paragraph on one line.
  * Codex note 2026-06-23: README was cleaned and development docs were split out. This ROADMAP still intentionally keeps some nested note formatting for readability.
* [ ] Check whether old or unnecessary `localStorage` values accumulate over time.
  * Codex note 2026-06-23: Old GM snapshots are pruned after 7 days. Other browser session keys still need a cleanup policy.
* [ ] Ensure mostly one-time or obsolete `localStorage` data is removed instead of being kept indefinitely and gradually filling the computer's storage.
  * Codex note 2026-06-23: Same as above; GM snapshots now have retention cleanup, but player/browser session data still needs a deliberate cleanup design.
* [ ] Changes for the v01 pop-up: If it's a soldier that killed, it's still shows the capitain card but soldier in the text instead of capitain. If there werewolves killes it says werewolves plural.
* [ ] Add the timer controls to the hidden mode in the GM screen.

## Additions

* [ ] Every script line has a tickeable box, when ticked it strikesthroughs for the GM to follow where they are. Drag-dropping a character (from the script, player circle or player list), or using the player's power (checkboxes) it also ticks the script line. This will also help with another automation, when a character that gives a status effect that stays until applied to someone else (e02, v09, etc) dies, the status effect is removed from the target when the GM checks a script line that is after the one of the deceased character
* [ ] Add automatic victory-condition detection and game-over handling.
  * Codex note 2026-06-23: Manual Game Over sending was added. Automatic detection and repeated-prompt timing still need implementation.

### Automatic Victory Conditions

* [ ] **Village victory:** Trigger when all werewolf characters have been eliminated. All non-evil beings and non-solo characters win. Evil beings, solo characters, `s01`, `s02`, `as01b`, and characters tagged `Namorado` lose.
* [ ] **Werewolf victory:** Trigger when only evil beings remain. All evil beings win. Every other character, including solo characters, loses.
* [ ] **Lovers and Cupid victory:** Trigger when only characters tagged `Namorado` remain. `s01` may be dead or alive for this condition to count. This victory condition cannot occur if one of the lovers is `as01b`. `s01` and all characters tagged `Namorado` win; everyone else loses.
* [ ] **White Werewolf victory:** Trigger when only `s02` remains. `s02` wins and everyone else loses.
* [ ] **Secret Lover victory:** Trigger when only `as01b` and one other character tagged `Namorado` remain. `as01b` wins and everyone else loses.
* [ ] When an automatic victory condition is met, show the GM a popup asking whether to end the game.
* [ ] If the GM accepts, send every player a removable Game Over popup showing either a victory or defeat title. After dismissing it, players must still be able to access their character and the player circle so they can discuss the game.
  * Codex note 2026-06-23: This behavior exists for the manual Game Over path. It still needs to be connected to automatic victory acceptance.
* [ ] If the GM declines, do not immediately show the same prompt again. Recalculate the victory conditions after the next night, day, tribunal, or other relevant game-state update, and show the prompt again if the condition is still valid.

## Future Plans

* [ ] Add new character `m06` to app and docs
* [ ] Add new character `v24` to app and docs
* [ ] Add rulebook pages inside the app instead of linking to external HTML pages.
* [ ] Add a logs of the games for easy recap at the end of the game
* [ ] Add the fonctionnality for the complex characters not yet deployed
* [ ] Add an English rulebook and English UI.
* [ ] Support more complete player-submitted actions from phones.
* [ ] Add better role-selection presets for different player counts and play styles (also better balance).
* [ ] Add screenshots to the README after the UI stabilizes.

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
