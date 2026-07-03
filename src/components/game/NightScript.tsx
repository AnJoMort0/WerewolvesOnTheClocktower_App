import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  parseScriptText,
  type ScriptLine,
} from "@/lib/nightScript";
import { useLanguage, getScripts, getDynamic, getRoleLabel, t, getToast } from "@/lib/i18n";
import { ROLES, type RoleId } from "@/lib/roles";
import { getGuaranteedWrongCount } from "@/lib/gameRules";
import poisonedIcon from "@/assets/icons/poisoned.png";
import { toast } from "sonner";
import type { PlayerStatus } from "@/components/game/PlayerStatusPopover";
import { EMPTY_ACTOR_POWER_STATE, type ActorPowerState } from "@/lib/actor";
import { isDrunkardActingPoisoned } from "@/lib/drunkard";
import type { DogWolfStates } from "@/lib/dogWolf";

/** Evil roles for bear/crow mechanics */
const EVIL_ROLES: RoleId[] = ["e01", "e02", "s02", "a06", "m01", "m02", "m03", "m04", "m05"];
const WEREWOLF_ROLES: RoleId[] = ["e01", "m01", "m02", "m03", "s02"];
const EMPTY_COMPLETED_LINE_KEYS = new Set<string>();

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
  v15: "role-v15",
  v18: "role-v18",
  s02: "role-s02",
  v08: "role-v08",
  m03: "role-m03",
  v23: "role-v23",
  a05: "role-a05",
  a04: "role-a04",
  a02: "role-a02",
  m05: "role-m05",
};

interface NightScriptProps {
  activeRoles: Set<RoleId>;
  permanentlyDead: Set<string>;
  poisonedPlayerId: string | null;
  poisonedPlayerIds?: Set<string>;
  illusionPlayerId: string | null;
  illusionPlayerIds?: Set<string>;
  roleAssignments: Record<string, RoleId>;
  baseRoleAssignments?: Record<string, RoleId>;
  nightNumber: number;
  onEndNight: () => void;
  chamanCharges: number;
  onChamanChargeToggle: (index: number) => void;
  lastNightDeadPlayerIds: string[];
  players: Array<{ id: string; name: string; seat_position: number | null }>;
  onVidenteReveal?: (sourcePlayerId?: string | null) => void;
  playerStatuses?: Record<string, PlayerStatus>;
  foxDisabled: boolean;
  onFoxDisabledToggle: () => void;
  nightTargetedPlayerIds: Set<string>;
  conditionKeys?: Record<string, boolean>;
  playerEffects?: Record<string, Set<string>>;
  profeciaGhostPlayerIds?: Set<string>;
  powerlessPlayerIds?: Set<string>;
  empregadaDynamicText?: string;
  onMeninaReveal?: (sourcePlayerId?: string | null) => void;
  onFaroleiroReveal?: (sourcePlayerId?: string | null) => void;
  onLobisomemVidenteReveal?: (sourcePlayerId?: string | null) => void;
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
  onSpiderReveal?: (sourcePlayerId?: string | null) => void;
  onSpyReveal?: (sourcePlayerId?: string | null) => void;
  onScriptRolesVisible?: (roles: RoleId[]) => void;
  completedLineKeys?: Set<string>;
  onLineCompletedChange?: (key: string, completed: boolean, progressOrder: number | null) => void;
  autoCompleteRole?: RoleId | null;
  autoCompleteSourcePlayerIds?: string[];
  autoCompleteVersion?: number;
  actorPlayerId?: string | null;
  actorCopiedRole?: RoleId | null;
  actorCopyNoticeNight?: number | null;
  actorPowerState?: ActorPowerState;
  onActorPowerStateChange?: (state: ActorPowerState) => void;
  deathTriggeredSourcePlayerIds?: Record<string, string[]>;
  dogWolfStates?: DogWolfStates;
  dogWolfPlayerIds?: string[];
  abilityRoleAssignments?: Record<string, RoleId>;
  objectiveRoleAssignments?: Record<string, RoleId>;
  spiderCaughtBySource?: Record<string, string[]>;
  independentPowerStates?: Record<string, ActorPowerState>;
  onIndependentPowerStateChange?: (playerId: string, state: ActorPowerState) => void;
  drunkardMechanicPlayerIds?: Set<string>;
}

type ScriptRenderItem = {
  line: ScriptLine;
  key: string;
  progressOrder: number | null;
  actorLine?: boolean;
  replaceAllRoleTokens?: boolean;
  actorNotice?: boolean;
  actorJoins?: boolean;
  drunkardLine?: boolean;
  drunkardActingPoisoned?: boolean;
  dogWolfLine?: boolean;
  dogWolfStandalone?: boolean;
  dogWolfActingPoisoned?: boolean;
  actingPoisoned?: boolean;
  sourcePlayerId?: string | null;
};

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
  if (line.requires.length === 1 && line.requires[0] === "s01") {
    return line.conditionKey ? null : "role-s01";
  }
  const special = getLineDragAction(line);
  if (special) return special;
  if (line.requires.length === 1) return DRAG_ACTION_BY_ROLE[line.requires[0]] ?? null;
  if (line.requires.includes("e01") && line.requires.includes("m01")) return "kill";
  return null;
}

function replaceRoleWithDog(text: string, lang: "pt" | "fr", copiedRole?: RoleId | null): string {
  const dogToken = `{${t("dogCopyLabel", lang)}}`;
  if (copiedRole) {
    const escapedLabel = getRoleLabel(copiedRole, lang).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const roleWithArticlePattern = lang === "fr"
      ? new RegExp(`(?:La|Le)\\s+\\{${escapedLabel}\\}|L['’]\\{${escapedLabel}\\}`)
      : new RegExp(`(?:A|O)\\s+\\{${escapedLabel}\\}`);
    if (roleWithArticlePattern.test(text)) {
      return text.replace(roleWithArticlePattern, `${lang === "fr" ? "Le" : "O"} ${dogToken}`);
    }
    const rolePattern = new RegExp(`\\{${escapedLabel}\\}`);
    if (rolePattern.test(text)) return text.replace(rolePattern, dogToken);
  }
  const articlePattern = lang === "fr"
    ? /(?:La|Le)\s+\{[^}]+\}|L['’]\{[^}]+\}/
    : /(?:A|O)\s+\{[^}]+\}/;
  const withArticle = text.replace(articlePattern, `${lang === "fr" ? "Le" : "O"} ${dogToken}`);
  return withArticle === text ? text.replace(/\{[^}]+\}/, dogToken) : withArticle;
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
  showFoxCheckbox,
  forceStrikethrough,
  paranoicoCharges,
  onParanoicoChargeToggle,
  anjoCharges,
  onAnjoChargeToggle,
  lobisomemMauCharges,
  onLobisomemMauChargeToggle,
  cupidoCharges,
  onCupidoChargeToggle,
  showCupidoCheckboxes,
  lobisomemVampiroUsed,
  onLobisomemVampiroToggle,
  juizCharges,
  onJuizChargeToggle,
  acusadorCharges,
  onAcusadorChargeToggle,
  onSpiderReveal,
  onSpyReveal,
  werewolvesAsleepText,
  lineCompleted,
  onLineCompletedChange,
  actorLine,
  replaceAllRoleTokens,
  actorCopiedRole,
  sourcePlayerId,
  disableDrag,
  actorJoins,
  drunkardLine,
  drunkardActingPoisoned,
  dogWolfLine,
  dogWolfStandalone,
  dogWolfCopiedRole,
  dogWolfActingPoisoned,
  actingPoisoned,
}: {
  line: ScriptLine;
  poisonedRoles: Set<RoleId>;
  poisonedPlayerId: string | null;
  roleAssignments: Record<string, RoleId>;
  chamanCharges: number;
  onChamanChargeToggle: (index: number) => void;
  isWerewolfLinePoisoned: boolean;
  lastNightDeadPlayerIds: string[];
  onVidenteReveal?: (sourcePlayerId?: string | null) => void;
  onMeninaReveal?: (sourcePlayerId?: string | null) => void;
  onFaroleiroReveal?: (sourcePlayerId?: string | null) => void;
  onLobisomemVidenteReveal?: (sourcePlayerId?: string | null) => void;
  dynamicText?: string;
  foxDisabled?: boolean;
  onFoxDisabledToggle?: () => void;
  showFoxCheckbox: boolean;
  forceStrikethrough?: boolean;
  paranoicoCharges?: number;
  onParanoicoChargeToggle?: (idx: number) => void;
  anjoCharges?: number;
  onAnjoChargeToggle?: (idx: number) => void;
  lobisomemMauCharges?: number;
  onLobisomemMauChargeToggle?: (idx: number) => void;
  cupidoCharges?: number;
  onCupidoChargeToggle?: (idx: number) => void;
  showCupidoCheckboxes: boolean;
  lobisomemVampiroUsed?: boolean;
  onLobisomemVampiroToggle?: () => void;
  juizCharges?: number;
  onJuizChargeToggle?: (idx: number) => void;
  acusadorCharges?: number;
  onAcusadorChargeToggle?: (idx: number) => void;
  onSpiderReveal?: (sourcePlayerId?: string | null) => void;
  onSpyReveal?: (sourcePlayerId?: string | null) => void;
  werewolvesAsleepText: string;
  lineCompleted: boolean;
  onLineCompletedChange: (completed: boolean) => void;
  actorLine?: boolean;
  replaceAllRoleTokens?: boolean;
  actorCopiedRole?: RoleId | null;
  sourcePlayerId?: string | null;
  disableDrag?: boolean;
  actorJoins?: boolean;
  drunkardLine?: boolean;
  drunkardActingPoisoned?: boolean;
  dogWolfLine?: boolean;
  dogWolfStandalone?: boolean;
  dogWolfCopiedRole?: RoleId | null;
  dogWolfActingPoisoned?: boolean;
  actingPoisoned?: boolean;
}) {
  const lang = useLanguage();
  const originalText = dynamicText ?? line.text;
  const rawDisplayText = dogWolfLine
    ? `${dogWolfStandalone ? "" : "("}${replaceRoleWithDog(originalText, lang, dogWolfCopiedRole)}${dogWolfStandalone ? "" : ")"}`
    : actorJoins
    ? originalText.replace(/(\{[^}]+\})/, `$1 (+ {${getRoleLabel("a04", lang)}})`)
    : actorLine && actorCopiedRole
    ? originalText.replace(replaceAllRoleTokens ? /\{[^}]+\}/g : /\{[^}]+\}/, `{${getRoleLabel("a04", lang)}}`)
    : originalText;
  const isStrikethrough = rawDisplayText.startsWith("~~") && rawDisplayText.endsWith("~~");
  const displayText = isStrikethrough ? rawDisplayText.slice(2, -2) : rawDisplayText;
  const { segments } = parseScriptText(displayText);
  const isPoisonedLine = dogWolfLine
    ? !!dogWolfActingPoisoned
    : drunkardLine
    ? !!drunkardActingPoisoned
    : actingPoisoned !== undefined
    ? actingPoisoned
    : line.requires?.some((r) => poisonedRoles.has(r));
  const dragAction = disableDrag ? null : getRawLineDragAction(line);
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
  const isA05Line = line.requires?.length === 1 && line.requires[0] === ("a05" as RoleId);
  const isA05Poisoned = sourcePlayerId ? isPoisonedLine : !!poisonedPlayerId && roleAssignments[poisonedPlayerId] === "a05";
  const a05Strike = isA05Line && isA05Poisoned;

  const isChamanPoisoned = useMemo(() => {
    if (sourcePlayerId) return isChamanLine && isPoisonedLine;
    if (!poisonedPlayerId) return false;
    return roleAssignments[poisonedPlayerId] === "e03";
  }, [isChamanLine, isPoisonedLine, poisonedPlayerId, roleAssignments, sourcePlayerId]);

  const isWerewolfPoisoned = useMemo(() => {
    if (sourcePlayerId) return isWerewolfLine && isPoisonedLine;
    if (!poisonedPlayerId) return false;
    const r = roleAssignments[poisonedPlayerId];
    return (["e01", "m01", "m02", "m03"] as RoleId[]).includes(r);
  }, [isPoisonedLine, isWerewolfLine, poisonedPlayerId, roleAssignments, sourcePlayerId]);

  const handleNativeDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (dragAction) {
      if (dragAction === "chaman" && isChamanPoisoned) {
        e.preventDefault();
        toast.warning(getToast("warnChamanPoisoned", lang));
        return;
      }
      if (dragAction === "kill" && isWerewolfPoisoned) {
        e.preventDefault();
        toast.warning(getToast("warnWolvesPoisoned", lang));
        return;
      }
      e.dataTransfer.setData("action", dragAction);
      if (sourcePlayerId) e.dataTransfer.setData("sourcePlayerId", sourcePlayerId);
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
      onClickCapture={(event) => {
        const button = (event.target as HTMLElement).closest("button");
        if (button && !button.hasAttribute("data-line-checkbox")) onLineCompletedChange(true);
      }}
    >
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className={`relative py-2 pl-3 pr-10 rounded-lg text-sm font-body leading-relaxed ${
          isPoisonedLine
            ? "bg-green-900/30 border border-green-500/40 text-green-300"
            : "bg-card/50 border border-border/30"
        } ${dragAction ? "cursor-grab active:cursor-grabbing hover:border-primary/50" : ""}`}
      >
        <Checkbox
          data-line-checkbox
          checked={lineCompleted}
          onCheckedChange={(checked) => onLineCompletedChange(checked === true)}
          aria-label={t("completeScriptLine", lang)}
          title={t("completeScriptLine", lang)}
          className="absolute right-3 top-3 h-5 w-5 border-primary data-[state=checked]:bg-primary"
        />
        {drunkardLine && (
          <img
            src={ROLES.a01.image}
            alt={getRoleLabel("a01", lang)}
            title={getRoleLabel("a01", lang)}
            className="mb-1 mr-2 inline-block h-7 w-7 rounded border border-green-400 object-cover align-middle shadow"
          />
        )}
        {isWerewolfLine && isWerewolfLinePoisoned ? (
          <span className="line-through text-muted-foreground">{werewolvesAsleepText}</span>
        ) : (
          <span className={(isStrikethrough || forceStrikethrough || a05Strike || lineCompleted) ? "line-through text-muted-foreground" : ""}>
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
        {isFoxLine && showFoxCheckbox && onFoxDisabledToggle != null && (
          <div className="flex items-center gap-2 mt-2">
            <Checkbox
              checked={foxDisabled}
              onCheckedChange={() => onFoxDisabledToggle?.()}
              className="h-5 w-5 rounded-none border-2 border-blue-400 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
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
        {isCupidoLine && showCupidoCheckboxes && onCupidoChargeToggle != null && (
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
            onClick={(e) => { e.stopPropagation(); onVidenteReveal(sourcePlayerId); }}
            className="inline-flex items-center ml-2 p-1 rounded hover:bg-primary/20 transition-colors"
          >
            <Eye className="h-4 w-4 text-blue-400" />
          </button>
        )}
        {isMeninaLine && onMeninaReveal && (
          <button onClick={(e) => { e.stopPropagation(); onMeninaReveal(sourcePlayerId); }} className="inline-flex items-center ml-2 p-1 rounded hover:bg-primary/20"><Eye className="h-4 w-4 text-blue-400" /></button>
        )}
        {isFaroleiroLine && onFaroleiroReveal && (
          <button onClick={(e) => { e.stopPropagation(); onFaroleiroReveal(sourcePlayerId); }} className="inline-flex items-center ml-2 p-1 rounded hover:bg-primary/20"><Eye className="h-4 w-4 text-blue-400" /></button>
        )}
        {isLobisomemVidenteLine && onLobisomemVidenteReveal && (
          <button onClick={(e) => { e.stopPropagation(); onLobisomemVidenteReveal(sourcePlayerId); }} className="inline-flex items-center ml-2 p-1 rounded hover:bg-primary/20"><Eye className="h-4 w-4 text-blue-400" /></button>
        )}
        {isSpiderCaughtLine && !dynamicText && onSpiderReveal && (
          <button onClick={(e) => { e.stopPropagation(); onSpiderReveal(sourcePlayerId); }} className="inline-flex items-center ml-2 p-1 rounded hover:bg-primary/20"><Eye className="h-4 w-4 text-blue-400" /></button>
        )}
        {isSpyLine && onSpyReveal && (
          <button onClick={(e) => { e.stopPropagation(); onSpyReveal(sourcePlayerId); }} className="inline-flex items-center ml-2 p-1 rounded hover:bg-primary/20"><Eye className="h-4 w-4 text-blue-400" /></button>
        )}
      </motion.div>
    </div>
  );
}

export const NightScript = ({
  activeRoles,
  permanentlyDead: _permanentlyDeadPlayerIds,
  poisonedPlayerId,
  poisonedPlayerIds = poisonedPlayerId ? new Set([poisonedPlayerId]) : new Set(),
  illusionPlayerId,
  illusionPlayerIds = illusionPlayerId ? new Set([illusionPlayerId]) : new Set(),
  roleAssignments,
  baseRoleAssignments = roleAssignments,
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
  onScriptRolesVisible,
  completedLineKeys = EMPTY_COMPLETED_LINE_KEYS,
  onLineCompletedChange,
  autoCompleteRole = null,
  autoCompleteSourcePlayerIds = [],
  autoCompleteVersion = 0,
  actorPlayerId = null,
  actorCopiedRole = null,
  actorCopyNoticeNight = null,
  actorPowerState = EMPTY_ACTOR_POWER_STATE,
  onActorPowerStateChange,
  deathTriggeredSourcePlayerIds = {},
  dogWolfStates = {},
  dogWolfPlayerIds = [],
  abilityRoleAssignments = roleAssignments,
  objectiveRoleAssignments = abilityRoleAssignments,
  spiderCaughtBySource = {},
  independentPowerStates = {},
  onIndependentPowerStateChange,
  drunkardMechanicPlayerIds: suppliedDrunkardMechanicPlayerIds,
}: NightScriptProps) => {
  const lang = useLanguage();
  const dyn = useMemo(() => getDynamic(lang), [lang]);
  const drunkardPlayerId = useMemo(
    () => Object.entries(baseRoleAssignments).find(([, role]) => role === "a01")?.[0] ?? null,
    [baseRoleAssignments],
  );
  const drunkardMechanicPlayerIds = useMemo(() => {
    if (suppliedDrunkardMechanicPlayerIds) return suppliedDrunkardMechanicPlayerIds;
    const playerIds = new Set<string>();
    if (drunkardPlayerId) playerIds.add(drunkardPlayerId);
    if (actorCopiedRole === "a01" && actorPlayerId) playerIds.add(actorPlayerId);
    return playerIds;
  }, [actorCopiedRole, actorPlayerId, drunkardPlayerId, suppliedDrunkardMechanicPlayerIds]);
  const drunkardReplacementRole = drunkardPlayerId
    ? roleAssignments[drunkardPlayerId] ?? null
    : actorCopiedRole === "a01" && actorPlayerId
    ? roleAssignments[actorPlayerId] ?? null
    : null;
  const isPlayerActingPoisoned = useCallback((playerId: string) => (
    isDrunkardActingPoisoned(playerId, drunkardMechanicPlayerIds, poisonedPlayerIds)
  ), [drunkardMechanicPlayerIds, poisonedPlayerIds]);
  const countsAsEvilBeing = useCallback((playerId: string) => {
    const role = objectiveRoleAssignments[playerId] ?? roleAssignments[playerId];
    const effects = _playerEffects[playerId] || new Set<string>();
    return EVIL_ROLES.includes(role) || effects.has("werewolf_turned") || effects.has("evil_being");
  }, [objectiveRoleAssignments, roleAssignments, _playerEffects]);

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
    for (const playerId of Object.keys(abilityRoleAssignments)) {
      if (!isPlayerActingPoisoned(playerId)) continue;
      const role = abilityRoleAssignments[playerId];
      if (role) s.add(role);
    }
    return s;
  }, [abilityRoleAssignments, isPlayerActingPoisoned]);

  const isWerewolfLinePoisoned = useMemo(() => {
    return Object.entries(abilityRoleAssignments).some(([playerId, role]) => {
      if (dogWolfPlayerIds.includes(playerId) || !isPlayerActingPoisoned(playerId)) return false;
      const effects = _playerEffects[playerId] || new Set<string>();
      return WEREWOLF_ROLES.includes(role) || effects.has("werewolf_turned");
    });
  }, [abilityRoleAssignments, dogWolfPlayerIds, isPlayerActingPoisoned, _playerEffects]);

  const shouldShowVidenteLine = lastNightDeadPlayerIds.length > 0;

  const alivePlayers = useMemo(() => {
    return players.filter((p) => !_permanentlyDeadPlayerIds.has(p.id));
  }, [players, _permanentlyDeadPlayerIds]);

  // Dynamic bear text
  const bearDynamicText = useMemo(() => {
    const bearPlayerId = Object.entries(roleAssignments).find(([playerId, role]) => role === "v02" && !effectivelyDead.has(playerId))?.[0];
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

    const hasIllusionNeighbor = neighbors.some((n) => illusionPlayerIds.has(n.id));
    const hasEvilNeighbor = neighbors.some((n) => countsAsEvilBeing(n.id));
    const isBearPoisoned = isPlayerActingPoisoned(bearPlayerId);
    if (isBearPoisoned) return hasEvilNeighbor ? dyn.bearSilent : dyn.bearGrowl;
    if (hasIllusionNeighbor) return dyn.bearConfused;
    return hasEvilNeighbor ? dyn.bearGrowl : dyn.bearSilent;
  }, [roleAssignments, effectivelyDead, players, _permanentlyDeadPlayerIds, illusionPlayerIds, countsAsEvilBeing, dyn, isPlayerActingPoisoned]);

  // Dynamic crow text
  const crowDynamicText = useMemo(() => {
    const crowPlayerId = Object.entries(roleAssignments).find(([playerId, role]) => role === "v03" && !effectivelyDead.has(playerId))?.[0];
    if (!crowPlayerId) return undefined;

    const isCrowPoisoned = isPlayerActingPoisoned(crowPlayerId);
    const aliveEvilCount = alivePlayers.filter((p) => countsAsEvilBeing(p.id)).length;
    const illusionActive = [...illusionPlayerIds].some((playerId) => (
      !_permanentlyDeadPlayerIds.has(playerId) && countsAsEvilBeing(playerId)
    ));

    if (isCrowPoisoned) {
      const fakeCount = getGuaranteedWrongCount(aliveEvilCount);
      return dyn.crowReveal.replace("{n}", String(fakeCount));
    }

    if (illusionActive) {
      return dyn.crowConfused;
    }

    return dyn.crowReveal.replace("{n}", String(aliveEvilCount));
  }, [roleAssignments, effectivelyDead, alivePlayers, illusionPlayerIds, _permanentlyDeadPlayerIds, countsAsEvilBeing, dyn, isPlayerActingPoisoned]);

  // Dynamic rabbit tamer text
  const rabbitDynamicText = useMemo(() => {
    const rabbitPlayerId = Object.entries(roleAssignments).find(([playerId, role]) => role === "v05" && !effectivelyDead.has(playerId))?.[0];
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
    const wasTargeted = relevantIds.some((id) => nightTargetedPlayerIds.has(id));
    const isRabbitPoisoned = isPlayerActingPoisoned(rabbitPlayerId);

    if (isRabbitPoisoned) return wasTargeted ? `~~${dyn.rabbitNothing}~~` : dyn.rabbitHeard;

    const hasIllusionNeighbor = neighbors.some((n) => illusionPlayerIds.has(n.id));
    if (hasIllusionNeighbor) return dyn.rabbitConfused;

    if (wasTargeted) return dyn.rabbitHeard;

    return `~~${dyn.rabbitNothing}~~`;
  }, [roleAssignments, effectivelyDead, players, _permanentlyDeadPlayerIds, illusionPlayerIds, nightTargetedPlayerIds, dyn, isPlayerActingPoisoned]);

  const spiderConfusedText = useMemo(() => {
    const webbedPid = Object.entries(_playerEffects).find(([, e]) => e.has("webbed"))?.[0];
    if (webbedPid && illusionPlayerIds.has(webbedPid)) return t("spiderConfused", lang);
    return undefined;
  }, [_playerEffects, illusionPlayerIds, lang]);

  const getLivingNeighbors = (playerId: string) => {
    const sorted = players
      .filter((player) => player.seat_position !== null)
      .sort((a, b) => a.seat_position! - b.seat_position!);
    const playerIndex = sorted.findIndex((player) => player.id === playerId);
    if (playerIndex === -1) return [];
    const findNeighbor = (direction: 1 | -1) => {
      for (let distance = 1; distance < sorted.length; distance += 1) {
        const index = (playerIndex + direction * distance + sorted.length) % sorted.length;
        if (!_permanentlyDeadPlayerIds.has(sorted[index].id)) return sorted[index];
      }
      return null;
    };
    return [findNeighbor(-1), findNeighbor(1)].filter(Boolean) as typeof players;
  };

  const getDogDynamicText = (line: ScriptLine, dogPlayerId: string): string | undefined => {
    const role = line.requires?.length === 1 ? line.requires[0] : null;
    if (role === "v02") {
      const neighbors = getLivingNeighbors(dogPlayerId);
      const hasEvilNeighbor = neighbors.some((neighbor) => countsAsEvilBeing(neighbor.id));
      const hasIllusionNeighbor = neighbors.some((neighbor) => illusionPlayerIds.has(neighbor.id));
      if (isPlayerActingPoisoned(dogPlayerId)) return hasEvilNeighbor ? dyn.bearSilent : dyn.bearGrowl;
      if (hasIllusionNeighbor) return dyn.bearConfused;
      return hasEvilNeighbor ? dyn.bearGrowl : dyn.bearSilent;
    }
    if (role === "v03") {
      const aliveEvilCount = alivePlayers.filter((player) => countsAsEvilBeing(player.id)).length;
      if (isPlayerActingPoisoned(dogPlayerId)) {
        return dyn.crowReveal.replace("{n}", String(getGuaranteedWrongCount(aliveEvilCount)));
      }
      const illusionActive = [...illusionPlayerIds].some((playerId) => (
        !_permanentlyDeadPlayerIds.has(playerId) && countsAsEvilBeing(playerId)
      ));
      return illusionActive ? dyn.crowConfused : dyn.crowReveal.replace("{n}", String(aliveEvilCount));
    }
    if (role === "v05") {
      const neighbors = getLivingNeighbors(dogPlayerId);
      const relevantIds = [dogPlayerId, ...neighbors.map((neighbor) => neighbor.id)];
      const wasTargeted = relevantIds.some((playerId) => nightTargetedPlayerIds.has(playerId));
      if (isPlayerActingPoisoned(dogPlayerId)) return wasTargeted ? `~~${dyn.rabbitNothing}~~` : dyn.rabbitHeard;
      if (neighbors.some((neighbor) => illusionPlayerIds.has(neighbor.id))) return dyn.rabbitConfused;
      return wasTargeted ? dyn.rabbitHeard : `~~${dyn.rabbitNothing}~~`;
    }
    if (role === "v20") {
      const sorted = players
        .filter((player) => player.seat_position !== null && !_permanentlyDeadPlayerIds.has(player.id))
        .sort((a, b) => a.seat_position! - b.seat_position!);
      const dogIndex = sorted.findIndex((player) => player.id === dogPlayerId);
      let distance: number | null = null;
      if (isPlayerActingPoisoned(dogPlayerId)) {
        distance = Math.floor(Math.random() * Math.max(1, Math.floor(sorted.length / 2))) + 1;
      } else if (dogIndex !== -1) {
        const distances = sorted.flatMap((player, poisonIndex) => {
          if (!poisonedPlayerIds.has(player.id)) return [];
          const difference = Math.abs(dogIndex - poisonIndex);
          return [Math.min(difference, sorted.length - difference)];
        });
        if (distances.length > 0) distance = Math.min(...distances);
      }
      if (distance === null) return undefined;
      const baseLine = lang === "fr"
        ? "Le {Chien} se réveille et la distance jusqu'à la personne empoisonnée lui est révélée"
        : "O {Cão} acorda e é-lhe revelada a distância até à pessoa envenenada";
      return `${baseLine}: ${distance}`;
    }
    return undefined;
  };

  const getDynamicText = (line: ScriptLine, sourcePlayerId?: string | null, dogWolfLine = false): string | undefined => {
    if (dogWolfLine && sourcePlayerId) {
      const dogText = getDogDynamicText(line, sourcePlayerId);
      if (dogText) return dogText;
    }
    if (line.requires?.length === 1 && line.requires[0] === "v02") return bearDynamicText;
    if (line.requires?.length === 1 && line.requires[0] === "v03") return crowDynamicText;
    if (line.requires?.length === 1 && line.requires[0] === "v05") return rabbitDynamicText;
    if (line.requires?.length === 1 && line.requires[0] === "v20") return empregadaDynamicText;
    if (line.requires?.length === 1 && line.requires[0] === "s02" && line.conditionKey === "whitewolfNight" && conditionKeys.whitewolfSolo) {
      return dyn.whiteWolfSoloKill;
    }
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
    if (l.requires?.length === 1 && l.requires[0] === ("v04" as RoleId) && foxDisabled) {
      const nestedActorFoxIsAvailable = actorCopiedRole === "a01"
        && drunkardReplacementRole === "v04"
        && !actorPowerState.foxDisabled;
      if (!nestedActorFoxIsAvailable) return false;
    }
    if (l.requires?.length === 1 && l.requires[0] === ("as01b" as RoleId) && !l.conditionKey) {
      const amanteId = Object.entries(roleAssignments).find(([, role]) => role === "as01b")?.[0];
      if (amanteId && _playerEffects[amanteId]?.has("namorado")) return false;
    }
    return true;
  }, [activeRoles, permanentlyDeadRoles, roleAssignments, effectivelyDead, conditionKeys, chamanCharges, shouldShowVidenteLine, foxDisabled, profeciaGhostPlayerIds, _playerEffects, actorCopiedRole, actorPowerState.foxDisabled, drunkardReplacementRole]);

  const localizedScripts = useMemo(() => getScripts(lang), [lang]);
  // A remounted script must not replay an action from the previous night.
  const processedAutoCompleteVersion = useRef(autoCompleteVersion);
  const sectionLabels = useMemo(() => ({
    first: t("firstNight", lang),
    secondStart: t("secondNightStart", lang),
    night: t("night", lang),
  }), [lang]);

  const scriptLines = useMemo(() => {
    const lines: { section: string; items: ScriptRenderItem[] }[] = [];
    const makeItems = (
      source: "first" | "second" | "normal",
      sourceLines: ScriptLine[],
      predicate: (line: ScriptLine) => boolean,
    ) => sourceLines.flatMap((line, index) => {
      const items: ScriptRenderItem[] = [];
      const progressOrder = source === "normal" ? index : null;
      const isDogWolfChoiceLine = line.requires?.length === 1 && line.requires[0] === "a02";
      if (isDogWolfChoiceLine) {
        if (!predicate(line)) return items;
        return dogWolfPlayerIds
          .filter((dogPlayerId) => !_permanentlyDeadPlayerIds.has(dogPlayerId))
          .filter((dogPlayerId) => !dogWolfStates[dogPlayerId]?.ownerPlayerId)
          .map((sourcePlayerId) => ({
            line,
            key: `${nightNumber}:${source}:${index}:dog-choice:${sourcePlayerId}`,
            progressOrder,
            sourcePlayerId,
          }));
      }
      const deathSourcePlayerIds = line.conditionKey ? deathTriggeredSourcePlayerIds[line.conditionKey] ?? [] : [];
      const isDeathOwnedLine = line.conditionKey === "cacadorDied" || line.conditionKey === "soldadoDied";
      if (isDeathOwnedLine && predicate(line) && deathSourcePlayerIds.length > 0) {
        return deathSourcePlayerIds.map((sourcePlayerId) => ({
          line,
          key: `${nightNumber}:${source}:${index}:death:${sourcePlayerId}`,
          progressOrder,
          sourcePlayerId,
          actorLine: line.conditionKey === "cacadorDied" && sourcePlayerId === actorPlayerId && actorCopiedRole === "v08",
          replaceAllRoleTokens: line.conditionKey === "cacadorDied" && sourcePlayerId === actorPlayerId && actorCopiedRole === "v08",
          dogWolfLine: dogWolfPlayerIds.includes(sourcePlayerId),
          dogWolfActingPoisoned: dogWolfPlayerIds.includes(sourcePlayerId)
            ? isPlayerActingPoisoned(sourcePlayerId)
            : undefined,
        }));
      }
      const isCopiedRoleLine = !!actorCopiedRole && !!actorPlayerId && line.requires?.includes(actorCopiedRole);
      const actorCanPerform = !!actorPlayerId
        && (!_permanentlyDeadPlayerIds.has(actorPlayerId) || profeciaGhostPlayerIds.has(actorPlayerId));
      const isSharedCopiedRoleLine = isCopiedRoleLine && actorCanPerform && (line.requires?.length ?? 0) > 1;
      const originalRolePlayerId = actorCopiedRole ? Object.entries(baseRoleAssignments)
        .find(([playerId, role]) => playerId !== actorPlayerId
          && role === actorCopiedRole
          && (!effectivelyDead.has(playerId) || profeciaGhostPlayerIds.has(playerId)))?.[0] : undefined;
      const hasOriginalRolePlayer = !!originalRolePlayerId;
      const isDrunkardRoleLine = !!drunkardReplacementRole
        && drunkardMechanicPlayerIds.size > 0
        && line.requires?.includes(drunkardReplacementRole);
      const activeDrunkardPlayerIds = [...drunkardMechanicPlayerIds].filter((playerId) => (
        !_permanentlyDeadPlayerIds.has(playerId) || profeciaGhostPlayerIds.has(playerId)
      )).filter((playerId) => !dogWolfPlayerIds.includes(playerId)).filter((playerId) => !(
        playerId === actorPlayerId
        && drunkardReplacementRole === "v04"
        && actorPowerState.foxDisabled
      ));
      const hasOriginalDrunkardRolePlayer = !!drunkardReplacementRole && Object.entries(baseRoleAssignments)
        .some(([playerId, role]) => !drunkardMechanicPlayerIds.has(playerId)
          && role === drunkardReplacementRole
          && (!effectivelyDead.has(playerId) || profeciaGhostPlayerIds.has(playerId)));
      const actorAllowsStandardLine = !isCopiedRoleLine || hasOriginalRolePlayer || isSharedCopiedRoleLine;
      const drunkardAllowsStandardLine = !isDrunkardRoleLine || hasOriginalDrunkardRolePlayer;

      if (predicate(line) && actorAllowsStandardLine && drunkardAllowsStandardLine) {
        const standardSourcePlayerId = line.requires?.length === 1
          ? Object.entries(roleAssignments).find(([, role]) => role === line.requires?.[0])?.[0]
          : undefined;
        const sourceHasCaught = line.conditionKey !== "spiderHasCaught"
          || !standardSourcePlayerId
          || (spiderCaughtBySource[standardSourcePlayerId]?.length ?? 0) > 0;
        if (sourceHasCaught) {
          items.push({
            line,
            key: `${nightNumber}:${source}:${index}`,
            progressOrder,
            actorJoins: isSharedCopiedRoleLine,
            sourcePlayerId: isCopiedRoleLine && line.requires?.length === 1 ? originalRolePlayerId : standardSourcePlayerId,
            actingPoisoned: standardSourcePlayerId ? isPlayerActingPoisoned(standardSourcePlayerId) : undefined,
          });
        }
      }

      if (isCopiedRoleLine && !isSharedCopiedRoleLine && actorCanPerform) {
        const conditionMatches = (!line.conditionKey || !!conditionKeys[line.conditionKey])
          && (line.conditionKey !== "spiderHasCaught" || (spiderCaughtBySource[actorPlayerId]?.length ?? 0) > 0);
        const actorHasCharges = !(line.requires?.length === 1 && line.requires[0] === "e03" && actorPowerState.chamanCharges >= 2);
        const actorFoxEnabled = !(line.requires?.length === 1 && line.requires[0] === "v04" && actorPowerState.foxDisabled);
        const actorVidenteVisible = !(line.requires?.length === 1 && line.requires[0] === "e04" && !shouldShowVidenteLine);
        if (conditionMatches && actorHasCharges && actorFoxEnabled && actorVidenteVisible) {
          items.push({
            line,
            key: `${nightNumber}:${source}:${index}:actor`,
            progressOrder,
            actorLine: true,
          });
        }
      }

      if (isDrunkardRoleLine && activeDrunkardPlayerIds.length > 0 && predicate(line)) {
        activeDrunkardPlayerIds.forEach((sourcePlayerId) => {
          items.push({
            line,
            key: `${nightNumber}:${source}:${index}:drunkard:${sourcePlayerId}`,
            progressOrder,
            sourcePlayerId,
            actorLine: sourcePlayerId === actorPlayerId && actorCopiedRole === "a01",
            drunkardLine: true,
            drunkardActingPoisoned: isDrunkardActingPoisoned(
              sourcePlayerId,
              drunkardMechanicPlayerIds,
              poisonedPlayerIds,
            ),
          });
        });
      }

      const dogPlayerIdsForLine = dogWolfPlayerIds.filter((dogPlayerId) => {
        if (_permanentlyDeadPlayerIds.has(dogPlayerId) && !profeciaGhostPlayerIds.has(dogPlayerId)) return false;
        const ownerPlayerId = dogWolfStates[dogPlayerId]?.ownerPlayerId;
        if (!ownerPlayerId) return false;
        if (_permanentlyDeadPlayerIds.has(ownerPlayerId) && !dogWolfStates[dogPlayerId]?.actorModeActive) return false;
        const abilityRole = abilityRoleAssignments[dogPlayerId];
        if (!abilityRole || !line.requires?.includes(abilityRole)) return false;
        if (line.conditionKey === "enemyDied" && abilityRole === "m05") {
          const enemyDied = (dogWolfStates[dogPlayerId]?.enemyPlayerIds ?? [])
            .some((playerId) => _permanentlyDeadPlayerIds.has(playerId));
          if (!enemyDied) return false;
        } else if (line.conditionKey && !conditionKeys[line.conditionKey]) return false;
        if (line.conditionKey === "spiderHasCaught" && (spiderCaughtBySource[dogPlayerId]?.length ?? 0) === 0) return false;
        const powerState = independentPowerStates[dogPlayerId];
        if (abilityRole === "e03" && (powerState?.chamanCharges ?? 0) >= 2) return false;
        if (abilityRole === "v04" && powerState?.foxDisabled) return false;
        return true;
      });
      dogPlayerIdsForLine.forEach((sourcePlayerId) => {
        items.push({
          line,
          key: `${nightNumber}:${source}:${index}:dog:${sourcePlayerId}`,
          progressOrder,
          sourcePlayerId,
          dogWolfLine: true,
          dogWolfStandalone: !!dogWolfStates[sourcePlayerId]?.actorModeActive || abilityRoleAssignments[sourcePlayerId] === "m05",
          dogWolfActingPoisoned: isPlayerActingPoisoned(sourcePlayerId),
        });
      });

      return items;
    });

    const addDogEvilCupidSetupLines = (items: ScriptRenderItem[]) => {
      const setupLine = localizedScripts.firstNight.find((line) => line.requires?.length === 1 && line.requires[0] === "m05");
      if (!setupLine) return;
      dogWolfPlayerIds.forEach((dogPlayerId) => {
        if (_permanentlyDeadPlayerIds.has(dogPlayerId) || abilityRoleAssignments[dogPlayerId] !== "m05") return;
        const livingEnemyCount = (dogWolfStates[dogPlayerId]?.enemyPlayerIds ?? [])
          .filter((playerId) => !_permanentlyDeadPlayerIds.has(playerId)).length;
        if (livingEnemyCount >= 2) return;
        const hasDeadEnemy = (dogWolfStates[dogPlayerId]?.enemyPlayerIds ?? [])
          .some((playerId) => _permanentlyDeadPlayerIds.has(playerId));
        if (hasDeadEnemy) return;
        items.unshift({
          line: setupLine,
          key: `${nightNumber}:normal:dog-evil-cupid-setup:${dogPlayerId}`,
          progressOrder: null,
          sourcePlayerId: dogPlayerId,
          dogWolfLine: true,
          dogWolfStandalone: true,
          dogWolfActingPoisoned: isPlayerActingPoisoned(dogPlayerId),
        });
      });
    };

    if (nightNumber === 1) {
      const filtered = makeItems("first", localizedScripts.firstNight, (line) => isLineRelevant(line, activeRoles, permanentlyDeadRoles, roleAssignments, _permanentlyDeadPlayerIds, profeciaGhostPlayerIds));
      if (filtered.length > 0) lines.push({ section: sectionLabels.first, items: filtered });
    } else if (nightNumber === 2) {
      const filtered2 = makeItems("second", localizedScripts.secondNight, (line) => isLineRelevant(line, activeRoles, permanentlyDeadRoles, roleAssignments, _permanentlyDeadPlayerIds, profeciaGhostPlayerIds));
      if (filtered2.length > 0) lines.push({ section: sectionLabels.secondStart, items: filtered2 });
      const filteredNormal = makeItems("normal", localizedScripts.normalNight, filterLine);
      addDogEvilCupidSetupLines(filteredNormal);
      if (actorCopiedRole && actorPlayerId && actorCopyNoticeNight === nightNumber && (actorCopiedRole === "v08" || !filteredNormal.some((item) => item.actorLine || item.actorJoins))) {
        const actorNoticeLine = localizedScripts.normalNight.find((line) => line.requires?.length === 1 && line.requires[0] === "a04");
        if (actorNoticeLine) filteredNormal.unshift({ line: actorNoticeLine, key: `${nightNumber}:normal:actor-notice`, progressOrder: null, actorNotice: true });
      }
      if (filteredNormal.length > 0) lines.push({ section: sectionLabels.night, items: filteredNormal });
    } else {
      const filteredNormal = makeItems("normal", localizedScripts.normalNight, filterLine);
      addDogEvilCupidSetupLines(filteredNormal);
      if (actorCopiedRole && actorPlayerId && actorCopyNoticeNight === nightNumber && (actorCopiedRole === "v08" || !filteredNormal.some((item) => item.actorLine || item.actorJoins))) {
        const actorNoticeLine = localizedScripts.normalNight.find((line) => line.requires?.length === 1 && line.requires[0] === "a04");
        if (actorNoticeLine) filteredNormal.unshift({ line: actorNoticeLine, key: `${nightNumber}:normal:actor-notice`, progressOrder: null, actorNotice: true });
      }
      const pendingDogPlayerIds = dogWolfPlayerIds.filter((dogPlayerId) => (
        !_permanentlyDeadPlayerIds.has(dogPlayerId) && !dogWolfStates[dogPlayerId]?.ownerPlayerId
      ));
      if (pendingDogPlayerIds.length > 0) {
        const dogChoiceLine = localizedScripts.secondNight.find((line) => line.requires?.length === 1 && line.requires[0] === "a02");
        if (dogChoiceLine) {
          pendingDogPlayerIds.forEach((sourcePlayerId) => filteredNormal.unshift({
            line: dogChoiceLine,
            key: `${nightNumber}:normal:dog-choice:${sourcePlayerId}`,
            progressOrder: null,
            sourcePlayerId,
          }));
        }
      }
      if (filteredNormal.length > 0) lines.push({ section: `${sectionLabels.night} ${nightNumber}`, items: filteredNormal });
    }

    return lines;
  }, [nightNumber, activeRoles, permanentlyDeadRoles, filterLine, roleAssignments, effectivelyDead, _permanentlyDeadPlayerIds, profeciaGhostPlayerIds, localizedScripts, sectionLabels, actorCopiedRole, actorPlayerId, actorCopyNoticeNight, actorPowerState.chamanCharges, actorPowerState.foxDisabled, baseRoleAssignments, conditionKeys, shouldShowVidenteLine, deathTriggeredSourcePlayerIds, drunkardMechanicPlayerIds, drunkardReplacementRole, poisonedPlayerIds, dogWolfPlayerIds, dogWolfStates, abilityRoleAssignments, independentPowerStates, isPlayerActingPoisoned, spiderCaughtBySource]);

  useEffect(() => {
    if (!onScriptRolesVisible) return;
    const visibleRoles = new Set<RoleId>();
    for (const section of scriptLines) {
      for (const item of section.items) {
        item.line.requires?.forEach((role) => visibleRoles.add(role));
      }
    }
    onScriptRolesVisible(Array.from(visibleRoles));
  }, [onScriptRolesVisible, scriptLines]);

  useEffect(() => {
    if (!autoCompleteRole || autoCompleteVersion <= processedAutoCompleteVersion.current || !onLineCompletedChange) return;
    processedAutoCompleteVersion.current = autoCompleteVersion;
    const candidates = scriptLines
      .flatMap((section) => section.items)
      .filter((candidate) => candidate.line.requires?.includes(autoCompleteRole) && !completedLineKeys.has(candidate.key));
    const matchingItems = autoCompleteSourcePlayerIds.length > 0
      ? candidates.filter((candidate) => (
        (candidate.sourcePlayerId && autoCompleteSourcePlayerIds.includes(candidate.sourcePlayerId))
        || (!candidate.sourcePlayerId && !candidate.dogWolfLine)
      ))
      : candidates.slice(0, 1);
    matchingItems.forEach((item) => onLineCompletedChange(item.key, true, item.progressOrder));
  }, [autoCompleteRole, autoCompleteSourcePlayerIds, autoCompleteVersion, completedLineKeys, onLineCompletedChange, scriptLines]);

  const setActorNumericCharge = useCallback((key: keyof ActorPowerState, index: number) => {
    if (!onActorPowerStateChange) return;
    const current = actorPowerState[key];
    if (typeof current !== "number") return;
    onActorPowerStateChange({ ...actorPowerState, [key]: current > index ? index : index + 1 });
  }, [actorPowerState, onActorPowerStateChange]);

  const toggleActorBoolean = useCallback((key: keyof ActorPowerState) => {
    if (!onActorPowerStateChange) return;
    const current = actorPowerState[key];
    if (typeof current !== "boolean") return;
    onActorPowerStateChange({ ...actorPowerState, [key]: !current });
  }, [actorPowerState, onActorPowerStateChange]);

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
            {section.items.map((item) => {
              const lineRole = item.line.requires?.length === 1 ? item.line.requires[0] : null;
              const sourcePlayerId = item.sourcePlayerId ?? (item.actorLine
                ? actorPlayerId
                : lineRole
                ? Object.entries(baseRoleAssignments).find(([, role]) => role === lineRole)?.[0] ?? null
                : null);
              const independentPowerState = sourcePlayerId ? independentPowerStates[sourcePlayerId] : undefined;
              const usesIndependentPowerState = !!independentPowerState || !!item.actorLine
                || (!!item.drunkardLine && sourcePlayerId === actorPlayerId);
              const powerState = independentPowerState ?? actorPowerState;
              const setNumericCharge = (key: keyof ActorPowerState, index: number) => {
                const current = powerState[key];
                if (typeof current !== "number") return;
                const next = { ...powerState, [key]: current > index ? index : index + 1 };
                if (sourcePlayerId && onIndependentPowerStateChange) onIndependentPowerStateChange(sourcePlayerId, next);
                else setActorNumericCharge(key, index);
              };
              const toggleBoolean = (key: keyof ActorPowerState) => {
                const current = powerState[key];
                if (typeof current !== "boolean") return;
                const next = { ...powerState, [key]: !current };
                if (sourcePlayerId && onIndependentPowerStateChange) onIndependentPowerStateChange(sourcePlayerId, next);
                else toggleActorBoolean(key);
              };
              return (
              <ScriptLineDisplay
                key={item.key}
                line={item.line}
                poisonedRoles={poisonedRoles}
                poisonedPlayerId={poisonedPlayerId}
                roleAssignments={roleAssignments}
                chamanCharges={usesIndependentPowerState ? powerState.chamanCharges : chamanCharges}
                onChamanChargeToggle={usesIndependentPowerState ? (idx) => setNumericCharge("chamanCharges", idx) : onChamanChargeToggle}
                isWerewolfLinePoisoned={isWerewolfLinePoisoned}
                lastNightDeadPlayerIds={lastNightDeadPlayerIds}
                onVidenteReveal={onVidenteReveal}
                onMeninaReveal={onMeninaReveal}
                onFaroleiroReveal={onFaroleiroReveal}
                onLobisomemVidenteReveal={onLobisomemVidenteReveal}
                dynamicText={getDynamicText(item.line, sourcePlayerId, !!item.dogWolfLine)}
                foxDisabled={usesIndependentPowerState ? powerState.foxDisabled : foxDisabled}
                onFoxDisabledToggle={usesIndependentPowerState ? () => toggleBoolean("foxDisabled") : onFoxDisabledToggle}
                showFoxCheckbox={nightNumber > 1}
                forceStrikethrough={item.dogWolfLine && sourcePlayerId
                  ? !!(_playerEffects[sourcePlayerId]?.has("hospede") || _playerEffects[sourcePlayerId]?.has("incendiado"))
                  : isLineForcedStrikethrough(item.line)}
                paranoicoCharges={usesIndependentPowerState ? powerState.paranoicoCharges : paranoicoCharges}
                onParanoicoChargeToggle={usesIndependentPowerState ? (idx) => setNumericCharge("paranoicoCharges", idx) : onParanoicoChargeToggle}
                anjoCharges={usesIndependentPowerState ? powerState.anjoCharges : anjoCharges}
                onAnjoChargeToggle={usesIndependentPowerState ? (idx) => setNumericCharge("anjoCharges", idx) : onAnjoChargeToggle}
                lobisomemMauCharges={usesIndependentPowerState ? powerState.lobisomemMauCharges : lobisomemMauCharges}
                onLobisomemMauChargeToggle={usesIndependentPowerState ? (idx) => setNumericCharge("lobisomemMauCharges", idx) : onLobisomemMauChargeToggle}
                cupidoCharges={usesIndependentPowerState ? powerState.cupidoCharges : cupidoCharges}
                onCupidoChargeToggle={usesIndependentPowerState ? (idx) => setNumericCharge("cupidoCharges", idx) : onCupidoChargeToggle}
                showCupidoCheckboxes={nightNumber > 1}
                lobisomemVampiroUsed={usesIndependentPowerState ? powerState.lobisomemVampiroUsed : lobisomemVampiroUsed}
                onLobisomemVampiroToggle={usesIndependentPowerState ? () => toggleBoolean("lobisomemVampiroUsed") : onLobisomemVampiroToggle}
                juizCharges={usesIndependentPowerState ? powerState.juizCharges : juizCharges}
                onJuizChargeToggle={usesIndependentPowerState ? (idx) => setNumericCharge("juizCharges", idx) : onJuizChargeToggle}
                acusadorCharges={usesIndependentPowerState ? powerState.acusadorCharges : acusadorCharges}
                onAcusadorChargeToggle={usesIndependentPowerState ? (idx) => setNumericCharge("acusadorCharges", idx) : onAcusadorChargeToggle}
                onSpiderReveal={onSpiderReveal}
                onSpyReveal={onSpyReveal}
                werewolvesAsleepText={dyn.werewolvesAsleep}
                lineCompleted={completedLineKeys.has(item.key)}
                onLineCompletedChange={(completed) => onLineCompletedChange?.(item.key, completed, item.progressOrder)}
                actorLine={item.actorLine}
                replaceAllRoleTokens={item.replaceAllRoleTokens}
                actorCopiedRole={actorCopiedRole}
                sourcePlayerId={sourcePlayerId}
                disableDrag={item.actorNotice || (!!item.dogWolfLine && !!sourcePlayerId && (
                  abilityRoleAssignments[sourcePlayerId] === "s01"
                  || (abilityRoleAssignments[sourcePlayerId] === "a04" && (
                    (dogWolfStates[sourcePlayerId]?.actorIdolUses ?? 0) >= 2
                    || !!dogWolfStates[sourcePlayerId]?.independentRole
                  ))
                ))}
                actorJoins={item.actorJoins}
                drunkardLine={item.drunkardLine}
                drunkardActingPoisoned={item.drunkardActingPoisoned}
                dogWolfLine={item.dogWolfLine}
                dogWolfStandalone={item.dogWolfStandalone}
                dogWolfCopiedRole={item.dogWolfLine && sourcePlayerId ? abilityRoleAssignments[sourcePlayerId] : null}
                dogWolfActingPoisoned={item.dogWolfActingPoisoned}
                actingPoisoned={item.actingPoisoned}
              />
              );
            })}
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
