import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { EVIL_ROLES, ROLES, WEREWOLF_ROLES, type RoleId } from "@/lib/roles";
import { useRoleLabel, useT, useLanguage, getEffectLabel, getToast } from "@/lib/i18n";
import { resolveRoleImage } from "@/lib/skinPacks";
import { useSkinPack } from "@/lib/skinPackContext";
import { PlayerStatusPopover, type PlayerStatus, type StatusEffect, STATUS_EFFECT_ICONS } from "./PlayerStatusPopover";
import poisonedIcon from "@/assets/icons/poisoned.png";
import illusionIcon from "@/assets/icons/illusion.png";
import imunityIcon from "@/assets/icons/imunity_full.png";
import immunityWerewolfIcon from "@/assets/icons/imunity_werewolf.png";
import { toast } from "sonner";
import type { ActorPowerState } from "@/lib/actor";
import type { DogWolfStates } from "@/lib/dogWolf";

type Player = {
  id: string;
  name: string;
  seat_position: number | null;
  character: string | null;
  is_alive: boolean;
};

const POISON_DRAG_ROLE: RoleId = "e02";
const KILL_DRAG_ROLE: RoleId = "e01";
const SHAMAN_ROLE: RoleId = "e03";
const ILLUSION_DRAG_ROLE: RoleId = "a06";
const ROLE_DRAG_ACTIONS: Partial<Record<RoleId, string>> = {
  v19: "role-v19",
  v22: "role-v22",
  v16: "role-v16",
  v17: "role-v17",
  v24: "role-v24",
  m06: "kill",
  v09: "role-v09",
  v11: "role-v11",
  v12: "role-v12",
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
  l06: "role-l06",
};

interface PlayerCircleProps {
  players: Player[];
  totalSlots: number;
  onDropPlayer: (playerId: string, position: number | null) => void;
  isGM?: boolean;
  roleAssignments?: Record<string, RoleId>;
  abilityRoleAssignments?: Record<string, RoleId>;
  baseRoleAssignments?: Record<string, RoleId>;
  objectiveRoleAssignments?: Record<string, RoleId>;
  playerStatuses?: Record<string, PlayerStatus>;
  permanentlyDead?: Set<string>;
  onPlayerStatusChange?: (playerId: string, status: PlayerStatus, source?: string) => void;
  isPlaying?: boolean;
  poisonedPlayerId?: string | null;
  poisonedPlayerIds?: Set<string>;
  actingPoisonedPlayerIds?: Set<string>;
  werewolfPackPoisoned?: boolean;
  illusionPlayerId?: string | null;
  illusionPlayerIds?: Set<string>;
  onSetIllusion?: (playerId: string) => void;
  isWitchPermaDead?: boolean;
  isPuppeteer?: boolean;
  shamanCharges?: number;
  onShamanChargeToggle?: (index: number) => void;
  onShamanDrop?: (targetPlayerId: string) => void;
  isWitchPoisoned?: boolean;
  compact?: boolean;
  foxDisabled?: boolean;
  onFoxDisabledToggle?: () => void;
  showFoxCheckbox?: boolean;
  judgeCharges?: number;
  onJudgeChargeToggle?: (idx: number) => void;
  accuserCharges?: number;
  onAccuserChargeToggle?: (idx: number) => void;
  bigBadWolfCharges?: number;
  onBigBadWolfChargeToggle?: (idx: number) => void;
  cupidCharges?: number;
  onCupidChargeToggle?: (idx: number) => void;
  showCupidCheckboxes?: boolean;
  spiderDayChangeUsed?: boolean;
  onSpiderDayChangeToggle?: () => void;
  vampireWolfUsed?: boolean;
  onVampireWolfToggle?: () => void;
  vampireVictimKeepsPower?: boolean;
  onVampireVictimToggle?: () => void;
  playerEffects?: Record<string, Set<StatusEffect>>;
  gameCyclePhase?: "night" | "day" | "tribunal";
  availableEffects?: (playerId: string) => StatusEffect[];
  onToggleEffect?: (playerId: string, effect: StatusEffect) => void;
  onExecute?: (playerId: string) => void;
  onDragAction?: (action: string, targetPlayerId: string, sourcePlayerId?: string | null) => void;
  hideSensitiveInfo?: boolean;
  onPlayerClick?: (playerId: string) => void;
  selectedPlayerId?: string | null;
  actorIdolUses?: number;
  actorCopyActive?: boolean;
  actorCopiesDrunkard?: boolean;
  onActorIdolUseToggle?: (idx: number) => void;
  actorPowerState?: ActorPowerState;
  onActorPowerStateChange?: (state: ActorPowerState) => void;
  independentPowerStates?: Record<string, ActorPowerState>;
  onIndependentPowerStateChange?: (playerId: string, state: ActorPowerState) => void;
  dogWolfOwnerRoles?: Record<string, RoleId>;
  dogWolfStates?: DogWolfStates;
  onDogActorIdolUseToggle?: (playerId: string, index: number) => void;
  allowFlexibleRoleSkins?: boolean;
}

export const PlayerCircle = ({
  players,
  totalSlots,
  onDropPlayer,
  isGM,
  roleAssignments,
  abilityRoleAssignments,
  baseRoleAssignments,
  objectiveRoleAssignments,
  playerStatuses = {},
  permanentlyDead = new Set(),
  onPlayerStatusChange,
  isPlaying,
  poisonedPlayerId,
  poisonedPlayerIds = poisonedPlayerId ? new Set([poisonedPlayerId]) : new Set(),
  actingPoisonedPlayerIds = poisonedPlayerIds,
  werewolfPackPoisoned = false,
  illusionPlayerId,
  illusionPlayerIds = illusionPlayerId ? new Set([illusionPlayerId]) : new Set(),
  onSetIllusion,
  isWitchPermaDead = false,
  isPuppeteer = false,
  shamanCharges = 0,
  onShamanChargeToggle,
  onShamanDrop,
  isWitchPoisoned = false,
  compact = false,
  foxDisabled = false,
  onFoxDisabledToggle,
  showFoxCheckbox = true,
  judgeCharges = 0,
  onJudgeChargeToggle,
  accuserCharges = 0,
  onAccuserChargeToggle,
  bigBadWolfCharges = 0,
  onBigBadWolfChargeToggle,
  cupidCharges = 0,
  onCupidChargeToggle,
  showCupidCheckboxes = true,
  spiderDayChangeUsed = false,
  onSpiderDayChangeToggle,
  vampireWolfUsed = false,
  onVampireWolfToggle,
  vampireVictimKeepsPower = true,
  onVampireVictimToggle,
  playerEffects: _playerEffects = {},
  gameCyclePhase = "night",
  availableEffects: _availableEffects,
  onToggleEffect: _onToggleEffect,
  onExecute: _onExecute,
  onDragAction,
  hideSensitiveInfo = false,
  onPlayerClick,
  selectedPlayerId = null,
  actorIdolUses = 0,
  actorCopyActive = false,
  actorCopiesDrunkard = false,
  onActorIdolUseToggle,
  actorPowerState,
  onActorPowerStateChange,
  independentPowerStates = {},
  onIndependentPowerStateChange,
  dogWolfOwnerRoles = {},
  dogWolfStates = {},
  onDogActorIdolUseToggle,
  allowFlexibleRoleSkins = true,
}: PlayerCircleProps) => {
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const roleLabel = useRoleLabel();
  const t = useT();
  const lang = useLanguage();
  const { skinPackId } = useSkinPack();
  const seatedPlayers = players.filter((p) => p.seat_position !== null);

  const scale = compact ? 0.65 : 1;
  const baseSize = Math.min(260, 80 + totalSlots * 12);
  const radiusX = Math.min(520, baseSize * 2.0) * scale;
  const radiusY = Math.min(280, baseSize * 0.95) * scale;

  const isShamanPoisoned = useMemo(() => {
    const assignments = abilityRoleAssignments ?? roleAssignments;
    if (!assignments) return false;
    return Object.entries(assignments)
      .some(([playerId, role]) => role === SHAMAN_ROLE && actingPoisonedPlayerIds.has(playerId));
  }, [abilityRoleAssignments, actingPoisonedPlayerIds, roleAssignments]);

  const handleDrop = (e: React.DragEvent, position: number) => {
    e.preventDefault();
    const action = e.dataTransfer.getData("action");
    const sourcePlayerId = e.dataTransfer.getData("sourcePlayerId") || null;
    if (action && isPlaying && onPlayerStatusChange) {
      const seated = seatedPlayers.find((p) => p.seat_position === position);
      if (!seated) return;
      if (onDragAction) {
        onDragAction(action, seated.id, sourcePlayerId);
        return;
      }

      if (action === "poison") {
        onPlayerStatusChange(seated.id, "poisoned");
        onDragAction?.("__catch__", seated.id, sourcePlayerId);
      } else if (action === "kill") {
        onPlayerStatusChange(seated.id, "dead-this-night", "e01");
        onDragAction?.("__catch__", seated.id, sourcePlayerId);
      } else if (action === "shaman") {
        if (isShamanPoisoned) {
          toast.warning(getToast("warnShamanPoisoned", lang));
          return;
        }
        onShamanDrop?.(seated.id);
        onDragAction?.("__catch__", seated.id, sourcePlayerId);
      } else if (action === "illusion") {
        if (onDragAction) onDragAction(action, seated.id, sourcePlayerId);
        else onSetIllusion?.(seated.id);
      } else {
        // Generic drag-drop action
        onDragAction?.(action, seated.id, sourcePlayerId);
      }
      return;
    }
    const playerId = e.dataTransfer.getData("playerId");
    if (playerId) {
      const existing = seatedPlayers.find((p) => p.seat_position === position);
      if (existing) onDropPlayer(existing.id, null);
      onDropPlayer(playerId, position);
    }
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleUnseat = (playerId: string) => {
    if (!roleAssignments) onDropPlayer(playerId, null);
  };

  const containerW = radiusX * 2 + 140;
  const containerH = radiusY * 2 + 160;

  const getStatusClasses = (playerId: string) => {
    if (hideSensitiveInfo) return permanentlyDead.has(playerId) ? "grayscale opacity-50" : "";
    const status = playerStatuses[playerId];
    const isPDead = permanentlyDead.has(playerId);
    const effects = _playerEffects[playerId] || new Set<StatusEffect>();
    if (isPDead) return "grayscale opacity-50";
    if (getDefaultObjectiveEffects(playerId).length > 0) return ""; // handled by glow
    if (effects.has("werewolf_turned")) return ""; // handled by glow
    if (effects.has("evil_being")) return ""; // handled by glow
    if (poisonedPlayerIds.has(playerId)) return "ring-2 ring-green-500";
    if (illusionPlayerIds.has(playerId)) return "ring-2 ring-purple-500";
    return "";
  };

  const getBorderClass = (playerId: string) => {
    if (hideSensitiveInfo) return "border-primary/40";
    const status = playerStatuses[playerId];
    const effects = _playerEffects[playerId] || new Set<StatusEffect>();
    if (effects.has("incendiado")) return "border-orange-500";
    if (illusionPlayerIds.has(playerId)) return "border-purple-500";
    if (poisonedPlayerIds.has(playerId)) return "border-green-500";
    if (status === "dead-this-night") return "border-destructive";
    return "border-primary/40";
  };

  const getGlowStyle = (playerId: string): React.CSSProperties => {
    if (hideSensitiveInfo) return {};
    const effects = _playerEffects[playerId] || new Set<StatusEffect>();
    if (getDefaultObjectiveEffects(playerId).length > 0 || effects.has("werewolf_turned") || effects.has("evil_being")) {
      return { boxShadow: "0 0 12px 3px rgba(239,68,68,0.5)" };
    }
    return {};
  };

  const getDefaultObjectiveEffects = (playerId: string): StatusEffect[] => {
    if (hideSensitiveInfo) return [];
    const objectiveRole = objectiveRoleAssignments?.[playerId]
      ?? baseRoleAssignments?.[playerId]
      ?? roleAssignments?.[playerId];
    if (!objectiveRole) return [];
    if (WEREWOLF_ROLES.includes(objectiveRole)) return ["werewolf_turned"];
    if (EVIL_ROLES.includes(objectiveRole)) return ["evil_being"];
    return [];
  };

  const getRoleImage = (roleId: RoleId, playerId?: string): string => resolveRoleImage(roleId, {
    skinPackId,
    flexible: playerId && allowFlexibleRoleSkins && !hideSensitiveInfo
      ? {
        objectiveRoleId: objectiveRoleAssignments?.[playerId] ?? baseRoleAssignments?.[playerId] ?? roleAssignments?.[playerId] ?? null,
        effects: _playerEffects[playerId] ?? null,
      }
      : undefined,
  }).src;

  const getDragProps = (playerId: string) => {
    if (hideSensitiveInfo) return {};
    if (!isPlaying || !roleAssignments) return {};
    const role = abilityRoleAssignments?.[playerId] ?? roleAssignments[playerId];
    const isActor = baseRoleAssignments?.[playerId] === "a04";
    const isMime = baseRoleAssignments?.[playerId] === "a03";
    const dogState = dogWolfStates[playerId];
    const isPDead = permanentlyDead.has(playerId);

    // Role-based drag actions
    const dragActions: Record<string, { action: string; check?: () => string | null }> = {};

    if (role === POISON_DRAG_ROLE && !isPDead) {
      dragActions.poison = { action: "poison" };
    }
    const werewolfActionBlocked = dogState || isMime
      ? actingPoisonedPlayerIds.has(playerId)
      : werewolfPackPoisoned;
    if (role === KILL_DRAG_ROLE && !werewolfActionBlocked) {
      dragActions.kill = {
        action: "kill",
      };
    }
    if (role === SHAMAN_ROLE && !isPDead) {
      dragActions.shaman = {
        action: "shaman",
        check: () => actingPoisonedPlayerIds.has(playerId) ? getToast("warnShamanPoisoned", lang) : null,
      };
    }
    if (role === ILLUSION_DRAG_ROLE && !isPDead) {
      dragActions.illusion = { action: "illusion" };
    }

    // Additional role drags
    const dogActorUnavailable = !!dogState && role === "a04"
      && (dogState.actorIdolUses >= 2 || !!dogState.independentRole);
    const dogCupidCannotChooseLovers = !!dogState && role === "s01";
    if (ROLE_DRAG_ACTIONS[role] && !isPDead
      && !(isActor && !dogState && !actorCopyActive && actorIdolUses >= 2)
      && !dogActorUnavailable
      && !dogCupidCannotChooseLovers) {
      const actionName = ROLE_DRAG_ACTIONS[role]!;
      return {
        draggable: true,
        onDragStart: (e: React.DragEvent) => {
          e.dataTransfer.setData("action", actionName);
          e.dataTransfer.setData("sourcePlayerId", playerId);
          e.dataTransfer.effectAllowed = "move";
        },
      };
    }

    // Default single drag action
    const firstKey = Object.keys(dragActions)[0];
    if (firstKey) {
      return {
        draggable: true,
        onDragStart: (e: React.DragEvent) => {
          const da = dragActions[firstKey];
          const err = da.check?.();
          if (err) {
            e.preventDefault();
            toast.warning(err);
            return;
          }
          e.dataTransfer.setData("action", da.action);
          e.dataTransfer.setData("sourcePlayerId", playerId);
          e.dataTransfer.effectAllowed = "move";
        },
      };
    }

    return {};
  };

  return (
    <div className="relative" style={{ width: containerW, height: containerH }}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border border-border/50 flex items-center justify-center">
          <span className="text-muted-foreground/40 font-display text-xs tracking-wider">
            {seatedPlayers.length}/{totalSlots}
          </span>
        </div>
      </div>

      {Array.from({ length: totalSlots }).map((_, i) => {
        const angle = (2 * Math.PI * i) / totalSlots - Math.PI / 2;
        const x = radiusX * Math.cos(angle) + containerW / 2;
        const y = radiusY * Math.sin(angle) + containerH / 2;

        const seated = seatedPlayers.find((p) => p.seat_position === i);
        const role = seated && !hideSensitiveInfo && roleAssignments?.[seated.id];
        const mechanicalRole = seated && !hideSensitiveInfo
          ? abilityRoleAssignments?.[seated.id] ?? role
          : role;
        const baseRole = seated && !hideSensitiveInfo ? baseRoleAssignments?.[seated.id] : undefined;
        const isActor = baseRole === "a04";
        const isDrunkard = baseRole === "a01";
        const isMime = baseRole === "a03";
        const roleDef = role ? ROLES[role] : null;
        const rawStatus = seated ? (playerStatuses[seated.id] || "alive") : "alive";
        const rawIsPermanentlyDead = seated ? permanentlyDead.has(seated.id) : false;
        const status = hideSensitiveInfo ? "alive" : rawStatus;
        const isPermanentlyDead = rawIsPermanentlyDead;
        const dragProps = seated ? getDragProps(seated.id) : {};
        const hasDrag = !!dragProps.draggable;
        const isThisIllusion = seated && !hideSensitiveInfo ? illusionPlayerIds.has(seated.id) : false;
        const isThisPoisoned = seated && !hideSensitiveInfo ? poisonedPlayerIds.has(seated.id) : false;
        const isThisWitchPoisoned = seated ? (mechanicalRole === "e02" && isThisPoisoned) : false;
        const isShaman = mechanicalRole === SHAMAN_ROLE;
        const isFox = mechanicalRole === ("v04" as RoleId);
        const independentPowerState = seated ? independentPowerStates[seated.id] : undefined;
        const dogState = seated ? dogWolfStates[seated.id] : undefined;
        const updateIndependentPowerState = (state: ActorPowerState) => {
          if (!seated) return;
          if (onIndependentPowerStateChange) onIndependentPowerStateChange(seated.id, state);
          else if (isActor && onActorPowerStateChange) onActorPowerStateChange(state);
        };
        const effects = seated && !hideSensitiveInfo ? (_playerEffects[seated.id] || new Set<StatusEffect>()) : new Set<StatusEffect>();
        const defaultObjectiveEffects = seated ? getDefaultObjectiveEffects(seated.id) : [];
        const effectsList = hideSensitiveInfo ? [] : [
          ...defaultObjectiveEffects,
          ...Array.from(effects).filter((effect) => !defaultObjectiveEffects.includes(effect)),
        ];

        const playerNode = seated ? (
          <div
            draggable={hasDrag}
            onDragStart={dragProps.onDragStart}
          >
            <motion.div
              layout
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`flex flex-col items-center cursor-pointer rounded-xl ${getStatusClasses(seated.id)} ${hasDrag ? "cursor-grab active:cursor-grabbing" : ""} ${selectedPlayerId === seated.id ? "outline outline-4 outline-primary/70 outline-offset-4" : ""}`}
              onClick={() => {
                if (onPlayerClick) {
                  onPlayerClick(seated.id);
                } else if (!hideSensitiveInfo && isGM && isPlaying && onPlayerStatusChange) {
                  setOpenPopoverId(openPopoverId === seated.id ? null : seated.id);
                } else if (!hideSensitiveInfo && isGM && !roleAssignments) {
                  handleUnseat(seated.id);
                }
              }}
            >
              {/* Status effect icons above player image */}
              {effectsList.length > 0 && (
                <div className="flex gap-0.5 mb-0.5 flex-wrap justify-center max-w-[80px]">
                  {effectsList.map(eff => STATUS_EFFECT_ICONS[eff] ? (
                    <img key={eff} src={STATUS_EFFECT_ICONS[eff]} alt={eff} title={getEffectLabel(eff, lang)} className="h-3.5 w-3.5" />
                  ) : null)}
                </div>
              )}
              <div className="relative">
                {roleDef ? (
                  <div
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 ${getBorderClass(seated.id)} shadow-lg flex-shrink-0`}
                    style={getGlowStyle(seated.id)}
                  >
                    <img
                      src={getRoleImage(roleDef.id, seated.id)}
                      alt={role ? roleLabel(role) : ""}
                      className={`w-full h-full object-cover ${isPermanentlyDead ? "grayscale" : ""}`}
                    />
                  </div>
                ) : (
                  <div className={`w-12 h-12 rounded-full bg-card border-2 ${getBorderClass(seated.id)} flex items-center justify-center paper-texture flex-shrink-0`}>
                    <span className="font-display text-sm font-bold">
                      {seated.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                {/* Dead X overlay */}
                {(status === "dead-this-night" || isPermanentlyDead) && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <X
                      className={`w-10 h-10 ${isPermanentlyDead ? "text-muted-foreground" : "text-destructive"}`}
                      strokeWidth={3}
                    />
                  </div>
                )}
                {/* Illusion icon */}
                {isThisIllusion && (
                  <img src={illusionIcon} alt="ilusão" className="absolute -top-1 -right-1 w-5 h-5" />
                )}
                {/* Poison icon */}
                {isThisPoisoned && !isThisWitchPoisoned && (
                  <img src={poisonedIcon} alt="envenenado" className="absolute -bottom-1 -right-1 w-5 h-5" />
                )}
                {/* Witch immunity icon when poisoned */}
                {isThisWitchPoisoned && (
                  <>
                    <img src={imunityIcon} alt="imunidade" className="absolute -top-1 -left-1 w-5 h-5" />
                    <img src={poisonedIcon} alt="envenenado" className="absolute -bottom-1 -right-1 w-5 h-5" />
                  </>
                )}
                {/* RedHood werewolf immunity icon */}
                {effects.has("immunity_werewolf") && (
                  <img src={immunityWerewolfIcon} alt="imunidade lobisomens" className="absolute -top-1 -left-1 w-5 h-5" />
                )}
                {isActor && role !== "a04" && (
                  <img
                    src={getRoleImage("a04")}
                    alt={roleLabel("a04")}
                    className="absolute -bottom-1 -left-1 h-6 w-6 rounded border border-primary object-cover shadow"
                  />
                )}
                {isActor && actorCopiesDrunkard && role !== "a01" && (
                  <img
                    src={getRoleImage("a01")}
                    alt={roleLabel("a01")}
                    className="absolute -left-1 -top-1 h-6 w-6 rounded border border-green-400 object-cover shadow"
                  />
                )}
                {isDrunkard && role !== "a01" && (
                  <img
                    src={getRoleImage("a01")}
                    alt={roleLabel("a01")}
                    className="absolute -bottom-1 -left-1 h-6 w-6 rounded border border-green-400 object-cover shadow"
                  />
                )}
                {isMime && role !== "a03" && (
                  <img
                    src={getRoleImage("a03")}
                    alt={roleLabel("a03")}
                    className="absolute -bottom-1 -left-1 h-6 w-6 rounded border border-cyan-300 object-cover shadow"
                  />
                )}
                {seated && dogWolfOwnerRoles[seated.id] && (
                  <img
                    src={getRoleImage(dogWolfOwnerRoles[seated.id])}
                    alt={roleLabel(dogWolfOwnerRoles[seated.id])}
                    className="absolute -bottom-1 -right-1 h-6 w-6 rounded border border-amber-400 object-cover shadow"
                  />
                )}
              </div>
              <span className={`text-xs font-body max-w-[80px] truncate text-center mt-1 ${isThisPoisoned ? "text-green-400" : isThisIllusion ? "text-purple-400" : ""}`}>
                {seated.name}
              </span>
              {isGM && roleDef && (
                <span className={`text-[10px] font-display leading-tight ${isThisPoisoned ? "text-green-400" : isThisIllusion ? "text-purple-400" : "text-primary"}`}>
                  {role ? roleLabel(role) : ""}
                </span>
              )}
              {/* Shaman charge boxes */}
              {isGM && isShaman && !isPermanentlyDead && onShamanChargeToggle && (
                <div className="flex gap-1 mt-0.5" onClick={(e) => e.stopPropagation()}>
                  {[0, 1].map((idx) => (
                    <Checkbox
                      key={idx}
                      checked={(independentPowerState?.shamanCharges ?? shamanCharges ?? 0) > idx}
                      onCheckedChange={() => {
                        if (independentPowerState) {
                          updateIndependentPowerState({ ...independentPowerState, shamanCharges: independentPowerState.shamanCharges > idx ? idx : idx + 1 });
                        } else onShamanChargeToggle(idx);
                      }}
                      className="h-4 w-4 border-primary data-[state=checked]:bg-primary"
                    />
                  ))}
                </div>
              )}
              {isGM && isActor && !dogState && !isPermanentlyDead && onActorIdolUseToggle && (
                <div className="flex gap-1 mt-0.5" onClick={(e) => e.stopPropagation()}>
                  {[0, 1].map((idx) => (
                    <Checkbox
                      key={idx}
                      checked={actorIdolUses > idx}
                      onCheckedChange={() => onActorIdolUseToggle(idx)}
                      className="h-4 w-4 border-primary data-[state=checked]:bg-primary"
                    />
                  ))}
                </div>
              )}
              {isGM && dogState && mechanicalRole === "a04" && !isPermanentlyDead && onDogActorIdolUseToggle && (
                <div className="flex gap-1 mt-0.5" onClick={(e) => e.stopPropagation()}>
                  {[0, 1].map((idx) => (
                    <Checkbox
                      key={idx}
                      checked={dogState.actorIdolUses > idx}
                      onCheckedChange={() => onDogActorIdolUseToggle(seated!.id, idx)}
                      className="h-4 w-4 border-primary data-[state=checked]:bg-primary"
                    />
                  ))}
                </div>
              )}
              {/* Fox checkbox */}
              {isGM && isFox && showFoxCheckbox && !isPermanentlyDead && onFoxDisabledToggle && (
                <div className="flex items-center gap-1 mt-0.5" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={independentPowerState?.foxDisabled ?? foxDisabled}
                    onCheckedChange={() => {
                      if (independentPowerState) updateIndependentPowerState({ ...independentPowerState, foxDisabled: !independentPowerState.foxDisabled });
                      else onFoxDisabledToggle();
                    }}
                    className="h-4 w-4 rounded-none border-2 border-blue-400 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                  />
                  <span className="text-[9px] text-muted-foreground">⚡</span>
                </div>
              )}
              {/* Cupid (s01) protection charges */}
              {isGM && mechanicalRole === ("s01" as RoleId) && showCupidCheckboxes && !isPermanentlyDead && onCupidChargeToggle && (
                <div className="flex gap-1 mt-0.5" onClick={(e) => e.stopPropagation()}>
                  {[0, 1].map((idx) => (
                    <Checkbox
                      key={idx}
                      checked={(independentPowerState?.cupidCharges ?? cupidCharges) > idx}
                      onCheckedChange={() => {
                        if (independentPowerState) updateIndependentPowerState({ ...independentPowerState, cupidCharges: independentPowerState.cupidCharges > idx ? idx : idx + 1 });
                        else onCupidChargeToggle(idx);
                      }}
                      className="h-4 w-4 border-primary data-[state=checked]:bg-primary"
                    />
                  ))}
                </div>
              )}
              {/* Big Bad Wolf (m01) checkboxes */}
              {isGM && mechanicalRole === ("m01" as RoleId) && !isPermanentlyDead && onBigBadWolfChargeToggle && (
                <div className="flex gap-1 mt-0.5" onClick={(e) => e.stopPropagation()}>
                  {[0, 1].map((idx) => (
                    <Checkbox
                      key={idx}
                      checked={(independentPowerState?.bigBadWolfCharges ?? bigBadWolfCharges ?? 0) > idx}
                      onCheckedChange={() => {
                        if (independentPowerState) updateIndependentPowerState({ ...independentPowerState, bigBadWolfCharges: independentPowerState.bigBadWolfCharges > idx ? idx : idx + 1 });
                        else onBigBadWolfChargeToggle(idx);
                      }}
                      className="h-4 w-4 border-primary data-[state=checked]:bg-primary"
                    />
                  ))}
                </div>
              )}
              {/* Domador da Aranha (v23) daytime web-change checkbox */}
              {isGM && mechanicalRole === ("v23" as RoleId) && !isPermanentlyDead && onSpiderDayChangeToggle && (
                <div className="flex gap-1 mt-0.5" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={independentPowerState?.spiderDayChangeUsed ?? spiderDayChangeUsed}
                    onCheckedChange={() => {
                      if (independentPowerState) updateIndependentPowerState({ ...independentPowerState, spiderDayChangeUsed: !independentPowerState.spiderDayChangeUsed });
                      else onSpiderDayChangeToggle();
                    }}
                    className="h-4 w-4 border-primary data-[state=checked]:bg-primary"
                  />
                </div>
              )}
              {/* Judge (v13) checkboxes */}
              {isGM && mechanicalRole === ("v13" as RoleId) && !isPermanentlyDead && onJudgeChargeToggle && (
                <div className="flex gap-1 mt-0.5" onClick={(e) => e.stopPropagation()}>
                  {[0, 1].map((idx) => (
                    <Checkbox
                      key={idx}
                      checked={(independentPowerState?.judgeCharges ?? judgeCharges ?? 0) > idx}
                      onCheckedChange={() => {
                        if (independentPowerState) updateIndependentPowerState({ ...independentPowerState, judgeCharges: independentPowerState.judgeCharges > idx ? idx : idx + 1 });
                        else onJudgeChargeToggle(idx);
                      }}
                      className="h-4 w-4 border-primary data-[state=checked]:bg-primary"
                    />
                  ))}
                </div>
              )}
              {/* Accuser (v14) checkboxes */}
              {isGM && mechanicalRole === ("v14" as RoleId) && !isPermanentlyDead && onAccuserChargeToggle && (
                <div className="flex gap-1 mt-0.5" onClick={(e) => e.stopPropagation()}>
                  {[0, 1].map((idx) => (
                    <Checkbox
                      key={idx}
                      checked={(independentPowerState?.accuserCharges ?? accuserCharges ?? 0) > idx}
                      onCheckedChange={() => {
                        if (independentPowerState) updateIndependentPowerState({ ...independentPowerState, accuserCharges: independentPowerState.accuserCharges > idx ? idx : idx + 1 });
                        else onAccuserChargeToggle(idx);
                      }}
                      className="h-4 w-4 border-primary data-[state=checked]:bg-primary"
                    />
                  ))}
                </div>
              )}
              {/* Vampire Wolf (m03) used checkbox */}
              {isGM && mechanicalRole === ("m03" as RoleId) && !isPermanentlyDead && onVampireWolfToggle && (
                <div className="flex gap-1 mt-0.5" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={independentPowerState?.vampireWolfUsed ?? vampireWolfUsed}
                    onCheckedChange={() => {
                      if (independentPowerState) updateIndependentPowerState({ ...independentPowerState, vampireWolfUsed: !independentPowerState.vampireWolfUsed });
                      else onVampireWolfToggle();
                    }}
                    className="h-4 w-4 border-primary data-[state=checked]:bg-primary"
                  />
                </div>
              )}
              {/* Vampire victim keeps-power checkbox (square blue) */}
              {isGM && effects.has("werewolf_turned") && !isPermanentlyDead && onVampireVictimToggle && (
                <div className="flex gap-1 mt-0.5" onClick={(e) => e.stopPropagation()} title={t("keepsPowers")}>
                  <Checkbox
                    checked={vampireVictimKeepsPower}
                    onCheckedChange={() => onVampireVictimToggle()}
                    className="h-4 w-4 rounded-none border-2 border-blue-400 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                  />
                </div>
              )}
            </motion.div>
          </div>
        ) : (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            className="w-12 h-12 rounded-full border-2 border-dashed border-border/50 flex items-center justify-center"
          >
            <span className="text-muted-foreground/30 text-xs">{i + 1}</span>
          </motion.div>
        );

        const showPoison = true;
        const showIllusion = isPuppeteer;
        const showExecutado = gameCyclePhase === "tribunal";
        const availableEffectsForPlayer = seated && _availableEffects ? _availableEffects(seated.id) : [];

        const wrappedNode = seated && !hideSensitiveInfo && isGM && isPlaying && onPlayerStatusChange ? (
          <PlayerStatusPopover
            status={status}
            isPermanentlyDead={isPermanentlyDead}
            isPoisoned={isThisPoisoned}
            open={openPopoverId === seated.id}
            onOpenChange={(open) => setOpenPopoverId(open ? seated.id : null)}
            showPoison={showPoison}
            showIllusion={showIllusion}
            isIllusion={isThisIllusion}
            showExecutado={showExecutado}
            poisonDisabled={isWitchPermaDead}
            activeEffects={effects}
            availableEffects={availableEffectsForPlayer}
            onSetPoisoned={() => {
              onPlayerStatusChange(seated.id, "poisoned");
              setOpenPopoverId(null);
            }}
            onSetDead={() => {
              if (mechanicalRole === "e02" && isThisPoisoned) {
                toast.warning(getToast("warnWitchPoisonedImmune", lang));
                setOpenPopoverId(null);
                return;
              }
              onPlayerStatusChange(seated.id, "dead-this-night");
              setOpenPopoverId(null);
            }}
            onSetAlive={() => {
              onPlayerStatusChange(seated.id, "alive");
              setOpenPopoverId(null);
            }}
            onSetPermaDead={() => {
              onPlayerStatusChange(seated.id, "dead");
              setOpenPopoverId(null);
            }}
            onSetIllusion={() => {
              onSetIllusion?.(seated.id);
              setOpenPopoverId(null);
            }}
            onSetExecuted={() => {
              _onExecute?.(seated.id);
              setOpenPopoverId(null);
            }}
            onToggleEffect={(effect) => {
              _onToggleEffect?.(seated.id, effect);
              setOpenPopoverId(null);
            }}
          >
            {playerNode}
          </PlayerStatusPopover>
        ) : (
          playerNode
        );

        return (
          <div
            key={i}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: x, top: y }}
            onDrop={(e) => handleDrop(e, i)}
            onDragOver={handleDragOver}
          >
            {wrappedNode}
          </div>
        );
      })}
    </div>
  );
};
