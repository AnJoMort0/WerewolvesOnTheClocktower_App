import { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  parseScriptText,
  type ScriptLine,
} from "@/lib/nightScript";
import { useLanguage, getScripts, getDynamic, t, getToast } from "@/lib/i18n";
import { ROLES, type RoleId } from "@/lib/roles";
import poisonedIcon from "@/assets/icons/poisoned.png";
import { toast } from "sonner";
import type { PlayerStatus } from "@/components/game/PlayerStatusPopover";

/** Evil roles for bear/crow mechanics */
const EVIL_ROLES: RoleId[] = ["e01", "e02", "s02", "a06", "m01", "m02", "m03", "m04", "m05"];
const WEREWOLF_ROLES: RoleId[] = ["e01", "m01", "m02", "m03", "s02"];

const DRAG_ACTION_BY_ROLE: Partial<Record<RoleId, string>> = {
  e02: "poison",
  e01: "kill",
  e03: "chaman",
  a06: "illusion",
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
  v23: "role-v23",
  a05: "role-a05",
};

interface NightScriptProps {
  activeRoles: Set<RoleId>;
  permanentlyDead: Set<string>;
  poisonedPlayerId: string | null;
  illusionPlayerId: string | null;
  roleAssignments: Record<string, RoleId>;
  nightNumber: number;
  onEndNight: () => void;
  chamanCharges: number;
  onChamanChargeToggle: (index: number) => void;
  lastNightDeadPlayerIds: string[];
  players: Array<{ id: string; name: string; seat_position: number | null }>;
  onVidenteReveal?: () => void;
  playerStatuses?: Record<string, PlayerStatus>;
  foxDisabled: boolean;
  onFoxDisabledToggle: () => void;
  nightTargetedPlayerIds: Set<string>;
  conditionKeys?: Record<string, boolean>;
  playerEffects?: Record<string, Set<string>>;
  profeciaGhostPlayerIds?: Set<string>;
  powerlessPlayerIds?: Set<string>;
  empregadaDynamicText?: string;
  onMeninaReveal?: () => void;
  onFaroleiroReveal?: () => void;
  onLobisomemVidenteReveal?: () => void;
  // Inline checkbox state for roles with limited uses
  paranoicoCharges?: number;
  onParanoicoChargeToggle?: (idx: number) => void;
  anjoCharges?: number;
  onAnjoChargeToggle?: (idx: number) => void;
  lobisomemMauCharges?: number;
  onLobisomemMauChargeToggle?: (idx: number) => void;
  cupidoCharges?: number;
  onCupidoChargeToggle?: (idx: number) => void;
  lobisomemVampiroUsed?: boolean;
  onLobisomemVampiroToggle?: () => void;
  juizCharges?: number;
  onJuizChargeToggle?: (idx: number) => void;
  acusadorCharges?: number;
  onAcusadorChargeToggle?: (idx: number) => void;
  onSpiderReveal?: () => void;
  onSpyReveal?: () => void;
  amanteUsed?: boolean;
  onAmanteToggle?: () => void;
}

function isLineRelevant(
  line: ScriptLine,
  activeRoles: Set<RoleId>,
  permanentlyDeadRoles: Set<RoleId>,
  roleAssignments: Record<string, RoleId>,
  permanentlyDeadPlayerIds: Set<string>,
  profeciaGhostPlayerIds: Set<string> = new Set(),
): boolean {
  if (!line.requires) return true;
  if (line.conditionKey === "cacadorDied" || line.conditionKey === "soldadoDied" || line.conditionKey === "capuchinhoExecuted") {
    return true;
  }
  return line.requires.some((r) => {
    const playersWithRole = Object.entries(roleAssignments).filter(([, role]) => role === r);
    if (playersWithRole.length === 0) return false;
    return playersWithRole.some(([pid]) => !permanentlyDeadPlayerIds.has(pid) || profeciaGhostPlayerIds.has(pid));
  });
}

function getLineDragAction(line: ScriptLine): "poison" | "kill" | "chaman" | "illusion" | null {
  if (!line.requires) return null;
  if (line.requires.length === 1 && line.requires[0] === ("e02" as RoleId)) return "poison";
  // Werewolf line has multiple requires now - check if e01 is included
  if (line.requires.includes("e01" as RoleId) && line.requires.includes("m01" as RoleId)) return "kill";
  if (line.requires.length === 1 && line.requires[0] === ("e03" as RoleId)) return "chaman";
  if (line.requires.length === 1 && line.requires[0] === ("a06" as RoleId)) return "illusion";
  return null;
}

function getRawLineDragAction(line: ScriptLine): string | null {
  // Soldado ghost line: drag to kill, sourced as soldado
  if (line.conditionKey === "soldadoDied") return "role-soldado-kill";
  // Caçador ghost lines also draggable as v08 kill
  if (line.conditionKey === "cacadorDied" || line.conditionKey === "capuchinhoExecuted") return "role-v08";
  if (!line.requires?.length) return null;
  const special = getLineDragAction(line);
  if (special) return special;
  if (line.requires.length === 1) return DRAG_ACTION_BY_ROLE[line.requires[0]] ?? null;
  if (line.requires.includes("e01") && line.requires.includes("m01")) return "kill";
  return null;
}

function ScriptLineDisplay({
  line,
  poisonedRoles,
  poisonedPlayerId,
  roleAssignments,
  chamanCharges,
  onChamanChargeToggle,
  isWerewolfLinePoisoned,
  lastNightDeadPlayerIds,
  onVidenteReveal,
  onMeninaReveal,
  onFaroleiroReveal,
  onLobisomemVidenteReveal,
  dynamicText,
  foxDisabled,
  onFoxDisabledToggle,
  forceStrikethrough,
  paranoicoCharges,
  onParanoicoChargeToggle,
  anjoCharges,
  onAnjoChargeToggle,
  lobisomemMauCharges,
  onLobisomemMauChargeToggle,
  cupidoCharges,
  onCupidoChargeToggle,
  lobisomemVampiroUsed,
  onLobisomemVampiroToggle,
  juizCharges,
  onJuizChargeToggle,
  acusadorCharges,
  onAcusadorChargeToggle,
  onSpiderReveal,
  onSpyReveal,
  amanteUsed,
  onAmanteToggle,
  werewolvesAsleepText,
}: {
  line: ScriptLine;
  poisonedRoles: Set<RoleId>;
  poisonedPlayerId: string | null;
  roleAssignments: Record<string, RoleId>;
  chamanCharges: number;
  onChamanChargeToggle: (index: number) => void;
  isWerewolfLinePoisoned: boolean;
  lastNightDeadPlayerIds: string[];
  onVidenteReveal?: () => void;
  onMeninaReveal?: () => void;
  onFaroleiroReveal?: () => void;
  onLobisomemVidenteReveal?: () => void;
  dynamicText?: string;
  foxDisabled?: boolean;
  onFoxDisabledToggle?: () => void;
  forceStrikethrough?: boolean;
  paranoicoCharges?: number;
  onParanoicoChargeToggle?: (idx: number) => void;
  anjoCharges?: number;
  onAnjoChargeToggle?: (idx: number) => void;
  lobisomemMauCharges?: number;
  onLobisomemMauChargeToggle?: (idx: number) => void;
  cupidoCharges?: number;
  onCupidoChargeToggle?: (idx: number) => void;
  lobisomemVampiroUsed?: boolean;
  onLobisomemVampiroToggle?: () => void;
  juizCharges?: number;
  onJuizChargeToggle?: (idx: number) => void;
  acusadorCharges?: number;
  onAcusadorChargeToggle?: (idx: number) => void;
  onSpiderReveal?: () => void;
  onSpyReveal?: () => void;
  amanteUsed?: boolean;
  onAmanteToggle?: () => void;
  werewolvesAsleepText: string;
}) {
  const lang = useLanguage();
  const rawDisplayText = dynamicText ?? line.text;
  const isStrikethrough = rawDisplayText.startsWith("~~") && rawDisplayText.endsWith("~~");
  const displayText = isStrikethrough ? rawDisplayText.slice(2, -2) : rawDisplayText;
  const { segments } = parseScriptText(displayText);
  const isPoisonedLine = line.requires?.some((r) => poisonedRoles.has(r));
  const dragAction = getRawLineDragAction(line);
  const isWerewolfLine = line.requires?.includes("e01" as RoleId) && line.requires?.includes("m01" as RoleId);
  const isChamanLine = line.requires?.length === 1 && line.requires[0] === ("e03" as RoleId);
  const isVidenteLine = line.requires?.length === 1 && line.requires[0] === ("e04" as RoleId);
  const isFoxLine = line.requires?.length === 1 && line.requires[0] === ("v04" as RoleId);
  const isMeninaLine = line.requires?.length === 1 && line.requires[0] === ("v01" as RoleId);
  const isFaroleiroLine = line.requires?.length === 1 && line.requires[0] === ("v21" as RoleId);
  const isLobisomemVidenteLine = line.requires?.length === 1 && line.requires[0] === ("m02" as RoleId);
  const isParanoicoLine = line.requires?.length === 1 && line.requires[0] === ("v10" as RoleId);
  const isAnjoLine = line.requires?.length === 1 && line.requires[0] === ("v18" as RoleId);
  const isLobisomemMauLine = line.requires?.length === 1 && line.requires[0] === ("m01" as RoleId);
  const isCupidoLine = line.requires?.length === 1 && line.requires[0] === ("s01" as RoleId);
  const isLobisomemVampiroLine = line.requires?.length === 1 && line.requires[0] === ("m03" as RoleId);
  const isJuizLine = line.requires?.length === 1 && line.requires[0] === ("v13" as RoleId);
  const isAcusadorLine = line.requires?.length === 1 && line.requires[0] === ("v14" as RoleId);
  const isSpiderCaughtLine = line.requires?.length === 1 && line.requires[0] === ("v23" as RoleId) && line.conditionKey === "spiderHasCaught";
  const isSpyLine = line.requires?.length === 1 && line.requires[0] === ("f02" as RoleId) && line.conditionKey === "spyHasUnseen";
  const isAmanteBaseLine = line.requires?.length === 1 && line.requires[0] === ("as01b" as RoleId) && !line.conditionKey;
  const isA05Line = line.requires?.length === 1 && line.requires[0] === ("a05" as RoleId);
  const isA05Poisoned = !!poisonedPlayerId && roleAssignments[poisonedPlayerId] === "a05";
  const a05Strike = isA05Line && isA05Poisoned;

  const isChamanPoisoned = useMemo(() => {
    if (!poisonedPlayerId) return false;
    return roleAssignments[poisonedPlayerId] === "e03";
  }, [poisonedPlayerId, roleAssignments]);

  const isWerewolfPoisoned = useMemo(() => {
    if (!poisonedPlayerId) return false;
    const r = roleAssignments[poisonedPlayerId];
    return (["e01", "m01", "m02", "m03"] as RoleId[]).includes(r);
  }, [poisonedPlayerId, roleAssignments]);

  // Hide the amante base line entirely once "Encontrado/Trouvé" is ticked
  if (isAmanteBaseLine && amanteUsed) return null;

  const handleNativeDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (dragAction) {
      if (dragAction === "chaman" && isChamanPoisoned) {
        e.preventDefault();
        toast.warning(getToast("warnChamanPoisoned", lang));
        return;
      }
      if (dragAction === "kill" && isWerewolfPoisoned) {
        e.preventDefault();
        toast.warning(getToast("warnLobosPoisoned", lang));
        return;
      }
      e.dataTransfer.setData("action", dragAction);
      e.dataTransfer.effectAllowed = "move";
    }
  };

  const handleChamanCheck = (index: number) => {
    // Chaman can always tick checkbox; only drag-drop resurrect is blocked when poisoned
    onChamanChargeToggle(index);
  };

  return (
    <div
      draggable={!!dragAction}
      onDragStart={handleNativeDragStart}
    >
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className={`py-2 px-3 rounded-lg text-sm font-body leading-relaxed ${
          isPoisonedLine
            ? "bg-green-900/30 border border-green-500/40 text-green-300"
            : "bg-card/50 border border-border/30"
        } ${dragAction ? "cursor-grab active:cursor-grabbing hover:border-primary/50" : ""}`}
      >
        {isWerewolfLine && isWerewolfLinePoisoned ? (
          <span className="line-through text-muted-foreground">{werewolvesAsleepText}</span>
        ) : (
          <span className={(isStrikethrough || forceStrikethrough || a05Strike || (isAmanteBaseLine && amanteUsed)) ? "line-through text-muted-foreground" : ""}>
            {segments.map((seg, i) =>
              seg.isRole ? (
                <span key={i} className={isPoisonedLine ? "font-bold text-green-400" : "font-bold text-blue-400"}>
                  {seg.text}
                </span>
              ) : (
                <span key={i}>{seg.text}</span>
              )
            )}
          </span>
        )}

        {/* Chaman power boxes */}
        {isChamanLine && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-muted-foreground">{t("uses", lang)}</span>
            {[0, 1].map((idx) => (
              <Checkbox
                key={idx}
                checked={chamanCharges > idx}
                onCheckedChange={() => handleChamanCheck(idx)}
                className="h-5 w-5 border-primary data-[state=checked]:bg-primary"
              />
            ))}
            {isChamanPoisoned && (
              <img src={poisonedIcon} alt="" className="h-4 w-4 ml-1" />
            )}
          </div>
        )}

        {/* Fox checkbox */}
        {isFoxLine && onFoxDisabledToggle != null && (
          <div className="flex items-center gap-2 mt-2">
            <Checkbox
              checked={foxDisabled}
              onCheckedChange={() => onFoxDisabledToggle?.()}
              className="h-5 w-5 border-primary data-[state=checked]:bg-primary"
            />
            <span className="text-xs text-muted-foreground">{t("powerExhausted", lang)}</span>
          </div>
        )}

        {/* Generic 2-charge checkboxes for limited-use roles */}
        {isParanoicoLine && onParanoicoChargeToggle != null && (
          <div className="flex items-center gap-2 mt-2">
            {[0, 1].map((idx) => (
              <Checkbox key={idx} checked={(paranoicoCharges ?? 0) > idx} onCheckedChange={() => onParanoicoChargeToggle(idx)} className="h-5 w-5 border-primary data-[state=checked]:bg-primary" />
            ))}
          </div>
        )}
        {isAnjoLine && onAnjoChargeToggle != null && (
          <div className="flex items-center gap-2 mt-2">
            {[0, 1].map((idx) => (
              <Checkbox key={idx} checked={(anjoCharges ?? 0) > idx} onCheckedChange={() => onAnjoChargeToggle(idx)} className="h-5 w-5 border-primary data-[state=checked]:bg-primary" />
            ))}
          </div>
        )}
        {isLobisomemMauLine && onLobisomemMauChargeToggle != null && (
          <div className="flex items-center gap-2 mt-2">
            {[0, 1].map((idx) => (
              <Checkbox key={idx} checked={(lobisomemMauCharges ?? 0) > idx} onCheckedChange={() => onLobisomemMauChargeToggle(idx)} className="h-5 w-5 border-primary data-[state=checked]:bg-primary" />
            ))}
          </div>
        )}
        {isCupidoLine && onCupidoChargeToggle != null && (
          <div className="flex items-center gap-2 mt-2">
            {[0, 1].map((idx) => (
              <Checkbox key={idx} checked={(cupidoCharges ?? 0) > idx} onCheckedChange={() => onCupidoChargeToggle(idx)} className="h-5 w-5 border-primary data-[state=checked]:bg-primary" />
            ))}
          </div>
        )}
        {isLobisomemVampiroLine && onLobisomemVampiroToggle != null && (
          <div className="flex items-center gap-2 mt-2">
            <Checkbox checked={!!lobisomemVampiroUsed} onCheckedChange={() => onLobisomemVampiroToggle()} className="h-5 w-5 border-primary data-[state=checked]:bg-primary" />
          </div>
        )}
        {isJuizLine && onJuizChargeToggle != null && (
          <div className="flex items-center gap-2 mt-2">
            {[0, 1].map((idx) => (
              <Checkbox key={idx} checked={(juizCharges ?? 0) > idx} onCheckedChange={() => onJuizChargeToggle(idx)} className="h-5 w-5 border-primary data-[state=checked]:bg-primary" />
            ))}
          </div>
        )}
        {isAcusadorLine && onAcusadorChargeToggle != null && (
          <div className="flex items-center gap-2 mt-2">
            {[0, 1].map((idx) => (
              <Checkbox key={idx} checked={(acusadorCharges ?? 0) > idx} onCheckedChange={() => onAcusadorChargeToggle(idx)} className="h-5 w-5 border-primary data-[state=checked]:bg-primary" />
            ))}
          </div>
        )}

        {/* Vidente eye icon */}
        {isVidenteLine && lastNightDeadPlayerIds.length > 0 && onVidenteReveal && (
          <button
            onClick={(e) => { e.stopPropagation(); onVidenteReveal(); }}
            className="inline-flex items-center ml-2 p-1 rounded hover:bg-primary/20 transition-colors"
          >
            <Eye className="h-4 w-4 text-blue-400" />
          </button>
        )}
        {isMeninaLine && onMeninaReveal && (
          <button onClick={(e) => { e.stopPropagation(); onMeninaReveal(); }} className="inline-flex items-center ml-2 p-1 rounded hover:bg-primary/20"><Eye className="h-4 w-4 text-blue-400" /></button>
        )}
        {isFaroleiroLine && onFaroleiroReveal && (
          <button onClick={(e) => { e.stopPropagation(); onFaroleiroReveal(); }} className="inline-flex items-center ml-2 p-1 rounded hover:bg-primary/20"><Eye className="h-4 w-4 text-blue-400" /></button>
        )}
        {isLobisomemVidenteLine && onLobisomemVidenteReveal && (
          <button onClick={(e) => { e.stopPropagation(); onLobisomemVidenteReveal(); }} className="inline-flex items-center ml-2 p-1 rounded hover:bg-primary/20"><Eye className="h-4 w-4 text-blue-400" /></button>
        )}
        {isSpiderCaughtLine && onSpiderReveal && (
          <button onClick={(e) => { e.stopPropagation(); onSpiderReveal(); }} className="inline-flex items-center ml-2 p-1 rounded hover:bg-primary/20"><Eye className="h-4 w-4 text-blue-400" /></button>
        )}
        {isSpyLine && onSpyReveal && (
          <button onClick={(e) => { e.stopPropagation(); onSpyReveal(); }} className="inline-flex items-center ml-2 p-1 rounded hover:bg-primary/20"><Eye className="h-4 w-4 text-blue-400" /></button>
        )}
        {isAmanteBaseLine && onAmanteToggle && (
          <div className="flex items-center gap-2 mt-2">
            <Checkbox checked={!!amanteUsed} onCheckedChange={() => onAmanteToggle()} className="h-5 w-5 border-primary data-[state=checked]:bg-primary" />
            <span className="text-xs text-muted-foreground">{t("amanteCheckboxLabel", lang)}</span>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export const NightScript = ({
  activeRoles,
  permanentlyDead: _permanentlyDeadPlayerIds,
  poisonedPlayerId,
  illusionPlayerId,
  roleAssignments,
  nightNumber,
  onEndNight,
  chamanCharges,
  onChamanChargeToggle,
  lastNightDeadPlayerIds,
  players,
  onVidenteReveal,
  playerStatuses = {},
  foxDisabled,
  onFoxDisabledToggle,
  nightTargetedPlayerIds,
  conditionKeys = {},
  playerEffects: _playerEffects = {},
  profeciaGhostPlayerIds = new Set(),
  powerlessPlayerIds = new Set(),
  empregadaDynamicText,
  onMeninaReveal,
  onFaroleiroReveal,
  onLobisomemVidenteReveal,
  paranoicoCharges,
  onParanoicoChargeToggle,
  anjoCharges,
  onAnjoChargeToggle,
  lobisomemMauCharges,
  onLobisomemMauChargeToggle,
  cupidoCharges,
  onCupidoChargeToggle,
  lobisomemVampiroUsed,
  onLobisomemVampiroToggle,
  juizCharges,
  onJuizChargeToggle,
  acusadorCharges,
  onAcusadorChargeToggle,
  onSpiderReveal,
  onSpyReveal,
  amanteUsed,
  onAmanteToggle,
}: NightScriptProps) => {
  const lang = useLanguage();
  const dyn = useMemo(() => getDynamic(lang), [lang]);
  const countsAsEvilBeing = useCallback((playerId: string) => {
    const role = roleAssignments[playerId];
    const effects = _playerEffects[playerId] || new Set<string>();
    return EVIL_ROLES.includes(role) || effects.has("werewolf_turned") || effects.has("evil_being");
  }, [roleAssignments, _playerEffects]);

  // Treat powerless players (e.g. vampire victim with keep-power off) as if they were perma-dead for line relevance
  const effectivelyDead = useMemo(() => {
    const s = new Set<string>(_permanentlyDeadPlayerIds);
    powerlessPlayerIds.forEach((pid) => s.add(pid));
    return s;
  }, [_permanentlyDeadPlayerIds, powerlessPlayerIds]);

  // Only mark a role as dead if ALL players with that role are permanently dead
  const permanentlyDeadRoles = useMemo(() => {
    const s = new Set<RoleId>();
    const rolePlayers: Record<string, string[]> = {};
    Object.entries(roleAssignments).forEach(([pid, r]) => {
      if (!rolePlayers[r]) rolePlayers[r] = [];
      rolePlayers[r].push(pid);
    });
    Object.entries(rolePlayers).forEach(([role, pids]) => {
      if (pids.every((pid) => effectivelyDead.has(pid))) {
        s.add(role as RoleId);
      }
    });
    return s;
  }, [effectivelyDead, roleAssignments]);

  const poisonedRoles = useMemo(() => {
    const s = new Set<RoleId>();
    if (poisonedPlayerId) {
      const r = roleAssignments[poisonedPlayerId];
      if (r) s.add(r);
    }
    return s;
  }, [poisonedPlayerId, roleAssignments]);

  const isWerewolfLinePoisoned = useMemo(() => {
    if (!poisonedPlayerId) return false;
    const r = roleAssignments[poisonedPlayerId];
    if (WEREWOLF_ROLES.includes(r)) return true;
    // Players with werewolf_turned status also count as werewolves
    const effects = _playerEffects[poisonedPlayerId] || new Set<string>();
    if (effects.has("werewolf_turned")) return true;
    return false;
  }, [poisonedPlayerId, roleAssignments, _playerEffects]);

  const shouldShowVidenteLine = lastNightDeadPlayerIds.length > 0;

  const alivePlayers = useMemo(() => {
    return players.filter((p) => !_permanentlyDeadPlayerIds.has(p.id));
  }, [players, _permanentlyDeadPlayerIds]);

  // Dynamic bear text
  const bearDynamicText = useMemo(() => {
    const bearPlayerId = Object.entries(roleAssignments).find(([, r]) => r === "v02")?.[0];
    if (!bearPlayerId) return undefined;
    const bearPlayer = players.find((p) => p.id === bearPlayerId);
    if (!bearPlayer || bearPlayer.seat_position === null) return undefined;

    const sorted = players
      .filter((p) => p.seat_position !== null)
      .sort((a, b) => a.seat_position! - b.seat_position!);
    const bearIndex = sorted.findIndex((p) => p.id === bearPlayerId);
    if (bearIndex === -1) return undefined;

    const findNeighbor = (dir: 1 | -1) => {
      for (let i = 1; i < sorted.length; i++) {
        const idx = (bearIndex + dir * i + sorted.length) % sorted.length;
        const p = sorted[idx];
        if (!_permanentlyDeadPlayerIds.has(p.id)) return p;
      }
      return null;
    };

    const left = findNeighbor(-1);
    const right = findNeighbor(1);
    const neighbors = [left, right].filter(Boolean) as typeof players;

    const isBearPoisoned = poisonedPlayerId === bearPlayerId;
    if (isBearPoisoned) {
      return Math.random() > 0.5 ? dyn.bearGrowl : dyn.bearSilent;
    }

    const hasIllusionNeighbor = neighbors.some((n) => n.id === illusionPlayerId);
    if (hasIllusionNeighbor) return dyn.bearConfused;

    const hasEvilNeighbor = neighbors.some((n) => countsAsEvilBeing(n.id));
    return hasEvilNeighbor ? dyn.bearGrowl : dyn.bearSilent;
  }, [roleAssignments, players, _permanentlyDeadPlayerIds, poisonedPlayerId, illusionPlayerId, countsAsEvilBeing, dyn]);

  // Dynamic crow text
  const crowDynamicText = useMemo(() => {
    const crowPlayerId = Object.entries(roleAssignments).find(([, r]) => r === "v03")?.[0];
    if (!crowPlayerId) return undefined;

    const isCrowPoisoned = poisonedPlayerId === crowPlayerId;
    const aliveEvilCount = alivePlayers.filter((p) => countsAsEvilBeing(p.id)).length;
    const illusionActive = illusionPlayerId && !_permanentlyDeadPlayerIds.has(illusionPlayerId);

    if (isCrowPoisoned) {
      const offset = Math.random() > 0.5 ? 1 : -1;
      const fakeCount = Math.max(0, aliveEvilCount + offset);
      return dyn.crowReveal.replace("{n}", String(fakeCount));
    }

    if (illusionActive) {
      return dyn.crowConfused;
    }

    return dyn.crowReveal.replace("{n}", String(aliveEvilCount));
  }, [roleAssignments, alivePlayers, poisonedPlayerId, illusionPlayerId, _permanentlyDeadPlayerIds, countsAsEvilBeing, dyn]);

  // Dynamic rabbit tamer text
  const rabbitDynamicText = useMemo(() => {
    const rabbitPlayerId = Object.entries(roleAssignments).find(([, r]) => r === "v05")?.[0];
    if (!rabbitPlayerId) return undefined;
    const rabbitPlayer = players.find((p) => p.id === rabbitPlayerId);
    if (!rabbitPlayer || rabbitPlayer.seat_position === null) return undefined;

    const sorted = players
      .filter((p) => p.seat_position !== null)
      .sort((a, b) => a.seat_position! - b.seat_position!);
    const rabbitIndex = sorted.findIndex((p) => p.id === rabbitPlayerId);
    if (rabbitIndex === -1) return undefined;

    const findNeighbor = (dir: 1 | -1) => {
      for (let i = 1; i < sorted.length; i++) {
        const idx = (rabbitIndex + dir * i + sorted.length) % sorted.length;
        const p = sorted[idx];
        if (!_permanentlyDeadPlayerIds.has(p.id)) return p;
      }
      return null;
    };

    const left = findNeighbor(-1);
    const right = findNeighbor(1);
    const neighbors = [left, right].filter(Boolean) as typeof players;
    const relevantIds = [rabbitPlayerId, ...neighbors.map((n) => n.id)];

    const hasIllusionNeighbor = neighbors.some((n) => n.id === illusionPlayerId);
    if (hasIllusionNeighbor) return dyn.rabbitConfused;

    const wasTargeted = relevantIds.some((id) => nightTargetedPlayerIds.has(id));
    if (wasTargeted) return dyn.rabbitHeard;

    return `~~${dyn.rabbitNothing}~~`;
  }, [roleAssignments, players, _permanentlyDeadPlayerIds, illusionPlayerId, nightTargetedPlayerIds, dyn]);

  const spiderConfusedText = useMemo(() => {
    const webbedPid = Object.entries(_playerEffects).find(([, e]) => e.has("webbed"))?.[0];
    if (webbedPid && webbedPid === illusionPlayerId) return t("spiderConfused", lang);
    return undefined;
  }, [_playerEffects, illusionPlayerId, lang]);

  const getDynamicText = (line: ScriptLine): string | undefined => {
    if (line.requires?.length === 1 && line.requires[0] === "v02") return bearDynamicText;
    if (line.requires?.length === 1 && line.requires[0] === "v03") return crowDynamicText;
    if (line.requires?.length === 1 && line.requires[0] === "v05") return rabbitDynamicText;
    if (line.requires?.length === 1 && line.requires[0] === "v20") return empregadaDynamicText;
    if (line.requires?.length === 1 && line.requires[0] === "v23" && line.conditionKey === "spiderHasCaught") return spiderConfusedText;
    return undefined;
  };

  // True if every player matching this role has hospede or incendiado effect
  const isLineForcedStrikethrough = useCallback((line: ScriptLine): boolean => {
    if (!line.requires || line.requires.length !== 1) return false;
    const r = line.requires[0];
    const playersWithRole = Object.entries(roleAssignments).filter(([, role]) => role === r).map(([pid]) => pid);
    if (playersWithRole.length === 0) return false;
    return playersWithRole.every((pid) => {
      const eff = _playerEffects[pid] || new Set<string>();
      return eff.has("hospede") || eff.has("incendiado");
    });
  }, [roleAssignments, _playerEffects]);

  const filterLine = useCallback((l: ScriptLine): boolean => {
    if (!isLineRelevant(l, activeRoles, permanentlyDeadRoles, roleAssignments, effectivelyDead, profeciaGhostPlayerIds)) return false;
    if (l.conditionKey && !conditionKeys[l.conditionKey]) return false;
    if (l.requires?.length === 1 && l.requires[0] === ("e03" as RoleId) && chamanCharges >= 2) return false;
    if (l.requires?.length === 1 && l.requires[0] === ("e04" as RoleId) && !shouldShowVidenteLine) return false;
    if (l.requires?.length === 1 && l.requires[0] === ("v04" as RoleId) && foxDisabled) return false;
    return true;
  }, [activeRoles, permanentlyDeadRoles, roleAssignments, effectivelyDead, conditionKeys, chamanCharges, shouldShowVidenteLine, foxDisabled, profeciaGhostPlayerIds]);

  const localizedScripts = useMemo(() => getScripts(lang), [lang]);
  const sectionLabels = useMemo(() => ({
    first: t("firstNight", lang),
    secondStart: t("secondNightStart", lang),
    night: t("night", lang),
  }), [lang]);

  const scriptLines = useMemo(() => {
    const lines: { section: string; items: ScriptLine[] }[] = [];

    if (nightNumber === 1) {
      const filtered = localizedScripts.firstNight.filter((l) => isLineRelevant(l, activeRoles, permanentlyDeadRoles, roleAssignments, _permanentlyDeadPlayerIds, profeciaGhostPlayerIds));
      if (filtered.length > 0) lines.push({ section: sectionLabels.first, items: filtered });
    } else if (nightNumber === 2) {
      const filtered2 = localizedScripts.secondNight.filter((l) => isLineRelevant(l, activeRoles, permanentlyDeadRoles, roleAssignments, _permanentlyDeadPlayerIds, profeciaGhostPlayerIds));
      if (filtered2.length > 0) lines.push({ section: sectionLabels.secondStart, items: filtered2 });
      const filteredNormal = localizedScripts.normalNight.filter(filterLine);
      if (filteredNormal.length > 0) lines.push({ section: sectionLabels.night, items: filteredNormal });
    } else {
      const filteredNormal = localizedScripts.normalNight.filter(filterLine);
      if (filteredNormal.length > 0) lines.push({ section: `${sectionLabels.night} ${nightNumber}`, items: filteredNormal });
    }

    return lines;
  }, [nightNumber, activeRoles, permanentlyDeadRoles, filterLine, roleAssignments, _permanentlyDeadPlayerIds, profeciaGhostPlayerIds, localizedScripts, sectionLabels]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Moon className="h-5 w-5 text-moon" />
        <h2 className="font-display text-sm tracking-widest uppercase text-muted-foreground">
          {t("scriptOfNight", lang)} {nightNumber}
        </h2>
      </div>

      <div className="space-y-4 pr-2">
        {scriptLines.map((section) => (
          <div key={section.section} className="space-y-2">
            <h3 className="font-display text-xs tracking-widest uppercase text-primary/70">
              {section.section}
            </h3>
            {section.items.map((line, i) => (
              <ScriptLineDisplay
                key={i}
                line={line}
                poisonedRoles={poisonedRoles}
                poisonedPlayerId={poisonedPlayerId}
                roleAssignments={roleAssignments}
                chamanCharges={chamanCharges}
                onChamanChargeToggle={onChamanChargeToggle}
                isWerewolfLinePoisoned={isWerewolfLinePoisoned}
                lastNightDeadPlayerIds={lastNightDeadPlayerIds}
                onVidenteReveal={onVidenteReveal}
                onMeninaReveal={onMeninaReveal}
                onFaroleiroReveal={onFaroleiroReveal}
                onLobisomemVidenteReveal={onLobisomemVidenteReveal}
                dynamicText={getDynamicText(line)}
                foxDisabled={foxDisabled}
                onFoxDisabledToggle={onFoxDisabledToggle}
                forceStrikethrough={isLineForcedStrikethrough(line)}
                paranoicoCharges={paranoicoCharges}
                onParanoicoChargeToggle={onParanoicoChargeToggle}
                anjoCharges={anjoCharges}
                onAnjoChargeToggle={onAnjoChargeToggle}
                lobisomemMauCharges={lobisomemMauCharges}
                onLobisomemMauChargeToggle={onLobisomemMauChargeToggle}
                cupidoCharges={cupidoCharges}
                onCupidoChargeToggle={onCupidoChargeToggle}
                lobisomemVampiroUsed={lobisomemVampiroUsed}
                onLobisomemVampiroToggle={onLobisomemVampiroToggle}
                juizCharges={juizCharges}
                onJuizChargeToggle={onJuizChargeToggle}
                acusadorCharges={acusadorCharges}
                onAcusadorChargeToggle={onAcusadorChargeToggle}
                onSpiderReveal={onSpiderReveal}
                onSpyReveal={onSpyReveal}
                amanteUsed={amanteUsed}
                onAmanteToggle={onAmanteToggle}
                werewolvesAsleepText={dyn.werewolvesAsleep}
              />
            ))}
          </div>
        ))}
      </div>

      <Button
        onClick={onEndNight}
        className="w-full h-12 font-display tracking-wider bg-secondary hover:bg-secondary/80 border border-moon/30 mt-2"
      >
        <Sun className="h-4 w-4 mr-2" />
        {t("endNight", lang)} {nightNumber}
      </Button>
    </div>
  );
};