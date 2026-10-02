# Roadmap

This file is intentionally human-owned. Codex can add items, reorganize items, or add notes, but only the human owner should remove items after real playtests or direct confirmation. Only human should add things to "Human Tests to Do", "Other changes Outside of the Repo" and "Future Plans".

## Human Tests to Do

* [ ] Touch screen compatibility
* [ ] Find out what "Clear previous rooms" button does.

## Decisions

* [ ] Should the Vampire Werewolf be webbed?

## Critical Fixes

* [ ] Never copy the D12 line to the in-app script

## Fixes

* [x] Clicking "X" in the rulebook doesn't directly close the rulebook, instead it goes to the previously focused character
* [x] I think the Dog's copying actions dependant on status effects was mixing with the owner's, so I added more dog-only status to the icons

## Balance Changes

* [ ] 

## Additions

* [x] 2 new travellers (description already in rulebookContents):
  * [x] Devil's Advocate:
    * [x] Add modal and drag-drop action to give one player the Execution Immune status. He can still pick characters that are tagged devil_advocate_used but neither the immunity nor the poison effect will actually be applied
    * [x] That status is removed automatically after ending the next Tribunal, and replaced with devil_advocate_used
    * [x] If the Devil's Advocate is poisoned, add a script line during the Tribunal saying "if [player] is nominated, they get automatically executed" and instead of the Execution Immune status effect, make a big corsshair icon overlay covering the target's role images in the circle and in the list so that the GM doesn't forget to execute them if that happens
  * [x] Bone Collector:
    * [x] Have a fox-style used power, since the Bone Collector can only use the copy once. Just like the Actor, if the original role is resurrected, the Bone Collector stops copying the power. If the player is ressurected the same day as the Bone Collector asks to copy them, the Bone Collector checkbox is unticked and he gets to pick another player
    * [x] Have a button on the player's device to "Copy last dead player", it pop-up in the GM for the GM to confirm or deny the request and if confirmed the Bone Collector is copying that role during that day and the following night
    * [x] Drag-drop a Bone Collector that isn't copying someone also does this copy action. Add an option to the pop-up menu for "stop copying" just in case there's a mistake
    * [x] Same player UI as the Actor copying a role
    * [x] Add an alignement icon for "Villager" / "Evil Being" in the player's phone, even when he is siding with the villagers to remind the player that copying an evil role, does not mean the alignement change
      * [x] Do the same with the Mime
      * [x] For both the Mime and Bone Collector, if the role that appears has alignement skins, show the skin of the player's allignement
    * [x] The script line calls for the "Bone Collector" when he has his own script line
    * [x] When copying the Spider Tamer, he gets the script line in the beginning of the night to web a player if he hasn't already during the day, and then the watch who was caught in the web line later in the same night
    * [x] If copying the White Werewolf, he will only have the script line if the script line was meant to be there already
    * [x] If he copies the Dog Wolf, he copies the original Dog's owner
    * [x] If he copies the Actor, he will either just be a useless Actor or if the previous Actor was copying a role, the Bone Collector keeps copying that role too. Same UI as Dog copying an Actor copying another role

  
## Future Plans

* [ ] Add the new 25th aniversary WoMH cards
  * [x] Singe Savant
  * [ ] Marionnettiste
  * [x] Colosse
  * [x] Puissante Mère des Loups
* [ ] New characters:
  * [ ] Stinky Werewolf: The nearest villager will always be poisoned (if same distance it's picked at random which one is affected) / OR / His neighbours are poisoned if they are villagers, otherwise, no effect on the neighbours
  * [ ] Martyr Werewolf: During the Werewolf hunt, can rise his hand. This will automatically kill himself and transform a random alive evil being into a e01.Werewolf
  * [ ] Werewolf Herald: When not every villager roles are in play, in the first night, receive a selection of not in play roles, for the number of evil beings in game.
  * [ ] Gluttonous Werewolf: At the end of the hunt, when all Werewolves finish hunting can stay awake and wave his hand until he gets the Narrators attention. The Narrator will then not kill the victim tonight, but instead kill 3 victims next night: the saved victim, the new target and another completly random player
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
  * [ ] Harlot: Once per game, during the night can choose one player, that player is awaken, if they are not from the same alignement as the Harlot, that player switches sides to join the Harlot alignement, keeping their role and abilities (probably too OP, needs to be changed, but I kinda wanted a traveller lady of the night in the game)
  * [ ] Bureaucrat: Two times during the game, can ask for the Tribunal votes to be private
  * [ ] Voudon: While alive and present, only the dead and himself can nominate and vote in the Tribunal
  * [ ] Gangster: Once per game, at the beginning of court, can kill one of his neighbours, if the other neighbour publicly agrees.
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
