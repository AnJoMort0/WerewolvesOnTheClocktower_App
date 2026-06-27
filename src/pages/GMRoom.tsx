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
import { PlayerStatusPopover, type PlayerStatus, type StatusEffect, STATUS_EFFECT_ICONS, STATUS_EFFECT_LABELS } from "@/components/game/PlayerStatusPopover";
import { VidenteRevealModal } from "@/components/game/VidenteRevealModal";
import { RevealModal, resolveKillerCard, type RevealCard } from "@/components/game/RevealModal";
import { Copy, Check, Users, Send, AlertTriangle, X, Minus, Play, Pause, Settings, FlaskConical, BookOpen, RotateCcw, Trash2, Trophy, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { assignRoles, ROLES, isUniqueRole, WEREWOLF_ROLES, WEB_IMMUNE_ROLES, type RoleId } from "@/lib/roles";
import { LanguageContext, getRoleLabel, t, getToast, getValidation, getGameOver, format, type Language, type WinKind } from "@/lib/i18n";
import { getScriptOrderIndex } from "@/lib/nightScript";
import { buildJoinUrl, getDefaultJoinBaseUrl, normalizeJoinBaseUrl } from "@/lib/joinUrl";
import { canWhiteWolfTarget, getMeninaAnswerKind, hasOtherLivingWerewolf, MENINA_POISONED_ANSWERS, type MeninaAnswerKind, type WhiteWolfPlayerState } from "@/lib/gameRules";
import { detectAutomaticVictory, getVictoryStateSignature, playerWinsAnyVictoryGroup, type AutomaticWinKind, type VictoryPlayer } from "@/lib/victory";
import { WinConfirmModal, WinPickerModal } from "@/components/game/WinConfirmModal";
import poisonedIcon from "@/assets/icons/poisoned.png";
import illusionIcon from "@/assets/icons/illusion.png";
import imunityIcon from "@/assets/icons/imunity_full.png";
import villagerIcon from "@/assets/icons/villager.png";

const TIMER_DEFAULTS_STORAGE_KEY = "wotct_gm_timer_defaults";
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
};

type TimerSyncState = {
  phase: "day" | "tribunal";
  timeLeft: number;
  isRunning: boolean;
  timerDone: boolean;
};

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
  gameCyclePhase: "night" | "day" | "tribunal";
  dayPhase: "day" | "tribunal";
  killSources: Record<string, string>;
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
  declinedAutomaticVictory?: { kind: AutomaticWinKind; signature: string } | null;
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
        window.localStorage.removeItem(`${GM_ADVANCED_STORAGE_PREFIX}${key.slice(GM_SNAPSHOT_STORAGE_PREFIX.length)}`);
      }
    } catch {
      window.localStorage.removeItem(key);
      window.localStorage.removeItem(`${GM_ADVANCED_STORAGE_PREFIX}${key.slice(GM_SNAPSHOT_STORAGE_PREFIX.length)}`);
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

  // Game cycle
  const [gameCyclePhase, setGameCyclePhase] = useState<"night" | "day" | "tribunal">("night");
  const [dayPhase, setDayPhase] = useState<"day" | "tribunal">("day");

  // Kill tracking
  const [killSources, setKillSources] = useState<Record<string, string>>({});

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
  const [timerDefaults, setTimerDefaults] = useState<{ day: number; tribunal: number }>(() => {
    if (typeof window === "undefined") return { day: 300, tribunal: 180 };
    const raw = window.localStorage.getItem(TIMER_DEFAULTS_STORAGE_KEY);
    if (!raw) return { day: 300, tribunal: 180 };
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed?.day === "number" && typeof parsed?.tribunal === "number") {
        return parsed;
      }
    } catch {
      // ignore
    }
    return { day: 300, tribunal: 180 };
  });

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

  const defaultJoinBaseUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return getDefaultJoinBaseUrl(window.location.origin, import.meta.env.VITE_PUBLIC_APP_URL);
  }, []);
  const joinBaseUrl = normalizeJoinBaseUrl(joinBaseOverride || defaultJoinBaseUrl);
  const joinUrl = room ? buildJoinUrl(room.code, joinBaseUrl) : "";
  // Derived states
  const isBruxaPermaDead = useMemo(() => {
    for (const [pid, role] of Object.entries(roleAssignments)) {
      if (role === "e02" && permanentlyDead.has(pid)) return true;
    }
    return false;
  }, [roleAssignments, permanentlyDead]);

  const isBruxaPoisoned = useMemo(() => {
    if (!poisonedPlayerId) return false;
    return roleAssignments[poisonedPlayerId] === "e02";
  }, [poisonedPlayerId, roleAssignments]);

  const isMarionetista = useMemo(() => {
    for (const [pid, role] of Object.entries(roleAssignments)) {
      if (role === ("a06" as RoleId) && !permanentlyDead.has(pid)) return true;
    }
    return false;
  }, [roleAssignments, permanentlyDead]);

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
    const assignedRoles = new Set(Object.values(roleAssignments));

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
  }, [roleAssignments, rolesAssigned, playerEffects, room?.language]);

  const activeRoles = useMemo(() => {
    return new Set(Object.values(roleAssignments));
  }, [roleAssignments]);

  const rolesConfirmed = rolesAssigned && room?.status === "playing";

  // Get available status effects for a player based on active roles
  const getAvailableEffects = useCallback((playerId: string): StatusEffect[] => {
    const effects: StatusEffect[] = [];
    const assignedRoles = new Set(Object.values(roleAssignments));
    const playerRole = roleAssignments[playerId];
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
        if (source === "e01" || (source && WEREWOLF_ROLES.includes(source as RoleId))) {
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

    return effects;
  }, [roleAssignments, gameCyclePhase, playerEffects, playerStatuses, killSources, lobisomemVampiroUsed]);

  const toggleEffect = useCallback((playerId: string, effect: StatusEffect) => {
    setPlayerEffects((prev) => {
      const newEffects = { ...prev };
      const current = new Set(prev[playerId] || []);

      if (current.has(effect)) {
        current.delete(effect);
        newEffects[playerId] = current;
        return newEffects;
      }

      // Singleton effects: remove from other players first
      const singletonEffects: StatusEffect[] = ["soldado", "hospede", "vote_revoked", "adoptive_dad", "profecia", "dug_up"];
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
        const cupidoId = Object.entries(roleAssignments).find(([, r]) => r === "s01")?.[0];
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

      // Vote_revoked: check ladrão not poisoned
      if (effect === "vote_revoked") {
        const ladraoId = Object.entries(roleAssignments).find(([, r]) => r === "f01")?.[0];
        if (ladraoId && poisonedPlayerId === ladraoId) {
          toast.warning(getToast("warnThiefPoisoned", (room?.language as Language) || "pt"));
          return prev;
        }
      }

      // Profecia: check profeta not poisoned
      if (effect === "profecia") {
        const profetaId = Object.entries(roleAssignments).find(([, r]) => r === "v19")?.[0];
        if (profetaId && poisonedPlayerId === profetaId) {
          toast.warning(getToast("warnProphetPoisoned", (room?.language as Language) || "pt"));
          return prev;
        }
      }

      current.add(effect);
      newEffects[playerId] = current;
      if (["werewolf_turned", "immunity_full", "immunity_onetime", "immunity_cupid"].includes(effect)) {
        setPlayerStatuses((statusPrev) => ({ ...statusPrev, [playerId]: "alive" }));
      }
      return newEffects;
    });
  }, [roleAssignments, poisonedPlayerId]);

  useEffect(() => {
    window.localStorage.setItem(TIMER_DEFAULTS_STORAGE_KEY, JSON.stringify(timerDefaults));
  }, [timerDefaults]);

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
      setGameCyclePhase(snapshot.gameCyclePhase ?? "night");
      setDayPhase(snapshot.dayPhase ?? "day");
      setKillSources(snapshot.killSources ?? {});
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
      setDeclinedAutomaticVictory(snapshot.declinedAutomaticVictory ?? null);
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
      gameCyclePhase,
      dayPhase,
      killSources,
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
      declinedAutomaticVictory,
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
    gameCyclePhase,
    dayPhase,
    killSources,
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
    declinedAutomaticVictory,
  ]);

  // Auto-apply vote_double effect for Juiz (dead non-execution) and Ankou (executed)
  useEffect(() => {
    setPlayerEffects((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const [pid, role] of Object.entries(roleAssignments)) {
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
    }, [roleAssignments, permanentlyDead, killSources]);

  // Auto-kill werewolves (or werewolf_turned players) marked Incendiado (instant red X, source = piromaníaco).
  // Balance: if the wolf is immune, the fire is shrugged off entirely — remove the incendiado effect.
  useEffect(() => {
    for (const [pid, effs] of Object.entries(playerEffects)) {
      const isWolf = WEREWOLF_ROLES.includes(roleAssignments[pid]) || effs.has("werewolf_turned");
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
  }, [playerEffects, roleAssignments]);
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

  // Fetch room
  useEffect(() => {
    if (!roomId) return;
    const fetchRoom = async () => {
      const { data } = await supabase
        .from("rooms")
        .select("id, code, status, language, phase_state, timer_state")
        .eq("id", roomId)
        .single();
      if (data) {
        const fetchedRoom = data as unknown as Room;
        setRoom(fetchedRoom);
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
          data.forEach((p) => {
            if (p.character && ROLES[p.character as RoleId]) {
              assignments[p.id] = p.character as RoleId;
            }
          });
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
  }, [roomId]);

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
    setGameCyclePhase("night");
    setDayPhase("day");
    setKillSources({});
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
    setAutomaticWinKind(null);
    setDeclinedAutomaticVictory(null);
    setTieWinnerGroups(new Set());
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
      const role = roleAssignments[player.id];
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
  }, [permanentlyDead, playerEffects, players, roleAssignments, tieWinnerGroups]);

  const sendGameOver = async (kind: WinKind) => {
    if (!roomId) return;
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

  const confirmPendingChanges = async () => {
    if (!roomId) return;
    const updates = Object.entries(roleAssignments).map(([playerId, roleId]) =>
      supabase.from("players").update({ character: roleId }).eq("id", playerId)
    );
    await Promise.all(updates);
    broadcastPlayerSync(Object.keys(roleAssignments));
    setPendingChanges(false);
    toast.success(getToast("okChangesSent", (room?.language as Language) || "pt"));
  };

  const sendRolesToPlayers = async () => {
    if (!roomId) return;
    const updates = Object.entries(roleAssignments).map(([playerId, roleId]) =>
      supabase.from("players").update({ character: roleId }).eq("id", playerId)
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
        const r = roleAssignments[p.id];
        if (WEREWOLF_ROLES.includes(r) && !permanentlyDead.has(p.id) && playerStatuses[p.id] !== "dead-this-night") return p;
      }
    }
    return null;
  }, [players, roleAssignments, permanentlyDead, playerStatuses]);

  // Check immunity
  const hasImmunity = useCallback((playerId: string, source: string): boolean => {
    const effects = playerEffects[playerId] || new Set();
    if (effects.has("immunity_full")) return true;
    if (effects.has("immunity_cupid")) return true;
    if (effects.has("immunity_onetime")) return true;
    // Werewolf immunity (capuchinho)
    if (source === "e01" || WEREWOLF_ROLES.includes(source as RoleId)) {
      if (effects.has("immunity_werewolf")) return true;
    }
    return false;
  }, [playerEffects]);

  // Player status management
  const handlePlayerStatusChange = (playerId: string, newStatus: PlayerStatus, _source?: string) => {
    if (newStatus === "poisoned") {
      if (poisonedPlayerId === playerId) {
        setPoisonedPlayerId(null);
      } else {
        setPoisonedPlayerId(playerId);
        setNightTargetedPlayerIds((prev) => { const n = new Set(prev); n.add(playerId); return n; });
      }
      return;
    } else if (newStatus === "dead-this-night") {
      const source = _source || "manual";
      const isWerewolfTargeting = source === "e01" || WEREWOLF_ROLES.includes(source as RoleId);
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
      if (WEREWOLF_ROLES.includes(source as RoleId) || source === "e01") {
        const capuchinhoId = Object.entries(roleAssignments).find(([, r]) => r === "v08b")?.[0];
        if (capuchinhoId === playerId) {
          const cacadorAlive = Object.entries(roleAssignments).some(([pid, r]) => r === "v08" && !permanentlyDead.has(pid));
          const capuchinhoPoisoned = poisonedPlayerId === playerId;
          if (cacadorAlive && !capuchinhoPoisoned) {
            toast.warning(getToast("warnLittleRedImmune", (room?.language as Language) || "pt"));
            return;
          }
        }
      }

      if (roleAssignments[playerId] === "e02" && poisonedPlayerId === playerId) {
        toast.warning(getToast("warnWitchPoisonedImmune", (room?.language as Language) || "pt"));
        return;
      }

      setPlayerStatuses((prev) => ({ ...prev, [playerId]: "dead-this-night" }));
      setKillSources((prev) => ({ ...prev, [playerId]: source }));

      // Cavaleiro Enferrujado mechanic: apply Tetanus (deferred death) instead of instant kill
      if (roleAssignments[playerId] === CAVALEIRO_ROLE && _source !== "cavaleiro-linked") {
        const isCavaleiroPoisoned = poisonedPlayerId === playerId;
        if (isCavaleiroPoisoned) {
          const nonWWAlive = players.filter(
            (p) => p.id !== playerId && !permanentlyDead.has(p.id) && !WEREWOLF_ROLES.includes(roleAssignments[p.id]) && playerStatuses[p.id] !== "dead-this-night"
          );
          if (nonWWAlive.length > 0) {
            const victim = nonWWAlive[Math.floor(Math.random() * nonWWAlive.length)];
            setPlayerEffects((prev) => {
              const cur = new Set(prev[victim.id] || []);
              cur.add("tetanus");
              return { ...prev, [victim.id]: cur };
            });
            setCavalerioLinkedDeath(victim.id);
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
      setPlayerStatuses((prev) => ({ ...prev, [playerId]: "alive" }));
      setPermanentlyDead((prev) => { const next = new Set(prev); next.delete(playerId); return next; });
      setPlayers((prev) => prev.map((player) => player.id === playerId ? { ...player, is_alive: true } : player));
      void supabase.from("players").update({ is_alive: true }).eq("id", playerId).then(() => {
        broadcastPlayerSync([playerId]);
      });

      // Cavaleiro resurrection does NOT remove Tetanus from the linked victim (by design).
      if (roleAssignments[playerId] === CAVALEIRO_ROLE && cavalerioLinkedDeath) {
        setCavalerioLinkedDeath(null);
      }
    }
  };

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
    const role = roleAssignments[playerId];
    const capuchinhoInGame = Object.values(roleAssignments).some((r) => r === "v08b");
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
          toast.info(format(getToast("infoKnightExecuted", (room?.language as Language) || "pt"), { name: closestWW.name }));
        }
      }
    }
    setListPopoverId(null);
  }, [players, hasImmunity, roleAssignments, poisonedPlayerId, findClosestWerewolf]);

  const handleSetIllusion = (playerId: string) => {
    if (illusionPlayerId === playerId) {
      setIllusionPlayerId(null);
    } else {
      setIllusionPlayerId(playerId);
    }
  };

  const handleChamanChargeToggle = (index: number) => {
    // Chaman can always tick/untick the checkbox to track usage manually,
    // even while poisoned. Only the drag-drop resurrect is gated by poison.
    if (chamanCharges > index) {
      setChamanCharges(index);
    } else {
      setChamanCharges(index + 1);
    }
  };

  const handleChamanDrop = (targetPlayerId: string) => {
    if (chamanCharges >= 2) {
      toast.warning(getToast("warnChamanUsedAll", (room?.language as Language) || "pt"));
      return;
    }
    const status = playerStatuses[targetPlayerId];
    if (status === "dead-this-night") {
      handlePlayerStatusChange(targetPlayerId, "alive");
      setChamanCharges((c) => Math.min(c + 1, 2));
      toast.success(getToast("okChamanRessurected", (room?.language as Language) || "pt"));
    } else {
      toast.error(getToast("errChamanDragOnlyDead", (room?.language as Language) || "pt"));
    }
  };

  const endNight = async () => {
    const newPermanentlyDead = new Set(permanentlyDead);
    const newStatuses = { ...playerStatuses };
    const newlyDead: string[] = [];

    // Irmãos survival check (l04)
    const irmaoPlayerIds = Object.entries(roleAssignments)
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
      if (salvadorLastTarget === pid) cleaned.delete("immunity_full");
      newEffects[pid] = cleaned;
    }
    setSalvadorLastTarget(null);

    // Werewolf incendiado victims die (red X) — also covers werewolf_turned victims, respecting immunities.
    // If immune, the wolf survives AND the incendiado effect is removed (balance rule).
    for (const [pid, effects] of Object.entries(newEffects)) {
      const isWolf = WEREWOLF_ROLES.includes(roleAssignments[pid]) || effects.has("werewolf_turned");
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
    const criancaId = Object.entries(roleAssignments).find(([, r]) => r === "l02")?.[0];
    if (criancaId && !newPermanentlyDead.has(criancaId)) {
      const paiAdotivoId = Object.entries(newEffects).find(([, e]) => e.has("adoptive_dad"))?.[0];
      if (paiAdotivoId && newPermanentlyDead.has(paiAdotivoId)) {
        // Transform Criança Selvagem into Lobisomem
        setRoleAssignments((prev) => ({ ...prev, [criancaId]: "e01" }));
        await supabase.from("players").update({ character: "e01" }).eq("id", criancaId);
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
    setPlayerStatuses((prevStatuses) => {
      const nextStatuses = { ...prevStatuses };
      const nextKillSources = { ...killSources };
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
        const cleaned = new Set(effs);
        cleaned.delete("tetanus");
        nextEffects[pid] = cleaned;
        any = true;
      }
      if (any) {
        setKillSources(nextKillSources);
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

    // At night start, remove m01's disguise immunity.
    // Salvador immunity is cleared at dawn in endNight.
    const newEffects = { ...playerEffects };
    for (const [pid, effects] of Object.entries(newEffects)) {
      const cleaned = new Set(effects);
      if (roleAssignments[pid] === "m01") cleaned.delete("immunity_full");
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
    return Object.entries(roleAssignments).find(([, r]) => r === role)?.[0] || null;
  }, [roleAssignments]);

  const markScriptRoleAction = useCallback((role: RoleId) => {
    setScriptAutoComplete((current) => ({ role, version: current.version + 1 }));
  }, []);

  const clearEffectsFromDeadSources = useCallback((progressOrder: number) => {
    const deadSourceRoles = [...new Set(Object.values(roleAssignments))].filter((role) => {
      if (getScriptOrderIndex(role) >= progressOrder) return false;
      const sourcePlayerIds = Object.entries(roleAssignments)
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
  }, [permanentlyDead, roleAssignments]);

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

  const handleScriptRolesVisible = useCallback((visibleRoles: RoleId[]) => {
    if (!Object.values(roleAssignments).includes("f02")) return;
    const visibleRoleSet = new Set(visibleRoles);
    setPlayerEffects((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const [pid, role] of Object.entries(roleAssignments)) {
        if (!visibleRoleSet.has(role)) continue;
        const cur = new Set(next[pid] || []);
        if (cur.has("spied_on")) continue;
        cur.add("spied_on");
        next[pid] = cur;
        changed = true;
      }
      return changed ? next : prev;
    });
  }, [roleAssignments]);

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
    resetUsesForRoleId(roleAssignments[playerId]);
  }, [resetUsesForRoleId, roleAssignments]);

  // Handle drag-drop actions (both list and circle)
  const handleDragAction = useCallback((action: string, targetPlayerId: string, sourcePlayerId?: string | null) => {
    // Universal "caught" tagging — any drag onto a webbed player tags the source
    const applyCaughtIfWebbed = () => {
      if (!sourcePlayerId || sourcePlayerId === targetPlayerId) return;
      const sourceRole = roleAssignments[sourcePlayerId];
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
    if (actionRole) markScriptRoleAction(actionRole);
    applyCaughtIfWebbed();
    if (action === "poison") {
      handlePlayerStatusChange(targetPlayerId, "poisoned");
      setNightTargetedPlayerIds((prev) => { const n = new Set(prev); n.add(targetPlayerId); return n; });
    } else if (action === "kill") {
      handlePlayerStatusChange(targetPlayerId, "dead-this-night", "e01");
    } else if (action === "chaman") {
      handleChamanDrop(targetPlayerId);
    } else if (action === "illusion") {
      const illusionistId = getRolePlayerId("a06");
      if (illusionistId && poisonedPlayerId === illusionistId) return;
      handleSetIllusion(targetPlayerId);
    } else if (action.startsWith("role-")) {
      const roleSource = action.replace("role-", "");
      // Role-specific drag actions that add effects instead of killing
      if (roleSource === "v19") { toggleEffect(targetPlayerId, "profecia"); }
      else if (roleSource === "v22") {
        if (!playerEffects[targetPlayerId]?.has("acusado")) toggleEffect(targetPlayerId, "acusado_next");
      }
      else if (roleSource === "v16") {
        // Sonâmbulo: if poisoned → random (excluding intended target & sonambulo)
        const sonambuloId = getRolePlayerId("v16");
        if (sonambuloId && poisonedPlayerId === sonambuloId) {
          const random = pickRandomPlayer((p) => !permanentlyDead.has(p.id) && p.id !== targetPlayerId && p.id !== sonambuloId);
          if (random) {
            toggleEffect(random.id, "hospede");
            toast.info(format(getToast("infoSleepwalkerPoisoned", (room?.language as Language) || "pt"), { name: random.name }));
          }
        } else {
          toggleEffect(targetPlayerId, "hospede");
        }
      }
      else if (roleSource === "v17") {
        // Salvador: if poisoned → random (excluding intended target & salvador)
        const salvadorId = getRolePlayerId("v17");
        let actualTarget = targetPlayerId;
        if (salvadorId && poisonedPlayerId === salvadorId) {
          const random = pickRandomPlayer((p) => !permanentlyDead.has(p.id) && p.id !== targetPlayerId && p.id !== salvadorId);
          if (random) {
            actualTarget = random.id;
            toast.info(format(getToast("infoSaviourPoisoned", (room?.language as Language) || "pt"), { name: random.name }));
          }
        }
        // Remove immunity from previous Salvador target if different
        if (salvadorLastTarget && salvadorLastTarget !== actualTarget) {
          const prevEff = playerEffects[salvadorLastTarget] || new Set();
          if (prevEff.has("immunity_full")) toggleEffect(salvadorLastTarget, "immunity_full");
        }
        toggleEffect(actualTarget, "immunity_full");
        setSalvadorLastTarget(actualTarget);
      }
      else if (roleSource === "v09") {
        const captainId = getRolePlayerId("v09");
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
        toggleEffect(soldierId, "soldado");
      }
      else if (roleSource === "v11") {
        const chefeId = getRolePlayerId("v11");
        const isPoisoned = chefeId && poisonedPlayerId === chefeId;
        const effectKey: StatusEffect = isPoisoned ? "vote_double" : "vote_against";
        // Remove from previous chefe target if different
        if (chefeLastTarget && chefeLastTarget !== targetPlayerId) {
          const prevEff = playerEffects[chefeLastTarget] || new Set();
          if (prevEff.has(effectKey)) toggleEffect(chefeLastTarget, effectKey);
          // Also clear the alternate key in case it was previously applied
          const otherKey: StatusEffect = effectKey === "vote_double" ? "vote_against" : "vote_double";
          if (prevEff.has(otherKey)) toggleEffect(chefeLastTarget, otherKey);
        }
        toggleEffect(targetPlayerId, effectKey);
        setChefeLastTarget(targetPlayerId);
      }
      else if (roleSource === "f01") { toggleEffect(targetPlayerId, "vote_revoked"); }
      else if (roleSource === "l02") {
        const childId = getRolePlayerId("l02");
        if (childId && poisonedPlayerId === childId) {
          if (!playerEffects[childId]?.has("werewolf_turned")) toggleEffect(childId, "werewolf_turned");
        } else {
          toggleEffect(targetPlayerId, "adoptive_dad");
        }
      }
      else if (roleSource === "s01") { toggleEffect(targetPlayerId, "namorado"); }
      else if (roleSource === "v15") {
        // Piromaníaco: poisoned → random Inocentado target gets incendiado
        const piroId = getRolePlayerId("v15");
        const targetEffects = playerEffects[targetPlayerId] || new Set();
        if (piroId && poisonedPlayerId === piroId) {
          const inocentados = players.filter((p) =>
            playerEffects[p.id]?.has("inocentado")
            && p.id !== piroId
            && p.id !== targetPlayerId
          );
          if (inocentados.length > 0) {
            const victim = inocentados[Math.floor(Math.random() * inocentados.length)];
            toggleEffect(victim.id, "incendiado");
            toast.info(format(getToast("infoPiromaniacPoisoned", (room?.language as Language) || "pt"), { name: victim.name }));
          }
        } else if (targetEffects.has("inocentado")) {
          toggleEffect(targetPlayerId, "incendiado");
        } else {
          toggleEffect(targetPlayerId, "inocentado");
        }
      }
      else if (roleSource === "v18") {
        // Anjo: needs to be perma-dead target. If poisoned → random other perma-dead.
        if (anjoCharges >= 2) {
          toast.warning(getToast("warnAngelUsedAll", (room?.language as Language) || "pt"));
          return;
        }
        const anjoId = getRolePlayerId("v18");
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
          handlePlayerStatusChange(resurrectId, "alive");
          resetUsesForRole(resurrectId);
          setAnjoCharges((c) => Math.min(c + 1, 2));
        } else if (resurrectId) {
          toast.warning(getToast("warnAngelUsedAll", (room?.language as Language) || "pt"));
        }
      }
      else if (roleSource === "v08") {
        const hunterId = getRolePlayerId("v08");
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
        handlePlayerStatusChange(killId, "dead-this-night", "v08");
      }
      else if (roleSource === "s02") {
        const whiteWolfId = getRolePlayerId("s02");
        if (!whiteWolfId) return;
        const whiteWolfPlayers: WhiteWolfPlayerState[] = players.map((player) => ({
          id: player.id,
          role: roleAssignments[player.id],
          alive: !permanentlyDead.has(player.id)
            && playerStatuses[player.id] !== "dead"
            && playerStatuses[player.id] !== "dead-this-night",
          werewolfTurned: !!playerEffects[player.id]?.has("werewolf_turned"),
        }));
        if (canWhiteWolfTarget(whiteWolfPlayers, whiteWolfId, targetPlayerId)) {
          handlePlayerStatusChange(targetPlayerId, "dead-this-night", "s02");
        }
      }
      else if (roleSource === "m02" || roleSource === "m03") {
        const sourceId = getRolePlayerId(roleSource as RoleId);
        if (sourceId && poisonedPlayerId === sourceId) return;
        toggleEffect(targetPlayerId, "werewolf_turned");
      }
      else if (roleSource === "v10" || roleSource === "v10-poisoned") {
        if (paranoicoCharges >= 2) {
          toast.warning(getToast("warnParanoidUsedAll", (room?.language as Language) || "pt"));
          return;
        }
        const paranoicoId = getRolePlayerId("v10");
        let killId = targetPlayerId;
        if (paranoicoId && poisonedPlayerId === paranoicoId) {
          const random = pickRandomPlayer((p) => !permanentlyDead.has(p.id) && p.id !== paranoicoId && p.id !== targetPlayerId);
          if (!random) { toast.warning(getToast("warnNoTargets", (room?.language as Language) || "pt")); return; }
          killId = random.id;
          toast.info(format(getToast("infoParanoidPoisoned", (room?.language as Language) || "pt"), { name: random.name }));
        }
        handlePlayerStatusChange(killId, "dead-this-night", "v10");
        setParanoicoCharges((c) => Math.min(c + 1, 2));
        setParanoicoKillName(players.find(p => p.id === killId)?.name || null);
        setDayKilledPlayerIds((prev) => [...prev, killId]);
      }
      else if (roleSource === "v23") {
        if (gameCyclePhase !== "night") {
          if (spiderDayChangeUsed) {
            toast.warning(getToast("warnNoTargets", (room?.language as Language) || "pt"));
            return;
          }
          setSpiderDayChangeUsed(true);
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
            cur.add("webbed");
          }
          next[targetPlayerId] = cur;
          return next;
        });
      }
      else if (roleSource === "a05") {
        // Rouba-Túmulos: marks a red-X victim. The actual swap happens if that
        // marked victim becomes permanently dead at the end of the night.
        const a05Id = getRolePlayerId("a05");
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
          cur.add("dug_up");
          next[targetPlayerId] = cur;
          return next;
        });
        toast.success(getToast("okGraveRobber", (room?.language as Language) || "pt"));
      }
      else if (roleSource === "soldado-kill") {
        // Soldado ghost kill
        handlePlayerStatusChange(targetPlayerId, "dead-this-night", "soldado");
      }
      else {
        handlePlayerStatusChange(targetPlayerId, "dead-this-night", roleSource);
      }
    }
  }, [handlePlayerStatusChange, handleChamanDrop, handleSetIllusion, toggleEffect, roleAssignments, poisonedPlayerId, players, playerEffects, gameCyclePhase, anjoCharges, getRolePlayerId, pickRandomPlayer, permanentlyDead, resetUsesForRole, salvadorLastTarget, chefeLastTarget, playerStatuses, paranoicoCharges, spiderDayChangeUsed, markScriptRoleAction]);

  const handleListDrop = (e: React.DragEvent, targetPlayerId: string) => {
    e.preventDefault();
    const action = e.dataTransfer.getData("action");
    const sourcePlayerId = e.dataTransfer.getData("sourcePlayerId") || null;
    if (action) handleDragAction(action, targetPlayerId, sourcePlayerId);
  };

  const handleListDragOver = (e: React.DragEvent) => e.preventDefault();

  const getListDragProps = (playerId: string) => {
    if (!isPlaying) return {};
    const role = roleAssignments[playerId];
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
      const isAnyWerewolfPoisoned = poisonedPlayerId ? WEREWOLF_ROLES.includes(roleAssignments[poisonedPlayerId]) : false;
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
          const chamanPoisoned = poisonedPlayerId ? roleAssignments[poisonedPlayerId] === CHAMAN_ROLE : false;
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
    return !!poisonedPlayerId && roleAssignments[poisonedPlayerId] === "e04";
  }, [poisonedPlayerId, roleAssignments]);

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
    const meninaId = Object.entries(roleAssignments).find(([, r]) => r === "v01")?.[0];
    const meninaPoisoned = !!meninaId && poisonedPlayerId === meninaId;
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
  }, [room, roleAssignments, poisonedPlayerId, playerStatuses, killSources, illusionPlayerId, players]);

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
    const candidates = players.filter((p) => !permanentlyDead.has(p.id) && limitedUseRoles.includes(roleAssignments[p.id]));
    if (candidates.length === 0) {
      toast.warning(getToast("warnNoLimitedRoles", (room?.language as Language) || "pt"));
      return;
    }
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    const role = roleAssignments[pick.id];
    let charges: boolean[] = [false, false];
    if (role === "e03") charges = [chamanCharges > 0, chamanCharges > 1];
    else if (role === "v10") charges = [paranoicoCharges > 0, paranoicoCharges > 1];
    else if (role === "v18") charges = [anjoCharges > 0, anjoCharges > 1];
    else if (role === "m01") charges = [lobisomemMauCharges > 0, lobisomemMauCharges > 1];
    else if (role === "s01") charges = [cupidoCharges > 0, cupidoCharges > 1];
    else if (role === "m02") charges = [lobisomemVidenteUsed];
    else if (role === "m03") charges = [lobisomemVampiroUsed];
    else if (role === "v13") charges = [juizCharges > 0, juizCharges > 1];
    else if (role === "v14") charges = [acusadorCharges > 0, acusadorCharges > 1];
    else if (role === "v23") charges = [spiderDayChangeUsed];

    const faroleiroId = Object.entries(roleAssignments).find(([, r]) => r === "v21")?.[0];
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
  }, [players, permanentlyDead, roleAssignments, chamanCharges, paranoicoCharges, anjoCharges, lobisomemMauCharges, cupidoCharges, lobisomemVidenteUsed, lobisomemVampiroUsed, foxDisabled, spiderDayChangeUsed, poisonedPlayerId, roomId]);

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
      return s === "dead-this-night" && (src === "e01" || (src && WEREWOLF_ROLES.includes(src as RoleId)));
    })?.[0];
    return victimId ? players.find((p) => p.id === victimId) : null;
  }, [playerStatuses, killSources, players]);

  const handleLobisomemVidenteReveal = useCallback(() => {
    if (!lobisomemVidenteVictim) return;
    const role = roleAssignments[lobisomemVidenteVictim.id];
    setLobisomemVidenteRevealedVictim({ id: lobisomemVidenteVictim.id, name: lobisomemVidenteVictim.name, role });
    handlePlayerStatusChange(lobisomemVidenteVictim.id, "alive");
    setLobisomemVidenteUsed(true);
    setLobisomemVidenteRevealOpen(true);
    if (!roomId) return;
    supabase.channel(`lobisomem-vidente-reveal-${roomId}`).send({
      type: "broadcast", event: "lv-reveal",
      payload: { show: true, victimId: lobisomemVidenteVictim.id, role },
    });
  }, [lobisomemVidenteVictim, handlePlayerStatusChange, roomId, roleAssignments]);

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
    const spiderPoisoned = !!spiderId && poisonedPlayerId === spiderId;
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
  }, [room, roleAssignments, playerEffects, poisonedPlayerId, getRolePlayerId, illusionPlayerId, roomId]);

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
  }, [room, roleAssignments, players, permanentlyDead, playerEffects, poisonedPlayerId, getRolePlayerId, illusionPlayerId, roomId]);

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
    const empregadaId = Object.entries(roleAssignments).find(([, r]) => r === "v20")?.[0];
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
  }, [roleAssignments, players, poisonedPlayerId, permanentlyDead]);


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
      const poisonedRole = roleAssignments[poisonedPlayerId];
      if (poisonedRole === "v12") {
        const name = players.find(p => p.id === poisonedPlayerId)?.name;
        if (name && !(playerEffects[poisonedPlayerId]?.has("vote_double"))) {
          lines.push(`{${name}} ${votesDouble}`);
        }
      }
    }

    for (const [pid, role] of Object.entries(roleAssignments)) {
      if (role === "v13" && permanentlyDead.has(pid)) {
        const source = killSources[pid];
        if (source !== "executado") {
          const name = players.find(p => p.id === pid)?.name;
          if (name) lines.push(`{${name}} (${getRoleLabel("v13", lng)}) ${votesDouble}`);
        }
      }
    }

    for (const [pid, role] of Object.entries(roleAssignments)) {
      if (role === "m04" && permanentlyDead.has(pid)) {
        const source = killSources[pid];
        if (source === "executado") {
          const name = players.find(p => p.id === pid)?.name;
          if (name) lines.push(`{${name}} (${getRoleLabel("m04", lng)}) ${votesDouble}`);
        }
      }
    }

    return lines;
  }, [playerEffects, players, poisonedPlayerId, roleAssignments, permanentlyDead, killSources, paranoicoKillName, playerStatuses, room?.language]);

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

  // Condition keys for conditional script lines
  const conditionKeys = useMemo(() => {
    const keys: Record<string, boolean> = {};

    const cavaleiroDied = Object.entries(playerStatuses).some(
      ([pid, s]) => s === "dead-this-night" && roleAssignments[pid] === "v07"
    );
    keys["cavaleiroDied"] = cavaleiroDied;

    const cacadorId = Object.entries(roleAssignments).find(([, r]) => r === "v08")?.[0];
    keys["cacadorDied"] = !!cacadorId && lastNightDeadPlayerIds.includes(cacadorId);

    const capuchinhoId = Object.entries(roleAssignments).find(([, r]) => r === "v08b")?.[0];
    const cacadorAlive = cacadorId && !permanentlyDead.has(cacadorId);
    keys["capuchinhoExecuted"] = !!(capuchinhoId && killSources[capuchinhoId] === "executado" &&
      lastNightDeadPlayerIds.includes(capuchinhoId) && cacadorAlive);

    keys["soldadoDied"] = lastNightDeadPlayerIds.some(pid => {
      const effects = playerEffects[pid] || new Set();
      return effects.has("soldado");
    });

    keys["whitewolfNight"] = nightNumber % 3 === 0;
    const whiteWolfId = Object.entries(roleAssignments).find(([, role]) => role === "s02")?.[0];
    const whiteWolfPlayers: WhiteWolfPlayerState[] = players.map((player) => ({
      id: player.id,
      role: roleAssignments[player.id],
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
      ([pid, status]) => status === "dead-this-night" && roleAssignments[pid] !== "a05",
    );

    // Empregada visible: only when someone is poisoned
    keys["empregadaVisible"] = !!poisonedPlayerId;
    keys["poisonedCharacterPresent"] = !!poisonedPlayerId;

    // Piromaníaco visible: only when someone has Inocentado status
    keys["piromaniacoVisible"] = Object.values(playerEffects).some((e) => e.has("inocentado"));

    // Cupido has charges left
    keys["cupidoHasCharges"] = cupidoCharges < 2;

    // Lobisomem Mau has charges
    keys["lobisomemMauHasCharges"] = lobisomemMauCharges < 2;

    // Vampiro has charges
    keys["vampiroHasCharges"] = !lobisomemVampiroUsed;
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
    const amanteId = Object.entries(roleAssignments).find(([, r]) => r === "as01b")?.[0];
    keys["amanteTraido"] = !!(amanteId && poisonedPlayerId === amanteId && playerEffects[amanteId]?.has("namorado"));

    return keys;
  }, [playerStatuses, roleAssignments, lastNightDeadPlayerIds, permanentlyDead, killSources, playerEffects, nightNumber, poisonedPlayerId, cupidoCharges, lobisomemMauCharges, lobisomemVampiroUsed, lobisomemVidenteUsed, players]);

  const lang: Language = (room?.language as Language) || "pt";
  const roleLabel = useCallback((id: RoleId) => getRoleLabel(id, lang), [lang]);
  const tt = useCallback((key: Parameters<typeof t>[0]) => t(key, lang), [lang]);
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
    setTimerDefaults((current) => ({ ...current, [effectiveGMPhase]: duration }));
    dayPanelRef.current?.setDuration(duration);
    setHiddenTimerEditing(false);
  };
  const victoryPlayers = useMemo<VictoryPlayer[]>(() => players
    .filter((player) => player.seat_position !== null && !!roleAssignments[player.id])
    .map((player) => {
      return {
        id: player.id,
        role: roleAssignments[player.id],
        alive: !permanentlyDead.has(player.id),
        effects: playerEffects[player.id] || new Set<StatusEffect>(),
      };
    }), [players, roleAssignments, permanentlyDead, playerEffects]);
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

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
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
                onClick={() => setWinPickerOpen(true)}
                title={getGameOver("manualGameOver", lang)}
                aria-label={getGameOver("manualGameOver", lang)}
              >
                <Trophy className="h-4 w-4" />
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
                variant="destructive"
                size="icon"
                onClick={endRoom}
                title={tt("endRoom")}
                aria-label={tt("endRoom")}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <a
              href={lang === "fr"
                ? "https://anjomort0.github.io/WerewolvesOnTheClocktower/Rulebook_FR.html"
                : "https://anjomort0.github.io/WerewolvesOnTheClocktower/Rulebook_PT.html"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground/60 hover:text-foreground transition-colors p-2 rounded-lg hover:bg-secondary"
              title={tt("rulebook")}
              aria-label={tt("rulebook")}
            >
              <BookOpen className="h-5 w-5" />
            </a>
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
                  roleAssignments={rolesAssigned ? roleAssignments : undefined}
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
                    roleAssignments={roleAssignments}
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
                    onDefaultsChange={setTimerDefaults}
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
                      const roleId = roleAssignments[player.id];
                      const roleDef = roleId ? ROLES[roleId] : null;
                      const isDuplicate = roleId && duplicateRoles.has(roleId);
                      const status = playerStatuses[player.id] || "alive";
                      const isPermanentDead = permanentlyDead.has(player.id);
                      const listDragProps = getListDragProps(player.id);
                      const isThisIllusion = player.id === illusionPlayerId;
                      const isThisPoisoned = player.id === poisonedPlayerId;
                      const isThisBruxaPoisoned = roleId === "e02" && isThisPoisoned;
                      const isChaman = roleId === CHAMAN_ROLE;
                      const isFox = roleId === ("v04" as RoleId);
                      const isChamanPoisoned = poisonedPlayerId ? roleAssignments[poisonedPlayerId] === CHAMAN_ROLE : false;
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
                            </div>
                          )}
                          <span className={`font-body text-sm flex-1 truncate ${isThisPoisoned ? "text-green-400" : isThisIllusion ? "text-purple-400" : ""}`}>{player.name}</span>
                          {/* Status effect icons */}
                          {effects.size > 0 && (
                            <div className="flex gap-0.5 flex-shrink-0">
                              {Array.from(effects).map(eff => STATUS_EFFECT_ICONS[eff] ? (
                                <img key={eff} src={STATUS_EFFECT_ICONS[eff]} alt={eff} className="h-4 w-4" title={STATUS_EFFECT_LABELS[eff]} />
                              ) : null)}
                            </div>
                          )}
                          {isDuplicate && <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0" />}
                          {isChaman && !isPermanentDead && (
                            <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                              {[0, 1].map((idx) => (
                                <Checkbox
                                  key={idx}
                                  checked={chamanCharges > idx}
                                  onCheckedChange={() => { handleChamanChargeToggle(idx); markScriptRoleAction("e03"); }}
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
                                checked={foxDisabled}
                                onCheckedChange={() => { setFoxDisabled((v) => !v); markScriptRoleAction("v04"); }}
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
                                  checked={paranoicoCharges > idx}
                                  onCheckedChange={() => { setParanoicoCharges(prev => prev > idx ? idx : idx + 1); markScriptRoleAction("v10"); }}
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
                                  checked={anjoCharges > idx}
                                  onCheckedChange={() => { setAnjoCharges(prev => prev > idx ? idx : idx + 1); markScriptRoleAction("v18"); }}
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
                                  checked={lobisomemMauCharges > idx}
                                  onCheckedChange={() => { handleLobisomemMauChargeToggle(idx); markScriptRoleAction("m01"); }}
                                  className="h-4 w-4 border-primary data-[state=checked]:bg-primary"
                                />
                              ))}
                            </div>
                          )}
                          {/* Domador da Aranha daytime web-change */}
                          {roleId === "v23" && !isPermanentDead && (
                            <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={spiderDayChangeUsed}
                                onCheckedChange={() => { setSpiderDayChangeUsed((value) => !value); markScriptRoleAction("v23"); }}
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
                                  checked={cupidoCharges > idx}
                                  onCheckedChange={() => { handleCupidoChargeToggle(idx); markScriptRoleAction("s01"); }}
                                  className="h-4 w-4 border-primary data-[state=checked]:bg-primary"
                                />
                              ))}
                            </div>
                          )}
          {/* Vampiro used: ticking auto-applies werewolf_turned to werewolf victim */}
          {roleId === "m03" && !isPermanentDead && (
            <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={lobisomemVampiroUsed}
                onCheckedChange={() => {
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
                                  checked={juizCharges > idx}
                                  onCheckedChange={() => { setJuizCharges(prev => prev > idx ? idx : idx + 1); markScriptRoleAction("v13"); }}
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
                                  checked={acusadorCharges > idx}
                                  onCheckedChange={() => { setAcusadorCharges(prev => prev > idx ? idx : idx + 1); markScriptRoleAction("v14"); }}
                                  className="h-4 w-4 border-primary data-[state=checked]:bg-primary"
                                />
                              ))}
                            </div>
                          )}
                          <RoleSelector value={roleId} onChange={(role) => changeRole(player.id, role)} advancedEnabled={advancedEnabled} />
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
                    roleAssignments={rolesAssigned ? roleAssignments : undefined}
                    compact
                    onDragAction={handleDragAction}
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
      />

      <RevealModal
        language={lang}
        open={meninaRevealOpen}
        onClose={handleCloseMeninaModal}
        title={tt("revealLittleGirlTitle")}
        subtitle={tt("revealLittleGirlSubtitle")}
        cards={meninaCards}
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
      />

      <RevealModal
        language={lang}
        open={spiderRevealOpen}
        onClose={handleCloseSpiderModal}
        title={tt("spiderEyeReveal")}
        cards={spiderRevealCards}
      />

      <RevealModal
        language={lang}
        open={spyRevealOpen}
        onClose={handleCloseSpyModal}
        title={tt("spyEyeReveal")}
        cards={spyRevealCards}
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
