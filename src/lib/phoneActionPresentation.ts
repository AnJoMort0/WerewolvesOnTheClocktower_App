import {
  Baby,
  BadgeMinus,
  Bone,
  Church,
  Eye,
  FlaskConical,
  Heart,
  HeartCrack,
  Moon,
  PawPrint,
  ShieldCheck,
  ShieldPlus,
  Shovel,
  Star,
  Target,
  Telescope,
  Users,
  Vote,
  WandSparkles,
  Waypoints,
  Wine,
  type LucideIcon,
} from "lucide-react";
import { PHONE_MODE, type PhoneMode } from "@/lib/phoneActionModes";

type PhoneActionPresentation = {
  icon: LucideIcon;
  iconClass: string;
};

/** Shared visual language for night-script buttons and their action screens. */
export const PHONE_ACTION_PRESENTATION: Record<PhoneMode, PhoneActionPresentation> = {
  [PHONE_MODE.WEREWOLF_HUNT]: { icon: Target, iconClass: "text-red-400" },
  [PHONE_MODE.WEREWOLF_ALLIES]: { icon: Users, iconClass: "text-gold" },
  [PHONE_MODE.EVIL_WITCH_POISON]: { icon: FlaskConical, iconClass: "text-green-400" },
  [PHONE_MODE.SHAMAN_SAVE]: { icon: ShieldPlus, iconClass: "text-moon" },
  [PHONE_MODE.MONKEY_TAMER_REVEAL]: { icon: Eye, iconClass: "text-sky-300" },
  [PHONE_MODE.FOX_TAMER_CHECK]: { icon: PawPrint, iconClass: "text-amber-400" },
  [PHONE_MODE.SPIDER_TAMER_WEB]: { icon: Waypoints, iconClass: "text-cyan-400" },
  [PHONE_MODE.PRIEST_CONFESSION]: { icon: Church, iconClass: "text-amber-200" },
  [PHONE_MODE.SLEEPWALKER_VISIT]: { icon: Moon, iconClass: "text-blue-300" },
  [PHONE_MODE.COLOSSUS_RETALIATION]: { icon: Target, iconClass: "text-red-400" },
  [PHONE_MODE.HUNTER_ASSASSINATION]: { icon: Target, iconClass: "text-red-400" },
  [PHONE_MODE.SOLDIER_ASSASSINATION]: { icon: Target, iconClass: "text-red-400" },
  [PHONE_MODE.WHITE_WEREWOLF_ASSASSINATION]: { icon: Target, iconClass: "text-red-400" },
  [PHONE_MODE.CAPTAIN_APPOINT_SOLDIER]: { icon: ShieldPlus, iconClass: "text-blue-300" },
  [PHONE_MODE.VILLAGE_ELDER_ASSIGN_VOTES]: { icon: Vote, iconClass: "text-amber-300" },
  [PHONE_MODE.SAVIOUR_PROTECT]: { icon: ShieldCheck, iconClass: "text-emerald-300" },
  [PHONE_MODE.PROPHET_MARK]: { icon: Telescope, iconClass: "text-violet-300" },
  [PHONE_MODE.VINTNER_POISON]: { icon: Wine, iconClass: "text-purple-300" },
  [PHONE_MODE.EVIL_CUPID_PAIR]: { icon: HeartCrack, iconClass: "text-rose-400" },
  [PHONE_MODE.EVIL_CUPID_REPLACE]: { icon: HeartCrack, iconClass: "text-rose-400" },
  [PHONE_MODE.CUPID_PAIR]: { icon: Heart, iconClass: "text-pink-300" },
  [PHONE_MODE.THIEF_REVOKE_VOTE]: { icon: BadgeMinus, iconClass: "text-slate-300" },
  [PHONE_MODE.WOLF_DOG_CHOOSE_OWNER]: { icon: Bone, iconClass: "text-orange-200" },
  [PHONE_MODE.ACTOR_CHOOSE_IDOL]: { icon: Star, iconClass: "text-yellow-300" },
  [PHONE_MODE.ACTOR_CHANGE_IDOL]: { icon: Star, iconClass: "text-yellow-300" },
  [PHONE_MODE.GRAVE_ROBBER_SWAP]: { icon: Shovel, iconClass: "text-stone-300" },
  [PHONE_MODE.ILLUSIONIST_HIDE]: { icon: WandSparkles, iconClass: "text-fuchsia-300" },
  [PHONE_MODE.SECRET_LOVER_CHECK]: { icon: Heart, iconClass: "text-pink-300" },
  [PHONE_MODE.WILD_CHILD_CHOOSE_PARENT]: { icon: Baby, iconClass: "text-lime-300" },
  [PHONE_MODE.DEVOUT_SERVANT_SAVE]: { icon: ShieldCheck, iconClass: "text-emerald-300" },
};
