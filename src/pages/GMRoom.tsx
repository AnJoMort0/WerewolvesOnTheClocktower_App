import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import { PlayerCircle } from "@/components/game/PlayerCircle";
import { AddPlayerForm } from "@/components/game/AddPlayerForm";
import { RoleSelector } from "@/components/game/RoleSelector";
import { NightScript } from "@/components/game/NightScript";
import { DayTribunalPanel, type DayTribunalPanelHandle } from "@/components/game/DayTribunalPanel";
import { PlayerStatusPopover, type PlayerStatus, type StatusEffect, STATUS_EFFECT_ICONS } from "@/components/game/PlayerStatusPopover";
import { FortuneTellerRevealModal } from "@/components/game/FortuneTellerRevealModal";
import { RevealModal, resolveKillerCard, type RevealCard } from "@/components/game/RevealModal";
import { RulebookModal } from "@/components/game/RulebookModal";
import { GameLogModal } from "@/components/game/GameLogModal";
import { Copy, Check, Users, Send, AlertTriangle, X, Minus, Play, Pause, Settings, FlaskConical, BookOpen, RotateCcw, Trash2, Trophy, Eye, EyeOff, ScrollText, MonitorUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { assignRoles, MIME_COPY_ROLES, ROLES, isUniqueRole, WEREWOLF_ROLES, WEB_IMMUNE_ROLES, type RoleId } from "@/lib/roles";
import { LanguageContext, getEffectLabel, getRoleLabel, t, getToast, getValidation, getGameOver, format, type Language, type WinKind } from "@/lib/i18n";
import { getScriptOrderIndex } from "@/lib/nightScript";
import { buildJoinUrl, getDefaultJoinBaseUrl, normalizeJoinBaseUrl } from "@/lib/joinUrl";
import {
  canWhiteWolfTarget,
  getCircularDistances,
  getLittleGirlAnswerKind,
  hasOtherLivingWerewolf,
  LITTLE_GIRL_POISONED_ANSWERS,
  shouldTransformEvilPoisonedSister,
  type LittleGirlAnswerKind,
  type WhiteWolfPlayerState,
} from "@/lib/gameRules";
import { detectAutomaticVictory, getVictoryStateSignature, playerWinsAnyVictoryGroup, type AutomaticWinKind, type VictoryPlayer } from "@/lib/victory";
import { WinConfirmModal, WinPickerModal } from "@/components/game/WinConfirmModal";
import { MAX_GAME_LOG_EVENTS, type GameLogEvent, type GameLogPhase, type GameLogPlayerSnapshot } from "@/lib/gameLog";
import { getRoomDisplayStorageKey, ROOM_DISPLAY_SNAPSHOT_VERSION, type RoomDisplaySnapshot } from "@/lib/roomDisplay";
import {
  EMPTY_ACTOR_POWER_STATE,
  encodeActorCharacter,
  getActorIdolUsesAfterSelection,
  getEffectiveRoleAssignments,
  parsePlayerCharacter,
  type ActorPowerState,
} from "@/lib/actor";
import {
  encodeDrunkardCharacter,
  getDrunkardReplacementCandidates,
  isDrunkardActingPoisoned,
  pickDrunkardReplacement,
} from "@/lib/drunkard";
import {
  advanceDogWolfStateForNight,
  createDogWolfState,
  createInheritedDogWolfState,
  getDogActorCopiedRoleForDisplay,
  getDogWolfAbilityRoleAssignments,
  getDogWolfPlayerIds,
  getDogWolfObjectiveRoleAssignments,
  type DogWolfStates,
} from "@/lib/dogWolf";
import {
  encodePlayerCharacterMetadata,
  OBJECTIVE_EFFECT_IDS,
  parsePlayerCharacterMetadata,
  type ObjectiveEffectId,
} from "@/lib/playerCharacter";
import poisonedIcon from "@/assets/icons/poisoned.png";
import illusionIcon from "@/assets/icons/illusion.png";
import imunityIcon from "@/assets/icons/imunity_full.png";
import villagerIcon from "@/assets/icons/villager.png";

const JOIN_BASE_URL_STORAGE_KEY = "wotct_join_base_url";
const GM_ADVANCED_STORAGE_PREFIX = "wotct_gm_advanced_";
const GM_SNAPSHOT_STORAGE_PREFIX = "wotct_gm_snapshot_";
const GM_SNAPSHOT_VERSION = 1;
const GM_SNAPSHOT_RETENTION_MS = 24 * 60 * 60 * 1000;
const SOLO_OBJECTIVE_ROLES: RoleId[] = ["s01", "s02", "as01b"];
const ROLE_DRAG_ACTIONS: Partial<Record<RoleId, string>> = {
  v19: "role-v19",
  v22: "role-v22",
  v16: "role-v16",
  v17: "role-v17",
  v09: "role-v09",
  v11: "role-v11",
  f01: "role-f01",
  l02: "role-l02",
  s01: "role-s01",
  v15: "role-v15",
  v18: "role-v18",
  s02: "role-s02",
  v08: "role-v08",
  m03: "role-m03",
  v10: "role-v10",
  v23: "role-v23",
  a05: "role-a05",
  a04: "role-a04",
  a02: "role-a02",
  m05: "role-m05",
};

type Player = {
  id: string;
  name: string;
  seat_position: number | null;
  character: string | null;
  is_alive: boolean;
  is_ready?: boolean;
  last_seen_at?: string;
};

type Room = {
  id: string;
  code: string;
  status: string;
  language?: Language;
  phase_state?: { phase: "night" | "day" | "tribunal"; number: number } | null;
  timer_state?: TimerSyncState | null;
  timer_defaults?: TimerDefaults | null;
};

type TimerSyncState = {
  phase: "day" | "tribunal";
  timeLeft: number;
  isRunning: boolean;
  timerDone: boolean;
};

type TimerDefaults = {
  day: number;
  tribunal: number;
};

const FALLBACK_TIMER_DEFAULTS: TimerDefaults = { day: 300, tribunal: 180 };

function normalizeTimerDefaults(value: unknown): TimerDefaults {
  if (!value || typeof value !== "object") return FALLBACK_TIMER_DEFAULTS;
  const partial = value as Partial<TimerDefaults>;
  const day = typeof partial.day === "number" && partial.day > 0 ? partial.day : FALLBACK_TIMER_DEFAULTS.day;
  const tribunal = typeof partial.tribunal === "number" && partial.tribunal > 0 ? partial.tribunal : FALLBACK_TIMER_DEFAULTS.tribunal;
  return { day, tribunal };
}

type GMSnapshot = {
  version: typeof GM_SNAPSHOT_VERSION;
  savedAt: number;
  roleAssignments: Record<string, RoleId>;
  rolesAssigned: boolean;
  pendingChanges: boolean;
  advancedEnabled: boolean;
  nightNumber: number;
  playerStatuses: Record<string, PlayerStatus>;
  permanentlyDead: string[];
  poisonedPlayerId: string | null;
  poisonTargetsBySource?: Record<string, string>;
  illusionPlayerId: string | null;
  illusionTargetsBySource?: Record<string, string>;
  shamanCharges: number;
  lastNightDeadPlayerIds: string[];
  foxDisabled: boolean;
  nightTargetedPlayerIds: string[];
  rustedKnightLinkedDeath: string | null;
  tetanusSourcePlayerIds?: Record<string, string>;
  gameCyclePhase: "night" | "day" | "tribunal";
  dayPhase: "day" | "tribunal";
  killSources: Record<string, string>;
  killSourcePlayerIds?: Record<string, string>;
  fortuneTellerFakeMap: Record<string, string> | null;
  witchDeathNight: number | null;
  playerEffects: Record<string, StatusEffect[]>;
  paranoidCharges: number;
  angelCharges: number;
  bigBadWolfCharges: number;
  cupidCharges: number;
  werewolfSeerUsed: boolean;
  vampireWolfUsed: boolean;
  dayKilledPlayerIds: string[];
  paranoidKillName: string | null;
  prophecyDeadAtNight: Record<string, number>;
  judgeCharges: number;
  accuserCharges: number;
  saviourLastTarget: string | null;
  villageElderLastTarget: string | null;
  vampireVictimKeepsPower: boolean;
  spiderDayChangeUsed: boolean;
  astronomerBlocksWerewolvesTonight: boolean;
  hideScreenMode: boolean;
  syncedTimerState: TimerSyncState | null;
  completedScriptLineKeys: string[];
  gameLogEvents: GameLogEvent[];
  declinedAutomaticVictory?: { kind: AutomaticWinKind; signature: string } | null;
  actorIdolUses?: number;
  actorCopiedRole?: RoleId | null;
  actorCopyNoticeNight?: number | null;
  actorPowerState?: ActorPowerState;
  drunkardReplacementRole?: RoleId | null;
  mimeCopiedRole?: RoleId | null;
  mimeReplacementRole?: RoleId | null;
  mimeOwnerRole?: RoleId | null;
  mimeCopyNoticeNight?: number | null;
  mimePowerState?: ActorPowerState;
  mimeAngelSavedPlayerId?: string | null;
  mimeFullImmunityPlayerId?: string | null;
  dogWolfStates?: DogWolfStates;
  sourcedEffectTargets?: Record<string, Partial<Record<StatusEffect, string>>>;
  spiderCaughtBySource?: Record<string, string[]>;
};

type LegacyActorPowerState = Partial<ActorPowerState> & {
  chamanCharges?: number;
  paranoicoCharges?: number;
  anjoCharges?: number;
  lobisomemMauCharges?: number;
  cupidoCharges?: number;
  lobisomemVidenteUsed?: boolean;
  lobisomemVampiroUsed?: boolean;
  juizCharges?: number;
  acusadorCharges?: number;
  salvadorLastTarget?: string | null;
  chefeLastTarget?: string | null;
};

type LegacyGMSnapshotFields = Partial<GMSnapshot> & {
  chamanCharges?: number;
  cavalerioLinkedDeath?: string | null;
  videnteFakeMap?: Record<string, string> | null;
  bruxaDeathNight?: number | null;
  paranoicoCharges?: number;
  anjoCharges?: number;
  lobisomemMauCharges?: number;
  cupidoCharges?: number;
  lobisomemVidenteUsed?: boolean;
  lobisomemVampiroUsed?: boolean;
  paranoicoKillName?: string | null;
  profeciaDeadAtNight?: Record<string, number>;
  juizCharges?: number;
  acusadorCharges?: number;
  salvadorLastTarget?: string | null;
  chefeLastTarget?: string | null;
};

const getGMSnapshotStorageKey = (roomId: string) => `${GM_SNAPSHOT_STORAGE_PREFIX}${roomId}`;

function serializeEffects(effects: Record<string, Set<StatusEffect>>): Record<string, StatusEffect[]> {
  return Object.fromEntries(Object.entries(effects).map(([playerId, set]) => [playerId, Array.from(set)]));
}

function restoreActorPowerState(value: LegacyActorPowerState | null | undefined): ActorPowerState {
  const state = value ?? {};
  return {
    ...EMPTY_ACTOR_POWER_STATE,
    ...state,
    shamanCharges: state.shamanCharges ?? state.chamanCharges ?? EMPTY_ACTOR_POWER_STATE.shamanCharges,
    paranoidCharges: state.paranoidCharges ?? state.paranoicoCharges ?? EMPTY_ACTOR_POWER_STATE.paranoidCharges,
    angelCharges: state.angelCharges ?? state.anjoCharges ?? EMPTY_ACTOR_POWER_STATE.angelCharges,
    bigBadWolfCharges: state.bigBadWolfCharges ?? state.lobisomemMauCharges ?? EMPTY_ACTOR_POWER_STATE.bigBadWolfCharges,
    cupidCharges: state.cupidCharges ?? state.cupidoCharges ?? EMPTY_ACTOR_POWER_STATE.cupidCharges,
    werewolfSeerUsed: state.werewolfSeerUsed ?? state.lobisomemVidenteUsed ?? EMPTY_ACTOR_POWER_STATE.werewolfSeerUsed,
    vampireWolfUsed: state.vampireWolfUsed ?? state.lobisomemVampiroUsed ?? EMPTY_ACTOR_POWER_STATE.vampireWolfUsed,
    judgeCharges: state.judgeCharges ?? state.juizCharges ?? EMPTY_ACTOR_POWER_STATE.judgeCharges,
    accuserCharges: state.accuserCharges ?? state.acusadorCharges ?? EMPTY_ACTOR_POWER_STATE.accuserCharges,
    saviourLastTarget: state.saviourLastTarget ?? state.salvadorLastTarget ?? EMPTY_ACTOR_POWER_STATE.saviourLastTarget,
    villageElderLastTarget: state.villageElderLastTarget ?? state.chefeLastTarget ?? EMPTY_ACTOR_POWER_STATE.villageElderLastTarget,
  };
}

function restoreDogWolfStates(states: DogWolfStates | undefined): DogWolfStates {
  if (!states) return {};
  return Object.fromEntries(Object.entries(states).map(([playerId, state]) => [
    playerId,
    {
      ...state,
      powerState: restoreActorPowerState(state.powerState as LegacyActorPowerState),
    },
  ])) as DogWolfStates;
}

function restoreEffects(effects: Record<string, StatusEffect[]> | undefined): Record<string, Set<StatusEffect>> {
  if (!effects) return {};
  return Object.fromEntries(Object.entries(effects).map(([playerId, values]) => [playerId, new Set(values)]));
}

function pruneOldGMSnapshots() {
  if (typeof window === "undefined") return;
  const now = Date.now();
  for (let i = window.localStorage.length - 1; i >= 0; i -= 1) {
    const key = window.localStorage.key(i);
    if (!key?.startsWith(GM_SNAPSHOT_STORAGE_PREFIX)) continue;
    try {
      const parsed = JSON.parse(window.localStorage.getItem(key) || "");
      if (typeof parsed?.savedAt !== "number" || now - parsed.savedAt > GM_SNAPSHOT_RETENTION_MS) {
        window.localStorage.removeItem(key);
        const storedRoomId = key.slice(GM_SNAPSHOT_STORAGE_PREFIX.length);
        window.localStorage.removeItem(`${GM_ADVANCED_STORAGE_PREFIX}${storedRoomId}`);
        window.localStorage.removeItem(getRoomDisplayStorageKey(storedRoomId));
      }
    } catch {
      window.localStorage.removeItem(key);
      const storedRoomId = key.slice(GM_SNAPSHOT_STORAGE_PREFIX.length);
      window.localStorage.removeItem(`${GM_ADVANCED_STORAGE_PREFIX}${storedRoomId}`);
      window.localStorage.removeItem(getRoomDisplayStorageKey(storedRoomId));
    }
  }
}

const ESSENTIAL_ROLES: RoleId[] = ["e02", "e03", "e04"];
const POISON_DRAG_ROLE: RoleId = "e02";
const KILL_DRAG_ROLE: RoleId = "e01";
const SHAMAN_ROLE: RoleId = "e03";
const ILLUSION_DRAG_ROLE: RoleId = "a06";
const RUSTED_KNIGHT_ROLE: RoleId = "v07";
const DEAD_SOURCE_EFFECTS: Partial<Record<RoleId, StatusEffect[]>> = {
  v09: ["soldado"],
  v11: ["vote_against", "vote_double"],
  v16: ["hospede"],
  v17: ["immunity_full"],
  v19: ["profecia"],
  v23: ["webbed"],
  f01: ["vote_revoked"],
};

const EFFECT_SOURCE_ROLES: Partial<Record<StatusEffect, RoleId>> = {
  soldado: "v09",
  vote_against: "v11",
  vote_double: "v11",
  inocentado: "v15",
  hospede: "v16",
  immunity_full: "v17",
  profecia: "v19",
  idol: "a04",
  owner: "a02",
  acusado: "v22",
  acusado_next: "v22",
  werewolf_turned: "m03",
  enemy: "m05",
  immunity_onetime: "m05",
  namorado: "s01",
  immunity_cupid: "s01",
  evil_being: "f02",
  vote_revoked: "f01",
  adoptive_dad: "l02",
  incendiado: "v15",
  immunity_werewolf: "v08b",
  tetanus: "v07",
  webbed: "v23",
  caught: "v23",
  spied_on: "f02",
  dug_up: "a05",
  dug_up_mime: "a03",
  idol_dog: "a02",
  adoptive_dad_dog: "a02",
  enemy_dog: "a02",
  dug_up_dog: "a02",
};

const SOURCE_SCOPED_EFFECTS = new Set<StatusEffect>([
  "soldado",
  "vote_against",
  "vote_double",
  "inocentado",
  "hospede",
  "immunity_full",
  "profecia",
  "vote_revoked",
  "adoptive_dad",
  "incendiado",
  "webbed",
  "dug_up",
  "dug_up_mime",
  "adoptive_dad_dog",
  "dug_up_dog",
]);

function getExpectedWerewolfCount(playerCount: number): number {
  if (playerCount < 12) return 2;
  return Math.floor(playerCount / 4);
}

const GMRoom = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [copied, setCopied] = useState(false);
  const [copiedJoinLink, setCopiedJoinLink] = useState(false);
  const [joinBaseOverride, setJoinBaseOverride] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(JOIN_BASE_URL_STORAGE_KEY) ?? "";
  });
  const [roleAssignments, setRoleAssignments] = useState<Record<string, RoleId>>({});
  const [rolesAssigned, setRolesAssigned] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(false);
  const [advancedEnabled, setAdvancedEnabled] = useState(() => {
    if (typeof window === "undefined" || !roomId) return false;
    return window.localStorage.getItem(`${GM_ADVANCED_STORAGE_PREFIX}${roomId}`) === "1";
  });

  // Night & status tracking
  const [nightNumber, setNightNumber] = useState(1);
  const [playerStatuses, setPlayerStatuses] = useState<Record<string, PlayerStatus>>({});
  const [permanentlyDead, setPermanentlyDead] = useState<Set<string>>(new Set());
  const [poisonTargetsBySource, setPoisonTargetsBySource] = useState<Record<string, string>>({});
  const [illusionTargetsBySource, setIllusionTargetsBySource] = useState<Record<string, string>>({});
  const [listPopoverId, setListPopoverId] = useState<string | null>(null);
  const [shamanCharges, setShamanCharges] = useState(0);
  const [lastNightDeadPlayerIds, setLastNightDeadPlayerIds] = useState<string[]>([]);
  const [fortuneTellerModalOpen, setFortuneTellerModalOpen] = useState(false);
  const [fortuneTellerModalPoisoned, setFortuneTellerModalPoisoned] = useState(false);
  const [foxDisabled, setFoxDisabled] = useState(false);
  const [nightTargetedPlayerIds, setNightTargetedPlayerIds] = useState<Set<string>>(new Set());
  const [rustedKnightLinkedDeath, setRustedKnightLinkedDeath] = useState<string | null>(null);
  const [tetanusSourcePlayerIds, setTetanusSourcePlayerIds] = useState<Record<string, string>>({});

  // Game cycle
  const [gameCyclePhase, setGameCyclePhase] = useState<"night" | "day" | "tribunal">("night");
  const [dayPhase, setDayPhase] = useState<"day" | "tribunal">("day");

  // Kill tracking
  const [killSources, setKillSources] = useState<Record<string, string>>({});
  const [killSourcePlayerIds, setKillSourcePlayerIds] = useState<Record<string, string>>({});

  // FortuneTeller fake map
  const [fortuneTellerFakeMap, setFortuneTellerFakeMap] = useState<Record<string, string> | null>(null);

  // Poison auto-removal tracking
  const [witchDeathNight, setWitchDeathNight] = useState<number | null>(null);

  // Status effects per player
  const [playerEffects, setPlayerEffects] = useState<Record<string, Set<StatusEffect>>>({});

  // Role charges
  const [paranoidCharges, setParanoidCharges] = useState(0);
  const [angelCharges, setAngelCharges] = useState(0);
  const [bigBadWolfCharges, setBigBadWolfCharges] = useState(0);
  const [cupidCharges, setCupidCharges] = useState(0);
  const [werewolfSeerUsed, setWerewolfSeerUsed] = useState(false);
  const [vampireWolfUsed, setVampireWolfUsed] = useState(false);

  // Executado tracking for day kills
  const [dayKilledPlayerIds, setDayKilledPlayerIds] = useState<string[]>([]);
  const [timerDefaults, setTimerDefaults] = useState<TimerDefaults>(FALLBACK_TIMER_DEFAULTS);

  // Paranoid kill announcement for tribunal
  const [paranoidKillName, setParanoidKillName] = useState<string | null>(null);

  // Reveal modals (Little Girl, Lamplighter, Werewolf Seer)
  const [qrPopupOpen, setQrPopupOpen] = useState(false);
  const [littleGirlRevealOpen, setLittleGirlRevealOpen] = useState(false);
  const [littleGirlRevealCards, setLittleGirlRevealCards] = useState<RevealCard[]>([]);
  const [lamplighterRevealOpen, setLamplighterRevealOpen] = useState(false);
  const [werewolfSeerRevealOpen, setWerewolfSeerRevealOpen] = useState(false);
  const [werewolfSeerRevealedVictim, setWerewolfSeerRevealedVictim] = useState<{ id: string; name: string; role: RoleId } | null>(null);
  const [lamplighterPickedRole, setLamplighterPickedRole] = useState<RoleId | null>(null);
  const [lamplighterPickedCharges, setLamplighterPickedCharges] = useState<boolean[]>([]);

  // Track when profecia-tagged player became perma-dead (for +1 night persistence)
  // Key: playerId. Value: nightNumber the player perma-died with profecia status.
  // The player's role line still appears during nightNumber === storedNight + 1.
  const [prophecyDeadAtNight, setProphecyDeadAtNight] = useState<Record<string, number>>({});

  // Track Judge/Accuser checkboxes (live action only)
  const [judgeCharges, setJudgeCharges] = useState(0);
  const [accuserCharges, setAccuserCharges] = useState(0);

  // Track last targets for Saviour / VillageElder da Aldeia (so retarget removes the previous effect)
  const [saviourLastTarget, setSaviourLastTarget] = useState<string | null>(null);
  const [villageElderLastTarget, setVillageElderLastTarget] = useState<string | null>(null);

  // Vampire victim "keeps power" toggle (default true once turned). Square checkbox.
  const [vampireVictimKeepsPower, setVampireVictimKeepsPower] = useState(true);
  const [spiderDayChangeUsed, setSpiderDayChangeUsed] = useState(false);
  const [astronomerBlocksWerewolvesTonight, setAstronomerBlocksWerewolvesTonight] = useState(false);
  const [hideScreenMode, setHideScreenMode] = useState(false);
  const [syncedTimerState, setSyncedTimerState] = useState<TimerSyncState | null>(null);
  const [hiddenTimerEditing, setHiddenTimerEditing] = useState(false);
  const [hiddenTimerMinutes, setHiddenTimerMinutes] = useState("0");
  const [hiddenTimerSeconds, setHiddenTimerSeconds] = useState("0");
  const dayPanelRef = useRef<DayTribunalPanelHandle>(null);
  const pendingGameOverLogKindRef = useRef<WinKind | null>(null);
  const pendingActorCopyLogRef = useRef<RoleId | null>(null);
  const pendingDrunkardSetupLogRef = useRef<RoleId | null>(null);
  const pendingDogOwnerLogRef = useRef<Array<{ dogPlayerId: string; ownerPlayerId: string }>>([]);
  const pendingDogRoleChangeLogRef = useRef<Array<{ dogPlayerId: string; fromRole: RoleId; toRole: RoleId }>>([]);
  const pendingActorDogFallbackLogRef = useRef<string | null>(null);
  const pendingRoleChangeSourcesRef = useRef<Map<string, { sourcePlayerId: string; sourceRole: RoleId }>>(new Map());
  const pendingGameActionLogSourcesRef = useRef<Map<string, string>>(new Map());
  const suppressedEffectLogAddsRef = useRef<Set<string>>(new Set());
  const gameLogDiffReadyRef = useRef(false);
  const previousGameLogStateRef = useRef<{
    playerStatuses: Record<string, PlayerStatus>;
    permanentlyDead: Set<string>;
    poisonedPlayerIds: Set<string>;
    illusionPlayerIds: Set<string>;
    playerEffects: Record<string, Set<StatusEffect>>;
    roleAssignments: Record<string, RoleId>;
    gameCyclePhase: "night" | "day" | "tribunal";
    dayPhase: "day" | "tribunal";
    nightNumber: number;
  } | null>(null);

  // Spider (v23) reveal modal
  const [spiderRevealOpen, setSpiderRevealOpen] = useState(false);
  const [spiderRevealCards, setSpiderRevealCards] = useState<RevealCard[]>([]);

  // Spy (f02) reveal modal
  const [spyRevealOpen, setSpyRevealOpen] = useState(false);
  const [spyRevealCards, setSpyRevealCards] = useState<RevealCard[]>([]);
  const [gmSnapshotLoaded, setGmSnapshotLoaded] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [winPickerOpen, setWinPickerOpen] = useState(false);
  const [manualWinKind, setManualWinKind] = useState<WinKind | null>(null);
  const [tieWinnerGroups, setTieWinnerGroups] = useState<Set<AutomaticWinKind>>(new Set());
  const [automaticWinKind, setAutomaticWinKind] = useState<AutomaticWinKind | null>(null);
  const [declinedAutomaticVictory, setDeclinedAutomaticVictory] = useState<{ kind: AutomaticWinKind; signature: string } | null>(null);
  const [completedScriptLineKeys, setCompletedScriptLineKeys] = useState<Set<string>>(new Set());
  const [scriptAutoComplete, setScriptAutoComplete] = useState<{
    role: RoleId | null;
    sourcePlayerIds: string[];
    version: number;
  }>({ role: null, sourcePlayerIds: [], version: 0 });
  const [rulebookOpen, setRulebookOpen] = useState(false);
  const [rulebookRoleId, setRulebookRoleId] = useState<RoleId | null>(null);
  const [gameLogOpen, setGameLogOpen] = useState(false);
  const [gameLogEvents, setGameLogEvents] = useState<GameLogEvent[]>([]);
  const [actorIdolUses, setActorIdolUses] = useState(0);
  const [actorCopiedRole, setActorCopiedRole] = useState<RoleId | null>(null);
  const [actorCopyNoticeNight, setActorCopyNoticeNight] = useState<number | null>(null);
  const [actorPowerState, setActorPowerState] = useState<ActorPowerState>(() => ({ ...EMPTY_ACTOR_POWER_STATE }));
  const [drunkardReplacementRole, setDrunkardReplacementRole] = useState<RoleId | null>(null);
  const [mimeCopiedRole, setMimeCopiedRole] = useState<RoleId | null>(null);
  const [mimeReplacementRole, setMimeReplacementRole] = useState<RoleId | null>(null);
  const [mimeOwnerRole, setMimeOwnerRole] = useState<RoleId | null>(null);
  const [mimeCopyNoticeNight, setMimeCopyNoticeNight] = useState<number | null>(null);
  const [mimePowerState, setMimePowerState] = useState<ActorPowerState>(() => ({ ...EMPTY_ACTOR_POWER_STATE }));
  const [mimeAngelSavedPlayerId, setMimeAngelSavedPlayerId] = useState<string | null>(null);
  const [mimeFullImmunityPlayerId, setMimeFullImmunityPlayerId] = useState<string | null>(null);
  const [mimeRevealOpen, setMimeRevealOpen] = useState(false);
  const [mimeRevealCards, setMimeRevealCards] = useState<RevealCard[]>([]);
  const [dogWolfStates, setDogWolfStates] = useState<DogWolfStates>({});
  const [sourcedEffectTargets, setSourcedEffectTargets] = useState<Record<string, Partial<Record<StatusEffect, string>>>>({});
  const [spiderCaughtBySource, setSpiderCaughtBySource] = useState<Record<string, string[]>>({});

  const defaultJoinBaseUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return getDefaultJoinBaseUrl(window.location.origin, import.meta.env.VITE_PUBLIC_APP_URL);
  }, []);
  const joinBaseUrl = normalizeJoinBaseUrl(joinBaseOverride || defaultJoinBaseUrl);
  const joinUrl = room ? buildJoinUrl(room.code, joinBaseUrl) : "";
  const actorPlayerId = useMemo(
    () => Object.entries(roleAssignments).find(([, role]) => role === "a04")?.[0] ?? null,
    [roleAssignments],
  );
  const drunkardPlayerId = useMemo(
    () => Object.entries(roleAssignments).find(([, role]) => role === "a01")?.[0] ?? null,
    [roleAssignments],
  );
  const mimePlayerId = useMemo(
    () => Object.entries(roleAssignments).find(([, role]) => role === "a03")?.[0] ?? null,
    [roleAssignments],
  );
  const actorIdolPlayerId = useMemo(
    () => Object.entries(playerEffects).find(([, effects]) => effects.has("idol"))?.[0] ?? null,
    [playerEffects],
  );
  const mimeMechanicalRole = useMemo(() => {
    if (!mimeCopiedRole) return null;
    if (mimeCopiedRole === "a01") return mimeReplacementRole;
    if (mimeCopiedRole === "a02") return mimeOwnerRole;
    return mimeCopiedRole;
  }, [mimeCopiedRole, mimeOwnerRole, mimeReplacementRole]);
  const effectiveRoleAssignments = useMemo(() => {
    const assignments = getEffectiveRoleAssignments(roleAssignments, actorCopiedRole, drunkardReplacementRole);
    if (mimePlayerId && mimeMechanicalRole) assignments[mimePlayerId] = mimeMechanicalRole;
    return assignments;
  }, [actorCopiedRole, drunkardReplacementRole, mimeMechanicalRole, mimePlayerId, roleAssignments]);
  const displayRoleAssignments = useMemo(() => {
    const assignments = { ...effectiveRoleAssignments };
    if (mimePlayerId && mimeCopiedRole) assignments[mimePlayerId] = mimeCopiedRole;
    return assignments;
  }, [effectiveRoleAssignments, mimeCopiedRole, mimePlayerId]);
  const dogWolfPlayerIds = useMemo(
    () => getDogWolfPlayerIds(roleAssignments, actorPlayerId, actorCopiedRole),
    [actorCopiedRole, actorPlayerId, roleAssignments],
  );
  const activeDogWolfPlayerIds = useMemo(
    () => dogWolfPlayerIds.filter((playerId) => !permanentlyDead.has(playerId)),
    [dogWolfPlayerIds, permanentlyDead],
  );
  const prophecyGhostPlayerIds = useMemo(() => {
    const playerIds = new Set<string>();
    for (const [playerId, deathNight] of Object.entries(prophecyDeadAtNight)) {
      if (nightNumber === deathNight + 1) playerIds.add(playerId);
    }
    return playerIds;
  }, [prophecyDeadAtNight, nightNumber]);
  const abilityRoleAssignments = useMemo(
    () => getDogWolfAbilityRoleAssignments(
      effectiveRoleAssignments,
      dogWolfStates,
      permanentlyDead,
      prophecyGhostPlayerIds,
    ),
    [dogWolfStates, effectiveRoleAssignments, permanentlyDead, prophecyGhostPlayerIds],
  );
  const objectiveRoleAssignments = useMemo(() => {
    const assignments = { ...effectiveRoleAssignments };
    if (drunkardPlayerId) assignments[drunkardPlayerId] = "a01";
    if (actorPlayerId && actorCopiedRole === "a01") assignments[actorPlayerId] = "a01";
    if (mimePlayerId) assignments[mimePlayerId] = "a03";
    return getDogWolfObjectiveRoleAssignments(assignments, dogWolfStates);
  }, [actorCopiedRole, actorPlayerId, dogWolfStates, drunkardPlayerId, effectiveRoleAssignments, mimePlayerId]);
  const poisonedPlayerIds = useMemo(
    () => new Set(Object.values(poisonTargetsBySource)),
    [poisonTargetsBySource],
  );
  const poisonedPlayerId = poisonedPlayerIds.values().next().value ?? null;
  const illusionPlayerIds = useMemo(
    () => new Set(Object.values(illusionTargetsBySource)),
    [illusionTargetsBySource],
  );
  const illusionPlayerId = illusionPlayerIds.values().next().value ?? null;
  const isPlayerPoisoned = useCallback(
    (playerId: string | null | undefined) => !!playerId && poisonedPlayerIds.has(playerId),
    [poisonedPlayerIds],
  );
  const drunkardMechanicPlayerIds = useMemo(() => {
    const playerIds = new Set<string>();
    if (drunkardPlayerId) playerIds.add(drunkardPlayerId);
    if (actorCopiedRole === "a01" && actorPlayerId) playerIds.add(actorPlayerId);
    if (mimeCopiedRole === "a01" && mimePlayerId) playerIds.add(mimePlayerId);
    for (const dogPlayerId of dogWolfPlayerIds) {
      if (dogWolfStates[dogPlayerId]?.actorCopiedRole === "a01") {
        playerIds.add(dogPlayerId);
        continue;
      }
      const ownerPlayerId = dogWolfStates[dogPlayerId]?.ownerPlayerId;
      if (!ownerPlayerId) continue;
      const ownerIsDrunkard = roleAssignments[ownerPlayerId] === "a01"
        || (ownerPlayerId === actorPlayerId && actorCopiedRole === "a01");
      if (ownerIsDrunkard) playerIds.add(dogPlayerId);
    }
    return playerIds;
  }, [actorCopiedRole, actorPlayerId, dogWolfPlayerIds, dogWolfStates, drunkardPlayerId, mimeCopiedRole, mimePlayerId, roleAssignments]);
  const isPlayerActingPoisoned = useCallback((playerId: string | null | undefined) => (
    isDrunkardActingPoisoned(playerId, drunkardMechanicPlayerIds, poisonedPlayerIds)
  ), [drunkardMechanicPlayerIds, poisonedPlayerIds]);
  const actingPoisonedPlayerIds = useMemo(() => new Set(
    Object.keys(abilityRoleAssignments).filter((playerId) => isPlayerActingPoisoned(playerId)),
  ), [abilityRoleAssignments, isPlayerActingPoisoned]);
  const werewolfPackPoisoned = useMemo(() => Object.entries(abilityRoleAssignments)
    .some(([playerId, role]) => {
      if (dogWolfPlayerIds.includes(playerId) || !isPlayerActingPoisoned(playerId)) return false;
      return WEREWOLF_ROLES.includes(role) || playerEffects[playerId]?.has("werewolf_turned");
    }) || astronomerBlocksWerewolvesTonight, [abilityRoleAssignments, astronomerBlocksWerewolvesTonight, dogWolfPlayerIds, isPlayerActingPoisoned, playerEffects]);
  const dogWolfOwnerRoles = useMemo(() => Object.fromEntries(
    dogWolfPlayerIds.flatMap((dogPlayerId) => {
      const ownerPlayerId = dogWolfStates[dogPlayerId]?.ownerPlayerId;
      const copiedPowerRole = abilityRoleAssignments[dogPlayerId];
      const displayedRole = copiedPowerRole && copiedPowerRole !== "a02"
        ? copiedPowerRole
        : ownerPlayerId ? effectiveRoleAssignments[ownerPlayerId] : null;
      return displayedRole ? [[dogPlayerId, displayedRole]] : [];
    }),
  ) as Record<string, RoleId>, [abilityRoleAssignments, dogWolfPlayerIds, dogWolfStates, effectiveRoleAssignments]);
  const mimeCornerRoles = useMemo(() => {
    if (!mimePlayerId) return {};
    const cornerRole = mimeCopiedRole === "a01"
      ? mimeReplacementRole
      : mimeCopiedRole === "a02"
      ? mimeOwnerRole
      : null;
    return cornerRole ? { [mimePlayerId]: cornerRole } : {};
  }, [mimeCopiedRole, mimeOwnerRole, mimePlayerId, mimeReplacementRole]);
  const displayOwnerRoles = useMemo(
    () => ({ ...dogWolfOwnerRoles, ...mimeCornerRoles }),
    [dogWolfOwnerRoles, mimeCornerRoles],
  );
  const independentPowerStates = useMemo(() => {
    const states: Record<string, ActorPowerState> = {};
    if (actorPlayerId && actorCopiedRole && actorCopiedRole !== "a02") states[actorPlayerId] = actorPowerState;
    if (mimePlayerId && mimeCopiedRole) states[mimePlayerId] = mimePowerState;
    for (const dogPlayerId of dogWolfPlayerIds) {
      const dogState = dogWolfStates[dogPlayerId];
      if (dogState) states[dogPlayerId] = dogState.powerState;
    }
    return states;
  }, [actorCopiedRole, actorPlayerId, actorPowerState, dogWolfPlayerIds, dogWolfStates, mimeCopiedRole, mimePlayerId, mimePowerState]);

  useEffect(() => {
    if (!drunkardPlayerId) {
      if (drunkardReplacementRole) setDrunkardReplacementRole(null);
      return;
    }
    const otherRoles = Object.entries(roleAssignments)
      .filter(([playerId]) => playerId !== drunkardPlayerId)
      .map(([, role]) => role);
    const candidates = getDrunkardReplacementCandidates(otherRoles);
    if (drunkardReplacementRole && candidates.includes(drunkardReplacementRole)) return;
    setDrunkardReplacementRole(pickDrunkardReplacement(otherRoles));
  }, [drunkardPlayerId, drunkardReplacementRole, roleAssignments]);

  useEffect(() => {
    setDogWolfStates((previous) => {
      const validPlayerIds = new Set(dogWolfPlayerIds);
      const next: DogWolfStates = {};
      let changed = false;
      for (const playerId of validPlayerIds) {
        const prior = previous[playerId];
        const defaults = createDogWolfState(prior?.ownerPlayerId ?? null);
        next[playerId] = prior ? {
          ...defaults,
          ...prior,
          powerState: { ...defaults.powerState, ...prior.powerState },
          enemyPlayerIds: prior.enemyPlayerIds ?? [],
        } : defaults;
        if (!prior || Object.keys(defaults).some((key) => !(key in prior))) changed = true;
      }
      if (Object.keys(previous).some((playerId) => !validPlayerIds.has(playerId))) changed = true;
      return changed ? next : previous;
    });
  }, [dogWolfPlayerIds]);

  useEffect(() => {
    const targetsByEffect: Record<"idol_dog" | "adoptive_dad_dog" | "enemy_dog", Set<string>> = {
      idol_dog: new Set(),
      adoptive_dad_dog: new Set(),
      enemy_dog: new Set(),
    };
    for (const state of Object.values(dogWolfStates)) {
      if (state.actorIdolPlayerId) targetsByEffect.idol_dog.add(state.actorIdolPlayerId);
      if (state.adoptiveDadPlayerId) targetsByEffect.adoptive_dad_dog.add(state.adoptiveDadPlayerId);
      for (const enemyPlayerId of state.enemyPlayerIds) {
        if (!permanentlyDead.has(enemyPlayerId)) targetsByEffect.enemy_dog.add(enemyPlayerId);
      }
    }
    setPlayerEffects((previous) => {
      const playerIds = new Set([
        ...Object.keys(previous),
        ...Object.values(targetsByEffect).flatMap((targets) => Array.from(targets)),
      ]);
      const next = { ...previous };
      let changed = false;
      for (const playerId of playerIds) {
        const current = previous[playerId] || new Set<StatusEffect>();
        const updated = new Set(current);
        for (const effect of Object.keys(targetsByEffect) as Array<keyof typeof targetsByEffect>) {
          if (targetsByEffect[effect].has(playerId)) updated.add(effect);
          else updated.delete(effect);
        }
        if (updated.size !== current.size || Array.from(updated).some((effect) => !current.has(effect))) {
          next[playerId] = updated;
          changed = true;
        }
      }
      return changed ? next : previous;
    });
  }, [dogWolfStates, permanentlyDead]);
  const isWerewolfAttackSource = useCallback((source: string, sourcePlayerId?: string | null) => (
    source === "e01"
    || WEREWOLF_ROLES.includes(source as RoleId)
    || (source === "a04" && !!actorCopiedRole && WEREWOLF_ROLES.includes(actorCopiedRole))
    || (!!sourcePlayerId && WEREWOLF_ROLES.includes(abilityRoleAssignments[sourcePlayerId]))
  ), [abilityRoleAssignments, actorCopiedRole]);
  // Derived states
  const isWitchPermaDead = useMemo(() => {
    const witchPlayerIds = Object.entries(abilityRoleAssignments)
      .filter(([, role]) => role === "e02")
      .map(([playerId]) => playerId);
    return witchPlayerIds.length > 0 && witchPlayerIds.every((playerId) => permanentlyDead.has(playerId));
  }, [abilityRoleAssignments, permanentlyDead]);

  const isWitchPoisoned = useMemo(() => {
    return Object.entries(abilityRoleAssignments)
      .some(([playerId, role]) => role === "e02" && isPlayerPoisoned(playerId));
  }, [abilityRoleAssignments, isPlayerPoisoned]);

  const isPuppeteer = useMemo(() => {
    for (const [pid, role] of Object.entries(effectiveRoleAssignments)) {
      if (role === ("a06" as RoleId) && !permanentlyDead.has(pid)) return true;
    }
    return false;
  }, [effectiveRoleAssignments, permanentlyDead]);

  const duplicateRoles = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(roleAssignments).forEach((roleId) => {
      counts[roleId] = (counts[roleId] || 0) + 1;
    });
    const dupes = new Set<RoleId>();
    Object.entries(counts).forEach(([roleId, count]) => {
      if (count > 1 && isUniqueRole(roleId as RoleId)) {
        if (roleId === "l03" && count <= 2) return;
        if (roleId === "l04" && count <= 3) return;
        dupes.add(roleId as RoleId);
      }
    });
    return dupes;
  }, [roleAssignments]);

  const validationWarnings = useMemo(() => {
    if (!rolesAssigned) return [];
    const lng: Language = (room?.language as Language) || "pt";
    const warnings: string[] = [];
    const assignedRoles = new Set(Object.values(effectiveRoleAssignments));

    for (const essential of ESSENTIAL_ROLES) {
      if (!assignedRoles.has(essential)) {
        warnings.push(format(getValidation("essentialMissing", lng), { label: getRoleLabel(essential, lng) }));
      }
    }

    const wwCount = Object.values(roleAssignments).filter((r) => WEREWOLF_ROLES.includes(r)).length;
    const seatedCount = Object.keys(roleAssignments).length;
    const expected = getExpectedWerewolfCount(seatedCount);
    if (wwCount < expected) {
      warnings.push(format(getValidation("fewWerewolves", lng), { n: wwCount, expected }));
    }

    if (assignedRoles.has("v08b") && !assignedRoles.has("v08")) {
      warnings.push(getValidation("littleRedNeedsHunter", lng));
    }
    if (assignedRoles.has("as01b") && !assignedRoles.has("s01")) {
      warnings.push(getValidation("secretLoverNeedsCupid", lng));
    }

    const irmasCount = Object.values(roleAssignments).filter((r) => r === "l03").length;
    if (assignedRoles.has("l03") && irmasCount !== 2) {
      warnings.push(format(getValidation("sistersCount", lng), { n: irmasCount }));
    }
    const irmaosCount = Object.values(roleAssignments).filter((r) => r === "l04").length;
    if (assignedRoles.has("l04") && irmaosCount !== 3) {
      warnings.push(format(getValidation("brothersCount", lng), { n: irmaosCount }));
    }

    const inimigosCount = Object.entries(playerEffects).filter(([, e]) => e.has("enemy")).length;
    if (inimigosCount > 2) {
      warnings.push(format(getValidation("tooManyEnemies", lng), { n: inimigosCount }));
    }

    const namoradosCount = Object.entries(playerEffects).filter(([, e]) => e.has("namorado")).length;
    if (namoradosCount > 2) {
      warnings.push(format(getValidation("tooManyLovers", lng), { n: namoradosCount }));
    }

    return warnings;
  }, [effectiveRoleAssignments, roleAssignments, rolesAssigned, playerEffects, room?.language]);

  const activeRoles = useMemo(() => new Set(Object.values(effectiveRoleAssignments)), [effectiveRoleAssignments]);

  const activeDogOwnerPlayerIds = useMemo(() => new Set(
    activeDogWolfPlayerIds.flatMap((dogPlayerId) => {
      const state = dogWolfStates[dogPlayerId];
      const ownerPlayerId = state?.ownerPlayerId;
      return ownerPlayerId ? [ownerPlayerId] : [];
    }),
  ), [activeDogWolfPlayerIds, dogWolfStates]);

  const displayedPlayerEffects = useMemo(() => {
    const next = Object.fromEntries(
      Object.entries(playerEffects).map(([playerId, effects]) => [playerId, new Set(effects)]),
    ) as Record<string, Set<StatusEffect>>;
    for (const ownerPlayerId of activeDogOwnerPlayerIds) {
      const effects = new Set(next[ownerPlayerId] || []);
      effects.add("owner");
      next[ownerPlayerId] = effects;
    }
    return next;
  }, [activeDogOwnerPlayerIds, playerEffects]);

  const setDogWolfOwner = useCallback((dogPlayerId: string, ownerPlayerId: string | null) => {
    if (!dogWolfPlayerIds.includes(dogPlayerId)) return;
    if (ownerPlayerId && (
      ownerPlayerId === dogPlayerId
      || permanentlyDead.has(ownerPlayerId)
      || playerStatuses[ownerPlayerId] === "dead-this-night"
    )) return;
    const inheritedAdoptiveDadId = ownerPlayerId && effectiveRoleAssignments[ownerPlayerId] === "l02"
      ? Object.entries(playerEffects).find(([, effects]) => effects.has("adoptive_dad"))?.[0] ?? null
      : null;
    setDogWolfStates((previous) => {
      if (previous[dogPlayerId]?.ownerPlayerId === ownerPlayerId) return previous;
      if (ownerPlayerId) {
        pendingDogOwnerLogRef.current.push({ dogPlayerId, ownerPlayerId });
        if (inheritedAdoptiveDadId) {
          pendingGameActionLogSourcesRef.current.set(`effect:${inheritedAdoptiveDadId}:adoptive_dad_dog`, dogPlayerId);
        }
      }
      return { ...previous, [dogPlayerId]: {
        ...createDogWolfState(ownerPlayerId),
        ownerSelectedNight: ownerPlayerId ? nightNumber : null,
        adoptiveDadPlayerId: inheritedAdoptiveDadId,
      } };
    });
  }, [dogWolfPlayerIds, effectiveRoleAssignments, nightNumber, permanentlyDead, playerEffects, playerStatuses]);

  const rolesConfirmed = rolesAssigned && room?.status === "playing";

  // Get available status effects for a player based on active roles
  const getAvailableEffects = useCallback((playerId: string): StatusEffect[] => {
    const effects: StatusEffect[] = [];
    const assignedRoles = new Set(Object.values(effectiveRoleAssignments));
    const playerRole = effectiveRoleAssignments[playerId];
    const playerEffectsSet = playerEffects[playerId] || new Set();

    if (assignedRoles.has("v09")) effects.push("soldado");
    if (assignedRoles.has("v11")) effects.push("vote_against", "vote_double");
    if (assignedRoles.has("v15")) {
      effects.push("inocentado");
      if (playerEffectsSet.has("inocentado")) effects.push("incendiado");
    }
    if (assignedRoles.has("v16")) effects.push("hospede");
    if (assignedRoles.has("v17")) effects.push("immunity_full");
    if (assignedRoles.has("v19")) effects.push("profecia");
    if (assignedRoles.has("v22") && !playerEffectsSet.has("acusado")) effects.push("acusado_next");
    if (assignedRoles.has("a05") && playerStatuses[playerId] === "dead-this-night" && playerRole !== "a05") effects.push("dug_up");
    // Vampiro: only available to red X victims of werewolves
    if (assignedRoles.has("m03") && !vampireWolfUsed) {
      const status = playerStatuses[playerId];
      if (status === "dead-this-night") {
        const source = killSources[playerId];
        if (source === "e01" || (source && WEREWOLF_ROLES.includes(source as RoleId)) || (source === "a04" && !!actorCopiedRole && WEREWOLF_ROLES.includes(actorCopiedRole))) {
          effects.push("werewolf_turned");
        }
      }
    }
    if (assignedRoles.has("m05")) {
      effects.push("enemy");
      // Imunidade Única only for Inimigo players
      if (playerEffectsSet.has("enemy")) effects.push("immunity_onetime");
    }
    if (assignedRoles.has("s01")) {
      effects.push("namorado");
      // Imunidade de Cúpido only for Namorado players
      if (playerEffectsSet.has("namorado")) effects.push("immunity_cupid");
    }
    if (assignedRoles.has("f01") || assignedRoles.has("l03") || assignedRoles.has("f02")) {
      if (playerRole === "f01" || playerRole === "l03" || playerRole === "f02") effects.push("evil_being");
    }
    if (assignedRoles.has("f01")) effects.push("vote_revoked");
    if (assignedRoles.has("l02")) {
      if (playerRole !== "l02") effects.push("adoptive_dad");
    }
    // v23 Domador da Aranha — webbed/caught effects are usable manually too
    if (assignedRoles.has("v23")) {
      effects.push("webbed", "caught");
    }
    // f02 Espião — spied_on effect is manually assignable
    if (assignedRoles.has("f02")) {
      effects.push("spied_on");
    }
    if (actorPlayerId && playerId !== actorPlayerId && !permanentlyDead.has(playerId) && actorIdolUses < 2 && !actorCopiedRole) {
      effects.push("idol");
    }
    const selectableDogPlayerId = activeDogWolfPlayerIds.find((dogPlayerId) => dogPlayerId !== playerId);
    if (selectableDogPlayerId && !permanentlyDead.has(playerId) && playerStatuses[playerId] !== "dead-this-night") {
      effects.push("owner");
    }

    return effects;
  }, [activeDogWolfPlayerIds, actorCopiedRole, actorIdolUses, actorPlayerId, effectiveRoleAssignments, killSources, vampireWolfUsed, permanentlyDead, playerEffects, playerStatuses]);

  const toggleEffect = useCallback((playerId: string, effect: StatusEffect, sourcePlayerId?: string | null) => {
    if (effect === "owner") {
      const dogPlayerId = activeDogWolfPlayerIds.find((candidateId) => (
        dogWolfStates[candidateId]?.ownerPlayerId === playerId
      )) ?? activeDogWolfPlayerIds.find((candidateId) => candidateId !== playerId);
      if (!dogPlayerId) return;
      setDogWolfOwner(
        dogPlayerId,
        dogWolfStates[dogPlayerId]?.ownerPlayerId === playerId ? null : playerId,
      );
      return;
    }
    setPlayerEffects((prev) => {
      const newEffects = { ...prev };
      const current = new Set(prev[playerId] || []);

      if (current.has(effect)) {
        current.delete(effect);
        newEffects[playerId] = current;
        if (effect === "idol" && actorCopiedRole && actorPlayerId) {
          setActorCopiedRole(null);
          setActorCopyNoticeNight(null);
          setActorPowerState({ ...EMPTY_ACTOR_POWER_STATE });
          setPlayers((playersState) => playersState.map((player) => player.id === actorPlayerId ? { ...player, character: "a04" } : player));
          void supabase.from("players").update({ character: "a04" }).eq("id", actorPlayerId).then(() => {
            if (!roomId) return;
            supabase.channel(`player-sync-${roomId}`).send({ type: "broadcast", event: "sync", payload: { playerIds: [actorPlayerId] } });
          });
        }
        return newEffects;
      }

      // Singleton effects: remove from other players first
      const singletonEffects: StatusEffect[] = ["soldado", "hospede", "vote_revoked", "adoptive_dad", "profecia", "dug_up", "idol"];
      if (singletonEffects.includes(effect)) {
        for (const [pid, effs] of Object.entries(newEffects)) {
          if (pid !== playerId && effs.has(effect)) {
            const cleaned = new Set(effs);
            cleaned.delete(effect);
            newEffects[pid] = cleaned;
          }
        }
      }

      // Namorado max 2
      if (effect === "namorado") {
        const existing = Object.entries(newEffects).filter(([pid, e]) => pid !== playerId && e.has("namorado"));
        if (existing.length >= 2) {
          toast.warning(getToast("warn2Lovers", (room?.language as Language) || "pt"));
          return prev;
        }
      }

      // Inimigo max 2
      if (effect === "enemy") {
        const existing = Object.entries(newEffects).filter(([pid, e]) => pid !== playerId && e.has("enemy"));
        if (existing.length >= 2) {
          toast.warning(getToast("warn2Enemies", (room?.language as Language) || "pt"));
          return prev;
        }
      }

      // Cupid checkbox sync: when immunity_cupid is given to one namorado, apply to both
      if (effect === "immunity_cupid") {
        // Check if cupid is poisoned
        const cupidId = Object.entries(effectiveRoleAssignments).find(([, r]) => r === "s01")?.[0];
        if (cupidId && isPlayerPoisoned(cupidId)) {
          toast.warning(getToast("warnCupidPoisoned", (room?.language as Language) || "pt"));
          return prev;
        }
        // Apply to both namorados
        for (const [pid, effs] of Object.entries(newEffects)) {
          if (effs.has("namorado")) {
            const updated = new Set(effs);
            updated.add("immunity_cupid");
            newEffects[pid] = updated;
            if (sourcePlayerId) pendingGameActionLogSourcesRef.current.set(`effect:${pid}:immunity_cupid`, sourcePlayerId);
          }
        }
        // Also tick a cupid charge
        setCupidCharges((c) => Math.min(c + 1, 2));
        return newEffects;
      }

      // Vampiro: tick checkbox on apply
      if (effect === "werewolf_turned") {
        setVampireWolfUsed(true);
      }

      if (effect === "idol") {
        if (!actorPlayerId || playerId === actorPlayerId || permanentlyDead.has(playerId) || actorIdolUses >= 2 || actorCopiedRole) {
          return prev;
        }
        setActorIdolUses((uses) => getActorIdolUsesAfterSelection(actorIdolPlayerId, playerId, uses));
      }

      // Vote_revoked: check ladrão not poisoned
      if (effect === "vote_revoked") {
        const ladraoId = Object.entries(effectiveRoleAssignments).find(([, r]) => r === "f01")?.[0];
        if (ladraoId && isPlayerPoisoned(ladraoId)) {
          toast.warning(getToast("warnThiefPoisoned", (room?.language as Language) || "pt"));
          return prev;
        }
      }

      // Prophecy: check Prophet not poisoned
      if (effect === "profecia") {
        const profetaId = Object.entries(effectiveRoleAssignments).find(([, r]) => r === "v19")?.[0];
        if (profetaId && isPlayerPoisoned(profetaId)) {
          toast.warning(getToast("warnProphetPoisoned", (room?.language as Language) || "pt"));
          return prev;
        }
      }

      current.add(effect);
      newEffects[playerId] = current;
      if (sourcePlayerId) {
        pendingGameActionLogSourcesRef.current.set(`effect:${playerId}:${effect}`, sourcePlayerId);
      }
      if (["werewolf_turned", "immunity_full", "immunity_onetime", "immunity_cupid"].includes(effect)) {
        if (sourcePlayerId && (playerStatuses[playerId] === "dead" || playerStatuses[playerId] === "dead-this-night" || permanentlyDead.has(playerId))) {
          pendingGameActionLogSourcesRef.current.set(`resurrect:${playerId}`, sourcePlayerId);
        }
        setPlayerStatuses((statusPrev) => ({ ...statusPrev, [playerId]: "alive" }));
      }
      return newEffects;
    });
  }, [activeDogWolfPlayerIds, actorCopiedRole, actorIdolPlayerId, actorIdolUses, actorPlayerId, dogWolfStates, effectiveRoleAssignments, isPlayerPoisoned, permanentlyDead, playerStatuses, room?.language, roomId, setDogWolfOwner]);

  const handleIndependentPowerStateChange = useCallback((playerId: string, next: ActorPowerState) => {
    const current = dogWolfStates[playerId]?.powerState
      ?? (playerId === mimePlayerId ? mimePowerState : null)
      ?? (playerId === actorPlayerId ? actorPowerState : null);
    if (!current) return;
    if (next.bigBadWolfCharges > current.bigBadWolfCharges && !playerEffects[playerId]?.has("immunity_full")) {
      toggleEffect(playerId, "immunity_full", playerId);
      if (playerId === mimePlayerId) setMimeFullImmunityPlayerId(playerId);
    }
    if (next.cupidCharges !== current.cupidCharges) {
      if (isPlayerActingPoisoned(playerId)) {
        toast.warning(getToast("warnCupidPoisoned", (room?.language as Language) || "pt"));
        return;
      }
      setPlayerEffects((previous) => Object.fromEntries(Object.entries(previous).map(([targetPlayerId, effects]) => {
        if (!effects.has("namorado")) return [targetPlayerId, effects];
        const updated = new Set(effects);
        if (next.cupidCharges > 0) updated.add("immunity_cupid");
        else updated.delete("immunity_cupid");
        return [targetPlayerId, updated];
      })));
    }
    if (next.vampireWolfUsed && !current.vampireWolfUsed) {
      const victimId = Object.entries(playerStatuses).find(([targetPlayerId, status]) => {
        const source = killSources[targetPlayerId];
        return status === "dead-this-night" && !!source && isWerewolfAttackSource(source, killSourcePlayerIds[targetPlayerId]);
      })?.[0];
      if (victimId) {
        toggleEffect(victimId, "werewolf_turned", playerId);
        setVampireVictimKeepsPower(true);
      }
    }
    if (dogWolfStates[playerId]) {
      setDogWolfStates((previous) => ({
        ...previous,
        [playerId]: { ...previous[playerId], powerState: next },
      }));
    } else if (playerId === mimePlayerId) {
      setMimePowerState(next);
    } else if (playerId === actorPlayerId) {
      setActorPowerState(next);
    }
  }, [actorPlayerId, actorPowerState, dogWolfStates, isPlayerActingPoisoned, isWerewolfAttackSource, killSourcePlayerIds, killSources, mimePlayerId, mimePowerState, playerEffects, playerStatuses, room?.language, toggleEffect]);

  useEffect(() => {
    if (typeof window === "undefined" || !roomId) return;
    window.localStorage.setItem(`${GM_ADVANCED_STORAGE_PREFIX}${roomId}`, advancedEnabled ? "1" : "0");
  }, [advancedEnabled, roomId]);

  useEffect(() => {
    const interval = window.setInterval(() => setNowMs(Date.now()), 15000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const hasAdvancedRole = Object.values(roleAssignments).some((role) => ROLES[role]?.category === "a");
    if (hasAdvancedRole) setAdvancedEnabled(true);
  }, [roleAssignments]);

  useEffect(() => {
    if (typeof window === "undefined" || !roomId || gmSnapshotLoaded) return;
    pruneOldGMSnapshots();
    const raw = window.localStorage.getItem(getGMSnapshotStorageKey(roomId));
    if (!raw) {
      setGmSnapshotLoaded(true);
      return;
    }

    try {
      const snapshot = JSON.parse(raw) as Partial<GMSnapshot>;
      if (snapshot.version !== GM_SNAPSHOT_VERSION) {
        window.localStorage.removeItem(getGMSnapshotStorageKey(roomId));
        setGmSnapshotLoaded(true);
        return;
      }
      const legacySnapshot = snapshot as LegacyGMSnapshotFields;

      setRoleAssignments(snapshot.roleAssignments ?? {});
      setRolesAssigned(!!snapshot.rolesAssigned);
      setPendingChanges(!!snapshot.pendingChanges);
      setAdvancedEnabled(!!snapshot.advancedEnabled);
      setNightNumber(snapshot.nightNumber ?? 1);
      setPlayerStatuses(snapshot.playerStatuses ?? {});
      setPermanentlyDead(new Set(snapshot.permanentlyDead ?? []));
      setPoisonTargetsBySource(snapshot.poisonTargetsBySource
        ?? (snapshot.poisonedPlayerId ? { manual: snapshot.poisonedPlayerId } : {}));
      setIllusionTargetsBySource(snapshot.illusionTargetsBySource
        ?? (snapshot.illusionPlayerId ? { manual: snapshot.illusionPlayerId } : {}));
      setShamanCharges(snapshot.shamanCharges ?? legacySnapshot.chamanCharges ?? 0);
      setLastNightDeadPlayerIds(snapshot.lastNightDeadPlayerIds ?? []);
      setFoxDisabled(!!snapshot.foxDisabled);
      setNightTargetedPlayerIds(new Set(snapshot.nightTargetedPlayerIds ?? []));
      setRustedKnightLinkedDeath(snapshot.rustedKnightLinkedDeath ?? legacySnapshot.cavalerioLinkedDeath ?? null);
      setTetanusSourcePlayerIds(snapshot.tetanusSourcePlayerIds ?? {});
      setGameCyclePhase(snapshot.gameCyclePhase ?? "night");
      setDayPhase(snapshot.dayPhase ?? "day");
      setKillSources(snapshot.killSources ?? {});
      setKillSourcePlayerIds(snapshot.killSourcePlayerIds ?? {});
      setFortuneTellerFakeMap(snapshot.fortuneTellerFakeMap ?? legacySnapshot.videnteFakeMap ?? null);
      setWitchDeathNight(snapshot.witchDeathNight ?? legacySnapshot.bruxaDeathNight ?? null);
      setPlayerEffects(restoreEffects(snapshot.playerEffects));
      setParanoidCharges(snapshot.paranoidCharges ?? legacySnapshot.paranoicoCharges ?? 0);
      setAngelCharges(snapshot.angelCharges ?? legacySnapshot.anjoCharges ?? 0);
      setBigBadWolfCharges(snapshot.bigBadWolfCharges ?? legacySnapshot.lobisomemMauCharges ?? 0);
      setCupidCharges(snapshot.cupidCharges ?? legacySnapshot.cupidoCharges ?? 0);
      setWerewolfSeerUsed(!!(snapshot.werewolfSeerUsed ?? legacySnapshot.lobisomemVidenteUsed));
      setVampireWolfUsed(!!(snapshot.vampireWolfUsed ?? legacySnapshot.lobisomemVampiroUsed));
      setDayKilledPlayerIds(snapshot.dayKilledPlayerIds ?? []);
      setParanoidKillName(snapshot.paranoidKillName ?? legacySnapshot.paranoicoKillName ?? null);
      setProphecyDeadAtNight(snapshot.prophecyDeadAtNight ?? legacySnapshot.profeciaDeadAtNight ?? {});
      setJudgeCharges(snapshot.judgeCharges ?? legacySnapshot.juizCharges ?? 0);
      setAccuserCharges(snapshot.accuserCharges ?? legacySnapshot.acusadorCharges ?? 0);
      setSaviourLastTarget(snapshot.saviourLastTarget ?? legacySnapshot.salvadorLastTarget ?? null);
      setVillageElderLastTarget(snapshot.villageElderLastTarget ?? legacySnapshot.chefeLastTarget ?? null);
      setVampireVictimKeepsPower(snapshot.vampireVictimKeepsPower ?? true);
      setSpiderDayChangeUsed(!!snapshot.spiderDayChangeUsed);
      setAstronomerBlocksWerewolvesTonight(!!snapshot.astronomerBlocksWerewolvesTonight);
      setHideScreenMode(!!snapshot.hideScreenMode);
      setSyncedTimerState(snapshot.syncedTimerState ?? null);
      setCompletedScriptLineKeys(new Set(snapshot.completedScriptLineKeys ?? []));
      setGameLogEvents(snapshot.gameLogEvents ?? []);
      setDeclinedAutomaticVictory(snapshot.declinedAutomaticVictory ?? null);
      setActorIdolUses(snapshot.actorIdolUses ?? 0);
      setActorCopiedRole(snapshot.actorCopiedRole ?? null);
      setActorCopyNoticeNight(snapshot.actorCopyNoticeNight ?? null);
      setActorPowerState(restoreActorPowerState(snapshot.actorPowerState as LegacyActorPowerState | undefined));
      setDrunkardReplacementRole(snapshot.drunkardReplacementRole ?? null);
      setMimeCopiedRole(snapshot.mimeCopiedRole ?? null);
      setMimeReplacementRole(snapshot.mimeReplacementRole ?? null);
      setMimeOwnerRole(snapshot.mimeOwnerRole ?? null);
      setMimeCopyNoticeNight(snapshot.mimeCopyNoticeNight ?? null);
      setMimePowerState(restoreActorPowerState(snapshot.mimePowerState as LegacyActorPowerState | undefined));
      setMimeAngelSavedPlayerId(snapshot.mimeAngelSavedPlayerId ?? null);
      setMimeFullImmunityPlayerId(snapshot.mimeFullImmunityPlayerId ?? null);
      setDogWolfStates(restoreDogWolfStates(snapshot.dogWolfStates));
      setSourcedEffectTargets(snapshot.sourcedEffectTargets ?? {});
      setSpiderCaughtBySource(snapshot.spiderCaughtBySource ?? {});
    } catch {
      window.localStorage.removeItem(getGMSnapshotStorageKey(roomId));
    } finally {
      setGmSnapshotLoaded(true);
    }
  }, [gmSnapshotLoaded, roomId]);

  useEffect(() => {
    if (typeof window === "undefined" || !roomId || !gmSnapshotLoaded) return;

    const snapshot: GMSnapshot = {
      version: GM_SNAPSHOT_VERSION,
      savedAt: Date.now(),
      roleAssignments,
      rolesAssigned,
      pendingChanges,
      advancedEnabled,
      nightNumber,
      playerStatuses,
      permanentlyDead: Array.from(permanentlyDead),
      poisonedPlayerId,
      poisonTargetsBySource,
      illusionPlayerIds: new Set(illusionPlayerIds),
      illusionTargetsBySource,
      shamanCharges,
      lastNightDeadPlayerIds,
      foxDisabled,
      nightTargetedPlayerIds: Array.from(nightTargetedPlayerIds),
      rustedKnightLinkedDeath,
      tetanusSourcePlayerIds,
      gameCyclePhase,
      dayPhase,
      killSources,
      killSourcePlayerIds,
      fortuneTellerFakeMap,
      witchDeathNight,
      playerEffects: serializeEffects(playerEffects),
      paranoidCharges,
      angelCharges,
      bigBadWolfCharges,
      cupidCharges,
      werewolfSeerUsed,
      vampireWolfUsed,
      dayKilledPlayerIds,
      paranoidKillName,
      prophecyDeadAtNight,
      judgeCharges,
      accuserCharges,
      saviourLastTarget,
      villageElderLastTarget,
      vampireVictimKeepsPower,
      spiderDayChangeUsed,
      astronomerBlocksWerewolvesTonight,
      hideScreenMode,
      syncedTimerState,
      completedScriptLineKeys: Array.from(completedScriptLineKeys),
      gameLogEvents,
      declinedAutomaticVictory,
      actorIdolUses,
      actorCopiedRole,
      actorCopyNoticeNight,
      actorPowerState,
      drunkardReplacementRole,
      mimeCopiedRole,
      mimeReplacementRole,
      mimeOwnerRole,
      mimeCopyNoticeNight,
      mimePowerState,
      mimeAngelSavedPlayerId,
      mimeFullImmunityPlayerId,
      dogWolfStates,
      sourcedEffectTargets,
      spiderCaughtBySource,
    };
    window.localStorage.setItem(getGMSnapshotStorageKey(roomId), JSON.stringify(snapshot));
  }, [
    roomId,
    gmSnapshotLoaded,
    roleAssignments,
    rolesAssigned,
    pendingChanges,
    advancedEnabled,
    nightNumber,
    playerStatuses,
    permanentlyDead,
    poisonedPlayerId,
    poisonedPlayerIds,
    poisonTargetsBySource,
    illusionPlayerId,
    illusionPlayerIds,
    illusionTargetsBySource,
    shamanCharges,
    lastNightDeadPlayerIds,
    foxDisabled,
    nightTargetedPlayerIds,
    rustedKnightLinkedDeath,
    tetanusSourcePlayerIds,
    gameCyclePhase,
    dayPhase,
    killSources,
    killSourcePlayerIds,
    fortuneTellerFakeMap,
    witchDeathNight,
    playerEffects,
    paranoidCharges,
    angelCharges,
    bigBadWolfCharges,
    cupidCharges,
    werewolfSeerUsed,
    vampireWolfUsed,
    dayKilledPlayerIds,
    paranoidKillName,
    prophecyDeadAtNight,
    judgeCharges,
    accuserCharges,
    saviourLastTarget,
    villageElderLastTarget,
    vampireVictimKeepsPower,
    spiderDayChangeUsed,
    astronomerBlocksWerewolvesTonight,
    hideScreenMode,
    syncedTimerState,
    completedScriptLineKeys,
    gameLogEvents,
    declinedAutomaticVictory,
    actorIdolUses,
    actorCopiedRole,
    actorCopyNoticeNight,
    actorPowerState,
    drunkardReplacementRole,
    mimeCopiedRole,
    mimeReplacementRole,
    mimeOwnerRole,
    mimeCopyNoticeNight,
    mimePowerState,
    mimeAngelSavedPlayerId,
    mimeFullImmunityPlayerId,
    dogWolfStates,
    sourcedEffectTargets,
    spiderCaughtBySource,
  ]);

  useEffect(() => {
    if (typeof window === "undefined" || !roomId || !room || !gmSnapshotLoaded) return;
    const latestGameOverEvent = [...gameLogEvents]
      .reverse()
      .find((event) => event.action === "game_over" && !!event.winKind);
    const effectivePhase = gameCyclePhase === "day" ? dayPhase : gameCyclePhase;
    const displaySnapshot: RoomDisplaySnapshot = {
      version: ROOM_DISPLAY_SNAPSHOT_VERSION,
      updatedAt: Date.now(),
      roomId,
      roomCode: room.code,
      language: room.language ?? "pt",
      status: room.status,
      players: players.map(({ id, name, seat_position, character, is_alive }) => ({
        id,
        name,
        seat_position,
        character,
        is_alive,
      })),
      phase: effectivePhase,
      phaseNumber: nightNumber,
      timerState: syncedTimerState,
      roleAssignments,
      playerStatuses,
      permanentlyDead: Array.from(permanentlyDead),
      playerEffects: serializeEffects(playerEffects),
      poisonedPlayerId,
      poisonedPlayerIds: Array.from(poisonedPlayerIds),
      illusionPlayerId,
      illusionPlayerIds: Array.from(illusionPlayerIds),
      gameLogEvents,
      gameOver: latestGameOverEvent?.winKind
        ? { id: latestGameOverEvent.id, kind: latestGameOverEvent.winKind }
        : null,
    };
    try {
      window.localStorage.setItem(getRoomDisplayStorageKey(roomId), JSON.stringify(displaySnapshot));
    } catch {
      // The GM snapshot remains authoritative if browser storage is unavailable.
    }
  }, [
    roomId,
    room,
    gmSnapshotLoaded,
    players,
    gameCyclePhase,
    dayPhase,
    nightNumber,
    syncedTimerState,
    roleAssignments,
    playerStatuses,
    permanentlyDead,
    playerEffects,
    poisonedPlayerId,
    poisonedPlayerIds,
    illusionPlayerId,
    illusionPlayerIds,
    gameLogEvents,
  ]);

  // Auto-apply vote_double effect for Judge (dead non-execution) and Ankou (executed)
  useEffect(() => {
    setPlayerEffects((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const [pid, role] of Object.entries(abilityRoleAssignments)) {
        const isJudgeDouble = role === "v13" && permanentlyDead.has(pid) && killSources[pid] !== "executado";
        const isAnkouDouble = role === "m04" && permanentlyDead.has(pid) && killSources[pid] === "executado";
        if (isJudgeDouble || isAnkouDouble) {
          const cur = next[pid] || new Set<StatusEffect>();
          if (!cur.has("vote_double")) {
            const updated = new Set(cur);
            updated.add("vote_double");
            next[pid] = updated;
            changed = true;
          }
        }
      }
      return changed ? next : prev;
    });
    }, [abilityRoleAssignments, permanentlyDead, killSources]);

  // Auto-kill werewolves (or werewolf_turned players) marked Incendiado (instant red X, source = piromaníaco).
  // Balance: if the wolf is immune, the fire is shrugged off entirely — remove the incendiado effect.
  useEffect(() => {
    for (const [pid, effs] of Object.entries(playerEffects)) {
      const isWolf = WEREWOLF_ROLES.includes(objectiveRoleAssignments[pid]) || effs.has("werewolf_turned");
      if (!effs.has("incendiado") || !isWolf) continue;
      if (permanentlyDead.has(pid)) continue;
      if (playerStatuses[pid] === "dead-this-night" || playerStatuses[pid] === "dead") continue;
      // Immunities → survive AND lose the incendiado tag
      if (effs.has("immunity_full") || effs.has("immunity_cupid") || effs.has("immunity_onetime") || effs.has("immunity_werewolf")) {
        setPlayerEffects((prev) => {
          const cur = prev[pid];
          if (!cur || !cur.has("incendiado")) return prev;
          const cleaned = new Set(cur);
          cleaned.delete("incendiado");
          return { ...prev, [pid]: cleaned };
        });
        continue;
      }
      setPlayerStatuses((prev) => ({ ...prev, [pid]: "dead-this-night" }));
      setKillSources((prev) => ({ ...prev, [pid]: "v15" }));
      setNightTargetedPlayerIds((prev) => { const n = new Set(prev); n.add(pid); return n; });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objectiveRoleAssignments, playerEffects]);
  // Broadcast current game phase to player devices (so they can show Noite/Dia/Tribunal X)
  useEffect(() => {
    if (!roomId || !room || !gmSnapshotLoaded) return;
    // When in the day cycle, the effective phase shown to players is dayPhase (day or tribunal).
    const effectivePhase = gameCyclePhase === "day" ? dayPhase : gameCyclePhase;
    const phaseState = { phase: effectivePhase, number: nightNumber };
    const ch = supabase.channel(`room-phase-${roomId}`);
    ch.send({
      type: "broadcast",
      event: "phase",
      payload: phaseState,
    });
    void supabase.from("rooms").update({ phase_state: phaseState }).eq("id", roomId);
  }, [roomId, room, gmSnapshotLoaded, gameCyclePhase, dayPhase, nightNumber]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const value = joinBaseOverride.trim();
    if (value) {
      window.localStorage.setItem(JOIN_BASE_URL_STORAGE_KEY, value);
    } else {
      window.localStorage.removeItem(JOIN_BASE_URL_STORAGE_KEY);
    }
  }, [joinBaseOverride]);

  const handleTimerSync = useCallback((state: TimerSyncState) => {
    setSyncedTimerState((current) => {
      if (current
        && current.phase === state.phase
        && current.timeLeft === state.timeLeft
        && current.isRunning === state.isRunning
        && current.timerDone === state.timerDone) return current;
      return state;
    });
    if (!roomId) return;
    void supabase.channel(`room-timer-${roomId}`).send({
      type: "broadcast", event: "timer", payload: state,
    });
    void supabase.from("rooms").update({ timer_state: state }).eq("id", roomId);
  }, [roomId]);

  const handleTimerDefaultsChange = useCallback((defaults: TimerDefaults) => {
    const next = normalizeTimerDefaults(defaults);
    setTimerDefaults(next);
    setRoom((current) => current ? { ...current, timer_defaults: next } : current);
    if (!roomId) return;
    void supabase.from("rooms").update({ timer_defaults: next }).eq("id", roomId);
  }, [roomId]);

  // Fetch room
  useEffect(() => {
    if (!roomId) return;
    const fetchRoom = async () => {
      const { data } = await supabase
        .from("rooms")
        .select("id, code, status, language, phase_state, timer_state, timer_defaults")
        .eq("id", roomId)
        .single();
      if (data) {
        const fetchedRoom = data as unknown as Room;
        setRoom(fetchedRoom);
        setTimerDefaults(normalizeTimerDefaults(fetchedRoom.timer_defaults));
        if (fetchedRoom.timer_state) setSyncedTimerState(fetchedRoom.timer_state);
        if (fetchedRoom.phase_state) {
          setNightNumber(fetchedRoom.phase_state.number);
          if (fetchedRoom.phase_state.phase === "night") {
            setGameCyclePhase("night");
          } else {
            setGameCyclePhase("day");
            setDayPhase(fetchedRoom.phase_state.phase);
          }
        }
      }
    };
    fetchRoom();
  }, [roomId]);

  // Fetch & subscribe to players
  useEffect(() => {
    if (!roomId) return;

    const fetchPlayers = async () => {
      const { data } = await supabase
        .from("players")
        .select("id, name, seat_position, character, is_alive, is_ready, last_seen_at")
        .eq("room_id", roomId)
        .order("created_at");
      if (data) {
        setPlayers(data);
        if (room?.status === "playing" || data.some((p) => p.character)) {
          const assignments: Record<string, RoleId> = {};
          let fetchedActorCopy: RoleId | null = null;
          let fetchedDrunkardReplacement: RoleId | null = null;
          const fetchedDogOwners: Record<string, string> = {};
          let actorFound = false;
          data.forEach((p) => {
            const parsed = parsePlayerCharacter(p.character);
            const metadata = parsePlayerCharacterMetadata(p.character);
            if (parsed.baseRole) assignments[p.id] = parsed.baseRole;
            if (parsed.baseRole === "a04") {
              actorFound = true;
              fetchedActorCopy = parsed.actorCopiedRole;
            }
            if (parsed.drunkardReplacementRole) fetchedDrunkardReplacement = parsed.drunkardReplacementRole;
            if ((parsed.baseRole === "a02" || parsed.actorCopiedRole === "a02") && metadata.ownerPlayerId) {
              fetchedDogOwners[p.id] = metadata.ownerPlayerId;
            }
          });
          if (actorFound) setActorCopiedRole(fetchedActorCopy);
          if (fetchedDrunkardReplacement) setDrunkardReplacementRole(fetchedDrunkardReplacement);
          if (Object.keys(fetchedDogOwners).length > 0) {
            setDogWolfStates((previous) => {
              const next = { ...previous };
              for (const [dogPlayerId, ownerPlayerId] of Object.entries(fetchedDogOwners)) {
                const existing = previous[dogPlayerId];
                next[dogPlayerId] = {
                  ...createDogWolfState(ownerPlayerId),
                  ...existing,
                  ownerPlayerId,
                  powerState: { ...EMPTY_ACTOR_POWER_STATE, ...existing?.powerState },
                };
              }
              return next;
            });
          }
          if (Object.keys(assignments).length > 0) {
            setRoleAssignments(assignments);
            setRolesAssigned(true);
          }
        }
      }
    };
    fetchPlayers();

    const channel = supabase
      .channel(`room-${roomId}-players`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players", filter: `room_id=eq.${roomId}` },
        () => fetchPlayers()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId, room?.status]);

  const copyCode = useCallback(() => {
    if (room) {
      navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [room]);

  const copyJoinUrl = useCallback(() => {
    if (!joinUrl) return;
    navigator.clipboard.writeText(joinUrl);
    setCopiedJoinLink(true);
    toast.success(getToast("okJoinLinkCopied", (room?.language as Language) || "pt"));
    setTimeout(() => setCopiedJoinLink(false), 2000);
  }, [joinUrl, room?.language]);

  const clearGMSnapshot = useCallback(() => {
    if (typeof window === "undefined" || !roomId) return;
    window.localStorage.removeItem(getGMSnapshotStorageKey(roomId));
    window.localStorage.removeItem(getRoomDisplayStorageKey(roomId));
  }, [roomId]);

  const clearLocalGameState = useCallback(() => {
    setRoleAssignments({});
    setRolesAssigned(false);
    setPendingChanges(false);
    setNightNumber(1);
    setPlayerStatuses({});
    setPermanentlyDead(new Set());
    setPoisonTargetsBySource({});
    setIllusionTargetsBySource({});
    setListPopoverId(null);
    setShamanCharges(0);
    setLastNightDeadPlayerIds([]);
    setFortuneTellerModalOpen(false);
    setFortuneTellerModalPoisoned(false);
    setFoxDisabled(false);
    setNightTargetedPlayerIds(new Set());
    setRustedKnightLinkedDeath(null);
    setTetanusSourcePlayerIds({});
    setGameCyclePhase("night");
    setDayPhase("day");
    setKillSources({});
    setKillSourcePlayerIds({});
    setFortuneTellerFakeMap(null);
    setWitchDeathNight(null);
    setPlayerEffects({});
    setParanoidCharges(0);
    setAngelCharges(0);
    setBigBadWolfCharges(0);
    setCupidCharges(0);
    setWerewolfSeerUsed(false);
    setVampireWolfUsed(false);
    setDayKilledPlayerIds([]);
    setParanoidKillName(null);
    setLittleGirlRevealOpen(false);
    setLittleGirlRevealCards([]);
    setLamplighterRevealOpen(false);
    setWerewolfSeerRevealOpen(false);
    setWerewolfSeerRevealedVictim(null);
    setLamplighterPickedRole(null);
    setLamplighterPickedCharges([]);
    setProphecyDeadAtNight({});
    setJudgeCharges(0);
    setAccuserCharges(0);
    setSaviourLastTarget(null);
    setVillageElderLastTarget(null);
    setVampireVictimKeepsPower(true);
    setSpiderDayChangeUsed(false);
    setAstronomerBlocksWerewolvesTonight(false);
    setHideScreenMode(false);
    setSyncedTimerState(null);
    setSpiderRevealOpen(false);
    setSpiderRevealCards([]);
    setSpyRevealOpen(false);
    setSpyRevealCards([]);
    setCompletedScriptLineKeys(new Set());
    setScriptAutoComplete({ role: null, sourcePlayerIds: [], version: 0 });
    setGameLogOpen(false);
    setGameLogEvents([]);
    suppressedEffectLogAddsRef.current.clear();
    pendingGameActionLogSourcesRef.current.clear();
    pendingActorCopyLogRef.current = null;
    pendingDrunkardSetupLogRef.current = null;
    pendingDogOwnerLogRef.current = [];
    pendingDogRoleChangeLogRef.current = [];
    pendingActorDogFallbackLogRef.current = null;
    pendingRoleChangeSourcesRef.current.clear();
    previousGameLogStateRef.current = null;
    gameLogDiffReadyRef.current = false;
    setAutomaticWinKind(null);
    setDeclinedAutomaticVictory(null);
    setTieWinnerGroups(new Set());
    setActorIdolUses(0);
    setActorCopiedRole(null);
    setActorCopyNoticeNight(null);
    setActorPowerState({ ...EMPTY_ACTOR_POWER_STATE });
    setDrunkardReplacementRole(null);
    setMimeCopiedRole(null);
    setMimeReplacementRole(null);
    setMimeOwnerRole(null);
    setMimeCopyNoticeNight(null);
    setMimePowerState({ ...EMPTY_ACTOR_POWER_STATE });
    setMimeAngelSavedPlayerId(null);
    setMimeFullImmunityPlayerId(null);
    setMimeRevealOpen(false);
    setMimeRevealCards([]);
    setDogWolfStates({});
    setSourcedEffectTargets({});
    setSpiderCaughtBySource({});
  }, []);

  const resetRoom = async () => {
    if (!roomId) return;
    const lang = (room?.language as Language) || "pt";
    if (!window.confirm(t("resetRoomConfirm", lang))) return;

    const playerUpdates = players.map((player) =>
      supabase
        .from("players")
        .update({ character: null, is_alive: true, is_ready: false, last_seen_at: new Date().toISOString() })
        .eq("id", player.id)
    );
    const roomUpdate = supabase.from("rooms").update({
      status: "lobby",
      phase_state: null,
      timer_state: null,
      game_over_state: null,
    }).eq("id", roomId);
    const results = await Promise.all([...playerUpdates, roomUpdate]);

    if (results.some((result) => result.error)) {
      toast.error(getToast("errRoomAction", lang));
      return;
    }

    clearLocalGameState();
    clearGMSnapshot();
    setRoom((prev) => (prev ? { ...prev, status: "lobby" } : prev));
    setPlayers((prev) => prev.map((player) => ({ ...player, character: null, is_alive: true, is_ready: false })));
    toast.success(getToast("okRoomReset", lang));
  };

  const endRoom = async () => {
    if (!roomId) return;
    const lang = (room?.language as Language) || "pt";
    if (!window.confirm(t("endRoomConfirm", lang))) return;

    const [roomResult, playersResult] = await Promise.all([
      supabase.from("rooms").update({ status: "finished" }).eq("id", roomId),
      supabase.from("players").delete().eq("room_id", roomId),
    ]);

    if (roomResult.error || playersResult.error) {
      toast.error(getToast("errRoomAction", lang));
      return;
    }

    clearLocalGameState();
    clearGMSnapshot();
    setRoom((prev) => (prev ? { ...prev, status: "finished" } : prev));
    setPlayers([]);
    toast.success(getToast("okRoomEnded", lang));
  };

  const cleanupOldRooms = async () => {
    const lang = (room?.language as Language) || "pt";
    const { data, error } = await supabase.rpc("cleanup_old_rooms", { retention: "24 hours" });
    if (error) {
      toast.error(getToast("errRoomAction", lang));
      return;
    }
    toast.success(format(getToast("okCleanupOldRooms", lang), { n: String(data ?? 0) }));
  };

  const getGameOverOutcome = useCallback((kind: WinKind, playerId: string): "victory" | "defeat" => {
    const allVictoryPlayers = players.flatMap<VictoryPlayer>((player) => {
      const role = objectiveRoleAssignments[player.id];
      if (!role) return [];
      const effects = new Set<StatusEffect>(playerEffects[player.id] || []);
      const dogState = dogWolfStates[player.id];
      const ownerPlayerId = dogState?.ownerPlayerId;
      if (ownerPlayerId && !dogState.objectiveRoleOverride) {
        for (const effect of playerEffects[ownerPlayerId] || []) effects.add(effect);
      }
      return [{
        id: player.id,
        role,
        alive: !permanentlyDead.has(player.id),
        effects,
      }];
    });
    const victoryPlayer = allVictoryPlayers.find((player) => player.id === playerId);
    if (!victoryPlayer) return "defeat";
    const winnerGroups: AutomaticWinKind[] = kind === "tie" ? Array.from(tieWinnerGroups) : [kind];
    return playerWinsAnyVictoryGroup(victoryPlayer, winnerGroups, allVictoryPlayers)
      ? "victory"
      : "defeat";
  }, [dogWolfStates, objectiveRoleAssignments, permanentlyDead, playerEffects, players, tieWinnerGroups]);

  const sendGameOver = async (kind: WinKind) => {
    if (!roomId) return;
    pendingGameOverLogKindRef.current = kind;
    const perPlayer = Object.fromEntries(players.map((player) => [player.id, getGameOverOutcome(kind, player.id)]));
    const gameOverState = {
      kind,
      perPlayer,
      ...(kind === "tie" ? { tieWinnerGroups: Array.from(tieWinnerGroups) } : {}),
    };
    await supabase.channel(`game-over-${roomId}`).send({
      type: "broadcast",
      event: "game-over",
      payload: gameOverState,
    });
    await supabase.from("rooms").update({ status: "finished", game_over_state: gameOverState }).eq("id", roomId);
    setRoom((prev) => (prev ? { ...prev, status: "finished" } : prev));
    setManualWinKind(null);
    setAutomaticWinKind(null);
    setTieWinnerGroups(new Set());
  };

  const updateSeatPosition = async (playerId: string, position: number | null) => {
    await supabase.from("players").update({ seat_position: position }).eq("id", playerId);
  };

  const addManualPlayer = async (name: string) => {
    if (!roomId) return;
    const { error } = await supabase.from("players").insert({ name, room_id: roomId });
    if (error) toast.error(getToast("errAddPlayer", (room?.language as Language) || "pt"));
  };

  const removePlayer = async (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (player?.seat_position !== null) {
      await supabase.from("players").update({ seat_position: null }).eq("id", playerId);
    }
    const { error } = await supabase.from("players").delete().eq("id", playerId);
    if (error) {
      toast.error(getToast("errRemovePlayer", (room?.language as Language) || "pt"));
    } else {
      // Update local state immediately
      setPlayers((prev) => prev.filter(p => p.id !== playerId));
      toast.success(getToast("okPlayerRemoved", (room?.language as Language) || "pt"));
    }
  };

  const addTestPlayers = async () => {
    if (!roomId) return;
    const names = ["Teste1", "Teste2", "Teste3", "Teste4", "Teste5", "Teste6", "Teste7", "Teste8"];
    const existing = players.map((p) => p.name.toLowerCase());
    const toAdd = names.filter((n) => !existing.includes(n.toLowerCase()));

    // Find available seat positions starting from current count
    const usedSeats = new Set(players.filter(p => p.seat_position !== null).map(p => p.seat_position!));
    let seatIdx = 0;
    for (const name of toAdd) {
      while (usedSeats.has(seatIdx)) seatIdx++;
      await supabase.from("players").insert({
        name,
        room_id: roomId,
        seat_position: seatIdx,
      });
      usedSeats.add(seatIdx);
      seatIdx++;
    }
    toast.success(`${toAdd.length} ${t("devTestPlayersAdded", (room?.language as Language) || "pt")}`);
  };

  const existingPlayerNames = useMemo(() => players.map((p) => p.name), [players]);

  const seatedPlayersCount = useMemo(() => players.filter(p => p.seat_position !== null).length, [players]);

  const isPlayerConnected = useCallback((player: Player) => {
    if (!player.last_seen_at) return false;
    const lastSeen = Date.parse(player.last_seen_at);
    return Number.isFinite(lastSeen) && nowMs - lastSeen < 45000;
  }, [nowMs]);

  const confirmRoom = () => {
    const unseated = players.filter((p) => p.seat_position === null);
    if (unseated.length > 0) {
      toast.error(getToast("errAllSeated", (room?.language as Language) || "pt"));
      return;
    }
    if (players.length < 8) {
      toast.error(getToast("errMinPlayers", (room?.language as Language) || "pt"));
      return;
    }

    const seatedPlayers = [...players].sort((a, b) => (a.seat_position ?? 0) - (b.seat_position ?? 0));
    const roles = assignRoles(seatedPlayers.length, advancedEnabled);
    const assignments: Record<string, RoleId> = {};
    seatedPlayers.forEach((p, i) => {
      assignments[p.id] = roles[i];
    });
    setRoleAssignments(assignments);
    setRolesAssigned(true);
    toast.success(getToast("okRolesAssigned", (room?.language as Language) || "pt"));
  };

  const changeRole = (playerId: string, role: RoleId) => {
    if (role === "v08b") {
      const hasHunter = Object.values(roleAssignments).some((r) => r === "v08");
      if (!hasHunter) toast.warning(getToast("warnHunterMissing", (room?.language as Language) || "pt"));
    }
    if (role === "as01b") {
      const hasCupid = Object.values(roleAssignments).some((r) => r === "s01");
      if (!hasCupid) toast.warning(getToast("warnSecretLoverMissing", (room?.language as Language) || "pt"));
    }
    const oldRole = roleAssignments[playerId];
    if (oldRole === "v08" && role !== "v08") {
      const hasRedHood = Object.entries(roleAssignments).some(([pid, r]) => r === "v08b" && pid !== playerId);
      if (hasRedHood) toast.warning(getToast("warnLittleRedWithoutHunter", (room?.language as Language) || "pt"));
    }
    if (oldRole === "s01" && role !== "s01") {
      const hasSecretLover = Object.entries(roleAssignments).some(([pid, r]) => r === "as01b" && pid !== playerId);
      if (hasSecretLover) toast.warning(getToast("warnSecretLoverWithoutCupid", (room?.language as Language) || "pt"));
    }
    if (oldRole === "a04" && role !== "a04") {
      setActorIdolUses(0);
      setActorCopiedRole(null);
      setActorCopyNoticeNight(null);
      setActorPowerState({ ...EMPTY_ACTOR_POWER_STATE });
      setPlayerEffects((prev) => Object.fromEntries(
        Object.entries(prev).map(([id, effects]) => {
          const next = new Set(effects);
          next.delete("idol");
          return [id, next];
        }),
      ));
    }
    if (oldRole === "a01" && role !== "a01") setDrunkardReplacementRole(null);
    if (oldRole === "a03" && role !== "a03") {
      setMimeCopiedRole(null);
      setMimeReplacementRole(null);
      setMimeOwnerRole(null);
      setMimeCopyNoticeNight(null);
      setMimePowerState({ ...EMPTY_ACTOR_POWER_STATE });
      setMimeAngelSavedPlayerId(null);
      setMimeFullImmunityPlayerId(null);
      setMimeRevealOpen(false);
      setMimeRevealCards([]);
    }

    setRoleAssignments((prev) => ({ ...prev, [playerId]: role }));
    if (room?.status === "playing") setPendingChanges(true);
  };

  const broadcastPlayerSync = useCallback((playerIds?: string[]) => {
    if (!roomId) return;
    supabase.channel(`player-sync-${roomId}`).send({
      type: "broadcast",
      event: "sync",
      payload: { playerIds },
    });
  }, [roomId]);

  useEffect(() => {
    if (!rolesAssigned || room?.status !== "playing") return;
    const transformedPlayerIds = Object.entries(roleAssignments)
      .filter(([playerId, role]) => (
        !permanentlyDead.has(playerId)
        && shouldTransformEvilPoisonedSister(
          role,
          playerEffects[playerId] || [],
          isPlayerPoisoned(playerId),
        )
      ))
      .map(([playerId]) => playerId);
    if (transformedPlayerIds.length === 0) return;

    for (const playerId of transformedPlayerIds) {
      const poisonSourcePlayerId = Object.entries(poisonTargetsBySource)
        .find(([, targetPlayerId]) => targetPlayerId === playerId)?.[0];
      if (poisonSourcePlayerId && poisonSourcePlayerId !== "manual") {
        pendingRoleChangeSourcesRef.current.set(playerId, {
          sourcePlayerId: poisonSourcePlayerId,
          sourceRole: "e02",
        });
      }
    }
    setRoleAssignments((previous) => {
      const next = { ...previous };
      transformedPlayerIds.forEach((playerId) => { next[playerId] = "e01"; });
      return next;
    });
    setPlayerEffects((previous) => {
      const next = { ...previous };
      for (const playerId of transformedPlayerIds) {
        const effects = new Set(next[playerId] || []);
        effects.delete("evil_being");
        next[playerId] = effects;
      }
      return next;
    });
    setPlayers((previous) => previous.map((player) => (
      transformedPlayerIds.includes(player.id)
        ? { ...player, character: "e01" }
        : player
    )));
    void Promise.all(transformedPlayerIds.map((playerId) => (
      supabase.from("players").update({ character: "e01" }).eq("id", playerId)
    ))).then(() => broadcastPlayerSync(transformedPlayerIds));
  }, [
    broadcastPlayerSync,
    isPlayerPoisoned,
    permanentlyDead,
    playerEffects,
    poisonTargetsBySource,
    roleAssignments,
    rolesAssigned,
    room?.status,
  ]);

  const getObjectiveEffectsForPlayer = useCallback((playerId: string): ObjectiveEffectId[] => {
    const effects = new Set<ObjectiveEffectId>();
    const addRelevantEffects = (sourcePlayerId: string) => {
      for (const effect of playerEffects[sourcePlayerId] || []) {
        if (OBJECTIVE_EFFECT_IDS.includes(effect as ObjectiveEffectId)) effects.add(effect as ObjectiveEffectId);
      }
    };
    addRelevantEffects(playerId);
    const dogState = dogWolfStates[playerId];
    const ownerPlayerId = dogState?.ownerPlayerId;
    if (ownerPlayerId && !dogState.objectiveRoleOverride) addRelevantEffects(ownerPlayerId);
    return Array.from(effects);
  }, [dogWolfStates, playerEffects]);

  const getStoredCharacter = useCallback((playerId: string, role: RoleId) => {
    let identity: string;
    if (role === "a04" && playerId === actorPlayerId) {
      identity = encodeActorCharacter(actorCopiedRole, drunkardReplacementRole);
    } else if (role === "a01" && playerId === drunkardPlayerId && drunkardReplacementRole) {
      identity = encodeDrunkardCharacter(drunkardReplacementRole);
    } else {
      identity = role;
    }
    const ownerPlayerId = dogWolfStates[playerId]?.ownerPlayerId;
    const ownerRole = dogWolfOwnerRoles[playerId]
      ?? (ownerPlayerId ? effectiveRoleAssignments[ownerPlayerId] ?? null : null);
    const objectiveRole = objectiveRoleAssignments[playerId] ?? null;
    const isMimePlayer = playerId === mimePlayerId;
    const mimeCornerRole = mimeCopiedRole === "a01"
      ? mimeReplacementRole
      : mimeCopiedRole === "a02"
      ? mimeOwnerRole
      : null;
    return encodePlayerCharacterMetadata(identity, {
      ownerRole: isMimePlayer && mimeCornerRole ? mimeCornerRole : ownerRole,
      ownerPlayerId,
      objectiveRole: ownerPlayerId || (objectiveRole && SOLO_OBJECTIVE_ROLES.includes(objectiveRole))
        ? objectiveRole
        : null,
      objectiveEffects: getObjectiveEffectsForPlayer(playerId),
      dogActorCopiedRole: getDogActorCopiedRoleForDisplay(
        dogWolfStates[playerId],
        actorPlayerId,
        actorCopiedRole,
        drunkardReplacementRole,
      ),
      mimeCopiedRole: isMimePlayer ? mimeCopiedRole : null,
    });
  }, [actorCopiedRole, actorPlayerId, dogWolfOwnerRoles, dogWolfStates, drunkardPlayerId, drunkardReplacementRole, effectiveRoleAssignments, getObjectiveEffectsForPlayer, mimeCopiedRole, mimeOwnerRole, mimePlayerId, mimeReplacementRole, objectiveRoleAssignments]);

  const syncActorCharacter = useCallback((copiedRole: RoleId | null) => {
    if (!actorPlayerId) return;
    const identity = encodeActorCharacter(copiedRole, drunkardReplacementRole);
    const ownerPlayerId = dogWolfStates[actorPlayerId]?.ownerPlayerId;
    const objectiveRole = objectiveRoleAssignments[actorPlayerId] ?? null;
    const character = encodePlayerCharacterMetadata(identity, {
      ownerRole: dogWolfOwnerRoles[actorPlayerId]
        ?? (ownerPlayerId ? effectiveRoleAssignments[ownerPlayerId] ?? null : null),
      ownerPlayerId,
      objectiveRole: ownerPlayerId || (objectiveRole && SOLO_OBJECTIVE_ROLES.includes(objectiveRole))
        ? objectiveRole
        : null,
      objectiveEffects: getObjectiveEffectsForPlayer(actorPlayerId),
      dogActorCopiedRole: getDogActorCopiedRoleForDisplay(
        dogWolfStates[actorPlayerId],
        actorPlayerId,
        copiedRole,
        drunkardReplacementRole,
      ),
    });
    setPlayers((prev) => prev.map((player) => player.id === actorPlayerId ? { ...player, character } : player));
    void supabase.from("players").update({ character }).eq("id", actorPlayerId).then(() => {
      broadcastPlayerSync([actorPlayerId]);
    });
  }, [actorPlayerId, broadcastPlayerSync, dogWolfOwnerRoles, dogWolfStates, drunkardReplacementRole, effectiveRoleAssignments, getObjectiveEffectsForPlayer, objectiveRoleAssignments]);

  useEffect(() => {
    if (!rolesAssigned || room?.status !== "playing" || pendingChanges) return;
    const changes = Object.entries(roleAssignments).flatMap(([playerId, role]) => {
      if (permanentlyDead.has(playerId)) return [];
      const character = getStoredCharacter(playerId, role);
      const currentCharacter = players.find((player) => player.id === playerId)?.character;
      return currentCharacter === character ? [] : [{ playerId, character }];
    });
    if (changes.length === 0) return;
    setPlayers((previous) => previous.map((player) => {
      const change = changes.find(({ playerId }) => playerId === player.id);
      return change ? { ...player, character: change.character } : player;
    }));
    void Promise.all(changes.map(({ playerId, character }) => (
      supabase.from("players").update({ character }).eq("id", playerId)
    ))).then(() => broadcastPlayerSync(changes.map(({ playerId }) => playerId)));
  }, [broadcastPlayerSync, getStoredCharacter, pendingChanges, permanentlyDead, players, roleAssignments, rolesAssigned, room?.status]);

  const confirmPendingChanges = async () => {
    if (!roomId) return;
    const updates = Object.entries(roleAssignments).map(([playerId, roleId]) =>
      supabase.from("players").update({ character: getStoredCharacter(playerId, roleId) }).eq("id", playerId)
    );
    await Promise.all(updates);
    broadcastPlayerSync(Object.keys(roleAssignments));
    setPendingChanges(false);
    toast.success(getToast("okChangesSent", (room?.language as Language) || "pt"));
  };

  const sendRolesToPlayers = async () => {
    if (!roomId) return;
    if (drunkardPlayerId && drunkardReplacementRole) {
      pendingDrunkardSetupLogRef.current = drunkardReplacementRole;
    }
    const updates = Object.entries(roleAssignments).map(([playerId, roleId]) =>
      supabase.from("players").update({ character: getStoredCharacter(playerId, roleId) }).eq("id", playerId)
    );
    await Promise.all(updates);
    await supabase.from("rooms").update({ status: "playing" }).eq("id", roomId);
    setRoom((prev) => (prev ? { ...prev, status: "playing" } : prev));
    // f02 Espião auto-spawn: knows himself, so seed spied_on on himself
    const spyId = Object.entries(roleAssignments).find(([, r]) => r === "f02")?.[0];
    if (spyId) {
      setPlayerEffects((prev) => {
        const next = { ...prev };
        const cur = new Set(next[spyId] || []);
        if (cur.has("spied_on")) return prev;
        suppressedEffectLogAddsRef.current.add(`${spyId}:spied_on`);
        cur.add("spied_on");
        next[spyId] = cur;
        return next;
      });
    }
    broadcastPlayerSync(Object.keys(roleAssignments));
    toast.success(getToast("okRolesSent", (room?.language as Language) || "pt"));
  };

  // Helper: find closest werewolf to rustedKnight
  const findClosestWerewolf = useCallback((rustedKnightId: string) => {
    const sorted = players
      .filter((p) => p.seat_position !== null)
      .sort((a, b) => a.seat_position! - b.seat_position!);
    const cavIdx = sorted.findIndex((p) => p.id === rustedKnightId);
    if (cavIdx === -1) return null;

    for (let dist = 1; dist < sorted.length; dist++) {
      for (const dir of [1, -1]) {
        const idx = (cavIdx + dir * dist + sorted.length) % sorted.length;
        const p = sorted[idx];
        if (p.id === rustedKnightId) continue;
        const r = abilityRoleAssignments[p.id];
        if (WEREWOLF_ROLES.includes(r) && !permanentlyDead.has(p.id) && playerStatuses[p.id] !== "dead-this-night") return p;
      }
    }
    return null;
  }, [abilityRoleAssignments, players, permanentlyDead, playerStatuses]);

  // Check immunity
  const hasImmunity = useCallback((playerId: string, source: string): boolean => {
    const effects = playerEffects[playerId] || new Set();
    if (effects.has("immunity_full")) return true;
    if (effects.has("immunity_cupid")) return true;
    if (effects.has("immunity_onetime")) return true;
    // Werewolf immunity (redHood)
    if (isWerewolfAttackSource(source)) {
      if (effects.has("immunity_werewolf")) return true;
    }
    return false;
  }, [isWerewolfAttackSource, playerEffects]);

  // Player status management
  const handlePlayerStatusChange = useCallback((playerId: string, newStatus: PlayerStatus, _source?: string, sourcePlayerId?: string | null) => {
    if (newStatus === "poisoned") {
      const sourceKey = sourcePlayerId ?? "manual";
      setPoisonTargetsBySource((previous) => {
        const next = { ...previous };
        if (!sourcePlayerId && Object.values(previous).includes(playerId)) {
          Object.entries(next).forEach(([source, target]) => {
            if (target === playerId) delete next[source];
          });
          return next;
        }
        if (previous[sourceKey] === playerId) {
          delete next[sourceKey];
          return next;
        }
        next[sourceKey] = playerId;
        return next;
      });
      if (!isPlayerPoisoned(playerId)) {
        if (sourcePlayerId) pendingGameActionLogSourcesRef.current.set(`poison:${playerId}`, sourcePlayerId);
        setNightTargetedPlayerIds((prev) => { const n = new Set(prev); n.add(playerId); return n; });
      }
      return;
    } else if (newStatus === "dead-this-night") {
      const source = _source || "manual";
      const isWerewolfTargeting = isWerewolfAttackSource(source, sourcePlayerId);
      if (isWerewolfTargeting) {
        setNightTargetedPlayerIds((prev) => { const next = new Set(prev); next.add(playerId); return next; });
      }

      // Check immunities
      if (hasImmunity(playerId, isWerewolfTargeting ? "e01" : source)) {
        // Immunity_onetime: consume it
        const effects = playerEffects[playerId] || new Set();
        if (effects.has("immunity_onetime")) {
          toggleEffect(playerId, "immunity_onetime");
          toast.info(format(getToast("infoUsedOnetime", (room?.language as Language) || "pt"), { name: players.find(p => p.id === playerId)?.name || "" }));
        } else {
          toast.warning(format(getToast("warnImmune", (room?.language as Language) || "pt"), { name: players.find(p => p.id === playerId)?.name || "" }));
        }
        return;
      }

      // Check RedHood werewolf immunity
      if (isWerewolfTargeting) {
        const redHoodId = Object.entries(effectiveRoleAssignments).find(([, r]) => r === "v08b")?.[0];
        if (redHoodId === playerId) {
          const hunterAlive = Object.entries(effectiveRoleAssignments).some(([pid, r]) => r === "v08" && !permanentlyDead.has(pid));
          const redHoodPoisoned = isPlayerPoisoned(playerId);
          if (hunterAlive && !redHoodPoisoned) {
            toast.warning(getToast("warnLittleRedImmune", (room?.language as Language) || "pt"));
            return;
          }
        }
      }

      if (abilityRoleAssignments[playerId] === "e02" && isPlayerPoisoned(playerId)) {
        toast.warning(getToast("warnWitchPoisonedImmune", (room?.language as Language) || "pt"));
        return;
      }

      setPlayerStatuses((prev) => ({ ...prev, [playerId]: "dead-this-night" }));
      setKillSources((prev) => ({ ...prev, [playerId]: source }));
      setKillSourcePlayerIds((prev) => {
        const next = { ...prev };
        if (sourcePlayerId) next[playerId] = sourcePlayerId;
        else delete next[playerId];
        return next;
      });

      // RustedKnight Enferrujado mechanic: apply Tetanus (deferred death) instead of instant kill
      if (abilityRoleAssignments[playerId] === RUSTED_KNIGHT_ROLE && _source !== "rustedKnight-linked") {
        const isRustedKnightPoisoned = isPlayerActingPoisoned(playerId);
        if (isRustedKnightPoisoned) {
          const nonWWAlive = players.filter(
            (p) => p.id !== playerId && !permanentlyDead.has(p.id) && !WEREWOLF_ROLES.includes(abilityRoleAssignments[p.id]) && playerStatuses[p.id] !== "dead-this-night"
          );
          if (nonWWAlive.length > 0) {
            const victim = nonWWAlive[Math.floor(Math.random() * nonWWAlive.length)];
            setPlayerEffects((prev) => {
              const cur = new Set(prev[victim.id] || []);
              cur.add("tetanus");
              return { ...prev, [victim.id]: cur };
            });
            setRustedKnightLinkedDeath(victim.id);
            setTetanusSourcePlayerIds((prev) => ({ ...prev, [victim.id]: playerId }));
            toast.info(format(getToast("infoKnightPoisoned", (room?.language as Language) || "pt"), { name: victim.name }));
          }
        } else {
          const closestWW = findClosestWerewolf(playerId);
          if (closestWW) {
            setPlayerEffects((prev) => {
              const cur = new Set(prev[closestWW.id] || []);
              cur.add("tetanus");
              return { ...prev, [closestWW.id]: cur };
            });
            setRustedKnightLinkedDeath(closestWW.id);
            setTetanusSourcePlayerIds((prev) => ({ ...prev, [closestWW.id]: playerId }));
            toast.info(format(getToast("infoKnightDied", (room?.language as Language) || "pt"), { name: closestWW.name }));
          }
        }
      }
    } else if (newStatus === "dead") {
      setPlayerStatuses((prev) => ({ ...prev, [playerId]: "dead" }));
      setPermanentlyDead((prev) => { const next = new Set(prev); next.add(playerId); return next; });
      setPlayers((prev) => prev.map((player) => player.id === playerId ? { ...player, is_alive: false } : player));
      const a05Id = Object.entries(roleAssignments).find(([, role]) => role === "a05")?.[0];
      if (a05Id && a05Id !== playerId && poisonedPlayerId !== a05Id && playerEffects[playerId]?.has("dug_up")) {
        const targetRole = roleAssignments[playerId];
        if (targetRole) {
          setRoleAssignments((prev) => ({ ...prev, [a05Id]: targetRole, [playerId]: "a05" }));
          setPlayers((prev) => prev.map((player) => {
            if (player.id === a05Id) return { ...player, character: targetRole };
            if (player.id === playerId) return { ...player, character: "a05" };
            return player;
          }));
          setPlayerEffects((prev) => {
            const cur = new Set(prev[playerId] || []);
            cur.delete("dug_up");
            return { ...prev, [playerId]: cur };
          });
          if (targetRole === "e03") setShamanCharges(0);
          if (targetRole === "v10") setParanoidCharges(0);
          if (targetRole === "v18") setAngelCharges(0);
          if (targetRole === "m01") setBigBadWolfCharges(0);
          if (targetRole === "s01") setCupidCharges(0);
          if (targetRole === "m02") setWerewolfSeerUsed(false);
          if (targetRole === "m03") setVampireWolfUsed(false);
          if (targetRole === "v04") setFoxDisabled(false);
          if (targetRole === "v23") setSpiderDayChangeUsed(false);
          Promise.all([
            supabase.from("players").update({ character: targetRole }).eq("id", a05Id),
            supabase.from("players").update({ character: "a05" }).eq("id", playerId),
          ]).then(() => broadcastPlayerSync([a05Id, playerId]));
          toast.success(getToast("okGraveRobber", (room?.language as Language) || "pt"));
        }
      }
      void supabase.from("players").update({ is_alive: false }).eq("id", playerId).then(() => {
        broadcastPlayerSync([playerId]);
      });
    } else if (newStatus === "alive") {
      if (sourcePlayerId) pendingGameActionLogSourcesRef.current.set(`resurrect:${playerId}`, sourcePlayerId);
      setPlayerStatuses((prev) => ({ ...prev, [playerId]: "alive" }));
      setKillSourcePlayerIds((prev) => {
        if (!(playerId in prev)) return prev;
        const next = { ...prev };
        delete next[playerId];
        return next;
      });
      setPermanentlyDead((prev) => { const next = new Set(prev); next.delete(playerId); return next; });
      setPlayers((prev) => prev.map((player) => player.id === playerId ? { ...player, is_alive: true } : player));
      void supabase.from("players").update({ is_alive: true }).eq("id", playerId).then(() => {
        broadcastPlayerSync([playerId]);
      });

      if (playerId === actorIdolPlayerId && actorCopiedRole) {
        setActorCopiedRole(null);
        setActorCopyNoticeNight(null);
        setActorPowerState({ ...EMPTY_ACTOR_POWER_STATE });
        syncActorCharacter(null);
      }

      setDogWolfStates((previous) => {
        let changed = false;
        const next = Object.fromEntries(Object.entries(previous).map(([dogPlayerId, state]) => {
          if (state.actorIdolPlayerId !== playerId || !state.independentRole) return [dogPlayerId, state];
          changed = true;
          return [dogPlayerId, {
            ...state,
            actorCopiedRole: null,
            independentRole: null,
            objectiveRoleOverride: null,
            powerState: { ...EMPTY_ACTOR_POWER_STATE },
          }];
        })) as DogWolfStates;
        return changed ? next : previous;
      });

      // RustedKnight resurrection does NOT remove Tetanus from the linked victim (by design).
      if (abilityRoleAssignments[playerId] === RUSTED_KNIGHT_ROLE && rustedKnightLinkedDeath) {
        setRustedKnightLinkedDeath(null);
      }
    }
  }, [
    actorCopiedRole,
    actorIdolPlayerId,
    abilityRoleAssignments,
    broadcastPlayerSync,
    rustedKnightLinkedDeath,
    effectiveRoleAssignments,
    findClosestWerewolf,
    hasImmunity,
    isWerewolfAttackSource,
    permanentlyDead,
    playerEffects,
    playerStatuses,
    players,
    isPlayerPoisoned,
    isPlayerActingPoisoned,
    poisonedPlayerId,
    roleAssignments,
    room?.language,
    syncActorCharacter,
    toggleEffect,
  ]);

  // A red-X lover immediately causes the other lover to receive a red X unless protected.
  useEffect(() => {
    const loverIds = Object.entries(playerEffects)
      .filter(([, effects]) => effects.has("namorado"))
      .map(([playerId]) => playerId);
    if (!loverIds.some((playerId) => playerStatuses[playerId] === "dead-this-night")) return;

    const suicideIds = loverIds.filter((playerId) =>
      !permanentlyDead.has(playerId)
      && playerStatuses[playerId] !== "dead"
      && playerStatuses[playerId] !== "dead-this-night"
      && !hasImmunity(playerId, "s01-suicide")
    );
    if (suicideIds.length === 0) return;

    setPlayerStatuses((prev) => {
      const next = { ...prev };
      suicideIds.forEach((playerId) => { next[playerId] = "dead-this-night"; });
      return next;
    });
    setKillSources((prev) => {
      const next = { ...prev };
      suicideIds.forEach((playerId) => { next[playerId] = "s01-suicide"; });
      return next;
    });
  }, [hasImmunity, permanentlyDead, playerEffects, playerStatuses]);

  // Executed handler (during tribunal). Big Bad Wolf is always executable when Red Hood is in game.
  const handleExecute = useCallback((playerId: string) => {
    const role = abilityRoleAssignments[playerId];
    const redHoodInGame = Object.values(abilityRoleAssignments).some((r) => r === "v08b");
    const bypassImmunity = role === "m01" && redHoodInGame;
    if (!bypassImmunity && hasImmunity(playerId, "executado")) return;
    setPlayerStatuses((prev) => ({ ...prev, [playerId]: "dead-this-night" }));
    setKillSources((prev) => ({ ...prev, [playerId]: "executado" }));
    setDayKilledPlayerIds((prev) => (prev.includes(playerId) ? prev : [...prev, playerId]));
    toast.info(format(getToast("infoExecuted", (room?.language as Language) || "pt"), { name: players.find(p => p.id === playerId)?.name || "" }));
    // RustedKnight Enferrujado: any death (including execution) triggers Tetanus on closest werewolf.
    if (role === RUSTED_KNIGHT_ROLE) {
      const isRustedKnightPoisoned = isPlayerActingPoisoned(playerId);
      if (!isRustedKnightPoisoned) {
        const closestWW = findClosestWerewolf(playerId);
        if (closestWW) {
          setPlayerEffects((prev) => {
            const cur = new Set(prev[closestWW.id] || []);
            cur.add("tetanus");
            return { ...prev, [closestWW.id]: cur };
          });
          setRustedKnightLinkedDeath(closestWW.id);
          setTetanusSourcePlayerIds((prev) => ({ ...prev, [closestWW.id]: playerId }));
          toast.info(format(getToast("infoKnightExecuted", (room?.language as Language) || "pt"), { name: closestWW.name }));
        }
      }
    }
    setListPopoverId(null);
  }, [abilityRoleAssignments, players, hasImmunity, isPlayerActingPoisoned, findClosestWerewolf, room?.language]);

  const handleSetIllusion = useCallback((playerId: string, sourcePlayerId?: string | null) => {
    const sourceKey = sourcePlayerId ?? "manual";
    setIllusionTargetsBySource((previous) => {
      const next = { ...previous };
      if (!sourcePlayerId && Object.values(previous).includes(playerId)) {
        Object.entries(next).forEach(([source, target]) => {
          if (target === playerId) delete next[source];
        });
        return next;
      }
      if (previous[sourceKey] === playerId) delete next[sourceKey];
      else next[sourceKey] = playerId;
      return next;
    });
    if (!illusionPlayerIds.has(playerId) && sourcePlayerId) {
      pendingGameActionLogSourcesRef.current.set(`illusion:${playerId}`, sourcePlayerId);
    }
  }, [illusionPlayerIds]);

  const handleShamanChargeToggle = (index: number) => {
    // Shaman can always tick/untick the checkbox to track usage manually,
    // even while poisoned. Only the drag-drop resurrect is gated by poison.
    if (shamanCharges > index) {
      setShamanCharges(index);
    } else {
      setShamanCharges(index + 1);
    }
  };

  const handleShamanDrop = useCallback((targetPlayerId: string, sourcePlayerId?: string | null) => {
    const independentPowerState = sourcePlayerId ? independentPowerStates[sourcePlayerId] : undefined;
    const charges = independentPowerState?.shamanCharges ?? shamanCharges;
    const isMimeSource = !!sourcePlayerId && roleAssignments[sourcePlayerId] === "a03";
    if (!isMimeSource && charges >= 2) {
      toast.warning(getToast("warnShamanUsedAll", (room?.language as Language) || "pt"));
      return;
    }
    const status = playerStatuses[targetPlayerId];
    if (status === "dead-this-night") {
      handlePlayerStatusChange(targetPlayerId, "alive", undefined, sourcePlayerId);
      if (sourcePlayerId && independentPowerState) {
        handleIndependentPowerStateChange(sourcePlayerId, {
          ...independentPowerState,
          shamanCharges: Math.min(independentPowerState.shamanCharges + 1, 2),
        });
      } else {
        setShamanCharges((c) => Math.min(c + 1, 2));
      }
      toast.success(getToast("okShamanRessurected", (room?.language as Language) || "pt"));
    } else {
      toast.error(getToast("errShamanDragOnlyDead", (room?.language as Language) || "pt"));
    }
  }, [shamanCharges, handleIndependentPowerStateChange, handlePlayerStatusChange, independentPowerStates, playerStatuses, roleAssignments, room?.language]);

  const endNight = async () => {
    const newPermanentlyDead = new Set(permanentlyDead);
    const newStatuses = { ...playerStatuses };
    const newlyDead: string[] = [];

    // Irmãos survival check (l04)
    const irmaoPlayerIds = Object.entries(effectiveRoleAssignments)
      .filter(([, r]) => r === "l04")
      .map(([pid]) => pid);
    if (irmaoPlayerIds.length >= 2) {
      const aliveIrmaos = irmaoPlayerIds.filter(pid => !newPermanentlyDead.has(pid) && newStatuses[pid] !== "dead-this-night");
      const deadThisNightIrmaos = irmaoPlayerIds.filter(pid => newStatuses[pid] === "dead-this-night");
      const someIrmaoPoisoned = irmaoPlayerIds.some(isPlayerPoisoned);
      if (aliveIrmaos.length >= 2 && deadThisNightIrmaos.length > 0 && !someIrmaoPoisoned) {
        for (const pid of deadThisNightIrmaos) {
          newStatuses[pid] = "alive";
          toast.info(format(getToast("infoBrothersSaved", (room?.language as Language) || "pt"), { name: players.find(p => p.id === pid)?.name || "" }));
        }
      }
    }

    // Tetanus is no longer resolved here — moved to startTribunal (red X like Paranoid),
    // so it perma-dies at "Próxima Noite" via the normal dead-this-night → perma flow.
    const newKillSources: Record<string, string> = { ...killSources };
    const newEffectsForTetanus = { ...playerEffects };

    // Flush the lover chain synchronously too, so a quick End Night click cannot skip it.
    const loverIds = Object.entries(playerEffects)
      .filter(([, effects]) => effects.has("namorado"))
      .map(([playerId]) => playerId);
    if (loverIds.some((playerId) => newStatuses[playerId] === "dead-this-night")) {
      for (const playerId of loverIds) {
        if (newPermanentlyDead.has(playerId)) continue;
        if (newStatuses[playerId] === "dead" || newStatuses[playerId] === "dead-this-night") continue;
        if (hasImmunity(playerId, "s01-suicide")) continue;
        newStatuses[playerId] = "dead-this-night";
        newKillSources[playerId] = "s01-suicide";
      }
    }
    setKillSources(newKillSources);

    const currentDeadThisNight = Object.entries(newStatuses)
      .filter(([, status]) => status === "dead-this-night")
      .map(([pid]) => pid);
    setLastNightDeadPlayerIds(currentDeadThisNight);
    setAstronomerBlocksWerewolvesTonight(currentDeadThisNight.some((pid) => (
      abilityRoleAssignments[pid] === "l05" && !isPlayerActingPoisoned(pid)
    )));

    Object.entries(newStatuses).forEach(([pid, status]) => {
      if (status === "dead-this-night") {
        newPermanentlyDead.add(pid);
        newStatuses[pid] = "dead";
        newlyDead.push(pid);
      }
    });

    const hasVintnerImmunityTarget = (playerId: string) => Object.entries(sourcedEffectTargets)
      .some(([sourcePlayerId, targets]) => (
        abilityRoleAssignments[sourcePlayerId] === "v24"
        && targets.immunity_full === playerId
      ));

    // Resolve temporary night markers on day start (Terminar Noite).
    const newEffects = { ...newEffectsForTetanus };
    for (const [pid, effects] of Object.entries(newEffects)) {
      const cleaned = new Set(effects);
      if (cleaned.has("acusado_next")) {
        cleaned.delete("acusado_next");
        cleaned.add("acusado");
      }
      cleaned.delete("inocentado");
      // 'caught' is a per-night marker — clear at night end
      cleaned.delete("caught");
      const dogSaviourTargeted = Object.values(dogWolfStates)
        .some((state) => state.powerState.saviourLastTarget === pid);
      if ((saviourLastTarget === pid || actorPowerState.saviourLastTarget === pid || dogSaviourTargeted) && !hasVintnerImmunityTarget(pid)) {
        cleaned.delete("immunity_full");
      }
      newEffects[pid] = cleaned;
    }
    setSaviourLastTarget(null);
    setActorPowerState((state) => ({ ...state, saviourLastTarget: null }));
    setDogWolfStates((previous) => Object.fromEntries(Object.entries(previous).map(([playerId, state]) => [
      playerId,
      { ...state, powerState: { ...state.powerState, saviourLastTarget: null } },
    ])));

    // Werewolf incendiado victims die (red X) — also covers werewolf_turned victims, respecting immunities.
    // If immune, the wolf survives AND the incendiado effect is removed (balance rule).
    for (const [pid, effects] of Object.entries(newEffects)) {
      const isWolf = WEREWOLF_ROLES.includes(objectiveRoleAssignments[pid]) || effects.has("werewolf_turned");
      if (!effects.has("incendiado") || !isWolf) continue;
      if (newPermanentlyDead.has(pid)) continue;
      if (effects.has("immunity_full") || effects.has("immunity_cupid") || effects.has("immunity_onetime") || effects.has("immunity_werewolf")) {
        const cleaned = new Set(effects);
        cleaned.delete("incendiado");
        newEffects[pid] = cleaned;
        continue;
      }
      if (newStatuses[pid] !== "dead" && newStatuses[pid] !== "dead-this-night") {
        newPermanentlyDead.add(pid);
        newStatuses[pid] = "dead";
        if (!newlyDead.includes(pid)) newlyDead.push(pid);
        toast.info(format(getToast("infoBornFireWolf", (room?.language as Language) || "pt"), { name: players.find(p => p.id === pid)?.name || "" }));
      }
    }

    // Track profecia perma-deaths for +1 night persistence
    setProphecyDeadAtNight((prev) => {
      const next = { ...prev };
      for (const pid of newlyDead) {
        if (newEffects[pid]?.has("profecia")) {
          next[pid] = nightNumber;
        }
      }
      return next;
    });

    // Inimigo: remove from perma-dead players
    for (const pid of newlyDead) {
      const eff = newEffects[pid];
      if (eff?.has("enemy")) {
        const cleaned = new Set(eff);
        cleaned.delete("enemy");
        newEffects[pid] = cleaned;
      }
    }

    const a05Id = Object.entries(roleAssignments).find(([, role]) => role === "a05")?.[0];
    const dugUpDeathId = newlyDead.find((pid) => pid !== a05Id && newEffects[pid]?.has("dug_up"));
    const characterUpdates: Array<PromiseLike<unknown>> = [];
    if (a05Id && dugUpDeathId && poisonedPlayerId !== a05Id) {
      const targetRole = roleAssignments[dugUpDeathId];
      if (targetRole) {
        const swappedAssignments = { ...roleAssignments, [a05Id]: targetRole, [dugUpDeathId]: "a05" as RoleId };
        setRoleAssignments(swappedAssignments);
        setPlayers((prev) => prev.map((player) => {
          if (player.id === a05Id) return { ...player, character: targetRole };
          if (player.id === dugUpDeathId) return { ...player, character: "a05" };
          return player;
        }));
        characterUpdates.push(
          supabase.from("players").update({ character: targetRole }).eq("id", a05Id),
          supabase.from("players").update({ character: "a05" }).eq("id", dugUpDeathId),
        );
        resetUsesForRoleId(targetRole);
        toast.success(getToast("okGraveRobber", (room?.language as Language) || "pt"));
      }
    }

    const dogGraveSwaps: Array<{ dogPlayerId: string; targetPlayerId: string; targetRole: RoleId }> = [];
    const claimedDogGraveTargets = new Set<string>();
    for (const [dogPlayerId] of Object.entries(dogWolfStates)) {
      if (abilityRoleAssignments[dogPlayerId] !== "a05" || isPlayerActingPoisoned(dogPlayerId)) continue;
      const sourcedTargetPlayerId = sourcedEffectTargets[dogPlayerId]?.dug_up_dog;
      const targetPlayerId = sourcedTargetPlayerId
        && newlyDead.includes(sourcedTargetPlayerId)
        && newEffects[sourcedTargetPlayerId]?.has("dug_up_dog")
        ? sourcedTargetPlayerId
        : null;
      const targetRole = targetPlayerId ? roleAssignments[targetPlayerId] : null;
      if (!targetPlayerId || !targetRole || claimedDogGraveTargets.has(targetPlayerId)) continue;
      claimedDogGraveTargets.add(targetPlayerId);
      dogGraveSwaps.push({ dogPlayerId, targetPlayerId, targetRole });
    }
    for (const { dogPlayerId, targetPlayerId, targetRole } of dogGraveSwaps) {
      pendingRoleChangeSourcesRef.current.set(targetPlayerId, { sourcePlayerId: dogPlayerId, sourceRole: "a02" });
      if (dogPlayerId === actorPlayerId && actorCopiedRole === "a02") {
        pendingActorCopyLogRef.current = targetRole;
        setActorCopiedRole(targetRole);
        setActorCopyNoticeNight(null);
        syncActorCharacter(targetRole);
        setRoleAssignments((previous) => ({ ...previous, [targetPlayerId]: "a02" }));
        setPlayers((previous) => previous.map((player) => (
          player.id === targetPlayerId ? { ...player, character: "a02" } : player
        )));
        characterUpdates.push(
          supabase.from("players").update({ character: "a02" }).eq("id", targetPlayerId),
        );
      } else {
        pendingRoleChangeSourcesRef.current.set(dogPlayerId, { sourcePlayerId: dogPlayerId, sourceRole: "a02" });
        setRoleAssignments((previous) => ({
          ...previous,
          [dogPlayerId]: targetRole,
          [targetPlayerId]: "a02",
        }));
        setPlayers((previous) => previous.map((player) => {
          if (player.id === dogPlayerId) return { ...player, character: targetRole };
          if (player.id === targetPlayerId) return { ...player, character: "a02" };
          return player;
        }));
        characterUpdates.push(
          supabase.from("players").update({ character: targetRole }).eq("id", dogPlayerId),
          supabase.from("players").update({ character: "a02" }).eq("id", targetPlayerId),
        );
      }
      setDogWolfStates((previous) => {
        const next = { ...previous };
        delete next[dogPlayerId];
        next[targetPlayerId] = createDogWolfState();
        return next;
      });
      const effects = new Set(newEffects[targetPlayerId] || []);
      effects.delete("dug_up_dog");
      newEffects[targetPlayerId] = effects;
    }

    const mimeDugUpDeathId = mimePlayerId && mimeCopiedRole === "a05"
      ? newlyDead.find((pid) => pid !== mimePlayerId && newEffects[pid]?.has("dug_up_mime")) ?? null
      : null;
    if (mimePlayerId && mimeDugUpDeathId) {
      const targetRole = roleAssignments[mimeDugUpDeathId];
      if (targetRole) {
        pendingRoleChangeSourcesRef.current.set(mimePlayerId, { sourcePlayerId: mimePlayerId, sourceRole: "a03" });
        pendingRoleChangeSourcesRef.current.set(mimeDugUpDeathId, { sourcePlayerId: mimePlayerId, sourceRole: "a03" });
        setRoleAssignments((previous) => ({
          ...previous,
          [mimePlayerId]: targetRole,
          [mimeDugUpDeathId]: "a03",
        }));
        setPlayers((previous) => previous.map((player) => {
          if (player.id === mimePlayerId) return { ...player, character: targetRole };
          if (player.id === mimeDugUpDeathId) return { ...player, character: "a03" };
          return player;
        }));
        characterUpdates.push(
          supabase.from("players").update({ character: targetRole }).eq("id", mimePlayerId),
          supabase.from("players").update({ character: "a03" }).eq("id", mimeDugUpDeathId),
        );
        const effects = new Set(newEffects[mimeDugUpDeathId] || []);
        effects.delete("dug_up_mime");
        newEffects[mimeDugUpDeathId] = effects;
        setMimeCopiedRole(null);
        setMimeReplacementRole(null);
        setMimeOwnerRole(null);
        setMimeCopyNoticeNight(null);
        setMimePowerState({ ...EMPTY_ACTOR_POWER_STATE });
        setMimeRevealOpen(false);
        setMimeRevealCards([]);
      }
    }

    const mimeAngelResurrectId = mimePlayerId && mimeCopiedRole === "v18" && mimeAngelSavedPlayerId
      ? mimeAngelSavedPlayerId
      : null;
    const resurrectedByMimeAngel: string[] = [];
    if (mimePlayerId && mimeAngelResurrectId && newPermanentlyDead.has(mimeAngelResurrectId)) {
      newPermanentlyDead.delete(mimeAngelResurrectId);
      newStatuses[mimeAngelResurrectId] = "alive";
      pendingGameActionLogSourcesRef.current.set(`resurrect:${mimeAngelResurrectId}`, mimePlayerId);
      resetUsesForRole(mimeAngelResurrectId);
      resurrectedByMimeAngel.push(mimeAngelResurrectId);
      setPlayers((previous) => previous.map((player) => (
        player.id === mimeAngelResurrectId ? { ...player, is_alive: true } : player
      )));
      characterUpdates.push(
        supabase.from("players").update({ is_alive: true }).eq("id", mimeAngelResurrectId),
      );
    }

    // Temporary night markers and Cupid protection end at dawn.
    for (const [pid, effects] of Object.entries(newEffects)) {
      if (effects.has("dug_up") || effects.has("dug_up_dog") || effects.has("dug_up_mime") || effects.has("immunity_cupid")) {
        const cleaned = new Set(effects);
        cleaned.delete("dug_up");
        cleaned.delete("dug_up_dog");
        cleaned.delete("dug_up_mime");
        cleaned.delete("immunity_cupid");
        newEffects[pid] = cleaned;
      }
    }

    setPlayerEffects(newEffects);
    setSourcedEffectTargets((previous) => Object.fromEntries(Object.entries(previous).map(([sourcePlayerId, targets]) => {
      const nextTargets = { ...targets };
      delete nextTargets.dug_up;
      delete nextTargets.dug_up_dog;
      delete nextTargets.dug_up_mime;
      return [sourcePlayerId, nextTargets];
    })));
    setSpiderCaughtBySource({});

    setPermanentlyDead(newPermanentlyDead);
    setPlayerStatuses(newStatuses);
    setNightTargetedPlayerIds(new Set());
    setRustedKnightLinkedDeath(null);
    setFortuneTellerFakeMap(null);
    setWerewolfSeerRevealedVictim(null);
    setParanoidKillName(null);
    setMimeCopiedRole(null);
    setMimeReplacementRole(null);
    setMimeOwnerRole(null);
    setMimeCopyNoticeNight(null);
    setMimePowerState({ ...EMPTY_ACTOR_POWER_STATE });
    setMimeAngelSavedPlayerId(null);
    setMimeRevealOpen(false);
    setMimeRevealCards([]);

    if (newlyDead.length > 0) {
      await Promise.all(
        newlyDead.map((pid) =>
          supabase.from("players").update({ is_alive: false }).eq("id", pid)
        )
      );
      broadcastPlayerSync(newlyDead);
    }
    if (characterUpdates.length > 0) {
      await Promise.all(characterUpdates);
    }
    if (newlyDead.length > 0 || dugUpDeathId || dogGraveSwaps.length > 0 || mimeDugUpDeathId || resurrectedByMimeAngel.length > 0) {
      broadcastPlayerSync([...new Set([
        ...newlyDead,
        ...resurrectedByMimeAngel,
        ...(dugUpDeathId && a05Id ? [dugUpDeathId, a05Id] : []),
        ...dogGraveSwaps.flatMap(({ dogPlayerId, targetPlayerId }) => [dogPlayerId, targetPlayerId]),
        ...(mimeDugUpDeathId && mimePlayerId ? [mimeDugUpDeathId, mimePlayerId] : []),
      ])]);
    }

    // Check Criança Selvagem → Pai Adotivo died
    const criancaId = Object.entries(effectiveRoleAssignments).find(([, r]) => r === "l02")?.[0];
    if (criancaId && !newPermanentlyDead.has(criancaId)) {
      const paiAdotivoId = Object.entries(newEffects).find(([, e]) => e.has("adoptive_dad"))?.[0];
      if (paiAdotivoId && newPermanentlyDead.has(paiAdotivoId)) {
        // Transform Wild Child into Werewolf
        if (criancaId === actorPlayerId) {
          setActorCopiedRole("e01");
          syncActorCharacter("e01");
        } else {
          setRoleAssignments((prev) => ({ ...prev, [criancaId]: "e01" }));
          await supabase.from("players").update({ character: "e01" }).eq("id", criancaId);
        }
        broadcastPlayerSync([criancaId]);
        toast.info(getToast("infoAdoptiveDadDied", (room?.language as Language) || "pt"));
      }
    }

    if (nightNumber >= 2) {
      const unownedDogPlayerIds = dogWolfPlayerIds.filter((dogPlayerId) => (
        !newPermanentlyDead.has(dogPlayerId)
        && !dogWolfStates[dogPlayerId]?.ownerPlayerId
      ));
      for (const dogPlayerId of unownedDogPlayerIds) {
        if (dogPlayerId === actorPlayerId && actorCopiedRole === "a02") {
          pendingActorDogFallbackLogRef.current = dogPlayerId;
          setActorCopiedRole("e01");
          setActorCopyNoticeNight(null);
          syncActorCharacter("e01");
        } else if (roleAssignments[dogPlayerId] === "a02") {
          pendingRoleChangeSourcesRef.current.set(dogPlayerId, {
            sourcePlayerId: dogPlayerId,
            sourceRole: "a02",
          });
          setRoleAssignments((previous) => ({ ...previous, [dogPlayerId]: "e01" }));
          setPlayers((previous) => previous.map((player) => (
            player.id === dogPlayerId ? { ...player, character: "e01" } : player
          )));
          await supabase.from("players").update({ character: "e01" }).eq("id", dogPlayerId);
          broadcastPlayerSync([dogPlayerId]);
        }
      }
    }

    toast.success(format(getToast("okNightEnded", (room?.language as Language) || "pt"), { n: nightNumber }));
    setCompletedScriptLineKeys(new Set());
    setScriptAutoComplete({ role: null, sourcePlayerIds: [], version: 0 });
    setGameCyclePhase("day");
    setDayPhase("day");
  };

  const startTribunal = () => {
    // Tetanus resolution: any player still tagged with 'tetanus' gets a red X
    // (dead-this-night, source 'v07'), like Paranoid. They perma-die at "Próxima Noite".
    const tetanusTargetIds = Object.entries(playerEffects)
      .filter(([, effects]) => effects.has("tetanus"))
      .map(([playerId]) => playerId);
    setTetanusSourcePlayerIds((prev) => {
      const next = { ...prev };
      tetanusTargetIds.forEach((playerId) => delete next[playerId]);
      return next;
    });
    setPlayerStatuses((prevStatuses) => {
      const nextStatuses = { ...prevStatuses };
      const nextKillSources = { ...killSources };
      const nextKillSourcePlayerIds = { ...killSourcePlayerIds };
      const nextEffects = { ...playerEffects };
      let any = false;
      for (const [pid, effs] of Object.entries(playerEffects)) {
        if (!effs.has("tetanus")) continue;
        if (permanentlyDead.has(pid)) continue;
        if (nextStatuses[pid] === "dead" || nextStatuses[pid] === "dead-this-night") continue;
        // Full immunity blocks tetanus death
        if (effs.has("immunity_full")) {
          const cleaned = new Set(effs);
          cleaned.delete("tetanus");
          nextEffects[pid] = cleaned;
          any = true;
          continue;
        }
        nextStatuses[pid] = "dead-this-night";
        nextKillSources[pid] = "v07";
        const sourcePlayerId = tetanusSourcePlayerIds[pid];
        if (sourcePlayerId) nextKillSourcePlayerIds[pid] = sourcePlayerId;
        else delete nextKillSourcePlayerIds[pid];
        const cleaned = new Set(effs);
        cleaned.delete("tetanus");
        nextEffects[pid] = cleaned;
        any = true;
      }
      if (any) {
        setKillSources(nextKillSources);
        setKillSourcePlayerIds(nextKillSourcePlayerIds);
        setPlayerEffects(nextEffects);
      }
      return nextStatuses;
    });
  };

  const startNextNight = async () => {
    // Make day-killed and red-X players permanently dead
    const newPermanentlyDead = new Set(permanentlyDead);
    const newStatuses = { ...playerStatuses };
    const newlyDead: string[] = [];

    // All red X players (from day kills or remaining) become perma-dead
    for (const [pid, status] of Object.entries(newStatuses)) {
      if (status === "dead-this-night") {
        newPermanentlyDead.add(pid);
        newStatuses[pid] = "dead";
        newlyDead.push(pid);
      }
    }
    const astronomerDiedDuringDay = newlyDead.some((pid) => (
      abilityRoleAssignments[pid] === "l05" && !isPlayerActingPoisoned(pid)
    ));
    if (astronomerDiedDuringDay) setAstronomerBlocksWerewolvesTonight(true);

    // Add day killed to lastNightDeadPlayerIds so FortuneTeller sees them
    setLastNightDeadPlayerIds((prev) => [...prev, ...newlyDead.filter(pid => !prev.includes(pid))]);

    if (newlyDead.length > 0) {
      await Promise.all(
        newlyDead.map((pid) =>
          supabase.from("players").update({ is_alive: false }).eq("id", pid)
        )
      );
      setPlayers((prev) => prev.map((player) => newlyDead.includes(player.id) ? { ...player, is_alive: false } : player));
      broadcastPlayerSync(newlyDead);
    }

    setPermanentlyDead(newPermanentlyDead);
    setPlayerStatuses(newStatuses);
    setDayKilledPlayerIds([]);

    let dogStatesForNight = dogWolfStates;
    if (
      actorPlayerId
      && actorIdolPlayerId
      && newPermanentlyDead.has(actorIdolPlayerId)
      && !newPermanentlyDead.has(actorPlayerId)
    ) {
      const copiedRole = roleAssignments[actorIdolPlayerId];
      if (copiedRole && copiedRole !== "a04" && !actorCopiedRole) {
        if (copiedRole === "a02") {
          const inherited = createInheritedDogWolfState(dogWolfStates[actorIdolPlayerId]);
          const ownerPlayerId = inherited.ownerPlayerId;
          if (ownerPlayerId === actorPlayerId) inherited.actorModeActive = true;
          if (ownerPlayerId && effectiveRoleAssignments[ownerPlayerId] === "l02") {
            inherited.adoptiveDadPlayerId = Object.entries(playerEffects)
              .find(([, effects]) => effects.has("adoptive_dad"))?.[0] ?? null;
          }
          dogStatesForNight = { ...dogStatesForNight, [actorPlayerId]: inherited };
        }
        pendingActorCopyLogRef.current = copiedRole;
        setActorCopiedRole(copiedRole);
        setActorCopyNoticeNight(nightNumber + 1);
        setActorPowerState({ ...EMPTY_ACTOR_POWER_STATE });
        syncActorCharacter(copiedRole);
      }
    }

    const advancedDogStates = { ...dogStatesForNight };
    let dogStateChanged = dogStatesForNight !== dogWolfStates;
    for (const [dogPlayerId, state] of Object.entries(dogStatesForNight)) {
      if (newPermanentlyDead.has(dogPlayerId)) continue;
      const advanced = advanceDogWolfStateForNight(
        state,
        roleAssignments,
        newPermanentlyDead,
        drunkardReplacementRole,
      );
      if (advanced === state) continue;
      advancedDogStates[dogPlayerId] = advanced;
      dogStateChanged = true;
      const toRole = advanced.independentRole;
      if (toRole) pendingDogRoleChangeLogRef.current.push({ dogPlayerId, fromRole: "a02", toRole });
    }
    if (dogStateChanged) setDogWolfStates(advancedDogStates);

    const vintnerImmunityTargetIds = new Set(
      Object.entries(sourcedEffectTargets).flatMap(([sourcePlayerId, targets]) => (
        abilityRoleAssignments[sourcePlayerId] === "v24" && targets.immunity_full
          ? [targets.immunity_full]
          : []
      )),
    );

    // At night start, remove m01's disguise immunity and Vintner's day-long immunity.
    // Saviour immunity is cleared at dawn in endNight.
    const newEffects = { ...playerEffects };
    for (const [pid, effects] of Object.entries(newEffects)) {
      const cleaned = new Set(effects);
      if (abilityRoleAssignments[pid] === "m01") cleaned.delete("immunity_full");
      if (vintnerImmunityTargetIds.has(pid)) cleaned.delete("immunity_full");
      if (pid === mimeFullImmunityPlayerId) cleaned.delete("immunity_full");
      newEffects[pid] = cleaned;
    }
    if (mimeFullImmunityPlayerId) setMimeFullImmunityPlayerId(null);
    if (vintnerImmunityTargetIds.size > 0) {
      setSourcedEffectTargets((previous) => {
        let changed = false;
        const next = Object.fromEntries(Object.entries(previous).map(([sourcePlayerId, targets]) => {
          if (abilityRoleAssignments[sourcePlayerId] !== "v24" || !targets.immunity_full) {
            return [sourcePlayerId, targets];
          }
          changed = true;
          const nextTargets = { ...targets };
          delete nextTargets.immunity_full;
          return [sourcePlayerId, nextTargets];
        }));
        return changed ? next : previous;
      });
    }

    // Track profecia perma-deaths for +1 night persistence
    setProphecyDeadAtNight((prev) => {
      const next = { ...prev };
      for (const pid of newlyDead) {
        if (newEffects[pid]?.has("profecia")) {
          next[pid] = nightNumber;
        }
      }
      return next;
    });

    // Inimigo: remove from newly perma-dead
    for (const pid of newlyDead) {
      const eff = newEffects[pid];
      if (eff?.has("enemy")) {
        const cleaned = new Set(eff);
        cleaned.delete("enemy");
        newEffects[pid] = cleaned;
      }
    }

    setPlayerEffects(newEffects);

    setCompletedScriptLineKeys(new Set());
    setScriptAutoComplete({ role: null, sourcePlayerIds: [], version: 0 });
    setGameCyclePhase("night");
    setNightNumber((n) => n + 1);
    setNightTargetedPlayerIds(new Set());
    setRustedKnightLinkedDeath(null);
    setFortuneTellerFakeMap(null);
    setWerewolfSeerRevealedVictim(null);
  };

  // Helper: pick a random player matching a predicate (excluding source if provided)
  const pickRandomPlayer = useCallback((predicate: (p: Player) => boolean, excludeId?: string): Player | null => {
    const candidates = players.filter((p) => p.id !== excludeId && p.seat_position !== null && predicate(p));
    if (candidates.length === 0) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
  }, [players]);

  // Helper: get role player id by role
  const getRolePlayerId = useCallback((role: RoleId): string | null => {
    const rolePlayers = Object.entries(effectiveRoleAssignments).filter(([, assignedRole]) => assignedRole === role);
    return rolePlayers.find(([playerId]) => !permanentlyDead.has(playerId) && playerStatuses[playerId] !== "dead")?.[0]
      ?? rolePlayers[0]?.[0]
      ?? null;
  }, [effectiveRoleAssignments, permanentlyDead, playerStatuses]);

  const getSourceRole = useCallback((source: string | null | undefined): RoleId | null => {
    if (!source) return null;
    if (source === "s01-suicide") return "s01";
    if (source === "soldier" || source === "soldado") return "v09";
    if (ROLES[source as RoleId]) return source as RoleId;
    return null;
  }, []);

  const getPlayerLogSnapshot = useCallback((playerId: string): GameLogPlayerSnapshot | null => {
    const player = players.find((p) => p.id === playerId);
    if (!player) return null;
    const role = roleAssignments[playerId] ?? parsePlayerCharacter(player.character).baseRole;
    return {
      id: playerId,
      name: player.name,
      role,
      status: playerStatuses[playerId] ?? (permanentlyDead.has(playerId) ? "dead" : "alive"),
      permanentlyDead: permanentlyDead.has(playerId),
      poisoned: isPlayerPoisoned(playerId),
      illusion: illusionPlayerIds.has(playerId),
      effects: Array.from(playerEffects[playerId] || []),
    };
  }, [illusionPlayerIds, isPlayerPoisoned, permanentlyDead, playerEffects, playerStatuses, players, roleAssignments]);

  const getActorSnapshotForRole = useCallback((role: RoleId | null | undefined) => {
    if (!role) return null;
    const playerId = role === "a04" ? actorPlayerId : getRolePlayerId(role);
    return playerId ? getPlayerLogSnapshot(playerId) : null;
  }, [actorPlayerId, getPlayerLogSnapshot, getRolePlayerId]);

  const recordGameEvent = useCallback((event: Omit<GameLogEvent, "id" | "createdAt" | "phase" | "phaseNumber"> & {
    phase?: GameLogPhase;
    phaseNumber?: number;
  }) => {
    const createdAt = Date.now();
    const effectivePhase: GameLogPhase = event.phase ?? (gameCyclePhase === "day" ? dayPhase : gameCyclePhase);
    const nextEvent: GameLogEvent = {
      id: `${createdAt}-${Math.random().toString(36).slice(2, 9)}`,
      createdAt,
      phase: effectivePhase,
      phaseNumber: event.phaseNumber ?? nightNumber,
      ...event,
    };
    setGameLogEvents((prev) => [...prev, nextEvent].slice(-MAX_GAME_LOG_EVENTS));
  }, [dayPhase, gameCyclePhase, nightNumber]);

  const getCoupledActionPlayerIds = useCallback((
    role: RoleId,
    sourcePlayerId?: string | null,
  ): string[] => {
    const sourceId = sourcePlayerId ?? getRolePlayerId(role);
    if (!sourceId) return [];
    const playerIds = new Set<string>([sourceId]);
    if (role === "e01") {
      for (const dogPlayerId of activeDogWolfPlayerIds) {
        if (WEREWOLF_ROLES.includes(abilityRoleAssignments[dogPlayerId])) playerIds.add(dogPlayerId);
      }
    }
    return Array.from(playerIds);
  }, [abilityRoleAssignments, activeDogWolfPlayerIds, getRolePlayerId]);

  const markScriptRoleAction = useCallback((
    role: RoleId,
    sourcePlayerId?: string | null,
    explicitPlayerIds?: string[],
  ) => {
    const sourcePlayerIds = explicitPlayerIds ?? getCoupledActionPlayerIds(role, sourcePlayerId);
    setScriptAutoComplete((current) => ({ role, sourcePlayerIds, version: current.version + 1 }));
  }, [getCoupledActionPlayerIds]);

  useEffect(() => {
    const copiedRole = pendingActorCopyLogRef.current;
    if (!copiedRole || !actorCopiedRole || !actorPlayerId || !gmSnapshotLoaded || room?.status !== "playing") return;
    const actorSnapshot = getPlayerLogSnapshot(actorPlayerId);
    if (!actorSnapshot) return;

    pendingActorCopyLogRef.current = null;
    const language = room?.language ?? "pt";
    recordGameEvent({
      action: "role_change",
      actor: actorSnapshot,
      actorRole: "a04",
      target: { ...actorSnapshot, role: copiedRole },
      detail: `${getRoleLabel("a04", language)} -> ${getRoleLabel(copiedRole, language)}`,
    });
  }, [actorCopiedRole, actorPlayerId, getPlayerLogSnapshot, gmSnapshotLoaded, recordGameEvent, room?.language, room?.status]);

  useEffect(() => {
    const replacementRole = pendingDrunkardSetupLogRef.current;
    if (!replacementRole || !drunkardPlayerId || !gmSnapshotLoaded || room?.status !== "playing") return;
    const drunkardSnapshot = getPlayerLogSnapshot(drunkardPlayerId);
    if (!drunkardSnapshot) return;

    pendingDrunkardSetupLogRef.current = null;
    const language = room?.language ?? "pt";
    recordGameEvent({
      action: "role_change",
      phase: "setup",
      phaseNumber: 0,
      actor: drunkardSnapshot,
      actorRole: "a01",
      target: { ...drunkardSnapshot, role: replacementRole },
      detail: `${getRoleLabel("a01", language)} -> ${getRoleLabel(replacementRole, language)}`,
    });
  }, [drunkardPlayerId, getPlayerLogSnapshot, gmSnapshotLoaded, recordGameEvent, room?.language, room?.status]);

  useEffect(() => {
    if (pendingDogOwnerLogRef.current.length === 0 || !gmSnapshotLoaded || room?.status !== "playing") return;
    const remaining: typeof pendingDogOwnerLogRef.current = [];
    for (const pending of pendingDogOwnerLogRef.current) {
      const actor = getPlayerLogSnapshot(pending.dogPlayerId);
      const target = getPlayerLogSnapshot(pending.ownerPlayerId);
      if (!actor || !target) {
        remaining.push(pending);
        continue;
      }
      recordGameEvent({
        action: "effect_add",
        actor,
        actorRole: "a02",
        target,
        effect: "owner",
      });
    }
    pendingDogOwnerLogRef.current = remaining;
  }, [dogWolfStates, getPlayerLogSnapshot, gmSnapshotLoaded, recordGameEvent, room?.status]);

  useEffect(() => {
    if (pendingDogRoleChangeLogRef.current.length === 0 || !gmSnapshotLoaded || room?.status !== "playing") return;
    const language = room?.language ?? "pt";
    const remaining: typeof pendingDogRoleChangeLogRef.current = [];
    for (const pending of pendingDogRoleChangeLogRef.current) {
      const snapshot = getPlayerLogSnapshot(pending.dogPlayerId);
      if (!snapshot) {
        remaining.push(pending);
        continue;
      }
      recordGameEvent({
        action: "role_change",
        actor: { ...snapshot, role: "a02" },
        actorRole: "a02",
        target: { ...snapshot, role: pending.toRole },
        detail: `${getRoleLabel(pending.fromRole, language)} -> ${getRoleLabel(pending.toRole, language)}`,
      });
    }
    pendingDogRoleChangeLogRef.current = remaining;
  }, [dogWolfStates, getPlayerLogSnapshot, gmSnapshotLoaded, recordGameEvent, room?.language, room?.status]);

  useEffect(() => {
    const playerId = pendingActorDogFallbackLogRef.current;
    if (!playerId || actorCopiedRole !== "e01" || !gmSnapshotLoaded || room?.status !== "playing") return;
    const snapshot = getPlayerLogSnapshot(playerId);
    if (!snapshot) return;
    pendingActorDogFallbackLogRef.current = null;
    const language = room?.language ?? "pt";
    recordGameEvent({
      action: "role_change",
      actor: { ...snapshot, role: "a02" },
      actorRole: "a02",
      target: { ...snapshot, role: "e01" },
      detail: `${getRoleLabel("a02", language)} -> ${getRoleLabel("e01", language)}`,
    });
  }, [actorCopiedRole, getPlayerLogSnapshot, gmSnapshotLoaded, recordGameEvent, room?.language, room?.status]);

  useEffect(() => {
    if (!gmSnapshotLoaded || room?.status !== "finished" || !pendingGameOverLogKindRef.current) return;
    const kind = pendingGameOverLogKindRef.current;
    pendingGameOverLogKindRef.current = null;
    recordGameEvent({
      action: "game_over",
      phase: "game-over",
      phaseNumber: nightNumber,
      winKind: kind,
    });
  }, [gmSnapshotLoaded, nightNumber, recordGameEvent, room?.status]);

  useEffect(() => {
    const cloneEffects = (effects: Record<string, Set<StatusEffect>>) => (
      Object.fromEntries(Object.entries(effects).map(([playerId, values]) => [playerId, new Set(values)]))
    );
    const currentState = {
      playerStatuses: { ...playerStatuses },
      permanentlyDead: new Set(permanentlyDead),
      poisonedPlayerIds: new Set(poisonedPlayerIds),
      illusionPlayerIds: new Set(illusionPlayerIds),
      playerEffects: cloneEffects(playerEffects),
      roleAssignments: { ...roleAssignments },
      gameCyclePhase,
      dayPhase,
      nightNumber,
    };
    const shouldLog = gmSnapshotLoaded && room?.status === "playing" && rolesAssigned;
    if (!shouldLog) {
      previousGameLogStateRef.current = currentState;
      gameLogDiffReadyRef.current = false;
      pendingGameActionLogSourcesRef.current.clear();
      return;
    }

    const previousState = previousGameLogStateRef.current;
    if (!gameLogDiffReadyRef.current || !previousState) {
      previousGameLogStateRef.current = currentState;
      gameLogDiffReadyRef.current = true;
      suppressedEffectLogAddsRef.current.clear();
      recordGameEvent({
        action: "phase",
        phase: gameCyclePhase === "day" ? dayPhase : gameCyclePhase,
        phaseNumber: nightNumber,
      });
      return;
    }

    const actorForRole = (role: RoleId | null | undefined) => getActorSnapshotForRole(role);
    const actorForTransition = (key: string, role: RoleId | null | undefined) => {
      const sourcePlayerId = pendingGameActionLogSourcesRef.current.get(key);
      pendingGameActionLogSourcesRef.current.delete(key);
      return sourcePlayerId ? getPlayerLogSnapshot(sourcePlayerId) : actorForRole(role);
    };
    const previousEffectivePhase: GameLogPhase = previousState.gameCyclePhase === "day" ? previousState.dayPhase : previousState.gameCyclePhase;
    const currentEffectivePhase: GameLogPhase = gameCyclePhase === "day" ? dayPhase : gameCyclePhase;
    const playerIds = new Set<string>([
      ...players.map((player) => player.id),
      ...Object.keys(previousState.playerStatuses),
      ...Object.keys(playerStatuses),
      ...Array.from(previousState.permanentlyDead),
      ...Array.from(permanentlyDead),
      ...Object.keys(previousState.playerEffects),
      ...Object.keys(playerEffects),
      ...Object.keys(previousState.roleAssignments),
      ...Object.keys(roleAssignments),
    ]);

    if (previousEffectivePhase !== currentEffectivePhase || previousState.nightNumber !== nightNumber) {
      // Structural marker for an empty/compact section in the log; it is not rendered as an event row.
      recordGameEvent({
        action: "phase",
        phase: currentEffectivePhase,
        phaseNumber: nightNumber,
      });
    }

    for (const poisonedId of poisonedPlayerIds) {
      if (!previousState.poisonedPlayerIds.has(poisonedId)) {
        recordGameEvent({
          action: "poison",
          actor: actorForTransition(`poison:${poisonedId}`, "e02"),
          actorRole: "e02",
          target: getPlayerLogSnapshot(poisonedId),
        });
      }
    }

    for (const illusionId of illusionPlayerIds) {
      if (!previousState.illusionPlayerIds.has(illusionId)) {
        recordGameEvent({
          action: "illusion",
          actor: actorForTransition(`illusion:${illusionId}`, "a06"),
          actorRole: "a06",
          target: getPlayerLogSnapshot(illusionId),
        });
      }
    }

    for (const playerId of playerIds) {
      const previousStatus = previousState.playerStatuses[playerId] ?? (previousState.permanentlyDead.has(playerId) ? "dead" : "alive");
      const currentStatus = playerStatuses[playerId] ?? (permanentlyDead.has(playerId) ? "dead" : "alive");

      if (previousStatus !== currentStatus) {
        if (currentStatus === "dead-this-night") {
          const source = killSources[playerId] ?? "manual";
          const sourceRole = source === "executado" || source === "manual" ? null : getSourceRole(source);
          const sourcePlayerId = killSourcePlayerIds[playerId];
          recordGameEvent({
            action: source === "executado" ? "execute" : "kill",
            actor: sourcePlayerId ? getPlayerLogSnapshot(sourcePlayerId) : actorForRole(sourceRole),
            actorRole: sourceRole,
            target: getPlayerLogSnapshot(playerId),
            source,
          });
        } else if (currentStatus === "alive" && (previousStatus === "dead" || previousStatus === "dead-this-night" || previousState.permanentlyDead.has(playerId))) {
          const pendingSourcePlayerId = pendingGameActionLogSourcesRef.current.get(`resurrect:${playerId}`);
          const sourceRole: RoleId | null = pendingSourcePlayerId
            ? abilityRoleAssignments[pendingSourcePlayerId] ?? null
            : previousState.permanentlyDead.has(playerId)
            ? "v18"
            : "e03";
          recordGameEvent({
            action: "resurrect",
            actor: actorForTransition(`resurrect:${playerId}`, sourceRole),
            actorRole: sourceRole,
            target: getPlayerLogSnapshot(playerId),
          });
        }
      }

      const previousEffects = previousState.playerEffects[playerId] || new Set<StatusEffect>();
      const currentEffects = playerEffects[playerId] || new Set<StatusEffect>();
      for (const effect of currentEffects) {
        if (previousEffects.has(effect)) continue;
        const transitionKey = `effect:${playerId}:${effect}`;
        if (suppressedEffectLogAddsRef.current.delete(`${playerId}:${effect}`)) {
          pendingGameActionLogSourcesRef.current.delete(transitionKey);
          continue;
        }
        const sourceRole = EFFECT_SOURCE_ROLES[effect] ?? null;
        recordGameEvent({
          action: "effect_add",
          actor: actorForTransition(transitionKey, sourceRole),
          actorRole: sourceRole,
          target: getPlayerLogSnapshot(playerId),
          effect,
        });
      }
      const previousRole = previousState.roleAssignments[playerId];
      const currentRole = roleAssignments[playerId];
      if (previousRole && currentRole && previousRole !== currentRole) {
        const pendingSource = pendingRoleChangeSourcesRef.current.get(playerId);
        pendingRoleChangeSourcesRef.current.delete(playerId);
        const sourceRole = pendingSource?.sourceRole
          ?? (previousRole === "a05" || currentRole === "a05" ? "a05" : null);
        const sourceSnapshot = pendingSource
          ? getPlayerLogSnapshot(pendingSource.sourcePlayerId)
          : actorForRole(sourceRole);
        const language = room?.language ?? "pt";
        recordGameEvent({
          action: "role_change",
          actor: sourceSnapshot && pendingSource ? { ...sourceSnapshot, role: pendingSource.sourceRole } : sourceSnapshot,
          actorRole: sourceRole,
          target: getPlayerLogSnapshot(playerId),
          detail: `${getRoleLabel(previousRole, language)} -> ${getRoleLabel(currentRole, language)}`,
        });
      }
    }

    previousGameLogStateRef.current = currentState;
  }, [
    gmSnapshotLoaded,
    room?.status,
    rolesAssigned,
    playerStatuses,
    permanentlyDead,
    poisonedPlayerIds,
    illusionPlayerIds,
    playerEffects,
    roleAssignments,
    abilityRoleAssignments,
    gameCyclePhase,
    dayPhase,
    nightNumber,
    killSources,
    killSourcePlayerIds,
    players,
    room?.language,
    getActorSnapshotForRole,
    getPlayerLogSnapshot,
    getSourceRole,
    recordGameEvent,
  ]);

  const clearEffectsFromDeadSources = useCallback((progressOrder: number) => {
    setPoisonTargetsBySource((previous) => Object.fromEntries(
      Object.entries(previous).filter(([sourcePlayerId]) => {
        if (sourcePlayerId === "manual") return true;
        const ownerPlayerId = dogWolfStates[sourcePlayerId]?.ownerPlayerId;
        const sourceInactive = permanentlyDead.has(sourcePlayerId)
          || (!!ownerPlayerId && permanentlyDead.has(ownerPlayerId));
        const sourceRole = ownerPlayerId
          ? effectiveRoleAssignments[ownerPlayerId]
          : abilityRoleAssignments[sourcePlayerId];
        return !sourceInactive || !sourceRole || getScriptOrderIndex(sourceRole) >= progressOrder;
      }),
    ));
    setIllusionTargetsBySource((previous) => Object.fromEntries(
      Object.entries(previous).filter(([sourcePlayerId]) => {
        if (sourcePlayerId === "manual") return true;
        const ownerPlayerId = dogWolfStates[sourcePlayerId]?.ownerPlayerId;
        const sourceInactive = permanentlyDead.has(sourcePlayerId)
          || (!!ownerPlayerId && permanentlyDead.has(ownerPlayerId));
        const sourceRole = ownerPlayerId
          ? effectiveRoleAssignments[ownerPlayerId]
          : abilityRoleAssignments[sourcePlayerId];
        return !sourceInactive || !sourceRole || getScriptOrderIndex(sourceRole) >= progressOrder;
      }),
    ));
    const inactiveSourcePlayerIds = Object.keys(sourcedEffectTargets).filter((sourcePlayerId) => {
      const ownerPlayerId = dogWolfStates[sourcePlayerId]?.ownerPlayerId;
      const sourceInactive = permanentlyDead.has(sourcePlayerId)
        || (!!ownerPlayerId && permanentlyDead.has(ownerPlayerId));
      const sourceRole = ownerPlayerId
        ? effectiveRoleAssignments[ownerPlayerId]
        : abilityRoleAssignments[sourcePlayerId];
      return sourceInactive && !!sourceRole && getScriptOrderIndex(sourceRole) < progressOrder;
    });
    if (inactiveSourcePlayerIds.length > 0) {
      const inactiveSources = new Set(inactiveSourcePlayerIds);
      const remainingTargets = Object.fromEntries(
        Object.entries(sourcedEffectTargets).filter(([sourcePlayerId]) => !inactiveSources.has(sourcePlayerId)),
      );
      setSourcedEffectTargets(remainingTargets);
      setPlayerEffects((previous) => {
        const next = { ...previous };
        for (const sourcePlayerId of inactiveSources) {
          for (const [effect, targetPlayerId] of Object.entries(sourcedEffectTargets[sourcePlayerId] || {})) {
            if (!targetPlayerId) continue;
            const retained = Object.values(remainingTargets).some((targets) => targets[effect as StatusEffect] === targetPlayerId);
            if (retained) continue;
            const effects = new Set(next[targetPlayerId] || []);
            effects.delete(effect as StatusEffect);
            next[targetPlayerId] = effects;
          }
        }
        return next;
      });
    }

    const deadSourceRoles = [...new Set(Object.values(effectiveRoleAssignments))].filter((role) => {
      if (getScriptOrderIndex(role) >= progressOrder) return false;
      const sourcePlayerIds = Object.entries(effectiveRoleAssignments)
        .filter(([, assignedRole]) => assignedRole === role)
        .map(([playerId]) => playerId);
      return sourcePlayerIds.length > 0 && sourcePlayerIds.every((playerId) => permanentlyDead.has(playerId));
    });
    if (deadSourceRoles.length === 0) return;

    if (deadSourceRoles.includes("e02")) {
      setPoisonTargetsBySource((previous) => Object.fromEntries(
        Object.entries(previous).filter(([sourcePlayerId]) => {
          if (sourcePlayerId === "manual") return true;
          if (permanentlyDead.has(sourcePlayerId)) return false;
          const ownerPlayerId = dogWolfStates[sourcePlayerId]?.ownerPlayerId;
          return !ownerPlayerId || !permanentlyDead.has(ownerPlayerId);
        }),
      ));
    }
    if (deadSourceRoles.includes("a06")) {
      setIllusionTargetsBySource((previous) => Object.fromEntries(
        Object.entries(previous).filter(([sourcePlayerId]) => {
          if (sourcePlayerId === "manual") return true;
          if (permanentlyDead.has(sourcePlayerId)) return false;
          const ownerPlayerId = dogWolfStates[sourcePlayerId]?.ownerPlayerId;
          return !ownerPlayerId || !permanentlyDead.has(ownerPlayerId);
        }),
      ));
    }
    if (deadSourceRoles.includes("v11")) setVillageElderLastTarget(null);
    if (deadSourceRoles.includes("v17")) setSaviourLastTarget(null);

    const effectsToRemove = new Set<StatusEffect>();
    deadSourceRoles.forEach((role) => DEAD_SOURCE_EFFECTS[role]?.forEach((effect) => effectsToRemove.add(effect)));
    if (effectsToRemove.size === 0) return;
    setPlayerEffects((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const [playerId, effects] of Object.entries(prev)) {
        const cleaned = new Set(effects);
        effectsToRemove.forEach((effect) => cleaned.delete(effect));
        if (cleaned.size !== effects.size) {
          next[playerId] = cleaned;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [abilityRoleAssignments, dogWolfStates, effectiveRoleAssignments, permanentlyDead, sourcedEffectTargets]);

  const handleScriptLineCompleted = useCallback((key: string, completed: boolean, progressOrder: number | null = null) => {
    setCompletedScriptLineKeys((prev) => {
      const next = new Set(prev);
      if (completed) next.add(key);
      else next.delete(key);
      return next;
    });
    if (completed && progressOrder !== null) clearEffectsFromDeadSources(progressOrder);
  }, [clearEffectsFromDeadSources]);

  const handleBigBadWolfChargeToggle = useCallback((idx: number) => {
    const newCharges = bigBadWolfCharges > idx ? idx : idx + 1;
    setBigBadWolfCharges(newCharges);
    if (newCharges > bigBadWolfCharges) {
      const m01Id = getRolePlayerId("m01");
      if (m01Id && !playerEffects[m01Id]?.has("immunity_full")) {
        toggleEffect(m01Id, "immunity_full");
      }
    }
  }, [getRolePlayerId, bigBadWolfCharges, playerEffects, toggleEffect]);

  const handleCupidChargeToggle = useCallback((idx: number) => {
    const cupidId = getRolePlayerId("s01");
    if (cupidId && isPlayerActingPoisoned(cupidId)) {
      toast.warning(getToast("warnCupidPoisoned", (room?.language as Language) || "pt"));
      return;
    }

    const newCharges = cupidCharges > idx ? idx : idx + 1;
    setCupidCharges(newCharges);
    setPlayerEffects((prev) => {
      const next = { ...prev };
      for (const [playerId, effects] of Object.entries(next)) {
        if (!effects.has("namorado")) continue;
        const updated = new Set(effects);
        if (newCharges > 0) updated.add("immunity_cupid");
        else updated.delete("immunity_cupid");
        next[playerId] = updated;
      }
      return next;
    });
  }, [cupidCharges, getRolePlayerId, isPlayerActingPoisoned, room?.language]);

  const handleActorPowerStateChange = useCallback((next: ActorPowerState) => {
    if (!actorPlayerId) return;
    handleIndependentPowerStateChange(actorPlayerId, next);
  }, [actorPlayerId, handleIndependentPowerStateChange]);

  const handleScriptRolesVisible = useCallback((visibleRoles: RoleId[]) => {
    if (!Object.values(abilityRoleAssignments).includes("f02")) return;
    const visibleRoleSet = new Set(visibleRoles);
    setPlayerEffects((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const [pid, role] of Object.entries(abilityRoleAssignments)) {
        if (pid === drunkardPlayerId) continue;
        if (!visibleRoleSet.has(role) && !(pid === actorPlayerId && visibleRoleSet.has("a04"))) continue;
        const cur = new Set(next[pid] || []);
        if (cur.has("spied_on")) continue;
        suppressedEffectLogAddsRef.current.add(`${pid}:spied_on`);
        cur.add("spied_on");
        next[pid] = cur;
        changed = true;
      }
      return changed ? next : prev;
    });
  }, [abilityRoleAssignments, actorPlayerId, drunkardPlayerId]);

  // Vampire victim id (player with werewolf_turned effect, transformed by Vampire Wolf)
  const vampireVictimId = useMemo(() => {
    for (const [pid, eff] of Object.entries(playerEffects)) {
      if (eff.has("werewolf_turned")) return pid;
    }
    return null;
  }, [playerEffects]);

  // Set of players who are "powerless" (their role line should not appear in the script)
  const powerlessPlayerIds = useMemo(() => {
    const s = new Set<string>();
    if (vampireVictimId && !vampireVictimKeepsPower) s.add(vampireVictimId);
    return s;
  }, [vampireVictimId, vampireVictimKeepsPower]);

  const resetUsesForRoleId = useCallback((role: RoleId | undefined) => {
    if (!role) return;
    if (role === "e03") setShamanCharges(0);
    if (role === "v10") setParanoidCharges(0);
    if (role === "v18") setAngelCharges(0);
    if (role === "m01") setBigBadWolfCharges(0);
    if (role === "s01") setCupidCharges(0);
    if (role === "m02") setWerewolfSeerUsed(false);
    if (role === "m03") setVampireWolfUsed(false);
    if (role === "v04") setFoxDisabled(false);
    if (role === "v23") setSpiderDayChangeUsed(false);
  }, []);

  // Reset uses for resurrected player based on their role
  const resetUsesForRole = useCallback((playerId: string) => {
    if (playerId === actorPlayerId && actorCopiedRole) {
      setActorPowerState({ ...EMPTY_ACTOR_POWER_STATE });
      return;
    }
    resetUsesForRoleId(roleAssignments[playerId]);
  }, [actorCopiedRole, actorPlayerId, resetUsesForRoleId, roleAssignments]);

  const applySourcedEffect = useCallback((
    sourcePlayerId: string | null | undefined,
    targetPlayerId: string,
    effect: StatusEffect,
  ) => {
    if (!sourcePlayerId) {
      toggleEffect(targetPlayerId, effect);
      return;
    }
    const previousTargetId = sourcedEffectTargets[sourcePlayerId]?.[effect] ?? null;
    const nextTargets = {
      ...sourcedEffectTargets,
      [sourcePlayerId]: {
        ...sourcedEffectTargets[sourcePlayerId],
        [effect]: previousTargetId === targetPlayerId ? undefined : targetPlayerId,
      },
    };
    setSourcedEffectTargets(nextTargets);
    setPlayerEffects((previousEffects) => {
      const nextEffects = { ...previousEffects };
      if (previousTargetId) {
        const retainedByAnotherSource = Object.entries(nextTargets).some(([otherSourceId, targets]) => (
          otherSourceId !== sourcePlayerId && targets[effect] === previousTargetId
        ));
        if (!retainedByAnotherSource) {
          const previousTargetEffects = new Set(nextEffects[previousTargetId] || []);
          previousTargetEffects.delete(effect);
          nextEffects[previousTargetId] = previousTargetEffects;
        }
      }
      if (previousTargetId !== targetPlayerId) {
        const targetEffects = new Set(nextEffects[targetPlayerId] || []);
        targetEffects.add(effect);
        nextEffects[targetPlayerId] = targetEffects;
        pendingGameActionLogSourcesRef.current.set(`effect:${targetPlayerId}:${effect}`, sourcePlayerId);
      }
      return nextEffects;
    });
  }, [sourcedEffectTargets, toggleEffect]);

  // Handle drag-drop actions (both list and circle)
  const handleDragAction = useCallback((action: string, targetPlayerId: string, sourcePlayerId?: string | null) => {
    // Universal "caught" tagging — any drag onto a webbed player tags the source
    const applyCaughtIfWebbed = () => {
      if (!sourcePlayerId || sourcePlayerId === targetPlayerId) return;
      const sourceRole = abilityRoleAssignments[sourcePlayerId];
      if (sourceRole && WEB_IMMUNE_ROLES.includes(sourceRole)) return;
      const targetEff = playerEffects[targetPlayerId];
      if (targetEff?.has("webbed")) {
        const matchingSpiderIds = Object.entries(sourcedEffectTargets)
          .filter(([, targets]) => targets.webbed === targetPlayerId)
          .map(([spiderPlayerId]) => spiderPlayerId);
        const spiderPlayerIds = matchingSpiderIds.length > 0
          ? matchingSpiderIds
          : Object.entries(abilityRoleAssignments)
            .filter(([, role]) => role === "v23")
            .map(([spiderPlayerId]) => spiderPlayerId);
        setSpiderCaughtBySource((previous) => {
          const next = { ...previous };
          for (const spiderPlayerId of spiderPlayerIds) {
            const caughtPlayerIds = next[spiderPlayerId] ?? [];
            if (!caughtPlayerIds.includes(sourcePlayerId)) {
              next[spiderPlayerId] = [...caughtPlayerIds, sourcePlayerId];
            }
          }
          return next;
        });
        const srcEff = playerEffects[sourcePlayerId] || new Set<StatusEffect>();
        if (!srcEff.has("caught")) {
          setPlayerEffects((prev) => {
            const next = { ...prev };
            const cur = new Set(next[sourcePlayerId] || []);
            cur.add("caught");
            next[sourcePlayerId] = cur;
            return next;
          });
        }
      }
    };
    if (action === "__catch__") {
      applyCaughtIfWebbed();
      return;
    }
    const actionRole: RoleId | null = action === "poison"
      ? "e02"
      : action === "kill"
      ? "e01"
      : action === "shaman"
      ? "e03"
      : action === "illusion"
      ? "a06"
      : action.startsWith("role-") && ROLES[action.replace("role-", "") as RoleId]
      ? action.replace("role-", "") as RoleId
      : null;
    if (action === "kill") {
      const blocked = sourcePlayerId && dogWolfStates[sourcePlayerId]
        ? isPlayerActingPoisoned(sourcePlayerId)
        : werewolfPackPoisoned;
      if (blocked) {
        toast.warning(getToast("warnWolvesPoisoned", (room?.language as Language) || "pt"));
        return;
      }
    }
    const independentPowerState = sourcePlayerId ? independentPowerStates[sourcePlayerId] : undefined;
    const updateIndependentPowerState = (powerState: ActorPowerState) => {
      if (sourcePlayerId) handleIndependentPowerStateChange(sourcePlayerId, powerState);
    };
    const publicSourceRole = sourcePlayerId
      ? roleAssignments[sourcePlayerId] ?? actionRole
      : actionRole;
    const toggleActionEffect = (playerId: string, effect: StatusEffect) => {
      if (SOURCE_SCOPED_EFFECTS.has(effect)) applySourcedEffect(sourcePlayerId, playerId, effect);
      else toggleEffect(playerId, effect, sourcePlayerId);
    };
    const dogEvilCupidState = actionRole === "m05" && sourcePlayerId
      ? dogWolfStates[sourcePlayerId]
      : null;
    const livingDogEnemyIds = dogEvilCupidState?.enemyPlayerIds
      .filter((playerId) => !permanentlyDead.has(playerId)) ?? [];
    const nextDogEnemyCount = livingDogEnemyIds.includes(targetPlayerId)
      ? livingDogEnemyIds.length - 1
      : livingDogEnemyIds.length + 1;
    if (actionRole && (!dogEvilCupidState || nextDogEnemyCount >= 2)) {
      markScriptRoleAction(actionRole, sourcePlayerId);
    }
    applyCaughtIfWebbed();
    if (action === "poison") {
      handlePlayerStatusChange(targetPlayerId, "poisoned", undefined, sourcePlayerId);
      setNightTargetedPlayerIds((prev) => { const n = new Set(prev); n.add(targetPlayerId); return n; });
    } else if (action === "kill") {
      handlePlayerStatusChange(targetPlayerId, "dead-this-night", publicSourceRole ?? "e01", sourcePlayerId);
    } else if (action === "shaman") {
      handleShamanDrop(targetPlayerId, sourcePlayerId);
    } else if (action === "illusion") {
      const illusionistId = sourcePlayerId && abilityRoleAssignments[sourcePlayerId] === "a06" ? sourcePlayerId : getRolePlayerId("a06");
      if (illusionistId && isPlayerActingPoisoned(illusionistId)) return;
      handleSetIllusion(targetPlayerId, sourcePlayerId);
    } else if (action.startsWith("role-")) {
      const roleSource = action.replace("role-", "");
      const isMimeSource = !!sourcePlayerId && roleAssignments[sourcePlayerId] === "a03";
      // Role-specific drag actions that add effects instead of killing
      if (roleSource === "a02") {
        const dogPlayerId = sourcePlayerId && dogWolfPlayerIds.includes(sourcePlayerId)
          ? sourcePlayerId
          : activeDogWolfPlayerIds[0];
        if (!dogPlayerId || targetPlayerId === dogPlayerId) return;
        setDogWolfOwner(dogPlayerId, targetPlayerId);
      }
      else if (roleSource === "a04") {
        const dogState = sourcePlayerId ? dogWolfStates[sourcePlayerId] : null;
        if (sourcePlayerId && dogState) {
          if (targetPlayerId === sourcePlayerId || permanentlyDead.has(targetPlayerId) || dogState.actorIdolUses >= 2 || dogState.independentRole) return;
          pendingGameActionLogSourcesRef.current.set(`effect:${targetPlayerId}:idol_dog`, sourcePlayerId);
          setDogWolfStates((previous) => ({
            ...previous,
            [sourcePlayerId]: {
              ...previous[sourcePlayerId],
              actorIdolPlayerId: targetPlayerId,
              actorIdolUses: getActorIdolUsesAfterSelection(
                previous[sourcePlayerId]?.actorIdolPlayerId ?? null,
                targetPlayerId,
                previous[sourcePlayerId]?.actorIdolUses ?? 0,
              ),
              actorModeActive: true,
              independentRole: null,
              objectiveRoleOverride: null,
              powerState: { ...EMPTY_ACTOR_POWER_STATE },
            },
          }));
        } else {
          if (!actorPlayerId || sourcePlayerId !== actorPlayerId || targetPlayerId === actorPlayerId || permanentlyDead.has(targetPlayerId) || actorIdolUses >= 2 || actorCopiedRole) return;
          toggleActionEffect(targetPlayerId, "idol");
        }
      }
      else if (roleSource === "v19") {
        const prophetId = sourcePlayerId && abilityRoleAssignments[sourcePlayerId] === "v19" ? sourcePlayerId : getRolePlayerId("v19");
        if (prophetId && isPlayerActingPoisoned(prophetId)) {
          toast.warning(getToast("warnProphetPoisoned", (room?.language as Language) || "pt"));
          return;
        }
        toggleActionEffect(targetPlayerId, "profecia");
      }
      else if (roleSource === "v22") {
        if (!playerEffects[targetPlayerId]?.has("acusado")) toggleActionEffect(targetPlayerId, "acusado_next");
      }
      else if (roleSource === "v16") {
        // Sonâmbulo: if poisoned → random (excluding intended target & sleepwalker)
        const sleepwalkerId = sourcePlayerId && abilityRoleAssignments[sourcePlayerId] === "v16" ? sourcePlayerId : getRolePlayerId("v16");
        if (sleepwalkerId && isPlayerActingPoisoned(sleepwalkerId)) {
          const random = pickRandomPlayer((p) => !permanentlyDead.has(p.id) && p.id !== targetPlayerId && p.id !== sleepwalkerId);
          if (random) {
            toggleActionEffect(random.id, "hospede");
            toast.info(format(getToast("infoSleepwalkerPoisoned", (room?.language as Language) || "pt"), { name: random.name }));
          }
        } else {
          toggleActionEffect(targetPlayerId, "hospede");
        }
      }
      else if (roleSource === "v17") {
        // Saviour: if poisoned → random (excluding intended target & saviour)
        const saviourId = sourcePlayerId && abilityRoleAssignments[sourcePlayerId] === "v17" ? sourcePlayerId : getRolePlayerId("v17");
        const previousTarget = independentPowerState?.saviourLastTarget ?? saviourLastTarget;
        let actualTarget = targetPlayerId;
        if (saviourId && isPlayerActingPoisoned(saviourId)) {
          const random = pickRandomPlayer((p) => !permanentlyDead.has(p.id) && p.id !== targetPlayerId && p.id !== saviourId);
          if (random) {
            actualTarget = random.id;
            toast.info(format(getToast("infoSaviourPoisoned", (room?.language as Language) || "pt"), { name: random.name }));
          }
        }
        // Remove immunity from previous Saviour target if different
        if (previousTarget && previousTarget !== actualTarget) {
          const prevEff = playerEffects[previousTarget] || new Set();
          if (prevEff.has("immunity_full")) toggleActionEffect(previousTarget, "immunity_full");
        }
        toggleActionEffect(actualTarget, "immunity_full");
        if (independentPowerState) updateIndependentPowerState({ ...independentPowerState, saviourLastTarget: actualTarget });
        else setSaviourLastTarget(actualTarget);
      }
      else if (roleSource === "v24") {
        const vintnerId = sourcePlayerId && abilityRoleAssignments[sourcePlayerId] === "v24" ? sourcePlayerId : getRolePlayerId("v24");
        if (!vintnerId) return;
        let actualTarget = targetPlayerId;
        if (isPlayerActingPoisoned(vintnerId)) {
          const random = pickRandomPlayer((p) =>
            !permanentlyDead.has(p.id)
            && playerStatuses[p.id] !== "dead-this-night"
            && p.id !== vintnerId
            && p.id !== targetPlayerId
          );
          if (!random) {
            toast.warning(getToast("warnNoTargets", (room?.language as Language) || "pt"));
            return;
          }
          actualTarget = random.id;
          toast.info(format(getToast("infoVintnerPoisoned", (room?.language as Language) || "pt"), { name: random.name }));
        }
        handlePlayerStatusChange(actualTarget, "poisoned", undefined, vintnerId);
        applySourcedEffect(vintnerId, actualTarget, "immunity_full");
        setNightTargetedPlayerIds((prev) => { const next = new Set(prev); next.add(actualTarget); return next; });
      }
      else if (roleSource === "v09") {
        const captainId = sourcePlayerId && abilityRoleAssignments[sourcePlayerId] === "v09" ? sourcePlayerId : getRolePlayerId("v09");
        let soldierId = targetPlayerId;
        if (captainId && isPlayerActingPoisoned(captainId)) {
          const random = pickRandomPlayer((p) =>
            !permanentlyDead.has(p.id)
            && playerStatuses[p.id] !== "dead-this-night"
            && p.id !== captainId
            && p.id !== targetPlayerId
          );
          if (!random) return;
          soldierId = random.id;
        }
        toggleActionEffect(soldierId, "soldado");
      }
      else if (roleSource === "v11") {
        const villageElderId = sourcePlayerId && abilityRoleAssignments[sourcePlayerId] === "v11" ? sourcePlayerId : getRolePlayerId("v11");
        const isPoisoned = villageElderId && isPlayerActingPoisoned(villageElderId);
        const effectKey: StatusEffect = isPoisoned ? "vote_double" : "vote_against";
        const previousTarget = independentPowerState?.villageElderLastTarget ?? villageElderLastTarget;
        // Remove from previous villageElder target if different
        if (previousTarget && previousTarget !== targetPlayerId) {
          const prevEff = playerEffects[previousTarget] || new Set();
          if (prevEff.has(effectKey)) toggleActionEffect(previousTarget, effectKey);
          // Also clear the alternate key in case it was previously applied
          const otherKey: StatusEffect = effectKey === "vote_double" ? "vote_against" : "vote_double";
          if (prevEff.has(otherKey)) toggleActionEffect(previousTarget, otherKey);
        }
        toggleActionEffect(targetPlayerId, effectKey);
        if (independentPowerState) updateIndependentPowerState({ ...independentPowerState, villageElderLastTarget: targetPlayerId });
        else setVillageElderLastTarget(targetPlayerId);
      }
      else if (roleSource === "f01") {
        const thiefId = sourcePlayerId && abilityRoleAssignments[sourcePlayerId] === "f01" ? sourcePlayerId : getRolePlayerId("f01");
        if (thiefId && isPlayerActingPoisoned(thiefId)) {
          toast.warning(getToast("warnThiefPoisoned", (room?.language as Language) || "pt"));
          return;
        }
        toggleActionEffect(targetPlayerId, "vote_revoked");
      }
      else if (roleSource === "l02") {
        const childId = sourcePlayerId && abilityRoleAssignments[sourcePlayerId] === "l02" ? sourcePlayerId : getRolePlayerId("l02");
        if (childId && isPlayerActingPoisoned(childId)) {
          if (!playerEffects[childId]?.has("werewolf_turned")) toggleActionEffect(childId, "werewolf_turned");
        } else if (childId && dogWolfStates[childId]) {
          pendingGameActionLogSourcesRef.current.set(`effect:${targetPlayerId}:adoptive_dad_dog`, childId);
          setDogWolfStates((previous) => ({
            ...previous,
            [childId]: { ...previous[childId], adoptiveDadPlayerId: targetPlayerId },
          }));
        } else {
          toggleActionEffect(targetPlayerId, "adoptive_dad");
        }
      }
      else if (roleSource === "s01") {
        const cupidId = sourcePlayerId && abilityRoleAssignments[sourcePlayerId] === "s01" ? sourcePlayerId : getRolePlayerId("s01");
        if (cupidId && isPlayerActingPoisoned(cupidId)) {
          toast.warning(getToast("warnCupidPoisoned", (room?.language as Language) || "pt"));
          return;
        }
        if (cupidId && dogWolfStates[cupidId]) return;
        toggleActionEffect(targetPlayerId, "namorado");
      }
      else if (roleSource === "m05") {
        const evilCupidId = sourcePlayerId && abilityRoleAssignments[sourcePlayerId] === "m05" ? sourcePlayerId : getRolePlayerId("m05");
        if (!evilCupidId) return;
        if (dogWolfStates[evilCupidId]) {
          const state = dogWolfStates[evilCupidId];
          const livingEnemyIds = (state.enemyPlayerIds ?? []).filter((playerId) => !permanentlyDead.has(playerId));
          const alreadySelected = livingEnemyIds.includes(targetPlayerId);
          if (!alreadySelected && livingEnemyIds.length >= 2) {
            toast.warning(getToast("warn2Enemies", (room?.language as Language) || "pt"));
            return;
          }
          const enemyPlayerIds = alreadySelected
            ? livingEnemyIds.filter((playerId) => playerId !== targetPlayerId)
            : [...livingEnemyIds, targetPlayerId];
          if (!alreadySelected) {
            pendingGameActionLogSourcesRef.current.set(`effect:${targetPlayerId}:enemy_dog`, evilCupidId);
          }
          setDogWolfStates((previous) => ({
            ...previous,
            [evilCupidId]: { ...previous[evilCupidId], enemyPlayerIds },
          }));
        } else {
          toggleActionEffect(targetPlayerId, "enemy");
        }
      }
      else if (roleSource === "v15") {
        // Piromaníaco: poisoned → random Inocentado target gets incendiado
        const piroId = sourcePlayerId && abilityRoleAssignments[sourcePlayerId] === "v15" ? sourcePlayerId : getRolePlayerId("v15");
        const targetEffects = playerEffects[targetPlayerId] || new Set();
        if (piroId && isPlayerActingPoisoned(piroId)) {
          const ownedInnocentTarget = sourcedEffectTargets[piroId]?.inocentado;
          const inocentados = players.filter((p) =>
            playerEffects[p.id]?.has("inocentado")
            && (!ownedInnocentTarget || p.id === ownedInnocentTarget)
            && p.id !== piroId
            && p.id !== targetPlayerId
          );
          if (inocentados.length > 0) {
            const victim = inocentados[Math.floor(Math.random() * inocentados.length)];
            toggleActionEffect(victim.id, "incendiado");
            toast.info(format(getToast("infoPiromaniacPoisoned", (room?.language as Language) || "pt"), { name: victim.name }));
          }
        } else if (targetEffects.has("inocentado") && (!piroId || sourcedEffectTargets[piroId]?.inocentado === targetPlayerId)) {
          toggleActionEffect(targetPlayerId, "incendiado");
        } else {
          toggleActionEffect(targetPlayerId, "inocentado");
        }
      }
      else if (roleSource === "v18") {
        // Angel: needs to be perma-dead target. If poisoned → random other perma-dead.
        const charges = independentPowerState?.angelCharges ?? angelCharges;
        if (!isMimeSource && charges >= 2) {
          toast.warning(getToast("warnAngelUsedAll", (room?.language as Language) || "pt"));
          return;
        }
        const angelId = sourcePlayerId && abilityRoleAssignments[sourcePlayerId] === "v18" ? sourcePlayerId : getRolePlayerId("v18");
        const isPoisoned = angelId && isPlayerActingPoisoned(angelId);
        let resurrectId: string | null = targetPlayerId;
        if (isPoisoned) {
          const random = pickRandomPlayer((p) => permanentlyDead.has(p.id) && p.id !== targetPlayerId, angelId || undefined);
          if (random) {
            resurrectId = random.id;
            toast.info(format(getToast("infoAngelPoisoned", (room?.language as Language) || "pt"), { name: random.name }));
          } else {
            resurrectId = null;
          }
        }
        if (resurrectId && permanentlyDead.has(resurrectId)) {
          if (isMimeSource) {
            setMimeAngelSavedPlayerId(resurrectId);
          } else {
            handlePlayerStatusChange(resurrectId, "alive", undefined, sourcePlayerId);
            resetUsesForRole(resurrectId);
            if (independentPowerState) updateIndependentPowerState({ ...independentPowerState, angelCharges: Math.min(independentPowerState.angelCharges + 1, 2) });
            else setAngelCharges((c) => Math.min(c + 1, 2));
          }
        } else if (resurrectId) {
          toast.warning(getToast("warnAngelUsedAll", (room?.language as Language) || "pt"));
        }
      }
      else if (roleSource === "v08") {
        const hunterId = sourcePlayerId && abilityRoleAssignments[sourcePlayerId] === "v08" ? sourcePlayerId : getRolePlayerId("v08");
        let killId = targetPlayerId;
        if (hunterId && isPlayerActingPoisoned(hunterId)) {
          const random = pickRandomPlayer((p) =>
            !permanentlyDead.has(p.id)
            && playerStatuses[p.id] !== "dead-this-night"
            && p.id !== hunterId
            && p.id !== targetPlayerId
          );
          if (!random) return;
          killId = random.id;
        }
        handlePlayerStatusChange(killId, "dead-this-night", publicSourceRole ?? "v08", sourcePlayerId);
      }
      else if (roleSource === "s02") {
        const whiteWolfId = sourcePlayerId && abilityRoleAssignments[sourcePlayerId] === "s02" ? sourcePlayerId : getRolePlayerId("s02");
        if (!whiteWolfId) return;
        const whiteWolfPlayers: WhiteWolfPlayerState[] = players.map((player) => ({
          id: player.id,
          role: abilityRoleAssignments[player.id],
          alive: !permanentlyDead.has(player.id)
            && playerStatuses[player.id] !== "dead"
            && playerStatuses[player.id] !== "dead-this-night",
          werewolfTurned: !!playerEffects[player.id]?.has("werewolf_turned"),
        }));
        if (canWhiteWolfTarget(whiteWolfPlayers, whiteWolfId, targetPlayerId)) {
          handlePlayerStatusChange(targetPlayerId, "dead-this-night", publicSourceRole ?? "s02", sourcePlayerId);
        }
      }
      else if (roleSource === "m02" || roleSource === "m03") {
        const sourceId = sourcePlayerId && abilityRoleAssignments[sourcePlayerId] === roleSource ? sourcePlayerId : getRolePlayerId(roleSource as RoleId);
        if (sourceId && isPlayerActingPoisoned(sourceId)) return;
        if (independentPowerState && roleSource === "m03") {
          if (sourcePlayerId) {
            pendingGameActionLogSourcesRef.current.set(`effect:${targetPlayerId}:werewolf_turned`, sourcePlayerId);
            if (playerStatuses[targetPlayerId] === "dead" || playerStatuses[targetPlayerId] === "dead-this-night" || permanentlyDead.has(targetPlayerId)) {
              pendingGameActionLogSourcesRef.current.set(`resurrect:${targetPlayerId}`, sourcePlayerId);
            }
          }
          setPlayerEffects((prev) => {
            const current = new Set(prev[targetPlayerId] || []);
            current.add("werewolf_turned");
            return { ...prev, [targetPlayerId]: current };
          });
          setPlayerStatuses((prev) => ({ ...prev, [targetPlayerId]: "alive" }));
          updateIndependentPowerState({ ...independentPowerState, vampireWolfUsed: true });
        } else {
          toggleActionEffect(targetPlayerId, "werewolf_turned");
        }
      }
      else if (roleSource === "v10" || roleSource === "v10-poisoned") {
        const charges = independentPowerState?.paranoidCharges ?? paranoidCharges;
        if (!isMimeSource && charges >= 2) {
          toast.warning(getToast("warnParanoidUsedAll", (room?.language as Language) || "pt"));
          return;
        }
        const paranoidId = sourcePlayerId && abilityRoleAssignments[sourcePlayerId] === "v10" ? sourcePlayerId : getRolePlayerId("v10");
        let killId = targetPlayerId;
        if (paranoidId && isPlayerActingPoisoned(paranoidId)) {
          const random = pickRandomPlayer((p) => !permanentlyDead.has(p.id) && p.id !== paranoidId && p.id !== targetPlayerId);
          if (!random) { toast.warning(getToast("warnNoTargets", (room?.language as Language) || "pt")); return; }
          killId = random.id;
          toast.info(format(getToast("infoParanoidPoisoned", (room?.language as Language) || "pt"), { name: random.name }));
        }
        handlePlayerStatusChange(killId, "dead-this-night", publicSourceRole ?? "v10", sourcePlayerId);
        if (!isMimeSource) {
          if (independentPowerState) updateIndependentPowerState({ ...independentPowerState, paranoidCharges: Math.min(independentPowerState.paranoidCharges + 1, 2) });
          else setParanoidCharges((c) => Math.min(c + 1, 2));
        }
        setParanoidKillName(players.find(p => p.id === killId)?.name || null);
        setDayKilledPlayerIds((prev) => [...prev, killId]);
      }
      else if (roleSource === "v23") {
        if (gameCyclePhase !== "night") {
          const used = independentPowerState?.spiderDayChangeUsed ?? spiderDayChangeUsed;
          if (used) {
            toast.warning(getToast("warnNoTargets", (room?.language as Language) || "pt"));
            return;
          }
          if (independentPowerState) updateIndependentPowerState({ ...independentPowerState, spiderDayChangeUsed: true });
          else setSpiderDayChangeUsed(true);
        }
        applySourcedEffect(sourcePlayerId, targetPlayerId, "webbed");
      }
      else if (roleSource === "a05") {
        // Rouba-Túmulos: marks a red-X victim. The actual swap happens if that
        // marked victim becomes permanently dead at the end of the night.
        const a05Id = sourcePlayerId && abilityRoleAssignments[sourcePlayerId] === "a05" ? sourcePlayerId : getRolePlayerId("a05");
        if (!a05Id) return;
        if (isPlayerActingPoisoned(a05Id)) {
          toast.warning(getToast("warnGraveRobberPoisoned", (room?.language as Language) || "pt"));
          return;
        }
        if (playerStatuses[targetPlayerId] !== "dead-this-night") {
          toast.error(getToast("errGraveRobberOnlyRedX", (room?.language as Language) || "pt"));
          return;
        }
        const dogGraveRobber = !!dogWolfStates[a05Id];
        const mimeGraveRobber = roleAssignments[a05Id] === "a03";
        const effectKey: StatusEffect = mimeGraveRobber ? "dug_up_mime" : dogGraveRobber ? "dug_up_dog" : "dug_up";
        applySourcedEffect(a05Id, targetPlayerId, effectKey);
        toast.success(getToast("okGraveRobber", (room?.language as Language) || "pt"));
      }
      else if (roleSource === "l06") {
        const servantId = sourcePlayerId && abilityRoleAssignments[sourcePlayerId] === "l06" ? sourcePlayerId : getRolePlayerId("l06");
        if (!servantId || targetPlayerId === servantId) return;
        if (isPlayerActingPoisoned(servantId)) {
          toast.warning(getToast("warnDevoutServantPoisoned", (room?.language as Language) || "pt"));
          return;
        }
        if (playerStatuses[targetPlayerId] !== "dead-this-night") {
          toast.error(getToast("errDevoutServantDragOnlyDead", (room?.language as Language) || "pt"));
          return;
        }
        handlePlayerStatusChange(targetPlayerId, "alive", undefined, servantId);
        setPlayerStatuses((prev) => ({ ...prev, [servantId]: "dead-this-night" }));
        setKillSources((prev) => ({ ...prev, [servantId]: "l06" }));
        setKillSourcePlayerIds((prev) => ({ ...prev, [servantId]: servantId }));
        toast.success(getToast("okDevoutServantRessurected", (room?.language as Language) || "pt"));
      }
      else if (roleSource === "soldier-kill") {
        // Soldier ghost kill
        handlePlayerStatusChange(targetPlayerId, "dead-this-night", "soldier", sourcePlayerId);
      }
      else {
        handlePlayerStatusChange(targetPlayerId, "dead-this-night", publicSourceRole ?? roleSource, sourcePlayerId);
      }
    }
  }, [abilityRoleAssignments, activeDogWolfPlayerIds, actorCopiedRole, actorIdolUses, actorPlayerId, applySourcedEffect, dogWolfPlayerIds, dogWolfStates, handleIndependentPowerStateChange, handlePlayerStatusChange, handleShamanDrop, handleSetIllusion, independentPowerStates, toggleEffect, players, playerEffects, gameCyclePhase, angelCharges, getRolePlayerId, isPlayerActingPoisoned, pickRandomPlayer, permanentlyDead, resetUsesForRole, roleAssignments, saviourLastTarget, villageElderLastTarget, playerStatuses, paranoidCharges, setDogWolfOwner, sourcedEffectTargets, spiderDayChangeUsed, markScriptRoleAction, room?.language, werewolfPackPoisoned]);

  const handleListDrop = (e: React.DragEvent, targetPlayerId: string) => {
    e.preventDefault();
    const action = e.dataTransfer.getData("action");
    const sourcePlayerId = e.dataTransfer.getData("sourcePlayerId") || null;
    if (action) handleDragAction(action, targetPlayerId, sourcePlayerId);
  };

  const handleListDragOver = (e: React.DragEvent) => e.preventDefault();

  const getListDragProps = (playerId: string) => {
    if (!isPlaying) return {};
    const role = abilityRoleAssignments[playerId];
    const dogState = dogWolfStates[playerId];
    const roleAction = ROLE_DRAG_ACTIONS[role];
    if (roleAction && !permanentlyDead.has(playerId)) {
      // a05 disabled when poisoned
      if (role === "a05" && isPlayerPoisoned(playerId)) return {};
      if (dogState && role === "s01") return {};
      if (dogState && role === "a04" && (dogState.actorIdolUses >= 2 || dogState.independentRole)) return {};
      if (!dogState && role === "a04" && actorIdolUses >= 2) return {};
      return {
        draggable: true,
        onDragStart: (e: React.DragEvent) => {
          e.dataTransfer.setData("action", roleAction);
          e.dataTransfer.setData("sourcePlayerId", playerId);
          e.dataTransfer.effectAllowed = "move";
        },
      };
    }
    if (role === POISON_DRAG_ROLE && !permanentlyDead.has(playerId)) {
      return {
        draggable: true,
        onDragStart: (e: React.DragEvent) => {
          e.dataTransfer.setData("action", "poison");
          e.dataTransfer.setData("sourcePlayerId", playerId);
          e.dataTransfer.effectAllowed = "move";
        },
      };
    }
    if (role === KILL_DRAG_ROLE) {
      const blocked = dogState ? isPlayerActingPoisoned(playerId) : werewolfPackPoisoned;
      if (blocked) return {};
      return {
        draggable: true,
        onDragStart: (e: React.DragEvent) => {
          e.dataTransfer.setData("action", "kill");
          e.dataTransfer.setData("sourcePlayerId", playerId);
          e.dataTransfer.effectAllowed = "move";
        },
      };
    }
    if (role === SHAMAN_ROLE && !permanentlyDead.has(playerId)) {
      return {
        draggable: true,
        onDragStart: (e: React.DragEvent) => {
          if (isPlayerActingPoisoned(playerId)) {
            e.preventDefault();
            toast.warning(getToast("warnShamanPoisoned", (room?.language as Language) || "pt"));
            return;
          }
          e.dataTransfer.setData("action", "shaman");
          e.dataTransfer.setData("sourcePlayerId", playerId);
          e.dataTransfer.effectAllowed = "move";
        },
      };
    }
    if (role === ILLUSION_DRAG_ROLE && !permanentlyDead.has(playerId)) {
      return {
        draggable: true,
        onDragStart: (e: React.DragEvent) => {
          e.dataTransfer.setData("action", "illusion");
          e.dataTransfer.setData("sourcePlayerId", playerId);
          e.dataTransfer.effectAllowed = "move";
        },
      };
    }
    // Paranoid drag
    if (role === "v10" && !permanentlyDead.has(playerId) && paranoidCharges < 2) {
      return {
        draggable: true,
        onDragStart: (e: React.DragEvent) => {
          if (isPlayerPoisoned(playerId)) {
            e.dataTransfer.setData("action", "role-v10");
          } else {
            e.dataTransfer.setData("action", "role-v10");
          }
          e.dataTransfer.setData("sourcePlayerId", playerId);
          e.dataTransfer.effectAllowed = "move";
        },
      };
    }
    return {};
  };

  const getRevealRecipientIds = useCallback((
    role: RoleId,
    sourcePlayerId?: string | null,
    mode: "shared" | "independent" | "poison-sensitive" = "shared",
  ) => {
    const sourceId = sourcePlayerId ?? getRolePlayerId(role);
    if (!sourceId) return [];
    if (mode === "independent") return permanentlyDead.has(sourceId) ? [] : [sourceId];
    const recipients = new Set<string>([sourceId]);
    const ownerPlayerId = dogWolfStates[sourceId]?.ownerPlayerId;
    if (ownerPlayerId && !permanentlyDead.has(ownerPlayerId)) recipients.add(ownerPlayerId);
    for (const dogPlayerId of activeDogWolfPlayerIds) {
      if (dogWolfStates[dogPlayerId]?.ownerPlayerId === sourceId && abilityRoleAssignments[dogPlayerId] === role) {
        recipients.add(dogPlayerId);
      }
    }
    const activeRecipients = Array.from(recipients).filter((playerId) => !permanentlyDead.has(playerId));
    if (mode === "poison-sensitive" && activeRecipients.some((playerId) => (
      isPlayerActingPoisoned(playerId) !== isPlayerActingPoisoned(sourceId)
    ))) return [sourceId];
    return activeRecipients;
  }, [abilityRoleAssignments, activeDogWolfPlayerIds, dogWolfStates, getRolePlayerId, isPlayerActingPoisoned, permanentlyDead]);

  const getMimeCopyCandidate = useCallback((): { role: RoleId; cornerRole: RoleId | null; mechanicRole: RoleId | null } | null => {
    const rolesInGame = new Set(
      Object.values(roleAssignments).filter((role): role is RoleId => (
        role !== "a03" && MIME_COPY_ROLES.includes(role)
      )),
    );
    const hasRedX = Object.values(playerStatuses).some((status) => status === "dead-this-night");
    const hasPermaDead = permanentlyDead.size > 0;
    const hasInnocentVote = Object.values(playerEffects).some((effects) => effects.has("inocentado"));
    const dogCopies = activeDogWolfPlayerIds.flatMap((dogPlayerId) => {
      const state = dogWolfStates[dogPlayerId];
      const ownerRole = state?.ownerPlayerId && !state.independentRole && !state.actorModeActive
        ? abilityRoleAssignments[dogPlayerId]
        : null;
      return ownerRole && ownerRole !== "a02" ? [{ dogPlayerId, ownerRole }] : [];
    });

    const redXRequiredRoles = new Set<RoleId>(["e03", "v01", "m02", "a05", "l06"]);
    const candidates = Array.from(rolesInGame).filter((role) => {
      if (redXRequiredRoles.has(role) && !hasRedX) return false;
      if (role === "v18" && !hasPermaDead) return false;
      if (role === "v15" && !hasInnocentVote) return false;
      if (role === "a02" && dogCopies.length === 0) return false;
      return true;
    });
    if (candidates.length === 0) return null;
    const role = candidates[Math.floor(Math.random() * candidates.length)];
    if (role === "a01") {
      const replacement = drunkardReplacementRole
        ?? pickDrunkardReplacement(Object.values(roleAssignments).filter((candidate) => candidate !== "a01" && candidate !== "a03"));
      return { role, cornerRole: replacement, mechanicRole: replacement };
    }
    if (role === "a02") {
      const dogCopy = dogCopies[Math.floor(Math.random() * dogCopies.length)];
      return { role, cornerRole: dogCopy.ownerRole, mechanicRole: dogCopy.ownerRole };
    }
    return { role, cornerRole: null, mechanicRole: role };
  }, [abilityRoleAssignments, activeDogWolfPlayerIds, dogWolfStates, drunkardReplacementRole, permanentlyDead.size, playerEffects, playerStatuses, roleAssignments]);

  const buildMimeRevealCard = useCallback((role: RoleId, cornerRole: RoleId | null): RevealCard => {
    const localLang = (room?.language as Language) || "pt";
    const label = cornerRole
      ? `${getRoleLabel(role, localLang)} (+ ${getRoleLabel(cornerRole, localLang)})`
      : getRoleLabel(role, localLang);
    return {
      image: ROLES[role].image,
      label,
      roleId: role,
      cornerRoleId: cornerRole ?? undefined,
    };
  }, [room?.language]);

  const generateFakeMap = useCallback((viewerPlayerId: string | null) => {
    if (!isPlayerActingPoisoned(viewerPlayerId ?? "") || lastNightDeadPlayerIds.length === 0) return null;
    const inPlayRoles = Object.values(roleAssignments).filter((r) => r !== "e04");
    const uniqueInPlay = [...new Set(inPlayRoles)];
    const deadActualRoles = new Set(lastNightDeadPlayerIds.map((pid) => roleAssignments[pid]).filter(Boolean));
    const candidateRoles = uniqueInPlay.filter((r) => !deadActualRoles.has(r));
    const map: Record<string, string> = {};
    const usedIndices = new Set<number>();
    for (const pid of lastNightDeadPlayerIds) {
      if (candidateRoles.length === 0) break;
      let idx: number;
      do {
        idx = Math.floor(Math.random() * candidateRoles.length);
      } while (usedIndices.has(idx) && usedIndices.size < candidateRoles.length);
      usedIndices.add(idx);
      map[pid] = candidateRoles[idx];
    }
    return map;
  }, [isPlayerActingPoisoned, lastNightDeadPlayerIds, roleAssignments]);

  const handleMimeReveal = useCallback((sourcePlayerId?: string | null) => {
    const mimeId = sourcePlayerId && roleAssignments[sourcePlayerId] === "a03" ? sourcePlayerId : mimePlayerId;
    if (!mimeId) return;
    const candidate = getMimeCopyCandidate();
    if (!candidate?.mechanicRole) {
      toast.warning(getToast("warnNoTargets", (room?.language as Language) || "pt"));
      return;
    }
    const card = buildMimeRevealCard(candidate.role, candidate.cornerRole);
    setMimeCopiedRole(candidate.role);
    setMimeReplacementRole(candidate.role === "a01" ? candidate.mechanicRole : null);
    setMimeOwnerRole(candidate.role === "a02" ? candidate.mechanicRole : null);
    setMimeCopyNoticeNight(nightNumber);
    setMimePowerState({ ...EMPTY_ACTOR_POWER_STATE });
    setMimeRevealCards([card]);
    setMimeRevealOpen(true);
    markScriptRoleAction("a03", mimeId);
    if (!roomId) return;
    supabase.channel(`mime-reveal-${roomId}`).send({
      type: "broadcast",
      event: "mime-reveal",
      payload: {
        show: true,
        byPlayerId: {
          [mimeId]: { cards: [card] },
        },
      },
    });
  }, [buildMimeRevealCard, getMimeCopyCandidate, markScriptRoleAction, mimePlayerId, nightNumber, roleAssignments, room?.language, roomId]);

  const handleFortuneTellerReveal = useCallback(async (sourcePlayerId?: string | null) => {
    const recipients = getRevealRecipientIds("e04", sourcePlayerId, "poison-sensitive");
    const deadRoleAssignments = Object.fromEntries(
      lastNightDeadPlayerIds
        .map((playerId) => [playerId, roleAssignments[playerId]])
        .filter(([, roleId]) => !!roleId),
    );
    const viewerPlayerId = recipients[0] ?? sourcePlayerId ?? null;
    const viewerPoisoned = isPlayerActingPoisoned(viewerPlayerId);
    const sharedResult = {
      deadPlayerIds: lastNightDeadPlayerIds,
      illusionPlayerId,
      illusionPlayerIds: Array.from(illusionPlayerIds),
      isFortuneTellerPoisoned: viewerPoisoned,
      fakeMap: viewerPoisoned ? generateFakeMap(viewerPlayerId) : null,
      roleAssignments: deadRoleAssignments,
    };
    const byPlayerId = Object.fromEntries(recipients.map((recipientId) => [recipientId, sharedResult]));
    const gmResult = Object.values(byPlayerId)[0];
    setFortuneTellerFakeMap(gmResult?.fakeMap ?? null);
    setFortuneTellerModalPoisoned(gmResult?.isFortuneTellerPoisoned ?? viewerPoisoned);
    setFortuneTellerModalOpen(true);
    markScriptRoleAction("e04", sourcePlayerId, recipients);
    if (!roomId) return;
    const channel = supabase.channel(`fortune-teller-reveal-${roomId}`);
    channel.send({
      type: "broadcast",
      event: "fortune-teller-reveal",
      payload: {
        show: true,
        byPlayerId,
      },
    });
  }, [generateFakeMap, getRevealRecipientIds, illusionPlayerId, illusionPlayerIds, isPlayerActingPoisoned, lastNightDeadPlayerIds, markScriptRoleAction, roleAssignments, roomId]);

  const handleCloseFortuneTellerModal = useCallback(() => {
    setFortuneTellerModalOpen(false);
    setFortuneTellerModalPoisoned(false);
    if (roomId) {
      const channel = supabase.channel(`fortune-teller-reveal-${roomId}`);
      channel.send({
        type: "broadcast",
        event: "fortune-teller-reveal",
        payload: { show: false },
      });
    }
  }, [roomId]);

  // LittleGirl reveal: cards = killer of each red-X player
  const buildLittleGirlCards = useCallback((viewerPlayerId: string | null): RevealCard[] => {
    const localLang: Language = (room?.language as Language) || "pt";
    const littleGirlPoisoned = isPlayerActingPoisoned(viewerPlayerId ?? "");
    const redX = Object.entries(playerStatuses)
      .filter(([, s]) => s === "dead-this-night")
      .map(([pid]) => pid);
    if (littleGirlPoisoned) {
      return redX.map((pid) => {
        const actualSrc = killSources[pid];
        const actualKind = getLittleGirlAnswerKind(actualSrc);
        const pool = LITTLE_GIRL_POISONED_ANSWERS.filter(({ kind }) => kind !== actualKind);
        const answer = pool[Math.floor(Math.random() * pool.length)];
        const def = ROLES[answer.roleId];
        const name = players.find((p) => p.id === pid)?.name;
        const customLabels: Partial<Record<LittleGirlAnswerKind, string>> = {
          soldier: t("littleGirlSoldier", localLang),
          suicide: t("littleGirlSuicide", localLang),
          werewolves: t("littleGirlWerewolves", localLang),
        };
        return {
          name,
          image: def.image,
          label: customLabels[answer.kind] ?? getRoleLabel(answer.roleId, localLang),
          roleId: answer.roleId,
        };
      });
    }
    return redX.map((pid) => {
      const card = resolveKillerCard(killSources[pid], roleAssignments, illusionPlayerIds.has(pid) ? pid : null, localLang);
      const name = players.find((p) => p.id === pid)?.name;
      return { name, image: card.image, label: card.label, roleId: card.roleId };
    });
  }, [isPlayerActingPoisoned, room, roleAssignments, playerStatuses, killSources, illusionPlayerIds, players]);

  const defaultLittleGirlCards = useMemo<RevealCard[]>(() => (
    buildLittleGirlCards(getRolePlayerId("v01"))
  ), [buildLittleGirlCards, getRolePlayerId]);

  const handleLittleGirlReveal = useCallback((sourcePlayerId?: string | null) => {
    const recipients = getRevealRecipientIds("v01", sourcePlayerId, "poison-sensitive");
    const sharedResult = { cards: buildLittleGirlCards(recipients[0] ?? sourcePlayerId ?? null) };
    const byPlayerId = Object.fromEntries(recipients.map((recipientId) => [recipientId, sharedResult]));
    setLittleGirlRevealCards(Object.values(byPlayerId)[0]?.cards ?? defaultLittleGirlCards);
    setLittleGirlRevealOpen(true);
    markScriptRoleAction("v01", sourcePlayerId, recipients);
    if (!roomId) return;
    supabase.channel(`little-girl-reveal-${roomId}`).send({
      type: "broadcast", event: "little-girl-reveal",
      payload: { show: true, byPlayerId },
    });
  }, [buildLittleGirlCards, defaultLittleGirlCards, getRevealRecipientIds, markScriptRoleAction, roomId]);

  const handleCloseLittleGirlModal = useCallback(() => {
    setLittleGirlRevealOpen(false);
    if (roomId) {
      supabase.channel(`little-girl-reveal-${roomId}`).send({
        type: "broadcast", event: "little-girl-reveal", payload: { show: false },
      });
    }
  }, [roomId]);

  // Lamplighter reveal: random alive limited-use char
  const handleLamplighterReveal = useCallback((sourcePlayerId?: string | null) => {
    const limitedUseRoles: RoleId[] = ["e03", "v10", "v18", "m01", "s01", "m03", "v13", "v14", "v23"];
    const candidates = players.filter((p) => !permanentlyDead.has(p.id) && limitedUseRoles.includes(abilityRoleAssignments[p.id]));
    if (candidates.length === 0) {
      toast.warning(getToast("warnNoLimitedRoles", (room?.language as Language) || "pt"));
      return;
    }
    const recipients = getRevealRecipientIds("v21", sourcePlayerId, "independent");
    const byPlayerId = Object.fromEntries(recipients.map((viewerPlayerId) => {
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      const mechanicalRole = abilityRoleAssignments[pick.id];
      const role = roleAssignments[pick.id];
      const powerState = independentPowerStates[pick.id];
      let charges: boolean[] = [false, false];
      if (mechanicalRole === "e03") charges = powerState ? [powerState.shamanCharges > 0, powerState.shamanCharges > 1] : [shamanCharges > 0, shamanCharges > 1];
      else if (mechanicalRole === "v10") charges = powerState ? [powerState.paranoidCharges > 0, powerState.paranoidCharges > 1] : [paranoidCharges > 0, paranoidCharges > 1];
      else if (mechanicalRole === "v18") charges = powerState ? [powerState.angelCharges > 0, powerState.angelCharges > 1] : [angelCharges > 0, angelCharges > 1];
      else if (mechanicalRole === "m01") charges = powerState ? [powerState.bigBadWolfCharges > 0, powerState.bigBadWolfCharges > 1] : [bigBadWolfCharges > 0, bigBadWolfCharges > 1];
      else if (mechanicalRole === "s01") charges = powerState ? [powerState.cupidCharges > 0, powerState.cupidCharges > 1] : [cupidCharges > 0, cupidCharges > 1];
      else if (mechanicalRole === "m03") charges = [powerState ? powerState.vampireWolfUsed : vampireWolfUsed];
      else if (mechanicalRole === "v13") charges = powerState ? [powerState.judgeCharges > 0, powerState.judgeCharges > 1] : [judgeCharges > 0, judgeCharges > 1];
      else if (mechanicalRole === "v14") charges = powerState ? [powerState.accuserCharges > 0, powerState.accuserCharges > 1] : [accuserCharges > 0, accuserCharges > 1];
      else if (mechanicalRole === "v23") charges = [powerState ? powerState.spiderDayChangeUsed : spiderDayChangeUsed];
      if (isPlayerActingPoisoned(viewerPlayerId) && charges.length > 0) {
        const flipIndex = Math.floor(Math.random() * charges.length);
        charges = charges.map((checked, index) => index === flipIndex ? !checked : checked);
      }
      return [viewerPlayerId, { role, charges }];
    }));
    const gmResult = Object.values(byPlayerId)[0];
    if (gmResult) {
      setLamplighterPickedRole(gmResult.role);
      setLamplighterPickedCharges(gmResult.charges);
    }
    setLamplighterRevealOpen(true);
    markScriptRoleAction("v21", sourcePlayerId, recipients);
    if (!roomId) return;
    supabase.channel(`lamplighter-reveal-${roomId}`).send({
      type: "broadcast", event: "lamplighter-reveal",
      payload: { show: true, byPlayerId },
    });
  }, [abilityRoleAssignments, players, permanentlyDead, getRevealRecipientIds, roleAssignments, independentPowerStates, shamanCharges, paranoidCharges, angelCharges, bigBadWolfCharges, cupidCharges, vampireWolfUsed, judgeCharges, accuserCharges, spiderDayChangeUsed, isPlayerActingPoisoned, markScriptRoleAction, roomId, room?.language]);

  const handleCloseLamplighterModal = useCallback(() => {
    setLamplighterRevealOpen(false);
    if (roomId) {
      supabase.channel(`lamplighter-reveal-${roomId}`).send({
        type: "broadcast", event: "lamplighter-reveal", payload: { show: false },
      });
    }
  }, [roomId]);

  // Werewolf Seer reveal: resurrect victim, show their card
  const werewolfSeerVictim = useMemo(() => {
    const victimId = Object.entries(playerStatuses).find(([pid, s]) => {
      const src = killSources[pid];
      return s === "dead-this-night" && !!src && isWerewolfAttackSource(src, killSourcePlayerIds[pid]);
    })?.[0];
    return victimId ? players.find((p) => p.id === victimId) : null;
  }, [isWerewolfAttackSource, killSourcePlayerIds, playerStatuses, killSources, players]);

  const handleWerewolfSeerReveal = useCallback((sourcePlayerId?: string | null) => {
    if (!werewolfSeerVictim) return;
    const actualRole = roleAssignments[werewolfSeerVictim.id];
    const recipients = getRevealRecipientIds("m02", sourcePlayerId);
    const inPlayRoles = [...new Set(Object.values(roleAssignments))];
    const byPlayerId = Object.fromEntries(recipients.map((viewerPlayerId) => {
      let role = actualRole;
      if (isPlayerActingPoisoned(viewerPlayerId)) {
        const wrongRoles = inPlayRoles.filter((candidateRole) => candidateRole !== actualRole);
        if (wrongRoles.length > 0) role = wrongRoles[Math.floor(Math.random() * wrongRoles.length)];
      }
      return [viewerPlayerId, { victimId: werewolfSeerVictim.id, role }];
    }));
    const gmResult = Object.values(byPlayerId)[0];
    setWerewolfSeerRevealedVictim({
      id: werewolfSeerVictim.id,
      name: werewolfSeerVictim.name,
      role: gmResult?.role ?? actualRole,
    });
    handlePlayerStatusChange(werewolfSeerVictim.id, "alive");
    for (const viewerPlayerId of recipients) {
      const powerState = independentPowerStates[viewerPlayerId];
      if (powerState) handleIndependentPowerStateChange(viewerPlayerId, { ...powerState, werewolfSeerUsed: true });
      else setWerewolfSeerUsed(true);
    }
    setWerewolfSeerRevealOpen(true);
    markScriptRoleAction("m02", sourcePlayerId, recipients);
    if (!roomId) return;
    supabase.channel(`werewolf-seer-reveal-${roomId}`).send({
      type: "broadcast", event: "lv-reveal",
      payload: { show: true, byPlayerId },
    });
  }, [getRevealRecipientIds, handleIndependentPowerStateChange, handlePlayerStatusChange, independentPowerStates, isPlayerActingPoisoned, werewolfSeerVictim, markScriptRoleAction, roleAssignments, roomId]);

  const handleCloseWerewolfSeerModal = useCallback(() => {
    setWerewolfSeerRevealOpen(false);
    if (roomId) {
      supabase.channel(`werewolf-seer-reveal-${roomId}`).send({
        type: "broadcast", event: "lv-reveal", payload: { show: false },
      });
    }
  }, [roomId]);

  // --- v23 Domador da Aranha eye reveal ---
  const buildSpiderRevealCards = useCallback((viewerPlayerId: string): RevealCard[] => {
    const localLang: Language = (room?.language as Language) || "pt";
    const spiderPoisoned = isPlayerActingPoisoned(viewerPlayerId);
    let cards: RevealCard[] = [];
    const sourceCaughtIds = spiderCaughtBySource[viewerPlayerId];
    const caughtIds = sourceCaughtIds ?? Object.entries(playerEffects)
      .filter(([, e]) => e.has("caught"))
      .map(([pid]) => pid);
    if (spiderPoisoned) {
      // Per caught slot, show a random in-play role that is NOT the actual caught role
      const inPlay = [...new Set(Object.values(roleAssignments))];
      const targets = caughtIds.length > 0 ? caughtIds : [null];
      cards = targets.map((pid) => {
        const actual = pid ? roleAssignments[pid] : undefined;
        const pool = inPlay.filter((r) => r !== actual);
        const r = (pool.length > 0 ? pool : inPlay)[Math.floor(Math.random() * Math.max(1, (pool.length || inPlay.length)))];
        const def = ROLES[r];
        return { image: def?.image || villagerIcon, label: def ? getRoleLabel(r, localLang) : "?", roleId: r };
      });
    } else {
      cards = caughtIds.map((pid) => {
        let role = roleAssignments[pid];
        if (illusionPlayerIds.has(pid)) role = "a06";
        const def = ROLES[role];
        return { image: def?.image || villagerIcon, label: def ? getRoleLabel(role, localLang) : "?", roleId: role };
      });
    }
    return cards;
  }, [room, roleAssignments, playerEffects, illusionPlayerIds, isPlayerActingPoisoned, spiderCaughtBySource]);

  const handleSpiderReveal = useCallback((sourcePlayerId?: string | null) => {
    const recipients = getRevealRecipientIds("v23", sourcePlayerId, "poison-sensitive");
    const sharedResult = { cards: buildSpiderRevealCards(recipients[0] ?? sourcePlayerId ?? "") };
    const byPlayerId = Object.fromEntries(recipients.map((recipientId) => [recipientId, sharedResult]));
    setSpiderRevealCards(Object.values(byPlayerId)[0]?.cards ?? []);
    setSpiderRevealOpen(true);
    markScriptRoleAction("v23", sourcePlayerId, recipients);
    if (!roomId) return;
    supabase.channel(`spider-reveal-${roomId}`).send({
      type: "broadcast", event: "spider-reveal",
      payload: { show: true, byPlayerId },
    });
  }, [buildSpiderRevealCards, getRevealRecipientIds, markScriptRoleAction, roomId]);

  const handleCloseSpiderModal = useCallback(() => {
    setSpiderRevealOpen(false);
    if (roomId) {
      supabase.channel(`spider-reveal-${roomId}`).send({
        type: "broadcast", event: "spider-reveal", payload: { show: false },
      });
    }
  }, [roomId]);

  // --- f02 Espião eye reveal ---
  const handleSpyReveal = useCallback((sourcePlayerId?: string | null) => {
    const localLang: Language = (room?.language as Language) || "pt";
    const recipients = getRevealRecipientIds("f02", sourcePlayerId, "independent");
    const pickedPlayerIds = new Set<string>();
    const inPlayRoles = new Set(Object.values(roleAssignments));
    const allRoles: RoleId[] = Object.keys(ROLES) as RoleId[];
    const notInPlay = allRoles.filter((role) => !inPlayRoles.has(role));
    const byPlayerId: Record<string, { cards: RevealCard[] }> = {};
    for (const viewerPlayerId of recipients) {
      let cards: RevealCard[];
      if (isPlayerActingPoisoned(viewerPlayerId)) {
        const chosen = notInPlay.length > 0
          ? notInPlay[Math.floor(Math.random() * notInPlay.length)]
          : "l01";
        const definition = ROLES[chosen];
        cards = [{ image: definition.image, label: getRoleLabel(chosen, localLang), roleId: chosen }];
      } else {
        const candidates = players.filter((player) => (
          player.seat_position !== null
          && !playerEffects[player.id]?.has("spied_on")
          && !pickedPlayerIds.has(player.id)
        ));
        if (candidates.length === 0) {
          cards = [];
        } else {
          const pick = candidates[Math.floor(Math.random() * candidates.length)];
          pickedPlayerIds.add(pick.id);
          let role = roleAssignments[pick.id];
          if (illusionPlayerIds.has(pick.id)) role = "a06";
          const definition = ROLES[role];
          cards = [{ image: definition?.image || villagerIcon, label: definition ? getRoleLabel(role, localLang) : "?", roleId: role }];
        }
      }
      byPlayerId[viewerPlayerId] = { cards };
    }
    if (Object.values(byPlayerId).every((result) => result.cards.length === 0)) {
      toast.warning(getToast("warnAllSpied", (room?.language as Language) || "pt"));
      return;
    }
    if (pickedPlayerIds.size > 0) {
      setPlayerEffects((prev) => {
        const next = { ...prev };
        for (const pickedPlayerId of pickedPlayerIds) {
          const current = new Set(next[pickedPlayerId] || []);
          current.add("spied_on");
          next[pickedPlayerId] = current;
        }
        return next;
      });
    }
    setSpyRevealCards(Object.values(byPlayerId)[0]?.cards ?? []);
    setSpyRevealOpen(true);
    markScriptRoleAction("f02", sourcePlayerId, recipients);
    if (!roomId) return;
    supabase.channel(`spy-reveal-${roomId}`).send({
      type: "broadcast", event: "spy-reveal",
      payload: { show: true, byPlayerId },
    });
  }, [room?.language, getRevealRecipientIds, roleAssignments, players, playerEffects, isPlayerActingPoisoned, illusionPlayerIds, markScriptRoleAction, roomId]);

  const handleCloseSpyModal = useCallback(() => {
    setSpyRevealOpen(false);
    if (roomId) {
      supabase.channel(`spy-reveal-${roomId}`).send({
        type: "broadcast", event: "spy-reveal", payload: { show: false },
      });
    }
  }, [roomId]);


  // HouseMaid distance text (dynamic). Ignores perma-dead players for the seat-distance count.
  const houseMaidDynamicText = useMemo(() => {
    const houseMaidId = Object.entries(effectiveRoleAssignments).find(([playerId, role]) => role === "v20" && !permanentlyDead.has(playerId))?.[0];
    if (!houseMaidId) return undefined;
    const houseMaidPoisoned = isPlayerPoisoned(houseMaidId);
    const sorted = players
      .filter((p) => p.seat_position !== null && !permanentlyDead.has(p.id))
      .sort((a, b) => a.seat_position! - b.seat_position!);
    const empIdx = sorted.findIndex((p) => p.id === houseMaidId);

    let distances: number[] = [];
    if (houseMaidPoisoned) {
      const resultCount = Math.max(1, poisonedPlayerIds.size);
      distances = Array.from({ length: resultCount }, () => (
        Math.floor(Math.random() * Math.max(1, Math.floor(sorted.length / 2))) + 1
      )).sort((left, right) => left - right);
    } else if (poisonedPlayerIds.size > 0 && empIdx !== -1) {
      distances = getCircularDistances(
        houseMaidId,
        sorted.map((player) => player.id),
        poisonedPlayerIds,
      );
    }
    if (distances.length === 0) return undefined;
    const lng2: Language = (room?.language as Language) || "pt";
    const baseLine = (lng2 === "fr"
      ? "La {Domestique} se réveille et la distance jusqu'à la personne empoisonnée lui est révélée"
      : "A {HouseMaid} acorda e é-lhe revelada a distância até a pessoa envenenada");
    return `${baseLine}: ${distances.join(", ")}`;
  }, [effectiveRoleAssignments, players, poisonedPlayerIds, permanentlyDead, room?.language, isPlayerPoisoned]);


  // Tribunal lines
  const tribunalLines = useMemo(() => {
    const lines: string[] = [];
    const lng: Language = (room?.language as Language) || "pt";
    const diedSimple = t("diedSimple", lng);
    const diedOfTetanus = t("diedOfTetanus", lng);
    const has2Votes = t("has2VotesAgainst", lng);
    const votesDouble = t("votesDouble", lng);
    const noVote = t("noVote", lng);

    if (paranoidKillName) {
      lines.push(`{${paranoidKillName}} ${diedSimple}`);
    }

    for (const [pid, src] of Object.entries(killSources)) {
      if (src !== "v07") continue;
      if (playerStatuses[pid] !== "dead-this-night") continue;
      const name = players.find((p) => p.id === pid)?.name;
      if (name) lines.push(`{${name}} ${diedOfTetanus}`);
    }

    for (const [pid, effects] of Object.entries(playerEffects)) {
      const name = players.find(p => p.id === pid)?.name;
      if (!name) continue;
      if (effects.has("vote_against")) lines.push(`{${name}} ${has2Votes}`);
      if (effects.has("vote_double")) lines.push(`{${name}} ${votesDouble}`);
      if (effects.has("vote_revoked")) lines.push(`{${name}} ${noVote}`);
    }

    for (const poisonedId of poisonedPlayerIds) {
      const poisonedRole = abilityRoleAssignments[poisonedId];
      if (poisonedRole === "v12" && roleAssignments[poisonedId] !== "a03") {
        const name = players.find(p => p.id === poisonedId)?.name;
        if (name && !(playerEffects[poisonedId]?.has("vote_double"))) {
          lines.push(`{${name}} ${votesDouble}`);
        }
      }
    }

    for (const [pid, role] of Object.entries(effectiveRoleAssignments)) {
      if (role === "v13" && permanentlyDead.has(pid)) {
        const source = killSources[pid];
        if (source !== "executado") {
          const name = players.find(p => p.id === pid)?.name;
          if (name) lines.push(`{${name}} (${getRoleLabel("v13", lng)}) ${votesDouble}`);
        }
      }
    }

    for (const [pid, role] of Object.entries(effectiveRoleAssignments)) {
      if (role === "m04" && permanentlyDead.has(pid)) {
        const source = killSources[pid];
        if (source === "executado") {
          const name = players.find(p => p.id === pid)?.name;
          if (name) lines.push(`{${name}} (${getRoleLabel("m04", lng)}) ${votesDouble}`);
        }
      }
    }

    return lines;
  }, [abilityRoleAssignments, effectiveRoleAssignments, playerEffects, players, poisonedPlayerIds, permanentlyDead, killSources, paranoidKillName, playerStatuses, room?.language]);

  // Day dead names
  const dayDeadNames = useMemo(() => {
    return lastNightDeadPlayerIds
      .map(pid => players.find(p => p.id === pid)?.name)
      .filter(Boolean) as string[];
  }, [lastNightDeadPlayerIds, players]);

  const deathTriggeredSourcePlayerIds = useMemo(() => ({
    hunterDied: lastNightDeadPlayerIds.filter((playerId) => (
      roleAssignments[playerId] === "v08"
      || abilityRoleAssignments[playerId] === "v08"
      || (playerId === actorPlayerId && actorCopiedRole === "v08")
    )),
    soldierDied: lastNightDeadPlayerIds.filter((playerId) => playerEffects[playerId]?.has("soldado")),
  }), [abilityRoleAssignments, actorCopiedRole, actorPlayerId, lastNightDeadPlayerIds, playerEffects, roleAssignments]);

  // Condition keys for conditional script lines
  const conditionKeys = useMemo(() => {
    const keys: Record<string, boolean> = {};

    const rustedKnightDied = Object.entries(playerStatuses).some(
      ([pid, s]) => s === "dead-this-night" && abilityRoleAssignments[pid] === "v07"
    );
    keys["rustedKnightDied"] = rustedKnightDied;

    const hunterId = getRolePlayerId("v08");
    keys["hunterDied"] = deathTriggeredSourcePlayerIds.hunterDied.length > 0;

    const redHoodId = Object.entries(abilityRoleAssignments).find(([, r]) => r === "v08b")?.[0];
    const hunterAlive = hunterId && !permanentlyDead.has(hunterId);
    keys["redHoodExecuted"] = !!(redHoodId && killSources[redHoodId] === "executado" &&
      lastNightDeadPlayerIds.includes(redHoodId) && hunterAlive);

    keys["soldierDied"] = deathTriggeredSourcePlayerIds.soldierDied.length > 0;

    keys["whitewolfNight"] = nightNumber % 3 === 0;
    const whiteWolfId = Object.entries(abilityRoleAssignments).find(([, role]) => role === "s02")?.[0];
    const whiteWolfPlayers: WhiteWolfPlayerState[] = players.map((player) => ({
      id: player.id,
      role: abilityRoleAssignments[player.id],
      alive: !permanentlyDead.has(player.id)
        && playerStatuses[player.id] !== "dead"
        && playerStatuses[player.id] !== "dead-this-night",
      werewolfTurned: !!playerEffects[player.id]?.has("werewolf_turned"),
    }));
    keys["whitewolfSolo"] = !!whiteWolfId && !hasOtherLivingWerewolf(whiteWolfPlayers, whiteWolfId);
    keys["astronomerBlocksWerewolvesTonight"] = astronomerBlocksWerewolvesTonight;

    const enemyPlayerIds = Object.entries(playerEffects)
      .filter(([, e]) => e.has("enemy"))
      .map(([pid]) => pid);
    keys["enemyDied"] = nightNumber === 1 ? false : enemyPlayerIds.some(pid => lastNightDeadPlayerIds.includes(pid));

    // Has red X players
    keys["hasRedXPlayers"] = Object.entries(playerStatuses).some(([, s]) => s === "dead-this-night");

    keys["graveRobberHasTargets"] = Object.entries(playerStatuses).some(
      ([pid, status]) => status === "dead-this-night" && effectiveRoleAssignments[pid] !== "a05",
    );

    // HouseMaid visible: only when someone is poisoned
    keys["houseMaidVisible"] = poisonedPlayerIds.size > 0;
    keys["poisonedCharacterPresent"] = poisonedPlayerIds.size > 0;

    // Piromaníaco visible: only when someone has Inocentado status
    keys["pyromaniacVisible"] = Object.values(playerEffects).some((e) => e.has("inocentado"));

    // Cupid has charges left
    keys["cupidHasCharges"] = cupidCharges < 2 || Object.entries(independentPowerStates)
      .some(([playerId, state]) => abilityRoleAssignments[playerId] === "s01" && state.cupidCharges < 2);

    // Big Bad Wolf has charges
    keys["bigBadWolfHasCharges"] = bigBadWolfCharges < 2 || Object.entries(independentPowerStates)
      .some(([playerId, state]) => abilityRoleAssignments[playerId] === "m01" && state.bigBadWolfCharges < 2);

    const hasWerewolfVictim = !!werewolfSeerVictim || !!werewolfSeerRevealedVictim;
    keys["vampireWolfHasCharges"] = hasWerewolfVictim && (
      !vampireWolfUsed || Object.entries(independentPowerStates)
        .some(([playerId, state]) => abilityRoleAssignments[playerId] === "m03" && !state.vampireWolfUsed)
    );
    keys["werewolfSeerHasCharges"] = hasWerewolfVictim;

    // v23 Domador da Aranha — webbed target became perma-dead (need to choose a new one)
    keys["spiderWebbedDied"] = Object.entries(playerEffects)
      .some(([playerId, effects]) => effects.has("webbed") && permanentlyDead.has(playerId));
    // v23 — at least one player has 'caught' effect this night
    keys["spiderHasCaught"] = Object.values(playerEffects).some((e) => e.has("caught"));

    // f02 Espião — not all in-game players have been spied
    const inGamePlayerIds = players.filter((p) => p.seat_position !== null).map((p) => p.id);
    keys["spyHasUnseen"] = inGamePlayerIds.some((pid) => !(playerEffects[pid]?.has("spied_on")));

    // SecretLover Secreto traído: as01b is in game, poisoned, AND has namorado effect
    const secretLoverId = Object.entries(effectiveRoleAssignments).find(([, r]) => r === "as01b")?.[0];
    keys["secretLoverBetrayed"] = !!(secretLoverId && isPlayerPoisoned(secretLoverId) && playerEffects[secretLoverId]?.has("namorado"));

    return keys;
  }, [abilityRoleAssignments, astronomerBlocksWerewolvesTonight, deathTriggeredSourcePlayerIds, effectiveRoleAssignments, getRolePlayerId, independentPowerStates, playerStatuses, lastNightDeadPlayerIds, permanentlyDead, killSources, playerEffects, nightNumber, poisonedPlayerIds, cupidCharges, bigBadWolfCharges, vampireWolfUsed, werewolfSeerRevealedVictim, werewolfSeerVictim, players, isPlayerPoisoned]);

  const lang: Language = (room?.language as Language) || "pt";
  const roleLabel = useCallback((id: RoleId) => getRoleLabel(id, lang), [lang]);
  const tt = useCallback((key: Parameters<typeof t>[0]) => t(key, lang), [lang]);
  const gameLogLabel = lang === "fr" ? "Journal de partie" : "Registo do jogo";
  const roomDisplayLabel = lang === "fr" ? "Écran de salle" : "Ecrã da sala";
  const openRulebook = useCallback((roleId: RoleId | null = null) => {
    setRulebookRoleId(roleId);
    setRulebookOpen(true);
  }, []);
  const openRoomDisplay = useCallback(() => {
    if (!roomId) return;
    const width = window.screen.availWidth;
    const height = window.screen.availHeight;
    const displayWindow = window.open(
      `/display/${roomId}`,
      `wotct-room-display-${roomId}`,
      `popup=yes,width=${width},height=${height},left=${window.screenX},top=${window.screenY},resizable=yes,scrollbars=yes`,
    );
    displayWindow?.focus();
  }, [roomId]);
  const effectiveGMPhase = gameCyclePhase === "day" ? dayPhase : gameCyclePhase;
  useEffect(() => setHiddenTimerEditing(false), [effectiveGMPhase]);
  const visibleTimerState = effectiveGMPhase !== "night" && syncedTimerState?.phase === effectiveGMPhase ? syncedTimerState : null;
  const formatTimerValue = (seconds: number) =>
    `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const beginHiddenTimerEdit = () => {
    if (effectiveGMPhase === "night") return;
    const duration = timerDefaults[effectiveGMPhase];
    setHiddenTimerMinutes(String(Math.floor(duration / 60)));
    setHiddenTimerSeconds(String(duration % 60));
    setHiddenTimerEditing(true);
  };
  const saveHiddenTimerDuration = () => {
    if (effectiveGMPhase === "night") return;
    const minutes = Number.parseInt(hiddenTimerMinutes, 10);
    const seconds = Number.parseInt(hiddenTimerSeconds, 10) || 0;
    if (Number.isNaN(minutes) || minutes < 0 || minutes > 30 || seconds < 0 || seconds > 59) return;
    const duration = minutes * 60 + seconds;
    if (duration <= 0) return;
    handleTimerDefaultsChange({ ...timerDefaults, [effectiveGMPhase]: duration });
    dayPanelRef.current?.setDuration(duration);
    setHiddenTimerEditing(false);
  };
  const victoryPlayers = useMemo<VictoryPlayer[]>(() => players
    .filter((player) => player.seat_position !== null && !!effectiveRoleAssignments[player.id])
    .map((player) => {
      const dogState = dogWolfStates[player.id];
      const ownerPlayerId = dogState?.ownerPlayerId;
      const effects = new Set<StatusEffect>(playerEffects[player.id] || []);
      if (ownerPlayerId && !dogState.objectiveRoleOverride) {
        for (const effect of playerEffects[ownerPlayerId] || []) effects.add(effect);
      }
      return {
        id: player.id,
        role: objectiveRoleAssignments[player.id],
        alive: !permanentlyDead.has(player.id),
        effects,
      };
    }), [dogWolfStates, effectiveRoleAssignments, objectiveRoleAssignments, players, permanentlyDead, playerEffects]);
  const detectedWinKind = useMemo(() => detectAutomaticVictory(victoryPlayers), [victoryPlayers]);
  const victoryStateSignature = useMemo(
    () => getVictoryStateSignature(victoryPlayers, `${effectiveGMPhase}:${nightNumber}`),
    [victoryPlayers, effectiveGMPhase, nightNumber],
  );

  useEffect(() => {
    if (!rolesConfirmed) {
      setAutomaticWinKind(null);
      return;
    }
    if (!detectedWinKind) {
      setAutomaticWinKind(null);
      setDeclinedAutomaticVictory(null);
      return;
    }
    if (declinedAutomaticVictory?.kind === detectedWinKind
      && declinedAutomaticVictory.signature === victoryStateSignature) {
      setAutomaticWinKind(null);
      return;
    }
    setAutomaticWinKind(detectedWinKind);
  }, [rolesConfirmed, detectedWinKind, declinedAutomaticVictory, victoryStateSignature]);

  if (!room) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground font-display">{tt("loading")}</div>
      </div>
    );
  }

  const unseatedPlayers = players.filter((p) => p.seat_position === null);
  const isPlaying = room.status === "playing";
  const pendingWinKind = manualWinKind ?? automaticWinKind;

  return (
    <LanguageContext.Provider value={lang}>
    <div className="min-h-screen p-4">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 max-w-7xl mx-auto">
          <div>
            <div className="flex items-center gap-2">
              <img src={villagerIcon} alt="" className="h-6 w-6 opacity-60" />
              <h1 className="font-display text-2xl md:text-3xl font-bold text-gradient-blood">
                {tt("gameMaster")}
              </h1>
            </div>
            <p className="text-muted-foreground/40 text-xs font-body">
              {tt("appTitle")} — {tt("byline")}
            </p>
            <p className="text-muted-foreground mt-1">
              <Users className="inline h-4 w-4 mr-1" />
              {players.length} {tt("playersInRoom")}
            </p>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:justify-end">
            <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-md border border-border bg-card/40 p-1">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={resetRoom}
                title={tt("resetRoom")}
                aria-label={tt("resetRoom")}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={cleanupOldRooms}
                title={tt("cleanupOldRooms")}
                aria-label={tt("cleanupOldRooms")}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={openRoomDisplay}
                title={roomDisplayLabel}
                aria-label={roomDisplayLabel}
              >
                <MonitorUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={endRoom}
                title={tt("endRoom")}
                aria-label={tt("endRoom")}
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="mx-1 h-6 w-px bg-border" aria-hidden="true" />
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={() => setWinPickerOpen(true)}
                title={getGameOver("manualGameOver", lang)}
                aria-label={getGameOver("manualGameOver", lang)}
              >
                <Trophy className="h-4 w-4" />
              </Button>
              <div className="mx-1 h-6 w-px bg-border" aria-hidden="true" />
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={() => setGameLogOpen(true)}
                title={gameLogLabel}
                aria-label={gameLogLabel}
              >
                <ScrollText className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={() => openRulebook()}
                title={tt("rulebook")}
                aria-label={tt("rulebook")}
              >
                <BookOpen className="h-4 w-4" />
              </Button>
              <div className="mx-1 h-6 w-px bg-border" aria-hidden="true" />
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={() => setHideScreenMode((value) => !value)}
                title={hideScreenMode ? tt("showSensitiveScreen") : tt("hideScreen")}
                aria-label={hideScreenMode ? tt("showSensitiveScreen") : tt("hideScreen")}
              >
                {hideScreenMode ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
            </div>
            <button
              onClick={copyCode}
              className="flex items-center gap-2 bg-secondary px-4 py-2 rounded-lg border border-border hover:border-primary/50 transition-colors"
            >
              <span className="font-display text-xl tracking-[0.2em]">{room.code}</span>
              {copied ? <Check className="h-4 w-4 text-gold" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
            </button>
            <button
              onClick={() => setQrPopupOpen(true)}
              className="bg-parchment p-2 rounded-lg hover:opacity-80 transition-opacity"
              aria-label={t("showQR", lang)}
            >
              <QRCodeSVG value={joinUrl} size={64} bgColor="hsl(40, 30%, 85%)" fgColor="hsl(30, 10%, 8%)" />
            </button>
          </div>
        </div>

        {/* Validation warnings */}
        {!hideScreenMode && validationWarnings.length > 0 && (
          <div className="flex flex-wrap gap-2 max-w-7xl mx-auto">
            {validationWarnings.map((w, i) => (
              <div key={i} className="flex items-center gap-1 bg-yellow-900/30 border border-yellow-500/50 rounded-lg px-3 py-1.5 text-xs font-display text-yellow-400">
                <AlertTriangle className="h-3 w-3" />
                {w}
              </div>
            ))}
          </div>
        )}

        {/* Main content layout */}
        {isPlaying ? (
          <>
            {/* Circle - full width when playing */}
            <div className="w-full flex justify-center overflow-x-auto">
              {players.length > 0 ? (
                <PlayerCircle
                  players={players}
                  totalSlots={seatedPlayersCount}
                  onDropPlayer={updateSeatPosition}
                  isGM
                  roleAssignments={rolesAssigned ? displayRoleAssignments : undefined}
                  abilityRoleAssignments={rolesAssigned ? abilityRoleAssignments : undefined}
                  baseRoleAssignments={rolesAssigned ? roleAssignments : undefined}
                  playerStatuses={playerStatuses}
                  permanentlyDead={permanentlyDead}
                  onPlayerStatusChange={handlePlayerStatusChange}
                  isPlaying={isPlaying}
                  poisonedPlayerId={poisonedPlayerId}
                  poisonedPlayerIds={poisonedPlayerIds}
                  actingPoisonedPlayerIds={actingPoisonedPlayerIds}
                  werewolfPackPoisoned={werewolfPackPoisoned}
                  illusionPlayerId={illusionPlayerId}
                  illusionPlayerIds={illusionPlayerIds}
                  onSetIllusion={handleSetIllusion}
                  isWitchPermaDead={isWitchPermaDead}
                  isPuppeteer={isPuppeteer}
                  shamanCharges={shamanCharges}
                  onShamanChargeToggle={(index) => { handleShamanChargeToggle(index); markScriptRoleAction("e03"); }}
                  onShamanDrop={handleShamanDrop}
                  isWitchPoisoned={isWitchPoisoned}
                  foxDisabled={foxDisabled}
                  onFoxDisabledToggle={() => { setFoxDisabled((v) => !v); markScriptRoleAction("v04"); }}
                  showFoxCheckbox={nightNumber > 1}
                  playerEffects={displayedPlayerEffects}
                  gameCyclePhase={gameCyclePhase}
                  availableEffects={getAvailableEffects}
                  onToggleEffect={toggleEffect}
                  onExecute={handleExecute}
                  onDragAction={handleDragAction}
                  judgeCharges={judgeCharges}
                  onJudgeChargeToggle={(idx) => { setJudgeCharges(prev => prev > idx ? idx : idx + 1); markScriptRoleAction("v13"); }}
                  accuserCharges={accuserCharges}
                  onAccuserChargeToggle={(idx) => { setAccuserCharges(prev => prev > idx ? idx : idx + 1); markScriptRoleAction("v14"); }}
                  bigBadWolfCharges={bigBadWolfCharges}
                  onBigBadWolfChargeToggle={(idx) => { handleBigBadWolfChargeToggle(idx); markScriptRoleAction("m01"); }}
                  cupidCharges={cupidCharges}
                  onCupidChargeToggle={(idx) => { handleCupidChargeToggle(idx); markScriptRoleAction("s01"); }}
                  showCupidCheckboxes={nightNumber > 1}
                  spiderDayChangeUsed={spiderDayChangeUsed}
                  onSpiderDayChangeToggle={() => { setSpiderDayChangeUsed((value) => !value); markScriptRoleAction("v23"); }}
                  vampireWolfUsed={vampireWolfUsed}
                  onVampireWolfToggle={() => {
                    markScriptRoleAction("m03");
                    const nextValue = !vampireWolfUsed;
                    setVampireWolfUsed(nextValue);
                    if (nextValue) {
                      const victimId = Object.entries(playerStatuses).find(([pid, status]) => {
                        const source = killSources[pid];
                        return status === "dead-this-night" && !!source && (source === "e01" || WEREWOLF_ROLES.includes(source as RoleId));
                      })?.[0];
                      if (victimId) {
                        const effectsForVictim = playerEffects[victimId] || new Set<StatusEffect>();
                        if (!effectsForVictim.has("werewolf_turned")) toggleEffect(victimId, "werewolf_turned");
                        setVampireVictimKeepsPower(true);
                      }
                    }
                  }}
                  vampireVictimKeepsPower={vampireVictimKeepsPower}
                  onVampireVictimToggle={() => setVampireVictimKeepsPower((v) => !v)}
                  hideSensitiveInfo={hideScreenMode}
                  actorIdolUses={actorIdolUses}
                  actorCopyActive={!!actorCopiedRole}
                  actorCopiesDrunkard={actorCopiedRole === "a01"}
                  onActorIdolUseToggle={(idx) => setActorIdolUses((uses) => uses > idx ? idx : idx + 1)}
                  actorPowerState={actorPowerState}
                  onActorPowerStateChange={handleActorPowerStateChange}
                  independentPowerStates={independentPowerStates}
                  onIndependentPowerStateChange={(playerId, state) => {
                    handleIndependentPowerStateChange(playerId, state);
                    const role = abilityRoleAssignments[playerId];
                    if (role) markScriptRoleAction(role, playerId);
                  }}
                  dogWolfOwnerRoles={displayOwnerRoles}
                  dogWolfStates={dogWolfStates}
                  onDogActorIdolUseToggle={(playerId, idx) => {
                    setDogWolfStates((previous) => {
                      const state = previous[playerId];
                      if (!state) return previous;
                      return {
                        ...previous,
                        [playerId]: { ...state, actorIdolUses: state.actorIdolUses > idx ? idx : idx + 1 },
                      };
                    });
                    markScriptRoleAction("a04", playerId);
                  }}
                />
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                  <p className="text-muted-foreground font-display text-lg">{tt("waitingForPlayers")}</p>
                </motion.div>
              )}
            </div>

            {/* Below circle: Script left, Player list right */}
            {hideScreenMode && (
              <div className="max-w-sm mx-auto rounded-lg border border-border/30 bg-card/50 p-4 text-center">
                <p className="font-display text-2xl tracking-widest">
                  {effectiveGMPhase === "night"
                    ? `${tt("night")} ${nightNumber}`
                    : effectiveGMPhase === "day"
                    ? `${tt("day")} ${nightNumber}`
                    : `${tt("tribunal")} ${nightNumber}`}
                </p>
                {visibleTimerState && (
                  <>
                    <p className={`font-display text-5xl tracking-wider mt-3 ${visibleTimerState.timeLeft <= 30 ? "text-destructive" : "text-foreground"}`}>
                      {formatTimerValue(visibleTimerState.timeLeft)}
                    </p>
                    <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
                      {!visibleTimerState.timerDone && (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => dayPanelRef.current?.toggleTimer()}
                            title={visibleTimerState.isRunning ? tt("pauseTimer") : tt("startTimer")}
                            aria-label={visibleTimerState.isRunning ? tt("pauseTimer") : tt("startTimer")}
                          >
                            {visibleTimerState.isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => dayPanelRef.current?.resetTimer()}
                            title={tt("resetTimer")}
                            aria-label={tt("resetTimer")}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {!hiddenTimerEditing ? (
                        <Button size="icon" variant="ghost" onClick={beginHiddenTimerEdit}>
                          <Settings className="h-4 w-4" />
                        </Button>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Input type="number" value={hiddenTimerMinutes} onChange={(event) => setHiddenTimerMinutes(event.target.value)} className="w-14 h-8 text-center text-sm" min={0} max={30} />
                          <span className="text-xs text-muted-foreground">:</span>
                          <Input type="number" value={hiddenTimerSeconds} onChange={(event) => setHiddenTimerSeconds(event.target.value)} className="w-14 h-8 text-center text-sm" min={0} max={59} />
                          <Button size="sm" variant="ghost" onClick={saveHiddenTimerDuration}>OK</Button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
            <div className={`${hideScreenMode ? "hidden" : "grid"} grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto`}>
              {/* Script / Day panel (left) */}
              <div>
                {gameCyclePhase === "night" ? (
                  <NightScript
                    activeRoles={activeRoles}
                    permanentlyDead={permanentlyDead}
                    poisonedPlayerId={poisonedPlayerId}
                    poisonedPlayerIds={poisonedPlayerIds}
                    illusionPlayerId={illusionPlayerId}
                    illusionPlayerIds={illusionPlayerIds}
                    roleAssignments={effectiveRoleAssignments}
                    baseRoleAssignments={roleAssignments}
                    nightNumber={nightNumber}
                    onEndNight={endNight}
                    shamanCharges={shamanCharges}
                    onShamanChargeToggle={handleShamanChargeToggle}
                    lastNightDeadPlayerIds={lastNightDeadPlayerIds}
                    players={players}
                    onFortuneTellerReveal={handleFortuneTellerReveal}
                    onLittleGirlReveal={handleLittleGirlReveal}
                    onLamplighterReveal={handleLamplighterReveal}
                    onWerewolfSeerReveal={werewolfSeerVictim ? handleWerewolfSeerReveal : undefined}
                    onMimeReveal={handleMimeReveal}
                    houseMaidDynamicText={houseMaidDynamicText}
                    playerStatuses={playerStatuses}
                    foxDisabled={foxDisabled}
                    onFoxDisabledToggle={() => setFoxDisabled((v) => !v)}
                    nightTargetedPlayerIds={nightTargetedPlayerIds}
                    conditionKeys={conditionKeys}
                    playerEffects={playerEffects}
                    prophecyGhostPlayerIds={prophecyGhostPlayerIds}
                    powerlessPlayerIds={powerlessPlayerIds}
                    paranoidCharges={paranoidCharges}
                    onParanoidChargeToggle={(idx) => setParanoidCharges(prev => prev > idx ? idx : idx + 1)}
                    angelCharges={angelCharges}
                    onAngelChargeToggle={(idx) => setAngelCharges(prev => prev > idx ? idx : idx + 1)}
                    bigBadWolfCharges={bigBadWolfCharges}
                    onBigBadWolfChargeToggle={handleBigBadWolfChargeToggle}
                    cupidCharges={cupidCharges}
                    onCupidChargeToggle={handleCupidChargeToggle}
                    vampireWolfUsed={vampireWolfUsed}
                    onVampireWolfToggle={() => setVampireWolfUsed(v => !v)}
                    judgeCharges={judgeCharges}
                    onJudgeChargeToggle={(idx) => setJudgeCharges(prev => prev > idx ? idx : idx + 1)}
                    accuserCharges={accuserCharges}
                    onAccuserChargeToggle={(idx) => setAccuserCharges(prev => prev > idx ? idx : idx + 1)}
                    onSpiderReveal={handleSpiderReveal}
                    onSpyReveal={handleSpyReveal}
                    onScriptRolesVisible={handleScriptRolesVisible}
                    completedLineKeys={completedScriptLineKeys}
                    onLineCompletedChange={handleScriptLineCompleted}
                    autoCompleteRole={scriptAutoComplete.role}
                    autoCompleteSourcePlayerIds={scriptAutoComplete.sourcePlayerIds}
                    autoCompleteVersion={scriptAutoComplete.version}
                    actorPlayerId={actorPlayerId}
                    actorCopiedRole={actorCopiedRole}
                    actorCopyNoticeNight={actorCopyNoticeNight}
                    actorPowerState={actorPowerState}
                    onActorPowerStateChange={handleActorPowerStateChange}
                    mimePlayerId={mimePlayerId}
                    mimeCopiedRole={mimeCopiedRole}
                    mimeMechanicalRole={mimeMechanicalRole}
                    mimeCopyNoticeNight={mimeCopyNoticeNight}
                    deathTriggeredSourcePlayerIds={deathTriggeredSourcePlayerIds}
                    dogWolfStates={dogWolfStates}
                    dogWolfPlayerIds={dogWolfPlayerIds}
                    abilityRoleAssignments={abilityRoleAssignments}
                    objectiveRoleAssignments={objectiveRoleAssignments}
                    spiderCaughtBySource={spiderCaughtBySource}
                    independentPowerStates={independentPowerStates}
                    onIndependentPowerStateChange={(playerId, state) => {
                      handleIndependentPowerStateChange(playerId, state);
                      const role = abilityRoleAssignments[playerId];
                      if (role) markScriptRoleAction(role, playerId);
                    }}
                    drunkardMechanicPlayerIds={drunkardMechanicPlayerIds}
                  />
                ) : (
                  <DayTribunalPanel
                    ref={dayPanelRef}
                    nightNumber={nightNumber}
                    alivePlayers={players.filter((p) => !permanentlyDead.has(p.id) && playerStatuses[p.id] !== "dead-this-night").length}
                    onStartNight={startNextNight}
                    onStartTribunal={startTribunal}
                    gamePhase={dayPhase}
                    onPhaseChange={setDayPhase}
                    tribunalLines={tribunalLines}
                    dayDeadNames={dayDeadNames}
                    dayDefaultSeconds={timerDefaults.day}
                    tribunalDefaultSeconds={timerDefaults.tribunal}
                    onDefaultsChange={handleTimerDefaultsChange}
                    initialTimerState={syncedTimerState}
                    onTimerSync={handleTimerSync}
                    completedLineKeys={completedScriptLineKeys}
                    onLineCompletedChange={(key, completed) => handleScriptLineCompleted(key, completed, null)}
                  />
                )}
              </div>

              {/* Player list (right) */}
              <div className="space-y-4">
                <h2 className="font-display text-sm tracking-widest uppercase text-muted-foreground">{tt("playersHeader")}</h2>

                <div className="space-y-2">
                  <h3 className="font-display text-xs tracking-widest uppercase text-muted-foreground">{tt("rolesAssignmentHeader")}</h3>
                  {players
                    .filter((p) => p.seat_position !== null)
                    .sort((a, b) => (a.seat_position ?? 0) - (b.seat_position ?? 0))
                    .map((player) => {
                      const baseRoleId = roleAssignments[player.id];
                      const roleId = effectiveRoleAssignments[player.id];
                      const mechanicalRoleId = abilityRoleAssignments[player.id] ?? roleId;
                      const roleDef = roleId ? ROLES[roleId] : null;
                      const isDuplicate = baseRoleId && duplicateRoles.has(baseRoleId);
                      const isActor = baseRoleId === "a04";
                      const isDrunkard = baseRoleId === "a01";
                      const dogState = dogWolfStates[player.id];
                      const status = playerStatuses[player.id] || "alive";
                      const isPermanentDead = permanentlyDead.has(player.id);
                      const listDragProps = getListDragProps(player.id);
                      const isThisIllusion = illusionPlayerIds.has(player.id);
                      const isThisPoisoned = isPlayerPoisoned(player.id);
                      const isThisWitchPoisoned = mechanicalRoleId === "e02" && isThisPoisoned;
                      const isShaman = mechanicalRoleId === SHAMAN_ROLE;
                      const isFox = mechanicalRoleId === ("v04" as RoleId);
                      const isShamanPoisoned = mechanicalRoleId === SHAMAN_ROLE && isPlayerActingPoisoned(player.id);
                      const independentPowerState = independentPowerStates[player.id];
                      const updateIndependentPowerState = (powerState: ActorPowerState) => (
                        handleIndependentPowerStateChange(player.id, powerState)
                      );
                      const effects = displayedPlayerEffects[player.id] || new Set<StatusEffect>();
                      const isIncendiado = effects.has("incendiado");
                      const isWerewolfTurned = effects.has("werewolf_turned");
                      const isEvilBeing = effects.has("evil_being");

                      const borderClass = isDuplicate
                        ? "border-yellow-500"
                        : isIncendiado
                        ? "border-orange-500"
                        : isThisIllusion
                        ? "border-purple-500"
                        : isThisPoisoned
                        ? "border-green-500"
                        : status === "dead-this-night"
                        ? "border-destructive"
                        : "border-border";

                      const rowContent = (
                        <div
                          className={`flex items-center gap-2 bg-card border rounded-lg p-2 ${borderClass} ${isPermanentDead ? "opacity-40 grayscale" : ""} ${(isWerewolfTurned || isEvilBeing) ? "shadow-[0_0_12px_hsl(var(--destructive)/0.45)]" : ""} ${listDragProps.draggable ? "cursor-grab active:cursor-grabbing" : ""}`}
                          onDrop={(e) => handleListDrop(e, player.id)}
                          onDragOver={handleListDragOver}
                          {...listDragProps}
                        >
                          {roleDef && (
                            <div className="relative w-8 h-8 flex-shrink-0">
                              <img src={roleDef.image} alt={roleLabel(roleDef.id)} className={`w-8 h-8 rounded ${isPermanentDead ? "grayscale" : ""}`} />
                              {(status === "dead-this-night" || isPermanentDead) && (
                                <X className={`absolute inset-0 m-auto w-6 h-6 ${isPermanentDead ? "text-muted-foreground" : "text-destructive"}`} strokeWidth={3} />
                              )}
                              {isThisIllusion && (
                                <img src={illusionIcon} alt="ilusão" className="absolute -top-1 -right-1 w-4 h-4" />
                              )}
                              {isThisPoisoned && !isThisWitchPoisoned && (
                                <img src={poisonedIcon} alt="envenenado" className="absolute -bottom-1 -right-1 w-4 h-4" />
                              )}
                               {isThisWitchPoisoned && (
                                 <img src={imunityIcon} alt="imunidade" className="absolute -top-1 -left-1 w-4 h-4" />
                               )}
                               {isActor && roleId !== "a04" && (
                                 <img src={ROLES.a04.image} alt={roleLabel("a04")} className="absolute -bottom-1 -left-1 h-4 w-4 rounded-sm border border-primary object-cover" />
                               )}
                               {isActor && actorCopiedRole === "a01" && roleId !== "a01" && (
                                 <img src={ROLES.a01.image} alt={roleLabel("a01")} className="absolute -left-1 -top-1 h-4 w-4 rounded-sm border border-green-400 object-cover" />
                               )}
                               {isDrunkard && roleId !== "a01" && (
                                 <img src={ROLES.a01.image} alt={roleLabel("a01")} className="absolute -bottom-1 -left-1 h-4 w-4 rounded-sm border border-green-400 object-cover" />
                               )}
                               {dogWolfOwnerRoles[player.id] && (
                                 <img src={ROLES[dogWolfOwnerRoles[player.id]].image} alt={roleLabel(dogWolfOwnerRoles[player.id])} className="absolute -bottom-1 -right-1 h-4 w-4 rounded-sm border border-amber-400 object-cover" />
                               )}
                            </div>
                          )}
                          <span className={`font-body text-sm flex-1 truncate ${isThisPoisoned ? "text-green-400" : isThisIllusion ? "text-purple-400" : ""}`}>{player.name}</span>
                          {/* Status effect icons */}
                          {effects.size > 0 && (
                            <div className="flex gap-0.5 flex-shrink-0">
                              {Array.from(effects).map(eff => STATUS_EFFECT_ICONS[eff] ? (
                                <img key={eff} src={STATUS_EFFECT_ICONS[eff]} alt={eff} className="h-4 w-4" title={getEffectLabel(eff, lang)} />
                              ) : null)}
                            </div>
                          )}
                          {isDuplicate && <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0" />}
                          {isShaman && !isPermanentDead && (
                            <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                              {[0, 1].map((idx) => (
                                <Checkbox
                                  key={idx}
                                  checked={(independentPowerState?.shamanCharges ?? shamanCharges) > idx}
                                  onCheckedChange={() => {
                                    if (independentPowerState) updateIndependentPowerState({ ...independentPowerState, shamanCharges: independentPowerState.shamanCharges > idx ? idx : idx + 1 });
                                    else handleShamanChargeToggle(idx);
                                    markScriptRoleAction("e03", player.id);
                                  }}
                                  className="h-4 w-4 border-primary data-[state=checked]:bg-primary"
                                />
                              ))}
                              {isShamanPoisoned && (
                                <img src={poisonedIcon} alt="" className="h-4 w-4" />
                              )}
                            </div>
                          )}
                          {isFox && nightNumber > 1 && !isPermanentDead && (
                            <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={independentPowerState?.foxDisabled ?? foxDisabled}
                                onCheckedChange={() => {
                                  if (independentPowerState) updateIndependentPowerState({ ...independentPowerState, foxDisabled: !independentPowerState.foxDisabled });
                                  else setFoxDisabled((v) => !v);
                                  markScriptRoleAction("v04", player.id);
                                }}
                                className="h-4 w-4 rounded-none border-2 border-blue-400 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                              />
                              <span className="text-[9px] text-muted-foreground">{tt("powerExhausted")}</span>
                            </div>
                          )}
                          {/* Paranoid charges */}
                          {mechanicalRoleId === "v10" && !isPermanentDead && (
                            <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                              {[0, 1].map((idx) => (
                                <Checkbox
                                  key={idx}
                                  checked={(independentPowerState?.paranoidCharges ?? paranoidCharges) > idx}
                                  onCheckedChange={() => {
                                    if (independentPowerState) updateIndependentPowerState({ ...independentPowerState, paranoidCharges: independentPowerState.paranoidCharges > idx ? idx : idx + 1 });
                                    else setParanoidCharges(prev => prev > idx ? idx : idx + 1);
                                    markScriptRoleAction("v10", player.id);
                                  }}
                                  className="h-4 w-4 border-primary data-[state=checked]:bg-primary"
                                />
                              ))}
                            </div>
                          )}
                          {/* Angel charges */}
                          {mechanicalRoleId === "v18" && !isPermanentDead && (
                            <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                              {[0, 1].map((idx) => (
                                <Checkbox
                                  key={idx}
                                  checked={(independentPowerState?.angelCharges ?? angelCharges) > idx}
                                  onCheckedChange={() => {
                                    if (independentPowerState) updateIndependentPowerState({ ...independentPowerState, angelCharges: independentPowerState.angelCharges > idx ? idx : idx + 1 });
                                    else setAngelCharges(prev => prev > idx ? idx : idx + 1);
                                    markScriptRoleAction("v18", player.id);
                                  }}
                                  className="h-4 w-4 border-primary data-[state=checked]:bg-primary"
                                />
                              ))}
                            </div>
                          )}
                          {/* Big Bad Wolf charges */}
                          {mechanicalRoleId === "m01" && !isPermanentDead && (
                            <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                              {[0, 1].map((idx) => (
                                <Checkbox
                                  key={idx}
                                  checked={(independentPowerState?.bigBadWolfCharges ?? bigBadWolfCharges) > idx}
                                  onCheckedChange={() => {
                                    if (independentPowerState) updateIndependentPowerState({ ...independentPowerState, bigBadWolfCharges: independentPowerState.bigBadWolfCharges > idx ? idx : idx + 1 });
                                    else handleBigBadWolfChargeToggle(idx);
                                    markScriptRoleAction("m01", player.id);
                                  }}
                                  className="h-4 w-4 border-primary data-[state=checked]:bg-primary"
                                />
                              ))}
                            </div>
                          )}
                          {/* Domador da Aranha daytime web-change */}
                          {mechanicalRoleId === "v23" && !isPermanentDead && (
                            <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={independentPowerState?.spiderDayChangeUsed ?? spiderDayChangeUsed}
                                onCheckedChange={() => {
                                  if (independentPowerState) updateIndependentPowerState({ ...independentPowerState, spiderDayChangeUsed: !independentPowerState.spiderDayChangeUsed });
                                  else setSpiderDayChangeUsed((value) => !value);
                                  markScriptRoleAction("v23", player.id);
                                }}
                                className="h-4 w-4 border-primary data-[state=checked]:bg-primary"
                              />
                            </div>
                          )}
                          {/* Werewolf Seer: no checkbox (unlimited uses) */}
                          {/* Cupid charges */}
                          {mechanicalRoleId === "s01" && nightNumber > 1 && !isPermanentDead && (
                            <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                              {[0, 1].map((idx) => (
                                <Checkbox
                                  key={idx}
                                  checked={(independentPowerState?.cupidCharges ?? cupidCharges) > idx}
                                  onCheckedChange={() => {
                                    if (independentPowerState) updateIndependentPowerState({ ...independentPowerState, cupidCharges: independentPowerState.cupidCharges > idx ? idx : idx + 1 });
                                    else handleCupidChargeToggle(idx);
                                    markScriptRoleAction("s01", player.id);
                                  }}
                                  className="h-4 w-4 border-primary data-[state=checked]:bg-primary"
                                />
                              ))}
                            </div>
                          )}
          {/* Vampiro used: ticking auto-applies werewolf_turned to werewolf victim */}
          {mechanicalRoleId === "m03" && !isPermanentDead && (
            <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={independentPowerState?.vampireWolfUsed ?? vampireWolfUsed}
                onCheckedChange={() => {
                  markScriptRoleAction("m03", player.id);
                  const nextValue = independentPowerState ? !independentPowerState.vampireWolfUsed : !vampireWolfUsed;
                  if (independentPowerState) updateIndependentPowerState({ ...independentPowerState, vampireWolfUsed: nextValue });
                  else setVampireWolfUsed(nextValue);
                  if (nextValue && !independentPowerState) {
                    const victimId = Object.entries(playerStatuses).find(([pid, status]) => {
                      const source = killSources[pid];
                      return status === "dead-this-night" && !!source && (source === "e01" || WEREWOLF_ROLES.includes(source as RoleId));
                    })?.[0];
                    if (victimId) {
                      const effectsForVictim = playerEffects[victimId] || new Set<StatusEffect>();
                      if (!effectsForVictim.has("werewolf_turned")) {
                        toggleEffect(victimId, "werewolf_turned");
                      }
                      setVampireVictimKeepsPower(true);
                    }
                  }
                }}
                className="h-4 w-4 border-primary data-[state=checked]:bg-primary"
              />
            </div>
          )}
          {/* Vampire victim: distinct square blue checkbox = keeps power */}
          {effects.has("werewolf_turned") && !isPermanentDead && (
            <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()} title="Mantém os poderes">
              <Checkbox
                checked={vampireVictimKeepsPower}
                onCheckedChange={() => setVampireVictimKeepsPower((v) => !v)}
                className="h-4 w-4 rounded-none border-2 border-blue-400 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
              />
            </div>
          )}
                          {/* Judge uses (2) */}
                          {mechanicalRoleId === "v13" && !isPermanentDead && (
                            <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                              {[0, 1].map((idx) => (
                                <Checkbox
                                  key={idx}
                                  checked={(independentPowerState?.judgeCharges ?? judgeCharges) > idx}
                                  onCheckedChange={() => {
                                    if (independentPowerState) updateIndependentPowerState({ ...independentPowerState, judgeCharges: independentPowerState.judgeCharges > idx ? idx : idx + 1 });
                                    else setJudgeCharges(prev => prev > idx ? idx : idx + 1);
                                    markScriptRoleAction("v13", player.id);
                                  }}
                                  className="h-4 w-4 border-primary data-[state=checked]:bg-primary"
                                />
                              ))}
                            </div>
                          )}
                          {/* Accuser (v14) uses (2) */}
                          {mechanicalRoleId === "v14" && !isPermanentDead && (
                            <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                              {[0, 1].map((idx) => (
                                <Checkbox
                                  key={idx}
                                  checked={(independentPowerState?.accuserCharges ?? accuserCharges) > idx}
                                  onCheckedChange={() => {
                                    if (independentPowerState) updateIndependentPowerState({ ...independentPowerState, accuserCharges: independentPowerState.accuserCharges > idx ? idx : idx + 1 });
                                    else setAccuserCharges(prev => prev > idx ? idx : idx + 1);
                                    markScriptRoleAction("v14", player.id);
                                  }}
                                  className="h-4 w-4 border-primary data-[state=checked]:bg-primary"
                                />
                              ))}
                            </div>
                          )}
                          {isActor && !dogState && !isPermanentDead && (
                            <div className="flex gap-1 flex-shrink-0" onClick={(event) => event.stopPropagation()}>
                              {[0, 1].map((idx) => (
                                <Checkbox key={idx} checked={actorIdolUses > idx} onCheckedChange={() => setActorIdolUses((uses) => uses > idx ? idx : idx + 1)} className="h-4 w-4 border-primary data-[state=checked]:bg-primary" />
                              ))}
                            </div>
                          )}
                          {dogState && mechanicalRoleId === "a04" && !isPermanentDead && (
                            <div className="flex gap-1 flex-shrink-0" onClick={(event) => event.stopPropagation()}>
                              {[0, 1].map((idx) => (
                                <Checkbox
                                  key={idx}
                                  checked={dogState.actorIdolUses > idx}
                                  onCheckedChange={() => {
                                    setDogWolfStates((previous) => {
                                      const state = previous[player.id];
                                      if (!state) return previous;
                                      return {
                                        ...previous,
                                        [player.id]: { ...state, actorIdolUses: state.actorIdolUses > idx ? idx : idx + 1 },
                                      };
                                    });
                                    markScriptRoleAction("a04", player.id);
                                  }}
                                  className="h-4 w-4 border-primary data-[state=checked]:bg-primary"
                                />
                              ))}
                            </div>
                          )}
                          <RoleSelector value={baseRoleId} onChange={(role) => changeRole(player.id, role)} advancedEnabled={advancedEnabled} />
                        </div>
                      );

                      const showPoison = true;
                      const showIllusion = isPuppeteer;
                      const showExecutado = gameCyclePhase === "tribunal";
                      const availableEffectsForPlayer = getAvailableEffects(player.id);

                      return (
                        <PlayerStatusPopover
                          key={player.id}
                          status={status}
                          isPermanentlyDead={isPermanentDead}
                          isPoisoned={isThisPoisoned}
                          open={listPopoverId === player.id}
                          onOpenChange={(open) => setListPopoverId(open ? player.id : null)}
                          showPoison={showPoison}
                          showIllusion={showIllusion}
                          isIllusion={isThisIllusion}
                          activeEffects={effects}
                          availableEffects={availableEffectsForPlayer}
                          showExecutado={showExecutado}
                          poisonDisabled={isWitchPermaDead}
                          onSetPoisoned={() => {
                            handlePlayerStatusChange(player.id, "poisoned");
                            setListPopoverId(null);
                          }}
                          onSetDead={() => {
                            handlePlayerStatusChange(player.id, "dead-this-night");
                            setListPopoverId(null);
                          }}
                          onSetAlive={() => {
                            handlePlayerStatusChange(player.id, "alive");
                            setListPopoverId(null);
                          }}
                          onSetPermaDead={() => {
                            handlePlayerStatusChange(player.id, "dead");
                            setListPopoverId(null);
                          }}
                          onSetIllusion={() => {
                            handleSetIllusion(player.id);
                            setListPopoverId(null);
                          }}
                          onSetExecuted={() => {
                            handleExecute(player.id);
                          }}
                          onToggleEffect={(effect) => {
                            toggleEffect(player.id, effect);
                            setListPopoverId(null);
                          }}
                        >
                          {rowContent}
                        </PlayerStatusPopover>
                      );
                    })}
                </div>

                {pendingChanges && (
                  <Button
                    onClick={confirmPendingChanges}
                    className="w-full h-12 font-display tracking-wider bg-yellow-600 hover:bg-yellow-700 text-white mt-4 animate-pulse"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {tt("confirmChanges")}
                  </Button>
                )}

                {!pendingChanges && (
                  <div className="bg-card border border-primary/30 rounded-lg p-4 text-center">
                    <p className="font-display text-primary">{tt("gameInProgress")}</p>
                    <p className="text-muted-foreground text-sm mt-1">{tt("gameInProgressDesc")}</p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Lobby */
          <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto items-start">
            <div className="flex-1 min-w-0 flex justify-center">
              {players.length > 0 ? (
                <div className="w-full overflow-hidden flex justify-center">
                  <PlayerCircle
                    players={players}
                    totalSlots={players.length}
                    onDropPlayer={updateSeatPosition}
                    isGM
                    roleAssignments={rolesAssigned ? displayRoleAssignments : undefined}
                    abilityRoleAssignments={rolesAssigned ? abilityRoleAssignments : undefined}
                    baseRoleAssignments={rolesAssigned ? roleAssignments : undefined}
                    compact
                    onDragAction={handleDragAction}
                    actorCopiesDrunkard={actorCopiedRole === "a01"}
                    dogWolfOwnerRoles={displayOwnerRoles}
                    dogWolfStates={dogWolfStates}
                  />
                </div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                  <p className="text-muted-foreground font-display text-lg">{tt("waitingForPlayers")}</p>
                  <p className="text-muted-foreground/60 text-sm mt-2">{tt("shareCodeOrAdd")}</p>
                </motion.div>
              )}
            </div>

            <div className="w-full lg:w-72 space-y-4">
              <h2 className="font-display text-sm tracking-widest uppercase text-muted-foreground">{tt("playersHeader")}</h2>

              {!rolesAssigned && <AddPlayerForm onAdd={addManualPlayer} existingNames={existingPlayerNames} />}

              {!rolesConfirmed && (
                <div className="flex items-center gap-2">
                  <Switch id="advanced-toggle" checked={advancedEnabled} onCheckedChange={setAdvancedEnabled} />
                  <Label htmlFor="advanced-toggle" className="font-display text-sm cursor-pointer">{tt("advancedMode")}</Label>
                </div>
              )}

              {!rolesAssigned && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addTestPlayers}
                  className="w-full text-xs opacity-50 hover:opacity-100"
                >
                  <FlaskConical className="h-3 w-3 mr-1" />
                  {tt("devTestPlayers")}
                </Button>
              )}

              <AnimatePresence>
                {unseatedPlayers.map((player) => (
                  <motion.div
                    key={player.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center gap-2 bg-card border border-border rounded-lg p-3"
                  >
                    <div
                      className="flex-1 cursor-grab active:cursor-grabbing"
                      draggable
                      onDragStartCapture={(e: React.DragEvent<HTMLDivElement>) => {
                        e.dataTransfer.setData("playerId", player.id);
                      }}
                    >
                      <span className="font-body text-lg">{player.name}</span>
                      <span className={`ml-2 text-[10px] font-display uppercase tracking-wider ${isPlayerConnected(player) ? "text-green-400" : "text-muted-foreground"}`}>
                        {isPlayerConnected(player) ? (player.is_ready ? tt("ready") : tt("connected")) : tt("disconnected")}
                      </span>
                    </div>
                    {!rolesAssigned && (
                      <button
                        onClick={() => removePlayer(player.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {unseatedPlayers.length === 0 && players.length > 0 && !rolesAssigned && (
                <p className="text-muted-foreground/60 text-sm">{tt("allSeated")}</p>
              )}

              {rolesAssigned && (
                <div className="space-y-2">
                  <h3 className="font-display text-xs tracking-widest uppercase text-muted-foreground mt-4">{tt("rolesAssignmentHeader")}</h3>
                  {players
                    .filter((p) => p.seat_position !== null)
                    .sort((a, b) => (a.seat_position ?? 0) - (b.seat_position ?? 0))
                    .map((player) => {
                      const roleId = roleAssignments[player.id];
                      const roleDef = roleId ? ROLES[roleId] : null;
                      const isDuplicate = roleId && duplicateRoles.has(roleId);

                      return (
                        <div
                          key={player.id}
                          className={`flex items-center gap-2 bg-card border rounded-lg p-2 ${isDuplicate ? "border-yellow-500" : "border-border"}`}
                        >
                          {roleDef && (
                            <img src={roleDef.image} alt={roleLabel(roleDef.id)} className="w-8 h-8 rounded flex-shrink-0" />
                          )}
                          <span className="font-body text-sm flex-1 truncate">
                            {player.name}
                            <span className={`ml-2 text-[9px] font-display uppercase tracking-wider ${isPlayerConnected(player) ? "text-green-400" : "text-muted-foreground"}`}>
                              {isPlayerConnected(player) ? (player.is_ready ? tt("ready") : tt("connected")) : tt("disconnected")}
                            </span>
                          </span>
                          {isDuplicate && <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0" />}
                          <RoleSelector value={roleId} onChange={(role) => changeRole(player.id, role)} advancedEnabled={advancedEnabled} />
                        </div>
                      );
                    })}
                </div>
              )}

              {!rolesAssigned && players.length >= 2 && room.status === "lobby" && (
                <Button
                  onClick={confirmRoom}
                  disabled={unseatedPlayers.length > 0}
                  className="w-full h-12 font-display tracking-wider bg-primary hover:bg-blood-glow glow-blood mt-6"
                >
                  {tt("confirmAndAssign")}
                </Button>
              )}

              {rolesAssigned && room.status !== "playing" && (
                <Button
                  onClick={sendRolesToPlayers}
                  className="w-full h-12 font-display tracking-wider bg-primary hover:bg-blood-glow glow-blood mt-4"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {tt("sendRolesToPlayers")}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      <FortuneTellerRevealModal
        open={fortuneTellerModalOpen}
        onClose={handleCloseFortuneTellerModal}
        deadPlayerIds={lastNightDeadPlayerIds}
        illusionPlayerId={illusionPlayerId}
        illusionPlayerIds={illusionPlayerIds}
        roleAssignments={roleAssignments}
        players={players}
        isFortuneTellerPoisoned={fortuneTellerModalPoisoned}
        precomputedFakeMap={fortuneTellerFakeMap}
        onRoleClick={(roleId) => openRulebook(roleId)}
      />

      <RevealModal
        language={lang}
        open={mimeRevealOpen}
        onClose={() => setMimeRevealOpen(false)}
        title={roleLabel("a03")}
        cards={mimeRevealCards}
        onRoleClick={(roleId) => openRulebook(roleId)}
      />

      <RevealModal
        language={lang}
        open={littleGirlRevealOpen}
        onClose={handleCloseLittleGirlModal}
        title={tt("revealLittleGirlTitle")}
        subtitle={tt("revealLittleGirlSubtitle")}
        cards={littleGirlRevealCards}
        onRoleClick={(roleId) => openRulebook(roleId)}
      />

      <RevealModal
        language={lang}
        open={lamplighterRevealOpen}
        onClose={handleCloseLamplighterModal}
        title={tt("revealLamplighterTitle")}
        subtitle={tt("revealLamplighterSubtitle")}
        cards={lamplighterPickedRole ? [{
          image: ROLES[lamplighterPickedRole].image,
          label: roleLabel(lamplighterPickedRole),
          roleId: lamplighterPickedRole,
          checkboxes: lamplighterPickedCharges.length > 0 ? lamplighterPickedCharges : undefined,
        }] : []}
        onRoleClick={(roleId) => openRulebook(roleId)}
      />

      <RevealModal
        language={lang}
        open={werewolfSeerRevealOpen}
        onClose={handleCloseWerewolfSeerModal}
        title={tt("revealVampireWolfTitle")}
        subtitle={tt("revealVampireWolfSubtitle")}
        cards={werewolfSeerRevealedVictim ? [{
          name: werewolfSeerRevealedVictim.name,
          image: ROLES[werewolfSeerRevealedVictim.role]?.image || villagerIcon,
          label: roleLabel(werewolfSeerRevealedVictim.role),
          roleId: werewolfSeerRevealedVictim.role,
        }] : []}
        onRoleClick={(roleId) => openRulebook(roleId)}
      />

      <RevealModal
        language={lang}
        open={spiderRevealOpen}
        onClose={handleCloseSpiderModal}
        title={tt("spiderEyeReveal")}
        cards={spiderRevealCards}
        onRoleClick={(roleId) => openRulebook(roleId)}
      />

      <RevealModal
        language={lang}
        open={spyRevealOpen}
        onClose={handleCloseSpyModal}
        title={tt("spyEyeReveal")}
        cards={spyRevealCards}
        onRoleClick={(roleId) => openRulebook(roleId)}
      />

      <RulebookModal
        open={rulebookOpen}
        onOpenChange={setRulebookOpen}
        language={lang}
        roleId={rulebookRoleId}
      />

      <GameLogModal
        open={gameLogOpen}
        onOpenChange={setGameLogOpen}
        language={lang}
        events={gameLogEvents}
        players={players}
        roleAssignments={roleAssignments}
        playerStatuses={playerStatuses}
        permanentlyDead={permanentlyDead}
        playerEffects={playerEffects}
        poisonedPlayerId={poisonedPlayerId}
        poisonedPlayerIds={poisonedPlayerIds}
        illusionPlayerId={illusionPlayerId}
        illusionPlayerIds={illusionPlayerIds}
      />

      <WinPickerModal
        open={winPickerOpen}
        onClose={() => setWinPickerOpen(false)}
        onPick={(kind) => {
          setWinPickerOpen(false);
          setTieWinnerGroups(new Set());
          setManualWinKind(kind);
        }}
      />

      <WinConfirmModal
        open={!!pendingWinKind}
        kind={pendingWinKind}
        onDecline={() => {
          if (manualWinKind) {
            setManualWinKind(null);
            setTieWinnerGroups(new Set());
            return;
          }
          if (automaticWinKind) {
            setDeclinedAutomaticVictory({ kind: automaticWinKind, signature: victoryStateSignature });
            setAutomaticWinKind(null);
          }
        }}
        onAccept={() => {
          if (pendingWinKind) sendGameOver(pendingWinKind);
        }}
        tieWinnerGroups={tieWinnerGroups}
        onTieWinnerGroupToggle={(kind) => {
          setTieWinnerGroups((current) => {
            const next = new Set(current);
            if (next.has(kind)) next.delete(kind);
            else next.add(kind);
            return next;
          });
        }}
      />

      <AnimatePresence>
        {qrPopupOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-background p-4"
            onClick={() => setQrPopupOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.85 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.85 }}
              className="flex max-h-[calc(100vh-2rem)] flex-col items-center gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-parchment p-4 rounded-2xl">
                <QRCodeSVG
                  value={joinUrl}
                  size={512}
                  bgColor="hsl(40, 30%, 85%)"
                  fgColor="hsl(30, 10%, 8%)"
                  style={{ width: "min(72vw, 52vh, 28rem)", height: "auto", maxWidth: "100%" }}
                />
              </div>
              <div className="font-display text-4xl tracking-[0.3em] text-foreground">{room.code}</div>
              <div className="w-full max-w-md space-y-2">
                <div className="flex gap-2">
                  <Input
                    aria-label="Join link base URL"
                    value={joinBaseOverride || defaultJoinBaseUrl}
                    onChange={(event) => setJoinBaseOverride(event.target.value)}
                    className="h-10 bg-secondary border-border text-xs"
                    placeholder="http://YOUR-LAN-IP:8080"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    onClick={copyJoinUrl}
                    title={tt("copyJoinLink")}
                    aria-label={tt("copyJoinLink")}
                    className="h-10 w-10 flex-shrink-0"
                  >
                    {copiedJoinLink ? <Check className="h-4 w-4 text-gold" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="break-all text-center text-xs text-muted-foreground">{joinUrl}</p>
                {copiedJoinLink && (
                  <p className="text-center text-xs font-display tracking-wider text-primary">
                    {getToast("okJoinLinkCopied", lang)}
                  </p>
                )}
              </div>
              <button
                onClick={() => setQrPopupOpen(false)}
                className="text-muted-foreground hover:text-foreground font-display text-sm tracking-widest uppercase"
              >{tt("close")}</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </LanguageContext.Provider>
  );
};

export default GMRoom;
