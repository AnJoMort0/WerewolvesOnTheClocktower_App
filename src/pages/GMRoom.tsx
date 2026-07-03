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
import { VidenteRevealModal } from "@/components/game/VidenteRevealModal";
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
import { assignRoles, ROLES, isUniqueRole, WEREWOLF_ROLES, WEB_IMMUNE_ROLES, type RoleId } from "@/lib/roles";
import { LanguageContext, getEffectLabel, getRoleLabel, t, getToast, getValidation, getGameOver, format, type Language, type WinKind } from "@/lib/i18n";
import { getScriptOrderIndex } from "@/lib/nightScript";
import { buildJoinUrl, getDefaultJoinBaseUrl, normalizeJoinBaseUrl } from "@/lib/joinUrl";
import { canWhiteWolfTarget, getMeninaAnswerKind, hasOtherLivingWerewolf, MENINA_POISONED_ANSWERS, type MeninaAnswerKind, type WhiteWolfPlayerState } from "@/lib/gameRules";
import { detectAutomaticVictory, getVictoryStateSignature, playerWinsAnyVictoryGroup, type AutomaticWinKind, type VictoryPlayer } from "@/lib/victory";
import { WinConfirmModal, WinPickerModal } from "@/components/game/WinConfirmModal";
import { MAX_GAME_LOG_EVENTS, type GameLogEvent, type GameLogPhase, type GameLogPlayerSnapshot } from "@/lib/gameLog";
import { getRoomDisplayStorageKey, ROOM_DISPLAY_SNAPSHOT_VERSION, type RoomDisplaySnapshot } from "@/lib/roomDisplay";
import {
  EMPTY_ACTOR_POWER_STATE,
  encodeActorCharacter,
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
import poisonedIcon from "@/assets/icons/poisoned.png";
import illusionIcon from "@/assets/icons/illusion.png";
import imunityIcon from "@/assets/icons/imunity_full.png";
import villagerIcon from "@/assets/icons/villager.png";

const JOIN_BASE_URL_STORAGE_KEY = "wotct_join_base_url";
const GM_ADVANCED_STORAGE_PREFIX = "wotct_gm_advanced_";
const GM_SNAPSHOT_STORAGE_PREFIX = "wotct_gm_snapshot_";
const GM_SNAPSHOT_VERSION = 1;
const GM_SNAPSHOT_RETENTION_MS = 24 * 60 * 60 * 1000;
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
  illusionPlayerId: string | null;
  chamanCharges: number;
  lastNightDeadPlayerIds: string[];
  foxDisabled: boolean;
  nightTargetedPlayerIds: string[];
  cavalerioLinkedDeath: string | null;
  tetanusSourcePlayerIds?: Record<string, string>;
  gameCyclePhase: "night" | "day" | "tribunal";
  dayPhase: "day" | "tribunal";
  killSources: Record<string, string>;
  killSourcePlayerIds?: Record<string, string>;
  videnteFakeMap: Record<string, string> | null;
  bruxaDeathNight: number | null;
  playerEffects: Record<string, StatusEffect[]>;
  paranoicoCharges: number;
  anjoCharges: number;
  lobisomemMauCharges: number;
  cupidoCharges: number;
  lobisomemVidenteUsed: boolean;
  lobisomemVampiroUsed: boolean;
  dayKilledPlayerIds: string[];
  paranoicoKillName: string | null;
  profeciaDeadAtNight: Record<string, number>;
  juizCharges: number;
  acusadorCharges: number;
  salvadorLastTarget: string | null;
  chefeLastTarget: string | null;
  vampireVictimKeepsPower: boolean;
  spiderDayChangeUsed: boolean;
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
};

const getGMSnapshotStorageKey = (roomId: string) => `${GM_SNAPSHOT_STORAGE_PREFIX}${roomId}`;

function serializeEffects(effects: Record<string, Set<StatusEffect>>): Record<string, StatusEffect[]> {
  return Object.fromEntries(Object.entries(effects).map(([playerId, set]) => [playerId, Array.from(set)]));
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
const CHAMAN_ROLE: RoleId = "e03";
const ILLUSION_DRAG_ROLE: RoleId = "a06";
const CAVALEIRO_ROLE: RoleId = "v07";
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
};

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
  const [poisonedPlayerId, setPoisonedPlayerId] = useState<string | null>(null);
  const [illusionPlayerId, setIllusionPlayerId] = useState<string | null>(null);
  const [listPopoverId, setListPopoverId] = useState<string | null>(null);
  const [chamanCharges, setChamanCharges] = useState(0);
  const [lastNightDeadPlayerIds, setLastNightDeadPlayerIds] = useState<string[]>([]);
  const [videnteModalOpen, setVidenteModalOpen] = useState(false);
  const [foxDisabled, setFoxDisabled] = useState(false);
  const [nightTargetedPlayerIds, setNightTargetedPlayerIds] = useState<Set<string>>(new Set());
  const [cavalerioLinkedDeath, setCavalerioLinkedDeath] = useState<string | null>(null);
  const [tetanusSourcePlayerIds, setTetanusSourcePlayerIds] = useState<Record<string, string>>({});

  // Game cycle
  const [gameCyclePhase, setGameCyclePhase] = useState<"night" | "day" | "tribunal">("night");
  const [dayPhase, setDayPhase] = useState<"day" | "tribunal">("day");

  // Kill tracking
  const [killSources, setKillSources] = useState<Record<string, string>>({});
  const [killSourcePlayerIds, setKillSourcePlayerIds] = useState<Record<string, string>>({});

  // Vidente fake map
  const [videnteFakeMap, setVidenteFakeMap] = useState<Record<string, string> | null>(null);

  // Poison auto-removal tracking
  const [bruxaDeathNight, setBruxaDeathNight] = useState<number | null>(null);

  // Status effects per player
  const [playerEffects, setPlayerEffects] = useState<Record<string, Set<StatusEffect>>>({});

  // Role charges
  const [paranoicoCharges, setParanoicoCharges] = useState(0);
  const [anjoCharges, setAnjoCharges] = useState(0);
  const [lobisomemMauCharges, setLobisomemMauCharges] = useState(0);
  const [cupidoCharges, setCupidoCharges] = useState(0);
  const [lobisomemVidenteUsed, setLobisomemVidenteUsed] = useState(false);
  const [lobisomemVampiroUsed, setLobisomemVampiroUsed] = useState(false);

  // Executado tracking for day kills
  const [dayKilledPlayerIds, setDayKilledPlayerIds] = useState<string[]>([]);
  const [timerDefaults, setTimerDefaults] = useState<TimerDefaults>(FALLBACK_TIMER_DEFAULTS);

  // Paranoico kill announcement for tribunal
  const [paranoicoKillName, setParanoicoKillName] = useState<string | null>(null);

  // Reveal modals (Menina, Faroleiro, Lobisomem Vidente)
  const [qrPopupOpen, setQrPopupOpen] = useState(false);
  const [meninaRevealOpen, setMeninaRevealOpen] = useState(false);
  const [faroleiroRevealOpen, setFaroleiroRevealOpen] = useState(false);
  const [lobisomemVidenteRevealOpen, setLobisomemVidenteRevealOpen] = useState(false);
  const [lobisomemVidenteRevealedVictim, setLobisomemVidenteRevealedVictim] = useState<{ id: string; name: string; role: RoleId } | null>(null);
  const [faroleiroPickedRole, setFaroleiroPickedRole] = useState<RoleId | null>(null);
  const [faroleiroPickedCharges, setFaroleiroPickedCharges] = useState<boolean[]>([]);

  // Track when profecia-tagged player became perma-dead (for +1 night persistence)
  // Key: playerId. Value: nightNumber the player perma-died with profecia status.
  // The player's role line still appears during nightNumber === storedNight + 1.
  const [profeciaDeadAtNight, setProfeciaDeadAtNight] = useState<Record<string, number>>({});

  // Track Juiz/Acusador checkboxes (live action only)
  const [juizCharges, setJuizCharges] = useState(0);
  const [acusadorCharges, setAcusadorCharges] = useState(0);

  // Track last targets for Salvador / Chefe da Aldeia (so retarget removes the previous effect)
  const [salvadorLastTarget, setSalvadorLastTarget] = useState<string | null>(null);
  const [chefeLastTarget, setChefeLastTarget] = useState<string | null>(null);

  // Vampire victim "keeps power" toggle (default true once turned). Square checkbox.
  const [vampireVictimKeepsPower, setVampireVictimKeepsPower] = useState(true);
  const [spiderDayChangeUsed, setSpiderDayChangeUsed] = useState(false);
  const [hideScreenMode, setHideScreenMode] = useState(false);
  const [syncedTimerState, setSyncedTimerState] = useState<TimerSyncState | null>(null);
  const [hiddenTimerEditing, setHiddenTimerEditing] = useState(false);
  const [hiddenTimerMinutes, setHiddenTimerMinutes] = useState("0");
  const [hiddenTimerSeconds, setHiddenTimerSeconds] = useState("0");
  const dayPanelRef = useRef<DayTribunalPanelHandle>(null);
  const pendingGameOverLogKindRef = useRef<WinKind | null>(null);
  const pendingActorCopyLogRef = useRef<RoleId | null>(null);
  const pendingDrunkardSetupLogRef = useRef<RoleId | null>(null);
  const pendingGameActionLogSourcesRef = useRef<Map<string, string>>(new Map());
  const suppressedEffectLogAddsRef = useRef<Set<string>>(new Set());
  const gameLogDiffReadyRef = useRef(false);
  const previousGameLogStateRef = useRef<{
    playerStatuses: Record<string, PlayerStatus>;
    permanentlyDead: Set<string>;
    poisonedPlayerId: string | null;
    illusionPlayerId: string | null;
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
  const [scriptAutoComplete, setScriptAutoComplete] = useState<{ role: RoleId | null; version: number }>({ role: null, version: 0 });
  const [rulebookOpen, setRulebookOpen] = useState(false);
  const [rulebookRoleId, setRulebookRoleId] = useState<RoleId | null>(null);
  const [gameLogOpen, setGameLogOpen] = useState(false);
  const [gameLogEvents, setGameLogEvents] = useState<GameLogEvent[]>([]);
  const [actorIdolUses, setActorIdolUses] = useState(0);
  const [actorCopiedRole, setActorCopiedRole] = useState<RoleId | null>(null);
  const [actorCopyNoticeNight, setActorCopyNoticeNight] = useState<number | null>(null);
  const [actorPowerState, setActorPowerState] = useState<ActorPowerState>(() => ({ ...EMPTY_ACTOR_POWER_STATE }));
  const [drunkardReplacementRole, setDrunkardReplacementRole] = useState<RoleId | null>(null);

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
  const actorIdolPlayerId = useMemo(
    () => Object.entries(playerEffects).find(([, effects]) => effects.has("idol"))?.[0] ?? null,
    [playerEffects],
  );
  const effectiveRoleAssignments = useMemo(
    () => getEffectiveRoleAssignments(roleAssignments, actorCopiedRole, drunkardReplacementRole),
    [actorCopiedRole, drunkardReplacementRole, roleAssignments],
  );
  const actorMechanicalRole = actorCopiedRole === "a01" && drunkardReplacementRole
    ? drunkardReplacementRole
    : actorCopiedRole;
  const drunkardMechanicPlayerIds = useMemo(() => {
    const playerIds = new Set<string>();
    if (drunkardPlayerId) playerIds.add(drunkardPlayerId);
    if (actorCopiedRole === "a01" && actorPlayerId) playerIds.add(actorPlayerId);
    return playerIds;
  }, [actorCopiedRole, actorPlayerId, drunkardPlayerId]);
  const isPlayerActingPoisoned = useCallback((playerId: string | null | undefined) => (
    isDrunkardActingPoisoned(playerId, drunkardMechanicPlayerIds, poisonedPlayerId)
  ), [drunkardMechanicPlayerIds, poisonedPlayerId]);

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
  const isWerewolfAttackSource = useCallback((source: string) => (
    source === "e01"
    || WEREWOLF_ROLES.includes(source as RoleId)
    || (source === "a04" && !!actorCopiedRole && WEREWOLF_ROLES.includes(actorCopiedRole))
  ), [actorCopiedRole]);
  // Derived states
  const isBruxaPermaDead = useMemo(() => {
    for (const [pid, role] of Object.entries(effectiveRoleAssignments)) {
      if (role === "e02" && permanentlyDead.has(pid)) return true;
    }
    return false;
  }, [effectiveRoleAssignments, permanentlyDead]);

  const isBruxaPoisoned = useMemo(() => {
    if (!poisonedPlayerId) return false;
    return effectiveRoleAssignments[poisonedPlayerId] === "e02";
  }, [effectiveRoleAssignments, poisonedPlayerId]);

  const isMarionetista = useMemo(() => {
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
    if (assignedRoles.has("m03") && !lobisomemVampiroUsed) {
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

    return effects;
  }, [actorCopiedRole, actorIdolUses, actorPlayerId, effectiveRoleAssignments, killSources, lobisomemVampiroUsed, permanentlyDead, playerEffects, playerStatuses]);

  const toggleEffect = useCallback((playerId: string, effect: StatusEffect, sourcePlayerId?: string | null) => {
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

      // Cupido checkbox sync: when immunity_cupid is given to one namorado, apply to both
      if (effect === "immunity_cupid") {
        // Check if cupido is poisoned
        const cupidoId = Object.entries(effectiveRoleAssignments).find(([, r]) => r === "s01")?.[0];
        if (cupidoId && poisonedPlayerId === cupidoId) {
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
        // Also tick a cupido charge
        setCupidoCharges((c) => Math.min(c + 1, 2));
        return newEffects;
      }

      // Vampiro: tick checkbox on apply
      if (effect === "werewolf_turned") {
        setLobisomemVampiroUsed(true);
      }

      if (effect === "idol") {
        if (!actorPlayerId || playerId === actorPlayerId || permanentlyDead.has(playerId) || actorIdolUses >= 2 || actorCopiedRole) {
          return prev;
        }
        setActorIdolUses((uses) => Math.min(uses + 1, 2));
      }

      // Vote_revoked: check ladrão not poisoned
      if (effect === "vote_revoked") {
        const ladraoId = Object.entries(effectiveRoleAssignments).find(([, r]) => r === "f01")?.[0];
        if (ladraoId && poisonedPlayerId === ladraoId) {
          toast.warning(getToast("warnThiefPoisoned", (room?.language as Language) || "pt"));
          return prev;
        }
      }

      // Profecia: check profeta not poisoned
      if (effect === "profecia") {
        const profetaId = Object.entries(effectiveRoleAssignments).find(([, r]) => r === "v19")?.[0];
        if (profetaId && poisonedPlayerId === profetaId) {
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
  }, [actorCopiedRole, actorIdolUses, actorPlayerId, effectiveRoleAssignments, permanentlyDead, playerStatuses, poisonedPlayerId, room?.language, roomId]);

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

      setRoleAssignments(snapshot.roleAssignments ?? {});
      setRolesAssigned(!!snapshot.rolesAssigned);
      setPendingChanges(!!snapshot.pendingChanges);
      setAdvancedEnabled(!!snapshot.advancedEnabled);
      setNightNumber(snapshot.nightNumber ?? 1);
      setPlayerStatuses(snapshot.playerStatuses ?? {});
      setPermanentlyDead(new Set(snapshot.permanentlyDead ?? []));
      setPoisonedPlayerId(snapshot.poisonedPlayerId ?? null);
      setIllusionPlayerId(snapshot.illusionPlayerId ?? null);
      setChamanCharges(snapshot.chamanCharges ?? 0);
      setLastNightDeadPlayerIds(snapshot.lastNightDeadPlayerIds ?? []);
      setFoxDisabled(!!snapshot.foxDisabled);
      setNightTargetedPlayerIds(new Set(snapshot.nightTargetedPlayerIds ?? []));
      setCavalerioLinkedDeath(snapshot.cavalerioLinkedDeath ?? null);
      setTetanusSourcePlayerIds(snapshot.tetanusSourcePlayerIds ?? {});
      setGameCyclePhase(snapshot.gameCyclePhase ?? "night");
      setDayPhase(snapshot.dayPhase ?? "day");
      setKillSources(snapshot.killSources ?? {});
      setKillSourcePlayerIds(snapshot.killSourcePlayerIds ?? {});
      setVidenteFakeMap(snapshot.videnteFakeMap ?? null);
      setBruxaDeathNight(snapshot.bruxaDeathNight ?? null);
      setPlayerEffects(restoreEffects(snapshot.playerEffects));
      setParanoicoCharges(snapshot.paranoicoCharges ?? 0);
      setAnjoCharges(snapshot.anjoCharges ?? 0);
      setLobisomemMauCharges(snapshot.lobisomemMauCharges ?? 0);
      setCupidoCharges(snapshot.cupidoCharges ?? 0);
      setLobisomemVidenteUsed(!!snapshot.lobisomemVidenteUsed);
      setLobisomemVampiroUsed(!!snapshot.lobisomemVampiroUsed);
      setDayKilledPlayerIds(snapshot.dayKilledPlayerIds ?? []);
      setParanoicoKillName(snapshot.paranoicoKillName ?? null);
      setProfeciaDeadAtNight(snapshot.profeciaDeadAtNight ?? {});
      setJuizCharges(snapshot.juizCharges ?? 0);
      setAcusadorCharges(snapshot.acusadorCharges ?? 0);
      setSalvadorLastTarget(snapshot.salvadorLastTarget ?? null);
      setChefeLastTarget(snapshot.chefeLastTarget ?? null);
      setVampireVictimKeepsPower(snapshot.vampireVictimKeepsPower ?? true);
      setSpiderDayChangeUsed(!!snapshot.spiderDayChangeUsed);
      setHideScreenMode(!!snapshot.hideScreenMode);
      setSyncedTimerState(snapshot.syncedTimerState ?? null);
      setCompletedScriptLineKeys(new Set(snapshot.completedScriptLineKeys ?? []));
      setGameLogEvents(snapshot.gameLogEvents ?? []);
      setDeclinedAutomaticVictory(snapshot.declinedAutomaticVictory ?? null);
      setActorIdolUses(snapshot.actorIdolUses ?? 0);
      setActorCopiedRole(snapshot.actorCopiedRole ?? null);
      setActorCopyNoticeNight(snapshot.actorCopyNoticeNight ?? null);
      setActorPowerState({ ...EMPTY_ACTOR_POWER_STATE, ...snapshot.actorPowerState });
      setDrunkardReplacementRole(snapshot.drunkardReplacementRole ?? null);
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
      illusionPlayerId,
      chamanCharges,
      lastNightDeadPlayerIds,
      foxDisabled,
      nightTargetedPlayerIds: Array.from(nightTargetedPlayerIds),
      cavalerioLinkedDeath,
      tetanusSourcePlayerIds,
      gameCyclePhase,
      dayPhase,
      killSources,
      killSourcePlayerIds,
      videnteFakeMap,
      bruxaDeathNight,
      playerEffects: serializeEffects(playerEffects),
      paranoicoCharges,
      anjoCharges,
      lobisomemMauCharges,
      cupidoCharges,
      lobisomemVidenteUsed,
      lobisomemVampiroUsed,
      dayKilledPlayerIds,
      paranoicoKillName,
      profeciaDeadAtNight,
      juizCharges,
      acusadorCharges,
      salvadorLastTarget,
      chefeLastTarget,
      vampireVictimKeepsPower,
      spiderDayChangeUsed,
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
    illusionPlayerId,
    chamanCharges,
    lastNightDeadPlayerIds,
    foxDisabled,
    nightTargetedPlayerIds,
    cavalerioLinkedDeath,
    tetanusSourcePlayerIds,
    gameCyclePhase,
    dayPhase,
    killSources,
    killSourcePlayerIds,
    videnteFakeMap,
    bruxaDeathNight,
    playerEffects,
    paranoicoCharges,
    anjoCharges,
    lobisomemMauCharges,
    cupidoCharges,
    lobisomemVidenteUsed,
    lobisomemVampiroUsed,
    dayKilledPlayerIds,
    paranoicoKillName,
    profeciaDeadAtNight,
    juizCharges,
    acusadorCharges,
    salvadorLastTarget,
    chefeLastTarget,
    vampireVictimKeepsPower,
    spiderDayChangeUsed,
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
      illusionPlayerId,
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
    illusionPlayerId,
    gameLogEvents,
  ]);

  // Auto-apply vote_double effect for Juiz (dead non-execution) and Ankou (executed)
  useEffect(() => {
    setPlayerEffects((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const [pid, role] of Object.entries(effectiveRoleAssignments)) {
        const isJuizDouble = role === "v13" && permanentlyDead.has(pid) && killSources[pid] !== "executado";
        const isAnkouDouble = role === "m04" && permanentlyDead.has(pid) && killSources[pid] === "executado";
        if (isJuizDouble || isAnkouDouble) {
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
    }, [effectiveRoleAssignments, permanentlyDead, killSources]);

  // Auto-kill werewolves (or werewolf_turned players) marked Incendiado (instant red X, source = piromaníaco).
  // Balance: if the wolf is immune, the fire is shrugged off entirely — remove the incendiado effect.
  useEffect(() => {
    for (const [pid, effs] of Object.entries(playerEffects)) {
      const isWolf = WEREWOLF_ROLES.includes(effectiveRoleAssignments[pid]) || effs.has("werewolf_turned");
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
  }, [effectiveRoleAssignments, playerEffects]);
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
          let actorFound = false;
          data.forEach((p) => {
            const parsed = parsePlayerCharacter(p.character);
            if (parsed.baseRole) assignments[p.id] = parsed.baseRole;
            if (parsed.baseRole === "a04") {
              actorFound = true;
              fetchedActorCopy = parsed.actorCopiedRole;
            }
            if (parsed.drunkardReplacementRole) fetchedDrunkardReplacement = parsed.drunkardReplacementRole;
          });
          if (actorFound) setActorCopiedRole(fetchedActorCopy);
          if (fetchedDrunkardReplacement) setDrunkardReplacementRole(fetchedDrunkardReplacement);
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
    setPoisonedPlayerId(null);
    setIllusionPlayerId(null);
    setListPopoverId(null);
    setChamanCharges(0);
    setLastNightDeadPlayerIds([]);
    setVidenteModalOpen(false);
    setFoxDisabled(false);
    setNightTargetedPlayerIds(new Set());
    setCavalerioLinkedDeath(null);
    setTetanusSourcePlayerIds({});
    setGameCyclePhase("night");
    setDayPhase("day");
    setKillSources({});
    setKillSourcePlayerIds({});
    setVidenteFakeMap(null);
    setBruxaDeathNight(null);
    setPlayerEffects({});
    setParanoicoCharges(0);
    setAnjoCharges(0);
    setLobisomemMauCharges(0);
    setCupidoCharges(0);
    setLobisomemVidenteUsed(false);
    setLobisomemVampiroUsed(false);
    setDayKilledPlayerIds([]);
    setParanoicoKillName(null);
    setMeninaRevealOpen(false);
    setFaroleiroRevealOpen(false);
    setLobisomemVidenteRevealOpen(false);
    setLobisomemVidenteRevealedVictim(null);
    setFaroleiroPickedRole(null);
    setFaroleiroPickedCharges([]);
    setProfeciaDeadAtNight({});
    setJuizCharges(0);
    setAcusadorCharges(0);
    setSalvadorLastTarget(null);
    setChefeLastTarget(null);
    setVampireVictimKeepsPower(true);
    setSpiderDayChangeUsed(false);
    setHideScreenMode(false);
    setSyncedTimerState(null);
    setSpiderRevealOpen(false);
    setSpiderRevealCards([]);
    setSpyRevealOpen(false);
    setSpyRevealCards([]);
    setCompletedScriptLineKeys(new Set());
    setScriptAutoComplete({ role: null, version: 0 });
    setGameLogOpen(false);
    setGameLogEvents([]);
    suppressedEffectLogAddsRef.current.clear();
    pendingGameActionLogSourcesRef.current.clear();
    pendingActorCopyLogRef.current = null;
    pendingDrunkardSetupLogRef.current = null;
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
      const role = effectiveRoleAssignments[player.id];
      if (!role) return [];
      return [{
        id: player.id,
        role,
        alive: !permanentlyDead.has(player.id),
        effects: playerEffects[player.id] || new Set<StatusEffect>(),
      }];
    });
    const victoryPlayer = allVictoryPlayers.find((player) => player.id === playerId);
    if (!victoryPlayer) return "defeat";
    const winnerGroups: AutomaticWinKind[] = kind === "tie" ? Array.from(tieWinnerGroups) : [kind];
    return playerWinsAnyVictoryGroup(victoryPlayer, winnerGroups, allVictoryPlayers)
      ? "victory"
      : "defeat";
  }, [effectiveRoleAssignments, permanentlyDead, playerEffects, players, tieWinnerGroups]);

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
      const hasCupido = Object.values(roleAssignments).some((r) => r === "s01");
      if (!hasCupido) toast.warning(getToast("warnSecretLoverMissing", (room?.language as Language) || "pt"));
    }
    const oldRole = roleAssignments[playerId];
    if (oldRole === "v08" && role !== "v08") {
      const hasCapuchinho = Object.entries(roleAssignments).some(([pid, r]) => r === "v08b" && pid !== playerId);
      if (hasCapuchinho) toast.warning(getToast("warnLittleRedWithoutHunter", (room?.language as Language) || "pt"));
    }
    if (oldRole === "s01" && role !== "s01") {
      const hasAmante = Object.entries(roleAssignments).some(([pid, r]) => r === "as01b" && pid !== playerId);
      if (hasAmante) toast.warning(getToast("warnSecretLoverWithoutCupid", (room?.language as Language) || "pt"));
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

  const getStoredCharacter = useCallback((playerId: string, role: RoleId) => {
    if (role === "a04" && playerId === actorPlayerId) {
      return encodeActorCharacter(actorCopiedRole, drunkardReplacementRole);
    }
    if (role === "a01" && playerId === drunkardPlayerId && drunkardReplacementRole) {
      return encodeDrunkardCharacter(drunkardReplacementRole);
    }
    return role;
  }, [actorCopiedRole, actorPlayerId, drunkardPlayerId, drunkardReplacementRole]);

  const syncActorCharacter = useCallback((copiedRole: RoleId | null) => {
    if (!actorPlayerId) return;
    const character = encodeActorCharacter(copiedRole, drunkardReplacementRole);
    setPlayers((prev) => prev.map((player) => player.id === actorPlayerId ? { ...player, character } : player));
    void supabase.from("players").update({ character }).eq("id", actorPlayerId).then(() => {
      broadcastPlayerSync([actorPlayerId]);
    });
  }, [actorPlayerId, broadcastPlayerSync, drunkardReplacementRole]);

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

  // Helper: find closest werewolf to cavaleiro
  const findClosestWerewolf = useCallback((cavalerioId: string) => {
    const sorted = players
      .filter((p) => p.seat_position !== null)
      .sort((a, b) => a.seat_position! - b.seat_position!);
    const cavIdx = sorted.findIndex((p) => p.id === cavalerioId);
    if (cavIdx === -1) return null;

    for (let dist = 1; dist < sorted.length; dist++) {
      for (const dir of [1, -1]) {
        const idx = (cavIdx + dir * dist + sorted.length) % sorted.length;
        const p = sorted[idx];
        if (p.id === cavalerioId) continue;
        const r = effectiveRoleAssignments[p.id];
        if (WEREWOLF_ROLES.includes(r) && !permanentlyDead.has(p.id) && playerStatuses[p.id] !== "dead-this-night") return p;
      }
    }
    return null;
  }, [effectiveRoleAssignments, players, permanentlyDead, playerStatuses]);

  // Check immunity
  const hasImmunity = useCallback((playerId: string, source: string): boolean => {
    const effects = playerEffects[playerId] || new Set();
    if (effects.has("immunity_full")) return true;
    if (effects.has("immunity_cupid")) return true;
    if (effects.has("immunity_onetime")) return true;
    // Werewolf immunity (capuchinho)
    if (isWerewolfAttackSource(source)) {
      if (effects.has("immunity_werewolf")) return true;
    }
    return false;
  }, [isWerewolfAttackSource, playerEffects]);

  // Player status management
  const handlePlayerStatusChange = useCallback((playerId: string, newStatus: PlayerStatus, _source?: string, sourcePlayerId?: string | null) => {
    if (newStatus === "poisoned") {
      if (poisonedPlayerId === playerId) {
        setPoisonedPlayerId(null);
      } else {
        if (sourcePlayerId) pendingGameActionLogSourcesRef.current.set(`poison:${playerId}`, sourcePlayerId);
        setPoisonedPlayerId(playerId);
        setNightTargetedPlayerIds((prev) => { const n = new Set(prev); n.add(playerId); return n; });
      }
      return;
    } else if (newStatus === "dead-this-night") {
      const source = _source || "manual";
      const isWerewolfTargeting = isWerewolfAttackSource(source);
      if (isWerewolfTargeting) {
        setNightTargetedPlayerIds((prev) => { const next = new Set(prev); next.add(playerId); return next; });
      }

      // Check immunities
      if (hasImmunity(playerId, source)) {
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

      // Check Capuchinho werewolf immunity
      if (isWerewolfAttackSource(source)) {
        const capuchinhoId = Object.entries(effectiveRoleAssignments).find(([, r]) => r === "v08b")?.[0];
        if (capuchinhoId === playerId) {
          const cacadorAlive = Object.entries(effectiveRoleAssignments).some(([pid, r]) => r === "v08" && !permanentlyDead.has(pid));
          const capuchinhoPoisoned = poisonedPlayerId === playerId;
          if (cacadorAlive && !capuchinhoPoisoned) {
            toast.warning(getToast("warnLittleRedImmune", (room?.language as Language) || "pt"));
            return;
          }
        }
      }

      if (effectiveRoleAssignments[playerId] === "e02" && poisonedPlayerId === playerId) {
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

      // Cavaleiro Enferrujado mechanic: apply Tetanus (deferred death) instead of instant kill
      if (effectiveRoleAssignments[playerId] === CAVALEIRO_ROLE && _source !== "cavaleiro-linked") {
        const isCavaleiroPoisoned = poisonedPlayerId === playerId;
        if (isCavaleiroPoisoned) {
          const nonWWAlive = players.filter(
            (p) => p.id !== playerId && !permanentlyDead.has(p.id) && !WEREWOLF_ROLES.includes(effectiveRoleAssignments[p.id]) && playerStatuses[p.id] !== "dead-this-night"
          );
          if (nonWWAlive.length > 0) {
            const victim = nonWWAlive[Math.floor(Math.random() * nonWWAlive.length)];
            setPlayerEffects((prev) => {
              const cur = new Set(prev[victim.id] || []);
              cur.add("tetanus");
              return { ...prev, [victim.id]: cur };
            });
            setCavalerioLinkedDeath(victim.id);
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
            setCavalerioLinkedDeath(closestWW.id);
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
          if (targetRole === "e03") setChamanCharges(0);
          if (targetRole === "v10") setParanoicoCharges(0);
          if (targetRole === "v18") setAnjoCharges(0);
          if (targetRole === "m01") setLobisomemMauCharges(0);
          if (targetRole === "s01") setCupidoCharges(0);
          if (targetRole === "m02") setLobisomemVidenteUsed(false);
          if (targetRole === "m03") setLobisomemVampiroUsed(false);
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

      // Cavaleiro resurrection does NOT remove Tetanus from the linked victim (by design).
      if (effectiveRoleAssignments[playerId] === CAVALEIRO_ROLE && cavalerioLinkedDeath) {
        setCavalerioLinkedDeath(null);
      }
    }
  }, [
    actorCopiedRole,
    actorIdolPlayerId,
    broadcastPlayerSync,
    cavalerioLinkedDeath,
    effectiveRoleAssignments,
    findClosestWerewolf,
    hasImmunity,
    isWerewolfAttackSource,
    permanentlyDead,
    playerEffects,
    playerStatuses,
    players,
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

  // Executado handler (during tribunal). Lobisomem Mau is always executable when Capuchinho is in game.
  const handleExecute = useCallback((playerId: string) => {
    const role = effectiveRoleAssignments[playerId];
    const capuchinhoInGame = Object.values(effectiveRoleAssignments).some((r) => r === "v08b");
    const bypassImmunity = role === "m01" && capuchinhoInGame;
    if (!bypassImmunity && hasImmunity(playerId, "executado")) return;
    setPlayerStatuses((prev) => ({ ...prev, [playerId]: "dead-this-night" }));
    setKillSources((prev) => ({ ...prev, [playerId]: "executado" }));
    setDayKilledPlayerIds((prev) => (prev.includes(playerId) ? prev : [...prev, playerId]));
    toast.info(format(getToast("infoExecuted", (room?.language as Language) || "pt"), { name: players.find(p => p.id === playerId)?.name || "" }));
    // Cavaleiro Enferrujado: any death (including execution) triggers Tetanus on closest werewolf.
    if (role === CAVALEIRO_ROLE) {
      const isCavaleiroPoisoned = poisonedPlayerId === playerId;
      if (!isCavaleiroPoisoned) {
        const closestWW = findClosestWerewolf(playerId);
        if (closestWW) {
          setPlayerEffects((prev) => {
            const cur = new Set(prev[closestWW.id] || []);
            cur.add("tetanus");
            return { ...prev, [closestWW.id]: cur };
          });
          setCavalerioLinkedDeath(closestWW.id);
          setTetanusSourcePlayerIds((prev) => ({ ...prev, [closestWW.id]: playerId }));
          toast.info(format(getToast("infoKnightExecuted", (room?.language as Language) || "pt"), { name: closestWW.name }));
        }
      }
    }
    setListPopoverId(null);
  }, [effectiveRoleAssignments, players, hasImmunity, poisonedPlayerId, findClosestWerewolf, room?.language]);

  const handleSetIllusion = useCallback((playerId: string, sourcePlayerId?: string | null) => {
    if (illusionPlayerId === playerId) {
      setIllusionPlayerId(null);
    } else {
      if (sourcePlayerId) pendingGameActionLogSourcesRef.current.set(`illusion:${playerId}`, sourcePlayerId);
      setIllusionPlayerId(playerId);
    }
  }, [illusionPlayerId]);

  const handleChamanChargeToggle = (index: number) => {
    // Chaman can always tick/untick the checkbox to track usage manually,
    // even while poisoned. Only the drag-drop resurrect is gated by poison.
    if (chamanCharges > index) {
      setChamanCharges(index);
    } else {
      setChamanCharges(index + 1);
    }
  };

  const handleChamanDrop = useCallback((targetPlayerId: string, actorActing = false, sourcePlayerId?: string | null) => {
    const charges = actorActing ? actorPowerState.chamanCharges : chamanCharges;
    if (charges >= 2) {
      toast.warning(getToast("warnChamanUsedAll", (room?.language as Language) || "pt"));
      return;
    }
    const status = playerStatuses[targetPlayerId];
    if (status === "dead-this-night") {
      handlePlayerStatusChange(targetPlayerId, "alive", undefined, sourcePlayerId);
      if (actorActing) {
        setActorPowerState((state) => ({ ...state, chamanCharges: Math.min(state.chamanCharges + 1, 2) }));
      } else {
        setChamanCharges((c) => Math.min(c + 1, 2));
      }
      toast.success(getToast("okChamanRessurected", (room?.language as Language) || "pt"));
    } else {
      toast.error(getToast("errChamanDragOnlyDead", (room?.language as Language) || "pt"));
    }
  }, [actorPowerState.chamanCharges, chamanCharges, handlePlayerStatusChange, playerStatuses, room?.language]);

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
      const someIrmaoPoisoned = irmaoPlayerIds.some((pid) => poisonedPlayerId === pid);
      if (aliveIrmaos.length >= 2 && deadThisNightIrmaos.length > 0 && !someIrmaoPoisoned) {
        for (const pid of deadThisNightIrmaos) {
          newStatuses[pid] = "alive";
          toast.info(format(getToast("infoBrothersSaved", (room?.language as Language) || "pt"), { name: players.find(p => p.id === pid)?.name || "" }));
        }
      }
    }

    // Tetanus is no longer resolved here — moved to startTribunal (red X like Paranoico),
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

    Object.entries(newStatuses).forEach(([pid, status]) => {
      if (status === "dead-this-night") {
        newPermanentlyDead.add(pid);
        newStatuses[pid] = "dead";
        newlyDead.push(pid);
      }
    });

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
      if (salvadorLastTarget === pid || actorPowerState.salvadorLastTarget === pid) cleaned.delete("immunity_full");
      newEffects[pid] = cleaned;
    }
    setSalvadorLastTarget(null);
    setActorPowerState((state) => ({ ...state, salvadorLastTarget: null }));

    // Werewolf incendiado victims die (red X) — also covers werewolf_turned victims, respecting immunities.
    // If immune, the wolf survives AND the incendiado effect is removed (balance rule).
    for (const [pid, effects] of Object.entries(newEffects)) {
      const isWolf = WEREWOLF_ROLES.includes(effectiveRoleAssignments[pid]) || effects.has("werewolf_turned");
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
    setProfeciaDeadAtNight((prev) => {
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

    // Temporary night markers and Cupid protection end at dawn.
    for (const [pid, effects] of Object.entries(newEffects)) {
      if (effects.has("dug_up") || effects.has("immunity_cupid")) {
        const cleaned = new Set(effects);
        cleaned.delete("dug_up");
        cleaned.delete("immunity_cupid");
        newEffects[pid] = cleaned;
      }
    }

    setPlayerEffects(newEffects);

    setPermanentlyDead(newPermanentlyDead);
    setPlayerStatuses(newStatuses);
    setNightTargetedPlayerIds(new Set());
    setCavalerioLinkedDeath(null);
    setVidenteFakeMap(null);
    setParanoicoKillName(null);

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
    if (newlyDead.length > 0 || dugUpDeathId) {
      broadcastPlayerSync([...new Set([...newlyDead, ...(dugUpDeathId && a05Id ? [dugUpDeathId, a05Id] : [])])]);
    }

    // Check Criança Selvagem → Pai Adotivo died
    const criancaId = Object.entries(effectiveRoleAssignments).find(([, r]) => r === "l02")?.[0];
    if (criancaId && !newPermanentlyDead.has(criancaId)) {
      const paiAdotivoId = Object.entries(newEffects).find(([, e]) => e.has("adoptive_dad"))?.[0];
      if (paiAdotivoId && newPermanentlyDead.has(paiAdotivoId)) {
        // Transform Criança Selvagem into Lobisomem
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

    toast.success(format(getToast("okNightEnded", (room?.language as Language) || "pt"), { n: nightNumber }));
    setCompletedScriptLineKeys(new Set());
    setScriptAutoComplete({ role: null, version: 0 });
    setGameCyclePhase("day");
    setDayPhase("day");
  };

  const startTribunal = () => {
    // Tetanus resolution: any player still tagged with 'tetanus' gets a red X
    // (dead-this-night, source 'v07'), like Paranoico. They perma-die at "Próxima Noite".
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

    // Add day killed to lastNightDeadPlayerIds so Vidente sees them
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

    if (
      actorPlayerId
      && actorIdolPlayerId
      && newPermanentlyDead.has(actorIdolPlayerId)
      && !newPermanentlyDead.has(actorPlayerId)
    ) {
      const copiedRole = roleAssignments[actorIdolPlayerId];
      if (copiedRole && copiedRole !== "a04" && !actorCopiedRole) {
        pendingActorCopyLogRef.current = copiedRole;
        setActorCopiedRole(copiedRole);
        setActorCopyNoticeNight(nightNumber + 1);
        setActorPowerState({ ...EMPTY_ACTOR_POWER_STATE });
        syncActorCharacter(copiedRole);
      }
    }

    // At night start, remove m01's disguise immunity.
    // Salvador immunity is cleared at dawn in endNight.
    const newEffects = { ...playerEffects };
    for (const [pid, effects] of Object.entries(newEffects)) {
      const cleaned = new Set(effects);
      if (effectiveRoleAssignments[pid] === "m01") cleaned.delete("immunity_full");
      newEffects[pid] = cleaned;
    }

    // Track profecia perma-deaths for +1 night persistence
    setProfeciaDeadAtNight((prev) => {
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
    setScriptAutoComplete({ role: null, version: 0 });
    setGameCyclePhase("night");
    setNightNumber((n) => n + 1);
    setNightTargetedPlayerIds(new Set());
    setCavalerioLinkedDeath(null);
    setVidenteFakeMap(null);
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
    if (source === "soldado") return "v09";
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
      poisoned: poisonedPlayerId === playerId,
      illusion: illusionPlayerId === playerId,
      effects: Array.from(playerEffects[playerId] || []),
    };
  }, [illusionPlayerId, permanentlyDead, playerEffects, playerStatuses, players, poisonedPlayerId, roleAssignments]);

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

  const markScriptRoleAction = useCallback((role: RoleId) => {
    setScriptAutoComplete((current) => ({ role, version: current.version + 1 }));
  }, []);

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
      poisonedPlayerId,
      illusionPlayerId,
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

    if (previousState.poisonedPlayerId !== poisonedPlayerId) {
      if (poisonedPlayerId) {
        recordGameEvent({
          action: "poison",
          actor: actorForTransition(`poison:${poisonedPlayerId}`, "e02"),
          actorRole: "e02",
          target: getPlayerLogSnapshot(poisonedPlayerId),
        });
      }
    }

    if (previousState.illusionPlayerId !== illusionPlayerId) {
      if (illusionPlayerId) {
        recordGameEvent({
          action: "illusion",
          actor: actorForTransition(`illusion:${illusionPlayerId}`, "a06"),
          actorRole: "a06",
          target: getPlayerLogSnapshot(illusionPlayerId),
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
          const sourceRole: RoleId | null = previousState.permanentlyDead.has(playerId) ? "v18" : "e03";
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
        const sourceRole = previousRole === "a05" || currentRole === "a05" ? "a05" : null;
        recordGameEvent({
          action: "role_change",
          actor: actorForRole(sourceRole),
          actorRole: sourceRole,
          target: getPlayerLogSnapshot(playerId),
          detail: `${previousRole} -> ${currentRole}`,
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
    poisonedPlayerId,
    illusionPlayerId,
    playerEffects,
    roleAssignments,
    gameCyclePhase,
    dayPhase,
    nightNumber,
    killSources,
    killSourcePlayerIds,
    players,
    getActorSnapshotForRole,
    getPlayerLogSnapshot,
    getSourceRole,
    recordGameEvent,
  ]);

  const clearEffectsFromDeadSources = useCallback((progressOrder: number) => {
    const deadSourceRoles = [...new Set(Object.values(effectiveRoleAssignments))].filter((role) => {
      if (getScriptOrderIndex(role) >= progressOrder) return false;
      const sourcePlayerIds = Object.entries(effectiveRoleAssignments)
        .filter(([, assignedRole]) => assignedRole === role)
        .map(([playerId]) => playerId);
      return sourcePlayerIds.length > 0 && sourcePlayerIds.every((playerId) => permanentlyDead.has(playerId));
    });
    if (deadSourceRoles.length === 0) return;

    if (deadSourceRoles.includes("e02")) setPoisonedPlayerId(null);
    if (deadSourceRoles.includes("a06")) setIllusionPlayerId(null);
    if (deadSourceRoles.includes("v11")) setChefeLastTarget(null);
    if (deadSourceRoles.includes("v17")) setSalvadorLastTarget(null);

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
  }, [effectiveRoleAssignments, permanentlyDead]);

  const handleScriptLineCompleted = useCallback((key: string, completed: boolean, progressOrder: number | null = null) => {
    setCompletedScriptLineKeys((prev) => {
      const next = new Set(prev);
      if (completed) next.add(key);
      else next.delete(key);
      return next;
    });
    if (completed && progressOrder !== null) clearEffectsFromDeadSources(progressOrder);
  }, [clearEffectsFromDeadSources]);

  const handleLobisomemMauChargeToggle = useCallback((idx: number) => {
    const newCharges = lobisomemMauCharges > idx ? idx : idx + 1;
    setLobisomemMauCharges(newCharges);
    if (newCharges > lobisomemMauCharges) {
      const m01Id = getRolePlayerId("m01");
      if (m01Id && !playerEffects[m01Id]?.has("immunity_full")) {
        toggleEffect(m01Id, "immunity_full");
      }
    }
  }, [getRolePlayerId, lobisomemMauCharges, playerEffects, toggleEffect]);

  const handleCupidoChargeToggle = useCallback((idx: number) => {
    const cupidoId = getRolePlayerId("s01");
    if (cupidoId && poisonedPlayerId === cupidoId) {
      toast.warning(getToast("warnCupidPoisoned", (room?.language as Language) || "pt"));
      return;
    }

    const newCharges = cupidoCharges > idx ? idx : idx + 1;
    setCupidoCharges(newCharges);
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
  }, [cupidoCharges, getRolePlayerId, poisonedPlayerId, room?.language]);

  const handleActorPowerStateChange = useCallback((next: ActorPowerState) => {
    if (!actorPlayerId) return;
    if (next.lobisomemMauCharges > actorPowerState.lobisomemMauCharges && !playerEffects[actorPlayerId]?.has("immunity_full")) {
      toggleEffect(actorPlayerId, "immunity_full");
    }
    if (next.cupidoCharges !== actorPowerState.cupidoCharges) {
      if (poisonedPlayerId === actorPlayerId) {
        toast.warning(getToast("warnCupidPoisoned", (room?.language as Language) || "pt"));
        return;
      }
      setPlayerEffects((prev) => Object.fromEntries(Object.entries(prev).map(([playerId, effects]) => {
        if (!effects.has("namorado")) return [playerId, effects];
        const updated = new Set(effects);
        if (next.cupidoCharges > 0) updated.add("immunity_cupid");
        else updated.delete("immunity_cupid");
        return [playerId, updated];
      })));
    }
    if (next.lobisomemVampiroUsed && !actorPowerState.lobisomemVampiroUsed) {
      const victimId = Object.entries(playerStatuses).find(([playerId, status]) => {
        const source = killSources[playerId];
        return status === "dead-this-night" && !!source && isWerewolfAttackSource(source);
      })?.[0];
      if (victimId) {
        setPlayerEffects((prev) => {
          const effects = new Set(prev[victimId] || []);
          effects.add("werewolf_turned");
          return { ...prev, [victimId]: effects };
        });
        setPlayerStatuses((prev) => ({ ...prev, [victimId]: "alive" }));
        setVampireVictimKeepsPower(true);
      }
    }
    setActorPowerState(next);
  }, [actorPlayerId, actorPowerState.cupidoCharges, actorPowerState.lobisomemMauCharges, actorPowerState.lobisomemVampiroUsed, isWerewolfAttackSource, killSources, playerEffects, playerStatuses, poisonedPlayerId, room?.language, toggleEffect]);

  const handleScriptRolesVisible = useCallback((visibleRoles: RoleId[]) => {
    if (!Object.values(effectiveRoleAssignments).includes("f02")) return;
    const visibleRoleSet = new Set(visibleRoles);
    setPlayerEffects((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const [pid, role] of Object.entries(effectiveRoleAssignments)) {
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
  }, [actorPlayerId, effectiveRoleAssignments]);

  // Vampire victim id (player with werewolf_turned effect, transformed by Lobisomem Vampiro)
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
    if (role === "e03") setChamanCharges(0);
    if (role === "v10") setParanoicoCharges(0);
    if (role === "v18") setAnjoCharges(0);
    if (role === "m01") setLobisomemMauCharges(0);
    if (role === "s01") setCupidoCharges(0);
    if (role === "m02") setLobisomemVidenteUsed(false);
    if (role === "m03") setLobisomemVampiroUsed(false);
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

  // Handle drag-drop actions (both list and circle)
  const handleDragAction = useCallback((action: string, targetPlayerId: string, sourcePlayerId?: string | null) => {
    // Universal "caught" tagging — any drag onto a webbed player tags the source
    const applyCaughtIfWebbed = () => {
      if (!sourcePlayerId || sourcePlayerId === targetPlayerId) return;
      const sourceRole = effectiveRoleAssignments[sourcePlayerId];
      if (sourceRole && WEB_IMMUNE_ROLES.includes(sourceRole)) return;
      const targetEff = playerEffects[targetPlayerId];
      if (targetEff?.has("webbed")) {
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
      : action === "chaman"
      ? "e03"
      : action === "illusion"
      ? "a06"
      : action.startsWith("role-") && ROLES[action.replace("role-", "") as RoleId]
      ? action.replace("role-", "") as RoleId
      : null;
    const actorActing = !!actorPlayerId
      && sourcePlayerId === actorPlayerId
      && !!actionRole
      && actorMechanicalRole === actionRole;
    const toggleActionEffect = (playerId: string, effect: StatusEffect) => toggleEffect(playerId, effect, sourcePlayerId);
    if (actionRole) markScriptRoleAction(actionRole);
    applyCaughtIfWebbed();
    if (action === "poison") {
      handlePlayerStatusChange(targetPlayerId, "poisoned", undefined, sourcePlayerId);
      setNightTargetedPlayerIds((prev) => { const n = new Set(prev); n.add(targetPlayerId); return n; });
    } else if (action === "kill") {
      handlePlayerStatusChange(targetPlayerId, "dead-this-night", actorActing ? "a04" : "e01", sourcePlayerId);
    } else if (action === "chaman") {
      handleChamanDrop(targetPlayerId, actorActing, sourcePlayerId);
    } else if (action === "illusion") {
      const illusionistId = sourcePlayerId && effectiveRoleAssignments[sourcePlayerId] === "a06" ? sourcePlayerId : getRolePlayerId("a06");
      if (illusionistId && poisonedPlayerId === illusionistId) return;
      handleSetIllusion(targetPlayerId, sourcePlayerId);
    } else if (action.startsWith("role-")) {
      const roleSource = action.replace("role-", "");
      // Role-specific drag actions that add effects instead of killing
      if (roleSource === "a04") {
        if (!actorPlayerId || sourcePlayerId !== actorPlayerId || targetPlayerId === actorPlayerId || permanentlyDead.has(targetPlayerId) || actorIdolUses >= 2 || actorCopiedRole) return;
        toggleActionEffect(targetPlayerId, "idol");
      }
      else if (roleSource === "v19") { toggleActionEffect(targetPlayerId, "profecia"); }
      else if (roleSource === "v22") {
        if (!playerEffects[targetPlayerId]?.has("acusado")) toggleActionEffect(targetPlayerId, "acusado_next");
      }
      else if (roleSource === "v16") {
        // Sonâmbulo: if poisoned → random (excluding intended target & sonambulo)
        const sonambuloId = sourcePlayerId && effectiveRoleAssignments[sourcePlayerId] === "v16" ? sourcePlayerId : getRolePlayerId("v16");
        if (sonambuloId && isPlayerActingPoisoned(sonambuloId)) {
          const random = pickRandomPlayer((p) => !permanentlyDead.has(p.id) && p.id !== targetPlayerId && p.id !== sonambuloId);
          if (random) {
            toggleActionEffect(random.id, "hospede");
            toast.info(format(getToast("infoSleepwalkerPoisoned", (room?.language as Language) || "pt"), { name: random.name }));
          }
        } else {
          toggleActionEffect(targetPlayerId, "hospede");
        }
      }
      else if (roleSource === "v17") {
        // Salvador: if poisoned → random (excluding intended target & salvador)
        const salvadorId = sourcePlayerId && effectiveRoleAssignments[sourcePlayerId] === "v17" ? sourcePlayerId : getRolePlayerId("v17");
        const previousTarget = actorActing ? actorPowerState.salvadorLastTarget : salvadorLastTarget;
        let actualTarget = targetPlayerId;
        if (salvadorId && poisonedPlayerId === salvadorId) {
          const random = pickRandomPlayer((p) => !permanentlyDead.has(p.id) && p.id !== targetPlayerId && p.id !== salvadorId);
          if (random) {
            actualTarget = random.id;
            toast.info(format(getToast("infoSaviourPoisoned", (room?.language as Language) || "pt"), { name: random.name }));
          }
        }
        // Remove immunity from previous Salvador target if different
        if (previousTarget && previousTarget !== actualTarget) {
          const prevEff = playerEffects[previousTarget] || new Set();
          if (prevEff.has("immunity_full")) toggleActionEffect(previousTarget, "immunity_full");
        }
        toggleActionEffect(actualTarget, "immunity_full");
        if (actorActing) setActorPowerState((state) => ({ ...state, salvadorLastTarget: actualTarget }));
        else setSalvadorLastTarget(actualTarget);
      }
      else if (roleSource === "v09") {
        const captainId = sourcePlayerId && effectiveRoleAssignments[sourcePlayerId] === "v09" ? sourcePlayerId : getRolePlayerId("v09");
        let soldierId = targetPlayerId;
        if (captainId && poisonedPlayerId === captainId) {
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
        const chefeId = sourcePlayerId && effectiveRoleAssignments[sourcePlayerId] === "v11" ? sourcePlayerId : getRolePlayerId("v11");
        const isPoisoned = chefeId && poisonedPlayerId === chefeId;
        const effectKey: StatusEffect = isPoisoned ? "vote_double" : "vote_against";
        const previousTarget = actorActing ? actorPowerState.chefeLastTarget : chefeLastTarget;
        // Remove from previous chefe target if different
        if (previousTarget && previousTarget !== targetPlayerId) {
          const prevEff = playerEffects[previousTarget] || new Set();
          if (prevEff.has(effectKey)) toggleActionEffect(previousTarget, effectKey);
          // Also clear the alternate key in case it was previously applied
          const otherKey: StatusEffect = effectKey === "vote_double" ? "vote_against" : "vote_double";
          if (prevEff.has(otherKey)) toggleActionEffect(previousTarget, otherKey);
        }
        toggleActionEffect(targetPlayerId, effectKey);
        if (actorActing) setActorPowerState((state) => ({ ...state, chefeLastTarget: targetPlayerId }));
        else setChefeLastTarget(targetPlayerId);
      }
      else if (roleSource === "f01") { toggleActionEffect(targetPlayerId, "vote_revoked"); }
      else if (roleSource === "l02") {
        const childId = sourcePlayerId && effectiveRoleAssignments[sourcePlayerId] === "l02" ? sourcePlayerId : getRolePlayerId("l02");
        if (childId && poisonedPlayerId === childId) {
          if (!playerEffects[childId]?.has("werewolf_turned")) toggleActionEffect(childId, "werewolf_turned");
        } else {
          toggleActionEffect(targetPlayerId, "adoptive_dad");
        }
      }
      else if (roleSource === "s01") { toggleActionEffect(targetPlayerId, "namorado"); }
      else if (roleSource === "v15") {
        // Piromaníaco: poisoned → random Inocentado target gets incendiado
        const piroId = sourcePlayerId && effectiveRoleAssignments[sourcePlayerId] === "v15" ? sourcePlayerId : getRolePlayerId("v15");
        const targetEffects = playerEffects[targetPlayerId] || new Set();
        if (piroId && poisonedPlayerId === piroId) {
          const inocentados = players.filter((p) =>
            playerEffects[p.id]?.has("inocentado")
            && p.id !== piroId
            && p.id !== targetPlayerId
          );
          if (inocentados.length > 0) {
            const victim = inocentados[Math.floor(Math.random() * inocentados.length)];
            toggleActionEffect(victim.id, "incendiado");
            toast.info(format(getToast("infoPiromaniacPoisoned", (room?.language as Language) || "pt"), { name: victim.name }));
          }
        } else if (targetEffects.has("inocentado")) {
          toggleActionEffect(targetPlayerId, "incendiado");
        } else {
          toggleActionEffect(targetPlayerId, "inocentado");
        }
      }
      else if (roleSource === "v18") {
        // Anjo: needs to be perma-dead target. If poisoned → random other perma-dead.
        const charges = actorActing ? actorPowerState.anjoCharges : anjoCharges;
        if (charges >= 2) {
          toast.warning(getToast("warnAngelUsedAll", (room?.language as Language) || "pt"));
          return;
        }
        const anjoId = sourcePlayerId && effectiveRoleAssignments[sourcePlayerId] === "v18" ? sourcePlayerId : getRolePlayerId("v18");
        const isPoisoned = anjoId && poisonedPlayerId === anjoId;
        let resurrectId: string | null = targetPlayerId;
        if (isPoisoned) {
          const random = pickRandomPlayer((p) => permanentlyDead.has(p.id) && p.id !== targetPlayerId, anjoId || undefined);
          if (random) {
            resurrectId = random.id;
            toast.info(format(getToast("infoAngelPoisoned", (room?.language as Language) || "pt"), { name: random.name }));
          } else {
            resurrectId = null;
          }
        }
        if (resurrectId && permanentlyDead.has(resurrectId)) {
          handlePlayerStatusChange(resurrectId, "alive", undefined, sourcePlayerId);
          resetUsesForRole(resurrectId);
          if (actorActing) setActorPowerState((state) => ({ ...state, anjoCharges: Math.min(state.anjoCharges + 1, 2) }));
          else setAnjoCharges((c) => Math.min(c + 1, 2));
        } else if (resurrectId) {
          toast.warning(getToast("warnAngelUsedAll", (room?.language as Language) || "pt"));
        }
      }
      else if (roleSource === "v08") {
        const hunterId = sourcePlayerId && effectiveRoleAssignments[sourcePlayerId] === "v08" ? sourcePlayerId : getRolePlayerId("v08");
        let killId = targetPlayerId;
        if (hunterId && poisonedPlayerId === hunterId) {
          const random = pickRandomPlayer((p) =>
            !permanentlyDead.has(p.id)
            && playerStatuses[p.id] !== "dead-this-night"
            && p.id !== hunterId
            && p.id !== targetPlayerId
          );
          if (!random) return;
          killId = random.id;
        }
        handlePlayerStatusChange(killId, "dead-this-night", actorActing ? "a04" : "v08", sourcePlayerId);
      }
      else if (roleSource === "s02") {
        const whiteWolfId = sourcePlayerId && effectiveRoleAssignments[sourcePlayerId] === "s02" ? sourcePlayerId : getRolePlayerId("s02");
        if (!whiteWolfId) return;
        const whiteWolfPlayers: WhiteWolfPlayerState[] = players.map((player) => ({
          id: player.id,
          role: effectiveRoleAssignments[player.id],
          alive: !permanentlyDead.has(player.id)
            && playerStatuses[player.id] !== "dead"
            && playerStatuses[player.id] !== "dead-this-night",
          werewolfTurned: !!playerEffects[player.id]?.has("werewolf_turned"),
        }));
        if (canWhiteWolfTarget(whiteWolfPlayers, whiteWolfId, targetPlayerId)) {
          handlePlayerStatusChange(targetPlayerId, "dead-this-night", actorActing ? "a04" : "s02", sourcePlayerId);
        }
      }
      else if (roleSource === "m02" || roleSource === "m03") {
        const sourceId = sourcePlayerId && effectiveRoleAssignments[sourcePlayerId] === roleSource ? sourcePlayerId : getRolePlayerId(roleSource as RoleId);
        if (sourceId && poisonedPlayerId === sourceId) return;
        if (actorActing && roleSource === "m03") {
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
          setActorPowerState((state) => ({ ...state, lobisomemVampiroUsed: true }));
        } else {
          toggleActionEffect(targetPlayerId, "werewolf_turned");
        }
      }
      else if (roleSource === "v10" || roleSource === "v10-poisoned") {
        const charges = actorActing ? actorPowerState.paranoicoCharges : paranoicoCharges;
        if (charges >= 2) {
          toast.warning(getToast("warnParanoidUsedAll", (room?.language as Language) || "pt"));
          return;
        }
        const paranoicoId = sourcePlayerId && effectiveRoleAssignments[sourcePlayerId] === "v10" ? sourcePlayerId : getRolePlayerId("v10");
        let killId = targetPlayerId;
        if (paranoicoId && poisonedPlayerId === paranoicoId) {
          const random = pickRandomPlayer((p) => !permanentlyDead.has(p.id) && p.id !== paranoicoId && p.id !== targetPlayerId);
          if (!random) { toast.warning(getToast("warnNoTargets", (room?.language as Language) || "pt")); return; }
          killId = random.id;
          toast.info(format(getToast("infoParanoidPoisoned", (room?.language as Language) || "pt"), { name: random.name }));
        }
        handlePlayerStatusChange(killId, "dead-this-night", actorActing ? "a04" : "v10", sourcePlayerId);
        if (actorActing) setActorPowerState((state) => ({ ...state, paranoicoCharges: Math.min(state.paranoicoCharges + 1, 2) }));
        else setParanoicoCharges((c) => Math.min(c + 1, 2));
        setParanoicoKillName(players.find(p => p.id === killId)?.name || null);
        setDayKilledPlayerIds((prev) => [...prev, killId]);
      }
      else if (roleSource === "v23") {
        if (gameCyclePhase !== "night") {
          const used = actorActing ? actorPowerState.spiderDayChangeUsed : spiderDayChangeUsed;
          if (used) {
            toast.warning(getToast("warnNoTargets", (room?.language as Language) || "pt"));
            return;
          }
          if (actorActing) setActorPowerState((state) => ({ ...state, spiderDayChangeUsed: true }));
          else setSpiderDayChangeUsed(true);
        }
        // Domador da Aranha: apply 'webbed' to target (only one webbed at a time)
        setPlayerEffects((prev) => {
          const next = { ...prev };
          // clear any previous webbed
          for (const [pid, effs] of Object.entries(next)) {
            if (effs.has("webbed") && pid !== targetPlayerId) {
              const cleaned = new Set(effs);
              cleaned.delete("webbed");
              next[pid] = cleaned;
            }
          }
          const cur = new Set(next[targetPlayerId] || []);
          if (cur.has("webbed")) {
            cur.delete("webbed");
          } else {
            if (sourcePlayerId) pendingGameActionLogSourcesRef.current.set(`effect:${targetPlayerId}:webbed`, sourcePlayerId);
            cur.add("webbed");
          }
          next[targetPlayerId] = cur;
          return next;
        });
      }
      else if (roleSource === "a05") {
        // Rouba-Túmulos: marks a red-X victim. The actual swap happens if that
        // marked victim becomes permanently dead at the end of the night.
        const a05Id = sourcePlayerId && effectiveRoleAssignments[sourcePlayerId] === "a05" ? sourcePlayerId : getRolePlayerId("a05");
        if (!a05Id) return;
        if (poisonedPlayerId === a05Id) {
          toast.warning(getToast("warnGraveRobberPoisoned", (room?.language as Language) || "pt"));
          return;
        }
        if (playerStatuses[targetPlayerId] !== "dead-this-night") {
          toast.error(getToast("errGraveRobberOnlyRedX", (room?.language as Language) || "pt"));
          return;
        }
        setPlayerEffects((prev) => {
          const next = { ...prev };
          for (const [pid, effs] of Object.entries(next)) {
            if (pid !== targetPlayerId && effs.has("dug_up")) {
              const cleaned = new Set(effs);
              cleaned.delete("dug_up");
              next[pid] = cleaned;
            }
          }
          const cur = new Set(next[targetPlayerId] || []);
          if (!cur.has("dug_up") && sourcePlayerId) {
            pendingGameActionLogSourcesRef.current.set(`effect:${targetPlayerId}:dug_up`, sourcePlayerId);
          }
          cur.add("dug_up");
          next[targetPlayerId] = cur;
          return next;
        });
        toast.success(getToast("okGraveRobber", (room?.language as Language) || "pt"));
      }
      else if (roleSource === "soldado-kill") {
        // Soldado ghost kill
        handlePlayerStatusChange(targetPlayerId, "dead-this-night", "soldado", sourcePlayerId);
      }
      else {
        handlePlayerStatusChange(targetPlayerId, "dead-this-night", actorActing ? "a04" : roleSource, sourcePlayerId);
      }
    }
  }, [actorCopiedRole, actorIdolUses, actorMechanicalRole, actorPlayerId, actorPowerState, effectiveRoleAssignments, handlePlayerStatusChange, handleChamanDrop, handleSetIllusion, toggleEffect, poisonedPlayerId, players, playerEffects, gameCyclePhase, anjoCharges, getRolePlayerId, isPlayerActingPoisoned, pickRandomPlayer, permanentlyDead, resetUsesForRole, salvadorLastTarget, chefeLastTarget, playerStatuses, paranoicoCharges, spiderDayChangeUsed, markScriptRoleAction, room?.language]);

  const handleListDrop = (e: React.DragEvent, targetPlayerId: string) => {
    e.preventDefault();
    const action = e.dataTransfer.getData("action");
    const sourcePlayerId = e.dataTransfer.getData("sourcePlayerId") || null;
    if (action) handleDragAction(action, targetPlayerId, sourcePlayerId);
  };

  const handleListDragOver = (e: React.DragEvent) => e.preventDefault();

  const getListDragProps = (playerId: string) => {
    if (!isPlaying) return {};
    const role = effectiveRoleAssignments[playerId];
    const roleAction = ROLE_DRAG_ACTIONS[role];
    if (roleAction && !permanentlyDead.has(playerId)) {
      // a05 disabled when poisoned
      if (role === "a05" && poisonedPlayerId === playerId) return {};
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
      const isAnyWerewolfPoisoned = poisonedPlayerId ? WEREWOLF_ROLES.includes(effectiveRoleAssignments[poisonedPlayerId]) : false;
      return {
        draggable: true,
        onDragStart: (e: React.DragEvent) => {
          if (isAnyWerewolfPoisoned) {
            e.preventDefault();
            toast.warning(getToast("warnWolvesPoisoned", (room?.language as Language) || "pt"));
            return;
          }
          e.dataTransfer.setData("action", "kill");
          e.dataTransfer.setData("sourcePlayerId", playerId);
          e.dataTransfer.effectAllowed = "move";
        },
      };
    }
    if (role === CHAMAN_ROLE && !permanentlyDead.has(playerId)) {
      return {
        draggable: true,
        onDragStart: (e: React.DragEvent) => {
          const chamanPoisoned = poisonedPlayerId ? effectiveRoleAssignments[poisonedPlayerId] === CHAMAN_ROLE : false;
          if (chamanPoisoned) {
            e.preventDefault();
            toast.warning(getToast("warnChamanPoisoned", (room?.language as Language) || "pt"));
            return;
          }
          e.dataTransfer.setData("action", "chaman");
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
    // Paranoico drag
    if (role === "v10" && !permanentlyDead.has(playerId) && paranoicoCharges < 2) {
      return {
        draggable: true,
        onDragStart: (e: React.DragEvent) => {
          if (poisonedPlayerId === playerId) {
            e.dataTransfer.setData("action", "role-v10");
          } else {
            e.dataTransfer.setData("action", "role-v10");
          }
          e.dataTransfer.effectAllowed = "move";
        },
      };
    }
    return {};
  };

  // Vidente reveal handler
  const isVidentePoisoned = useMemo(() => {
    const videnteId = getRolePlayerId("e04");
    return isPlayerActingPoisoned(videnteId);
  }, [getRolePlayerId, isPlayerActingPoisoned]);

  const generateFakeMap = useCallback(() => {
    if (!isVidentePoisoned || lastNightDeadPlayerIds.length === 0) return null;
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
  }, [isVidentePoisoned, lastNightDeadPlayerIds, roleAssignments]);

  const handleVidenteReveal = useCallback(async () => {
    let fakeMap = videnteFakeMap;
    if (isVidentePoisoned && !fakeMap) {
      fakeMap = generateFakeMap();
      setVidenteFakeMap(fakeMap);
    }
    setVidenteModalOpen(true);
    if (!roomId) return;
    const channel = supabase.channel(`vidente-reveal-${roomId}`);
    channel.send({
      type: "broadcast",
      event: "vidente-reveal",
      payload: {
        deadPlayerIds: lastNightDeadPlayerIds,
        illusionPlayerId,
        isVidentePoisoned,
        fakeMap: fakeMap || null,
        roleAssignments: Object.fromEntries(
          lastNightDeadPlayerIds
            .map((playerId) => [playerId, roleAssignments[playerId]])
            .filter(([, roleId]) => !!roleId),
        ),
        show: true,
      },
    });
  }, [roomId, roleAssignments, lastNightDeadPlayerIds, illusionPlayerId, isVidentePoisoned, videnteFakeMap, generateFakeMap]);

  const handleCloseVidenteModal = useCallback(() => {
    setVidenteModalOpen(false);
    if (roomId) {
      const channel = supabase.channel(`vidente-reveal-${roomId}`);
      channel.send({
        type: "broadcast",
        event: "vidente-reveal",
        payload: { show: false },
      });
    }
  }, [roomId]);

  // Menina reveal: cards = killer of each red-X player
  const meninaCards = useMemo<RevealCard[]>(() => {
    const localLang: Language = (room?.language as Language) || "pt";
    const meninaId = getRolePlayerId("v01");
    const meninaPoisoned = isPlayerActingPoisoned(meninaId);
    const redX = Object.entries(playerStatuses)
      .filter(([, s]) => s === "dead-this-night")
      .map(([pid]) => pid);
    if (meninaPoisoned) {
      return redX.map((pid) => {
        const actualSrc = killSources[pid];
        const actualKind = getMeninaAnswerKind(actualSrc);
        const pool = MENINA_POISONED_ANSWERS.filter(({ kind }) => kind !== actualKind);
        const answer = pool[Math.floor(Math.random() * pool.length)];
        const def = ROLES[answer.roleId];
        const name = players.find((p) => p.id === pid)?.name;
        const customLabels: Partial<Record<MeninaAnswerKind, string>> = {
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
      const card = resolveKillerCard(killSources[pid], roleAssignments, illusionPlayerId, localLang);
      const name = players.find((p) => p.id === pid)?.name;
      return { name, image: card.image, label: card.label, roleId: card.roleId };
    });
  }, [getRolePlayerId, isPlayerActingPoisoned, room, roleAssignments, playerStatuses, killSources, illusionPlayerId, players]);

  const handleMeninaReveal = useCallback(() => {
    setMeninaRevealOpen(true);
    if (!roomId) return;
    supabase.channel(`menina-reveal-${roomId}`).send({
      type: "broadcast", event: "menina-reveal",
      payload: { show: true, cards: meninaCards },
    });
  }, [roomId, meninaCards]);

  const handleCloseMeninaModal = useCallback(() => {
    setMeninaRevealOpen(false);
    if (roomId) {
      supabase.channel(`menina-reveal-${roomId}`).send({
        type: "broadcast", event: "menina-reveal", payload: { show: false },
      });
    }
  }, [roomId]);

  // Faroleiro reveal: random alive limited-use char
  const handleFaroleiroReveal = useCallback(() => {
    const limitedUseRoles: RoleId[] = ["e03", "v10", "v18", "m01", "s01", "m03", "v13", "v14", "v23"];
    const candidates = players.filter((p) => !permanentlyDead.has(p.id) && limitedUseRoles.includes(effectiveRoleAssignments[p.id]));
    if (candidates.length === 0) {
      toast.warning(getToast("warnNoLimitedRoles", (room?.language as Language) || "pt"));
      return;
    }
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    const mechanicalRole = effectiveRoleAssignments[pick.id];
    const role = roleAssignments[pick.id];
    const actorPicked = pick.id === actorPlayerId;
    let charges: boolean[] = [false, false];
    if (mechanicalRole === "e03") charges = actorPicked ? [actorPowerState.chamanCharges > 0, actorPowerState.chamanCharges > 1] : [chamanCharges > 0, chamanCharges > 1];
    else if (mechanicalRole === "v10") charges = actorPicked ? [actorPowerState.paranoicoCharges > 0, actorPowerState.paranoicoCharges > 1] : [paranoicoCharges > 0, paranoicoCharges > 1];
    else if (mechanicalRole === "v18") charges = actorPicked ? [actorPowerState.anjoCharges > 0, actorPowerState.anjoCharges > 1] : [anjoCharges > 0, anjoCharges > 1];
    else if (mechanicalRole === "m01") charges = actorPicked ? [actorPowerState.lobisomemMauCharges > 0, actorPowerState.lobisomemMauCharges > 1] : [lobisomemMauCharges > 0, lobisomemMauCharges > 1];
    else if (mechanicalRole === "s01") charges = actorPicked ? [actorPowerState.cupidoCharges > 0, actorPowerState.cupidoCharges > 1] : [cupidoCharges > 0, cupidoCharges > 1];
    else if (mechanicalRole === "m02") charges = [actorPicked ? actorPowerState.lobisomemVidenteUsed : lobisomemVidenteUsed];
    else if (mechanicalRole === "m03") charges = [actorPicked ? actorPowerState.lobisomemVampiroUsed : lobisomemVampiroUsed];
    else if (mechanicalRole === "v13") charges = actorPicked ? [actorPowerState.juizCharges > 0, actorPowerState.juizCharges > 1] : [juizCharges > 0, juizCharges > 1];
    else if (mechanicalRole === "v14") charges = actorPicked ? [actorPowerState.acusadorCharges > 0, actorPowerState.acusadorCharges > 1] : [acusadorCharges > 0, acusadorCharges > 1];
    else if (mechanicalRole === "v23") charges = [actorPicked ? actorPowerState.spiderDayChangeUsed : spiderDayChangeUsed];

    const faroleiroId = getRolePlayerId("v21");
    const faroleiroPoisoned = !!faroleiroId && poisonedPlayerId === faroleiroId;
    if (faroleiroPoisoned && charges.length > 0) {
      // Guaranteed wrong: flip at least one bit
      const flipIdx = Math.floor(Math.random() * charges.length);
      charges = charges.map((c, i) => (i === flipIdx ? !c : c));
    }
    setFaroleiroPickedRole(role);
    setFaroleiroPickedCharges(charges);
    setFaroleiroRevealOpen(true);
    if (!roomId) return;
    supabase.channel(`faroleiro-reveal-${roomId}`).send({
      type: "broadcast", event: "faroleiro-reveal",
      payload: { show: true, role, charges },
    });
  }, [actorPlayerId, actorPowerState, effectiveRoleAssignments, getRolePlayerId, players, permanentlyDead, roleAssignments, chamanCharges, paranoicoCharges, anjoCharges, lobisomemMauCharges, cupidoCharges, lobisomemVidenteUsed, lobisomemVampiroUsed, juizCharges, acusadorCharges, spiderDayChangeUsed, poisonedPlayerId, roomId, room?.language]);

  const handleCloseFaroleiroModal = useCallback(() => {
    setFaroleiroRevealOpen(false);
    if (roomId) {
      supabase.channel(`faroleiro-reveal-${roomId}`).send({
        type: "broadcast", event: "faroleiro-reveal", payload: { show: false },
      });
    }
  }, [roomId]);

  // Lobisomem Vidente reveal: resurrect victim, show their card
  const lobisomemVidenteVictim = useMemo(() => {
    const victimId = Object.entries(playerStatuses).find(([pid, s]) => {
      const src = killSources[pid];
      return s === "dead-this-night" && (src === "e01" || (src && WEREWOLF_ROLES.includes(src as RoleId)) || (src === "a04" && !!actorCopiedRole && WEREWOLF_ROLES.includes(actorCopiedRole)));
    })?.[0];
    return victimId ? players.find((p) => p.id === victimId) : null;
  }, [actorCopiedRole, playerStatuses, killSources, players]);

  const handleLobisomemVidenteReveal = useCallback(() => {
    if (!lobisomemVidenteVictim) return;
    const role = roleAssignments[lobisomemVidenteVictim.id];
    const viewerId = getRolePlayerId("m02");
    setLobisomemVidenteRevealedVictim({ id: lobisomemVidenteVictim.id, name: lobisomemVidenteVictim.name, role });
    handlePlayerStatusChange(lobisomemVidenteVictim.id, "alive");
    if (viewerId === actorPlayerId) setActorPowerState((state) => ({ ...state, lobisomemVidenteUsed: true }));
    else setLobisomemVidenteUsed(true);
    setLobisomemVidenteRevealOpen(true);
    if (!roomId) return;
    supabase.channel(`lobisomem-vidente-reveal-${roomId}`).send({
      type: "broadcast", event: "lv-reveal",
      payload: { show: true, victimId: lobisomemVidenteVictim.id, role },
    });
  }, [actorPlayerId, getRolePlayerId, lobisomemVidenteVictim, handlePlayerStatusChange, roomId, roleAssignments]);

  const handleCloseLobisomemVidenteModal = useCallback(() => {
    setLobisomemVidenteRevealOpen(false);
    if (roomId) {
      supabase.channel(`lobisomem-vidente-reveal-${roomId}`).send({
        type: "broadcast", event: "lv-reveal", payload: { show: false },
      });
    }
  }, [roomId]);

  // --- v23 Domador da Aranha eye reveal ---
  const handleSpiderReveal = useCallback(() => {
    const localLang: Language = (room?.language as Language) || "pt";
    const spiderId = getRolePlayerId("v23");
    const spiderPoisoned = isPlayerActingPoisoned(spiderId);
    let cards: RevealCard[] = [];
    const caughtIds = Object.entries(playerEffects)
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
        if (pid === illusionPlayerId) role = "a06";
        const def = ROLES[role];
        return { image: def?.image || villagerIcon, label: def ? getRoleLabel(role, localLang) : "?", roleId: role };
      });
    }
    setSpiderRevealCards(cards);
    setSpiderRevealOpen(true);
    if (!roomId) return;
    supabase.channel(`spider-reveal-${roomId}`).send({
      type: "broadcast", event: "spider-reveal",
      payload: { show: true, cards },
    });
  }, [room, roleAssignments, playerEffects, getRolePlayerId, illusionPlayerId, isPlayerActingPoisoned, roomId]);

  const handleCloseSpiderModal = useCallback(() => {
    setSpiderRevealOpen(false);
    if (roomId) {
      supabase.channel(`spider-reveal-${roomId}`).send({
        type: "broadcast", event: "spider-reveal", payload: { show: false },
      });
    }
  }, [roomId]);

  // --- f02 Espião eye reveal ---
  const handleSpyReveal = useCallback(() => {
    const localLang: Language = (room?.language as Language) || "pt";
    const spyId = getRolePlayerId("f02");
    const spyPoisoned = !!spyId && poisonedPlayerId === spyId;
    let cards: RevealCard[] = [];
    if (spyPoisoned) {
      const inPlayRoles = new Set(Object.values(roleAssignments));
      const allRoles: RoleId[] = Object.keys(ROLES) as RoleId[];
      const notInPlay = allRoles.filter((r) => !inPlayRoles.has(r));
      const chosen: RoleId = notInPlay.length > 0
        ? notInPlay[Math.floor(Math.random() * notInPlay.length)]
        : "l01";
      const def = ROLES[chosen];
      cards = [{ image: def.image, label: getRoleLabel(chosen, localLang), roleId: chosen }];
    } else {
      // Pick a random in-game player not yet spied
      const candidates = players.filter(
        (p) => p.seat_position !== null && !(playerEffects[p.id]?.has("spied_on"))
      );
      if (candidates.length === 0) {
        toast.warning(getToast("warnAllSpied", (room?.language as Language) || "pt"));
        return;
      }
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      // Tag spied_on
      setPlayerEffects((prev) => {
        const next = { ...prev };
        const cur = new Set(next[pick.id] || []);
        cur.add("spied_on");
        next[pick.id] = cur;
        return next;
      });
      let role = roleAssignments[pick.id];
      if (pick.id === illusionPlayerId) role = "a06";
      const def = ROLES[role];
      cards = [{ image: def?.image || villagerIcon, label: def ? getRoleLabel(role, localLang) : "?", roleId: role }];
    }
    setSpyRevealCards(cards);
    setSpyRevealOpen(true);
    if (!roomId) return;
    supabase.channel(`spy-reveal-${roomId}`).send({
      type: "broadcast", event: "spy-reveal",
      payload: { show: true, cards },
    });
  }, [room?.language, roleAssignments, players, playerEffects, poisonedPlayerId, getRolePlayerId, illusionPlayerId, roomId]);

  const handleCloseSpyModal = useCallback(() => {
    setSpyRevealOpen(false);
    if (roomId) {
      supabase.channel(`spy-reveal-${roomId}`).send({
        type: "broadcast", event: "spy-reveal", payload: { show: false },
      });
    }
  }, [roomId]);


  // Empregada distance text (dynamic). Ignores perma-dead players for the seat-distance count.
  const empregadaDynamicText = useMemo(() => {
    const empregadaId = Object.entries(effectiveRoleAssignments).find(([playerId, role]) => role === "v20" && !permanentlyDead.has(playerId))?.[0];
    if (!empregadaId) return undefined;
    const empregadaPoisoned = poisonedPlayerId === empregadaId;
    const sorted = players
      .filter((p) => p.seat_position !== null && !permanentlyDead.has(p.id))
      .sort((a, b) => a.seat_position! - b.seat_position!);
    const empIdx = sorted.findIndex((p) => p.id === empregadaId);

    let distance: number | null = null;
    if (empregadaPoisoned) {
      distance = Math.floor(Math.random() * Math.max(1, Math.floor(sorted.length / 2))) + 1;
    } else if (poisonedPlayerId && empIdx !== -1) {
      const poisonIdx = sorted.findIndex((p) => p.id === poisonedPlayerId);
      if (poisonIdx !== -1) {
        const diff = Math.abs(empIdx - poisonIdx);
        distance = Math.min(diff, sorted.length - diff);
      }
    }
    if (distance === null) return undefined;
    const lng2: Language = (room?.language as Language) || "pt";
    const baseLine = (lng2 === "fr"
      ? "La {Domestique} se réveille et la distance jusqu'à la personne empoisonnée lui est révélée"
      : "A {Empregada} acorda e é-lhe revelada a distância até a pessoa envenenada");
    return `${baseLine}: ${distance}`;
  }, [effectiveRoleAssignments, players, poisonedPlayerId, permanentlyDead, room?.language]);


  // Tribunal lines
  const tribunalLines = useMemo(() => {
    const lines: string[] = [];
    const lng: Language = (room?.language as Language) || "pt";
    const diedSimple = t("diedSimple", lng);
    const diedOfTetanus = t("diedOfTetanus", lng);
    const has2Votes = t("has2VotesAgainst", lng);
    const votesDouble = t("votesDouble", lng);
    const noVote = t("noVote", lng);

    if (paranoicoKillName) {
      lines.push(`{${paranoicoKillName}} ${diedSimple}`);
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

    if (poisonedPlayerId) {
      const poisonedRole = effectiveRoleAssignments[poisonedPlayerId];
      if (poisonedRole === "v12") {
        const name = players.find(p => p.id === poisonedPlayerId)?.name;
        if (name && !(playerEffects[poisonedPlayerId]?.has("vote_double"))) {
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
  }, [effectiveRoleAssignments, playerEffects, players, poisonedPlayerId, permanentlyDead, killSources, paranoicoKillName, playerStatuses, room?.language]);

  // Day dead names
  const dayDeadNames = useMemo(() => {
    return lastNightDeadPlayerIds
      .map(pid => players.find(p => p.id === pid)?.name)
      .filter(Boolean) as string[];
  }, [lastNightDeadPlayerIds, players]);

  // Profecia ghost set: players whose role line still appears the night after their death
  const profeciaGhostPlayerIds = useMemo(() => {
    const s = new Set<string>();
    for (const [pid, deathNight] of Object.entries(profeciaDeadAtNight)) {
      if (nightNumber === deathNight + 1) s.add(pid);
    }
    return s;
  }, [profeciaDeadAtNight, nightNumber]);

  const deathTriggeredSourcePlayerIds = useMemo(() => ({
    cacadorDied: lastNightDeadPlayerIds.filter((playerId) => (
      roleAssignments[playerId] === "v08"
      || (playerId === actorPlayerId && actorCopiedRole === "v08")
    )),
    soldadoDied: lastNightDeadPlayerIds.filter((playerId) => playerEffects[playerId]?.has("soldado")),
  }), [actorCopiedRole, actorPlayerId, lastNightDeadPlayerIds, playerEffects, roleAssignments]);

  // Condition keys for conditional script lines
  const conditionKeys = useMemo(() => {
    const keys: Record<string, boolean> = {};

    const cavaleiroDied = Object.entries(playerStatuses).some(
      ([pid, s]) => s === "dead-this-night" && effectiveRoleAssignments[pid] === "v07"
    );
    keys["cavaleiroDied"] = cavaleiroDied;

    const cacadorId = getRolePlayerId("v08");
    keys["cacadorDied"] = deathTriggeredSourcePlayerIds.cacadorDied.length > 0;

    const capuchinhoId = Object.entries(effectiveRoleAssignments).find(([, r]) => r === "v08b")?.[0];
    const cacadorAlive = cacadorId && !permanentlyDead.has(cacadorId);
    keys["capuchinhoExecuted"] = !!(capuchinhoId && killSources[capuchinhoId] === "executado" &&
      lastNightDeadPlayerIds.includes(capuchinhoId) && cacadorAlive);

    keys["soldadoDied"] = deathTriggeredSourcePlayerIds.soldadoDied.length > 0;

    keys["whitewolfNight"] = nightNumber % 3 === 0;
    const whiteWolfId = Object.entries(effectiveRoleAssignments).find(([, role]) => role === "s02")?.[0];
    const whiteWolfPlayers: WhiteWolfPlayerState[] = players.map((player) => ({
      id: player.id,
      role: effectiveRoleAssignments[player.id],
      alive: !permanentlyDead.has(player.id)
        && playerStatuses[player.id] !== "dead"
        && playerStatuses[player.id] !== "dead-this-night",
      werewolfTurned: !!playerEffects[player.id]?.has("werewolf_turned"),
    }));
    keys["whitewolfSolo"] = !!whiteWolfId && !hasOtherLivingWerewolf(whiteWolfPlayers, whiteWolfId);

    const enemyPlayerIds = Object.entries(playerEffects)
      .filter(([, e]) => e.has("enemy"))
      .map(([pid]) => pid);
    keys["enemyDied"] = nightNumber === 1 ? false : enemyPlayerIds.some(pid => lastNightDeadPlayerIds.includes(pid));

    // Has red X players
    keys["hasRedXPlayers"] = Object.entries(playerStatuses).some(([, s]) => s === "dead-this-night");

    keys["roubaTumulosHasTargets"] = Object.entries(playerStatuses).some(
      ([pid, status]) => status === "dead-this-night" && effectiveRoleAssignments[pid] !== "a05",
    );

    // Empregada visible: only when someone is poisoned
    keys["empregadaVisible"] = !!poisonedPlayerId;
    keys["poisonedCharacterPresent"] = !!poisonedPlayerId;

    // Piromaníaco visible: only when someone has Inocentado status
    keys["piromaniacoVisible"] = Object.values(playerEffects).some((e) => e.has("inocentado"));

    // Cupido has charges left
    keys["cupidoHasCharges"] = cupidoCharges < 2 || (actorCopiedRole === "s01" && actorPowerState.cupidoCharges < 2);

    // Lobisomem Mau has charges
    keys["lobisomemMauHasCharges"] = lobisomemMauCharges < 2 || (actorCopiedRole === "m01" && actorPowerState.lobisomemMauCharges < 2);

    // Vampiro has charges
    keys["vampiroHasCharges"] = !lobisomemVampiroUsed || (actorCopiedRole === "m03" && !actorPowerState.lobisomemVampiroUsed);
    // Lobisomem Vidente: unlimited uses (always shown)
    keys["lobisomemVidenteHasCharges"] = true;

    // v23 Domador da Aranha — webbed target became perma-dead (need to choose a new one)
    const webbedPid = Object.entries(playerEffects).find(([, e]) => e.has("webbed"))?.[0];
    keys["spiderWebbedDied"] = !!(webbedPid && permanentlyDead.has(webbedPid));
    // v23 — at least one player has 'caught' effect this night
    keys["spiderHasCaught"] = Object.values(playerEffects).some((e) => e.has("caught"));

    // f02 Espião — not all in-game players have been spied
    const inGamePlayerIds = players.filter((p) => p.seat_position !== null).map((p) => p.id);
    keys["spyHasUnseen"] = inGamePlayerIds.some((pid) => !(playerEffects[pid]?.has("spied_on")));

    // Amante Secreto traído: as01b is in game, poisoned, AND has namorado effect
    const amanteId = Object.entries(effectiveRoleAssignments).find(([, r]) => r === "as01b")?.[0];
    keys["amanteTraido"] = !!(amanteId && poisonedPlayerId === amanteId && playerEffects[amanteId]?.has("namorado"));

    return keys;
  }, [actorCopiedRole, actorPowerState.cupidoCharges, actorPowerState.lobisomemMauCharges, actorPowerState.lobisomemVampiroUsed, deathTriggeredSourcePlayerIds, effectiveRoleAssignments, getRolePlayerId, playerStatuses, lastNightDeadPlayerIds, permanentlyDead, killSources, playerEffects, nightNumber, poisonedPlayerId, cupidoCharges, lobisomemMauCharges, lobisomemVampiroUsed, players]);

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
      return {
        id: player.id,
        role: effectiveRoleAssignments[player.id],
        alive: !permanentlyDead.has(player.id),
        effects: playerEffects[player.id] || new Set<StatusEffect>(),
      };
    }), [effectiveRoleAssignments, players, permanentlyDead, playerEffects]);
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
                  roleAssignments={rolesAssigned ? effectiveRoleAssignments : undefined}
                  baseRoleAssignments={rolesAssigned ? roleAssignments : undefined}
                  playerStatuses={playerStatuses}
                  permanentlyDead={permanentlyDead}
                  onPlayerStatusChange={handlePlayerStatusChange}
                  isPlaying={isPlaying}
                  poisonedPlayerId={poisonedPlayerId}
                  illusionPlayerId={illusionPlayerId}
                  onSetIllusion={handleSetIllusion}
                  isBruxaPermaDead={isBruxaPermaDead}
                  isMarionetista={isMarionetista}
                  chamanCharges={chamanCharges}
                  onChamanChargeToggle={(index) => { handleChamanChargeToggle(index); markScriptRoleAction("e03"); }}
                  onChamanDrop={handleChamanDrop}
                  isBruxaPoisoned={isBruxaPoisoned}
                  foxDisabled={foxDisabled}
                  onFoxDisabledToggle={() => { setFoxDisabled((v) => !v); markScriptRoleAction("v04"); }}
                  showFoxCheckbox={nightNumber > 1}
                  playerEffects={playerEffects}
                  gameCyclePhase={gameCyclePhase}
                  availableEffects={getAvailableEffects}
                  onToggleEffect={toggleEffect}
                  onExecute={handleExecute}
                  onDragAction={handleDragAction}
                  juizCharges={juizCharges}
                  onJuizChargeToggle={(idx) => { setJuizCharges(prev => prev > idx ? idx : idx + 1); markScriptRoleAction("v13"); }}
                  acusadorCharges={acusadorCharges}
                  onAcusadorChargeToggle={(idx) => { setAcusadorCharges(prev => prev > idx ? idx : idx + 1); markScriptRoleAction("v14"); }}
                  lobisomemMauCharges={lobisomemMauCharges}
                  onLobisomemMauChargeToggle={(idx) => { handleLobisomemMauChargeToggle(idx); markScriptRoleAction("m01"); }}
                  cupidoCharges={cupidoCharges}
                  onCupidoChargeToggle={(idx) => { handleCupidoChargeToggle(idx); markScriptRoleAction("s01"); }}
                  showCupidoCheckboxes={nightNumber > 1}
                  spiderDayChangeUsed={spiderDayChangeUsed}
                  onSpiderDayChangeToggle={() => { setSpiderDayChangeUsed((value) => !value); markScriptRoleAction("v23"); }}
                  lobisomemVampiroUsed={lobisomemVampiroUsed}
                  onLobisomemVampiroToggle={() => {
                    markScriptRoleAction("m03");
                    const nextValue = !lobisomemVampiroUsed;
                    setLobisomemVampiroUsed(nextValue);
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
                    illusionPlayerId={illusionPlayerId}
                    roleAssignments={effectiveRoleAssignments}
                    baseRoleAssignments={roleAssignments}
                    nightNumber={nightNumber}
                    onEndNight={endNight}
                    chamanCharges={chamanCharges}
                    onChamanChargeToggle={handleChamanChargeToggle}
                    lastNightDeadPlayerIds={lastNightDeadPlayerIds}
                    players={players}
                    onVidenteReveal={handleVidenteReveal}
                    onMeninaReveal={handleMeninaReveal}
                    onFaroleiroReveal={handleFaroleiroReveal}
                    onLobisomemVidenteReveal={lobisomemVidenteVictim ? handleLobisomemVidenteReveal : undefined}
                    empregadaDynamicText={empregadaDynamicText}
                    playerStatuses={playerStatuses}
                    foxDisabled={foxDisabled}
                    onFoxDisabledToggle={() => setFoxDisabled((v) => !v)}
                    nightTargetedPlayerIds={nightTargetedPlayerIds}
                    conditionKeys={conditionKeys}
                    playerEffects={playerEffects}
                    profeciaGhostPlayerIds={profeciaGhostPlayerIds}
                    powerlessPlayerIds={powerlessPlayerIds}
                    paranoicoCharges={paranoicoCharges}
                    onParanoicoChargeToggle={(idx) => setParanoicoCharges(prev => prev > idx ? idx : idx + 1)}
                    anjoCharges={anjoCharges}
                    onAnjoChargeToggle={(idx) => setAnjoCharges(prev => prev > idx ? idx : idx + 1)}
                    lobisomemMauCharges={lobisomemMauCharges}
                    onLobisomemMauChargeToggle={handleLobisomemMauChargeToggle}
                    cupidoCharges={cupidoCharges}
                    onCupidoChargeToggle={handleCupidoChargeToggle}
                    lobisomemVampiroUsed={lobisomemVampiroUsed}
                    onLobisomemVampiroToggle={() => setLobisomemVampiroUsed(v => !v)}
                    juizCharges={juizCharges}
                    onJuizChargeToggle={(idx) => setJuizCharges(prev => prev > idx ? idx : idx + 1)}
                    acusadorCharges={acusadorCharges}
                    onAcusadorChargeToggle={(idx) => setAcusadorCharges(prev => prev > idx ? idx : idx + 1)}
                    onSpiderReveal={handleSpiderReveal}
                    onSpyReveal={handleSpyReveal}
                    onScriptRolesVisible={handleScriptRolesVisible}
                    completedLineKeys={completedScriptLineKeys}
                    onLineCompletedChange={handleScriptLineCompleted}
                    autoCompleteRole={scriptAutoComplete.role}
                    autoCompleteVersion={scriptAutoComplete.version}
                    actorPlayerId={actorPlayerId}
                    actorCopiedRole={actorCopiedRole}
                    actorCopyNoticeNight={actorCopyNoticeNight}
                    actorPowerState={actorPowerState}
                    onActorPowerStateChange={handleActorPowerStateChange}
                    deathTriggeredSourcePlayerIds={deathTriggeredSourcePlayerIds}
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
                      const roleDef = roleId ? ROLES[roleId] : null;
                      const isDuplicate = baseRoleId && duplicateRoles.has(baseRoleId);
                      const isActor = baseRoleId === "a04";
                      const isDrunkard = baseRoleId === "a01";
                      const status = playerStatuses[player.id] || "alive";
                      const isPermanentDead = permanentlyDead.has(player.id);
                      const listDragProps = getListDragProps(player.id);
                      const isThisIllusion = player.id === illusionPlayerId;
                      const isThisPoisoned = player.id === poisonedPlayerId;
                      const isThisBruxaPoisoned = roleId === "e02" && isThisPoisoned;
                      const isChaman = roleId === CHAMAN_ROLE;
                      const isFox = roleId === ("v04" as RoleId);
                      const isChamanPoisoned = poisonedPlayerId ? effectiveRoleAssignments[poisonedPlayerId] === CHAMAN_ROLE : false;
                      const effects = playerEffects[player.id] || new Set<StatusEffect>();
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
                              {isThisPoisoned && !isThisBruxaPoisoned && (
                                <img src={poisonedIcon} alt="envenenado" className="absolute -bottom-1 -right-1 w-4 h-4" />
                              )}
                               {isThisBruxaPoisoned && (
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
                          {isChaman && !isPermanentDead && (
                            <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                              {[0, 1].map((idx) => (
                                <Checkbox
                                  key={idx}
                                  checked={(isActor ? actorPowerState.chamanCharges : chamanCharges) > idx}
                                  onCheckedChange={() => {
                                    if (isActor) handleActorPowerStateChange({ ...actorPowerState, chamanCharges: actorPowerState.chamanCharges > idx ? idx : idx + 1 });
                                    else handleChamanChargeToggle(idx);
                                    markScriptRoleAction("e03");
                                  }}
                                  className="h-4 w-4 border-primary data-[state=checked]:bg-primary"
                                />
                              ))}
                              {isChamanPoisoned && (
                                <img src={poisonedIcon} alt="" className="h-4 w-4" />
                              )}
                            </div>
                          )}
                          {isFox && nightNumber > 1 && !isPermanentDead && (
                            <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={isActor ? actorPowerState.foxDisabled : foxDisabled}
                                onCheckedChange={() => {
                                  if (isActor) handleActorPowerStateChange({ ...actorPowerState, foxDisabled: !actorPowerState.foxDisabled });
                                  else setFoxDisabled((v) => !v);
                                  markScriptRoleAction("v04");
                                }}
                                className="h-4 w-4 rounded-none border-2 border-blue-400 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                              />
                              <span className="text-[9px] text-muted-foreground">{tt("powerExhausted")}</span>
                            </div>
                          )}
                          {/* Paranoico charges */}
                          {roleId === "v10" && !isPermanentDead && (
                            <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                              {[0, 1].map((idx) => (
                                <Checkbox
                                  key={idx}
                                  checked={(isActor ? actorPowerState.paranoicoCharges : paranoicoCharges) > idx}
                                  onCheckedChange={() => {
                                    if (isActor) handleActorPowerStateChange({ ...actorPowerState, paranoicoCharges: actorPowerState.paranoicoCharges > idx ? idx : idx + 1 });
                                    else setParanoicoCharges(prev => prev > idx ? idx : idx + 1);
                                    markScriptRoleAction("v10");
                                  }}
                                  className="h-4 w-4 border-primary data-[state=checked]:bg-primary"
                                />
                              ))}
                            </div>
                          )}
                          {/* Anjo charges */}
                          {roleId === "v18" && !isPermanentDead && (
                            <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                              {[0, 1].map((idx) => (
                                <Checkbox
                                  key={idx}
                                  checked={(isActor ? actorPowerState.anjoCharges : anjoCharges) > idx}
                                  onCheckedChange={() => {
                                    if (isActor) handleActorPowerStateChange({ ...actorPowerState, anjoCharges: actorPowerState.anjoCharges > idx ? idx : idx + 1 });
                                    else setAnjoCharges(prev => prev > idx ? idx : idx + 1);
                                    markScriptRoleAction("v18");
                                  }}
                                  className="h-4 w-4 border-primary data-[state=checked]:bg-primary"
                                />
                              ))}
                            </div>
                          )}
                          {/* Lobisomem Mau charges */}
                          {roleId === "m01" && !isPermanentDead && (
                            <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                              {[0, 1].map((idx) => (
                                <Checkbox
                                  key={idx}
                                  checked={(isActor ? actorPowerState.lobisomemMauCharges : lobisomemMauCharges) > idx}
                                  onCheckedChange={() => {
                                    if (isActor) handleActorPowerStateChange({ ...actorPowerState, lobisomemMauCharges: actorPowerState.lobisomemMauCharges > idx ? idx : idx + 1 });
                                    else handleLobisomemMauChargeToggle(idx);
                                    markScriptRoleAction("m01");
                                  }}
                                  className="h-4 w-4 border-primary data-[state=checked]:bg-primary"
                                />
                              ))}
                            </div>
                          )}
                          {/* Domador da Aranha daytime web-change */}
                          {roleId === "v23" && !isPermanentDead && (
                            <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={isActor ? actorPowerState.spiderDayChangeUsed : spiderDayChangeUsed}
                                onCheckedChange={() => {
                                  if (isActor) handleActorPowerStateChange({ ...actorPowerState, spiderDayChangeUsed: !actorPowerState.spiderDayChangeUsed });
                                  else setSpiderDayChangeUsed((value) => !value);
                                  markScriptRoleAction("v23");
                                }}
                                className="h-4 w-4 border-primary data-[state=checked]:bg-primary"
                              />
                            </div>
                          )}
                          {/* Lobisomem Vidente: no checkbox (unlimited uses) */}
                          {/* Cupido charges */}
                          {roleId === "s01" && nightNumber > 1 && !isPermanentDead && (
                            <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                              {[0, 1].map((idx) => (
                                <Checkbox
                                  key={idx}
                                  checked={(isActor ? actorPowerState.cupidoCharges : cupidoCharges) > idx}
                                  onCheckedChange={() => {
                                    if (isActor) handleActorPowerStateChange({ ...actorPowerState, cupidoCharges: actorPowerState.cupidoCharges > idx ? idx : idx + 1 });
                                    else handleCupidoChargeToggle(idx);
                                    markScriptRoleAction("s01");
                                  }}
                                  className="h-4 w-4 border-primary data-[state=checked]:bg-primary"
                                />
                              ))}
                            </div>
                          )}
          {/* Vampiro used: ticking auto-applies werewolf_turned to werewolf victim */}
          {roleId === "m03" && !isPermanentDead && (
            <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={isActor ? actorPowerState.lobisomemVampiroUsed : lobisomemVampiroUsed}
                onCheckedChange={() => {
                  markScriptRoleAction("m03");
                  const nextValue = isActor ? !actorPowerState.lobisomemVampiroUsed : !lobisomemVampiroUsed;
                  if (isActor) handleActorPowerStateChange({ ...actorPowerState, lobisomemVampiroUsed: nextValue });
                  else setLobisomemVampiroUsed(nextValue);
                  if (nextValue && !isActor) {
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
                          {/* Juiz uses (2) */}
                          {roleId === "v13" && !isPermanentDead && (
                            <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                              {[0, 1].map((idx) => (
                                <Checkbox
                                  key={idx}
                                  checked={(isActor ? actorPowerState.juizCharges : juizCharges) > idx}
                                  onCheckedChange={() => {
                                    if (isActor) handleActorPowerStateChange({ ...actorPowerState, juizCharges: actorPowerState.juizCharges > idx ? idx : idx + 1 });
                                    else setJuizCharges(prev => prev > idx ? idx : idx + 1);
                                    markScriptRoleAction("v13");
                                  }}
                                  className="h-4 w-4 border-primary data-[state=checked]:bg-primary"
                                />
                              ))}
                            </div>
                          )}
                          {/* Acusador (v14) uses (2) */}
                          {roleId === "v14" && !isPermanentDead && (
                            <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                              {[0, 1].map((idx) => (
                                <Checkbox
                                  key={idx}
                                  checked={(isActor ? actorPowerState.acusadorCharges : acusadorCharges) > idx}
                                  onCheckedChange={() => {
                                    if (isActor) handleActorPowerStateChange({ ...actorPowerState, acusadorCharges: actorPowerState.acusadorCharges > idx ? idx : idx + 1 });
                                    else setAcusadorCharges(prev => prev > idx ? idx : idx + 1);
                                    markScriptRoleAction("v14");
                                  }}
                                  className="h-4 w-4 border-primary data-[state=checked]:bg-primary"
                                />
                              ))}
                            </div>
                          )}
                          {isActor && !isPermanentDead && (
                            <div className="flex gap-1 flex-shrink-0" onClick={(event) => event.stopPropagation()}>
                              {[0, 1].map((idx) => (
                                <Checkbox key={idx} checked={actorIdolUses > idx} onCheckedChange={() => setActorIdolUses((uses) => uses > idx ? idx : idx + 1)} className="h-4 w-4 border-primary data-[state=checked]:bg-primary" />
                              ))}
                            </div>
                          )}
                          <RoleSelector value={baseRoleId} onChange={(role) => changeRole(player.id, role)} advancedEnabled={advancedEnabled} />
                        </div>
                      );

                      const showPoison = true;
                      const showIllusion = isMarionetista;
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
                          poisonDisabled={isBruxaPermaDead}
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
                    roleAssignments={rolesAssigned ? effectiveRoleAssignments : undefined}
                    baseRoleAssignments={rolesAssigned ? roleAssignments : undefined}
                    compact
                    onDragAction={handleDragAction}
                    actorCopiesDrunkard={actorCopiedRole === "a01"}
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

      <VidenteRevealModal
        open={videnteModalOpen}
        onClose={handleCloseVidenteModal}
        deadPlayerIds={lastNightDeadPlayerIds}
        illusionPlayerId={illusionPlayerId}
        roleAssignments={roleAssignments}
        players={players}
        isVidentePoisoned={isVidentePoisoned}
        precomputedFakeMap={videnteFakeMap}
        onRoleClick={(roleId) => openRulebook(roleId)}
      />

      <RevealModal
        language={lang}
        open={meninaRevealOpen}
        onClose={handleCloseMeninaModal}
        title={tt("revealLittleGirlTitle")}
        subtitle={tt("revealLittleGirlSubtitle")}
        cards={meninaCards}
        onRoleClick={(roleId) => openRulebook(roleId)}
      />

      <RevealModal
        language={lang}
        open={faroleiroRevealOpen}
        onClose={handleCloseFaroleiroModal}
        title={tt("revealLamplighterTitle")}
        subtitle={tt("revealLamplighterSubtitle")}
        cards={faroleiroPickedRole ? [{
          image: ROLES[faroleiroPickedRole].image,
          label: roleLabel(faroleiroPickedRole),
          roleId: faroleiroPickedRole,
          checkboxes: faroleiroPickedCharges.length > 0 ? faroleiroPickedCharges : undefined,
        }] : []}
        onRoleClick={(roleId) => openRulebook(roleId)}
      />

      <RevealModal
        language={lang}
        open={lobisomemVidenteRevealOpen}
        onClose={handleCloseLobisomemVidenteModal}
        title={tt("revealVampireWolfTitle")}
        subtitle={tt("revealVampireWolfSubtitle")}
        cards={lobisomemVidenteRevealedVictim ? [{
          name: lobisomemVidenteRevealedVictim.name,
          image: ROLES[lobisomemVidenteRevealedVictim.role]?.image || villagerIcon,
          label: roleLabel(lobisomemVidenteRevealedVictim.role),
          roleId: lobisomemVidenteRevealedVictim.role,
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
        illusionPlayerId={illusionPlayerId}
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
