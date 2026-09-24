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

* [ ] 
  
## Future Plans

* [ ] Add the new 25th aniversary WoMH cards
  * [x] Singe Savant
  * [ ] Marionnettiste
  * [x] Colosse
  * [ ] Puissante Mère des Loups:
    * [ ] Mother of the Werewolves:
      * [ ] The second night she can pick a player to curse. The player under the Mother's Curse will still be called but will be notified they were cursed. The curse prevents the player to use their powers completly. The curse only disappears once the player nominates another player in Tribunal
      * [ ] The Mother can then pick a new target after this
      * [ ] The Mother can change the cursed player twice per game during the night as she will be called every night to make sure nobody can't track when the curse passes to next player
* [ ] New characters:
  * [ ] Stinky Werewolf: The nearest villager will always be poisoned (if same distance it's picked at random which one is affected) / OR / His neighbours are poisoned if they are villagers, otherwise, no effect on the neighbours
  * [ ] Martyr Werewolf: During the Werewolf hunt, can rise his hand. This will automatically kill himself and transform a random alive evil being into a e01.Werewolf
  * [ ] Werewolf Herald: When not every villager roles are in play, in the first night, receive a selection of not in play roles, for the number of evil beings in game.
  * [ ] Evil Twin (evil - we could just use the sisters card here tbf): The first night, they are assigned a Good Twin (a random villager). They will wake up to see eachother. If the Good Twin is killed by execution, another random Villager will die as well. The Evil Twin will then receive a new Twin.
  * [ ] Slanderer (evil): Each night picks a player, that player will be shown as a random evil being to all role abilities
  * [ ] Teacher (villager): Twice per game, can pick a player, that player will act twice during that night if their ability permits it
  * [ ] Swan Tamer (villager): Each night learns how many pairs of evil beings are in game (as in groups of 2 evil players next to each other)
  * [ ] Private Investigator (villager): Called at the end of the night. Each night select a group of 3 neighbouring players and learn how many of them were called tonight
  * [ ] Vigilante (villager): Called at the end of the night. If noone died that night, is called and asked to kill someone (or choose to kill someone?)
  * [ ] Seamstress (villager): Twice per game, chose two player dead or alive and get to know if YES or NO they are from the same alignement
  * [ ] Mathematician (villager): Each night, you learn how many players' abilities worked abnormally due to another character's ability.
  * [ ] Fraud (villager): At the beginning of the second night, appears as one of the Werewolf allies to the Werewolves
  * [ ] Cannibal (solo-advanced): Always take the role of the last executed player. Objective be the last player alive
* [ ] Add a new class of characters: TRAVELLERS, akin to Blood on the Clocktower, everyone knows the role of the traveller but they have 50/50% chance of being evil or villager (if they are an evil being, they will know who the werewolves are). They participate in votes.They can be exiled at any time during day or tribunal, if the majority of the players, including ghosts, decide so. Exile doesn't count as execution nor assasination. They keep playing like a ghost after that. Their powers are powerful, mostly single use and very simple. The idea is to use the TRAVELLERS for players who arrive late and want to join the game:
  * [ ] Gunslinger: Once per game, right after a Tribunal vote, the gunslinger can kill one of the players that voted.
  * [ ] Bone Collector: Once per game, during the day, can ask the Narrator to gain the role of the last dead player during a day and a night. The Bone Collector doesn't change alignement
  * [ ] Harlot: Once per game, during the night can choose one player, that player is awaken, if they are not from the same alignement as the Harlot, that player switches sides to join the Harlot alignement, keeping their role and abilities (probably too OP, needs to be changed, but I kinda wanted a traveller lady of the night in the game)
  * [ ] Bureaucrat: Two times during the game, can ask for the Tribunal votes to be private
  * [ ] Voudon: While alive and present, only the dead and himself can nominate and vote in the Tribunal
  * [ ] Lawyer: Once per game, can overide or choose the result of a nomination.
  * [ ] Gangster: Once per game, at the beginning of court, can kill one of his neighbours, if the other neighbour publicly agrees.
  * [ ] Gambler: Each night, can choose a player and try to guess their role, if they're wrong they die
  * [ ] Devil's Advocate: each night choose a player, if they are then voted to be executed they won't die. Can't choose the same player two nights in a row
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
