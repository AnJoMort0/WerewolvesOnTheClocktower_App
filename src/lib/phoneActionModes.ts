/**
 * Stable identifiers for every action that can be opened from a night-script
 * line. Values describe the character and action; role IDs belong in the
 * action configuration rather than in UI state.
 */
export const PHONE_MODE = {
  WEREWOLF_HUNT: "werewolf-hunt",
  WEREWOLF_ALLIES: "werewolf-allies",
  EVIL_WITCH_POISON: "evil-witch-poison",
  SHAMAN_SAVE: "shaman-save",
  MONKEY_TAMER_REVEAL: "monkey-tamer-reveal",
  FOX_TAMER_CHECK: "fox-tamer-check",
  GYPSY_POISON_CHECK: "gypsy-poison-check",
  PYROMANIAC_BURN: "pyromaniac-burn",
  SPIDER_TAMER_WEB: "spider-tamer-web",
  PRIEST_CONFESSION: "priest-confession",
  SLEEPWALKER_VISIT: "sleepwalker-visit",
  COLOSSUS_RETALIATION: "colossus-retaliation",
  HUNTER_ASSASSINATION: "hunter-assassination",
  SOLDIER_ASSASSINATION: "soldier-assassination",
  WHITE_WEREWOLF_ASSASSINATION: "white-werewolf-assassination",
  CAPTAIN_APPOINT_SOLDIER: "captain-appoint-soldier",
  VILLAGE_ELDER_ASSIGN_VOTES: "village-elder-assign-votes",
  SAVIOUR_PROTECT: "saviour-protect",
  PROPHET_MARK: "prophet-mark",
  VINTNER_POISON: "vintner-poison",
  EVIL_CUPID_PAIR: "evil-cupid-pair",
  EVIL_CUPID_REPLACE: "evil-cupid-replace",
  CUPID_PAIR: "cupid-pair",
  THIEF_REVOKE_VOTE: "thief-revoke-vote",
  WOLF_DOG_CHOOSE_OWNER: "wolf-dog-choose-owner",
  ACTOR_CHOOSE_IDOL: "actor-choose-idol",
  ACTOR_CHANGE_IDOL: "actor-change-idol",
  GRAVE_ROBBER_SWAP: "grave-robber-swap",
  ILLUSIONIST_HIDE: "illusionist-hide",
  SECRET_LOVER_CHECK: "secret-lover-check",
  WILD_CHILD_CHOOSE_PARENT: "wild-child-choose-parent",
  DEVOUT_SERVANT_SAVE: "devout-servant-save",
} as const;

export type PhoneMode = typeof PHONE_MODE[keyof typeof PHONE_MODE];

const ASSASSINATION_PHONE_MODES = new Set<PhoneMode>([
  PHONE_MODE.WEREWOLF_HUNT,
  PHONE_MODE.COLOSSUS_RETALIATION,
  PHONE_MODE.HUNTER_ASSASSINATION,
  PHONE_MODE.SOLDIER_ASSASSINATION,
  PHONE_MODE.WHITE_WEREWOLF_ASSASSINATION,
]);

export function isAssassinationPhoneMode(mode: PhoneMode): boolean {
  return ASSASSINATION_PHONE_MODES.has(mode);
}
