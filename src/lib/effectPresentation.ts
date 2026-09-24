import adoptiveDadIcon from "@/assets/display/icons/adoptive_dad.webp";
import dogAdoptiveDadIcon from "@/assets/display/icons/adoptive_dad_dog.webp";
import asleepIcon from "@/assets/display/icons/asleep.webp";
import burnedIcon from "@/assets/display/icons/burned.webp";
import caughtIcon from "@/assets/display/icons/caught.webp";
import dogDugUpIcon from "@/assets/display/icons/dug_up_dog.webp";
import dugUpIcon from "@/assets/display/icons/dug_up.webp";
import mimeDugUpIcon from "@/assets/display/icons/dug_up_mime.webp";
import dogEnemyIcon from "@/assets/display/icons/enemy_dog.webp";
import enemyIcon from "@/assets/display/icons/enemy.webp";
import evilBeingIcon from "@/assets/display/icons/evil_being.webp";
import ghostProphecyIcon from "@/assets/display/icons/ghost_prophecy.webp";
import dogIdolIcon from "@/assets/display/icons/idol_dog.webp";
import idolIcon from "@/assets/display/icons/idol.webp";
import immunityCupidIcon from "@/assets/display/icons/immunity_cupid.webp";
import immunityFullIcon from "@/assets/display/icons/immunity_full.webp";
import immunityOnetimeIcon from "@/assets/display/icons/immunity_onetime.webp";
import immunityWerewolfIcon from "@/assets/display/icons/immunity_werewolf.webp";
import loverIcon from "@/assets/display/icons/lover.webp";
import ownerIcon from "@/assets/display/icons/owner.webp";
import soldierIcon from "@/assets/display/icons/soldier.webp";
import spiedOnIcon from "@/assets/display/icons/spied_on.webp";
import tetanusIcon from "@/assets/display/icons/tetanus.webp";
import voteAccusedIcon from "@/assets/display/icons/vote_accused.webp";
import voteAccusedLastTribunalIcon from "@/assets/display/icons/vote_accused_last_tribunal.webp";
import voteAgainstIcon from "@/assets/display/icons/vote_against.webp";
import voteDoubleIcon from "@/assets/display/icons/vote_double.webp";
import voteInnocentIcon from "@/assets/display/icons/vote_innocent.webp";
import voteRevokedIcon from "@/assets/display/icons/vote_revoked.webp";
import webbedIcon from "@/assets/display/icons/webbed.webp";
import werewolfIcon from "@/assets/display/icons/werewolf.webp";
import type { StatusEffect } from "@/lib/effects";

/** One visual source for effects shown in the circle, player list, popover, and log. */
export const STATUS_EFFECT_ICONS: Record<StatusEffect, string> = {
  soldier: soldierIcon,
  vote_against: voteAgainstIcon,
  vote_double: voteDoubleIcon,
  acquitted: voteInnocentIcon,
  host: asleepIcon,
  immunity_full: immunityFullIcon,
  prophecy: ghostProphecyIcon,
  accused: voteAccusedIcon,
  accused_next: voteAccusedLastTribunalIcon,
  werewolf_turned: werewolfIcon,
  enemy: enemyIcon,
  immunity_onetime: immunityOnetimeIcon,
  lover: loverIcon,
  immunity_cupid: immunityCupidIcon,
  evil_being: evilBeingIcon,
  vote_revoked: voteRevokedIcon,
  adoptive_dad: adoptiveDadIcon,
  burned: burnedIcon,
  immunity_werewolf: immunityWerewolfIcon,
  tetanus: tetanusIcon,
  webbed: webbedIcon,
  caught: caughtIcon,
  spied_on: spiedOnIcon,
  dug_up: dugUpIcon,
  idol: idolIcon,
  idol_dog: dogIdolIcon,
  adoptive_dad_dog: dogAdoptiveDadIcon,
  enemy_dog: dogEnemyIcon,
  dug_up_dog: dogDugUpIcon,
  dug_up_mime: mimeDugUpIcon,
  owner: ownerIcon,
};
