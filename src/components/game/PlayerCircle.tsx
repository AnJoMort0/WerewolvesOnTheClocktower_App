import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ROLES, WEREWOLF_ROLES, type RoleId } from "@/lib/roles";
import { useRoleLabel, useT, useLanguage, getToast } from "@/lib/i18n";
import { PlayerStatusPopover, type PlayerStatus, type StatusEffect, STATUS_EFFECT_ICONS } from "./PlayerStatusPopover";
import poisonedIcon from "@/assets/icons/poisoned.png";
import illusionIcon from "@/assets/icons/illusion.png";
import imunityIcon from "@/assets/icons/imunity_full.png";
import immunityWerewolfIcon from "@/assets/icons/imunity_werewolf.png";
import { toast } from "sonner";

type Player = {
  id: string;
  name: string;
  seat_position: number | null;
  character: string | null;
  is_alive: boolean;
};

const POISON_DRAG_ROLE: RoleId = "e02";
const KILL_DRAG_ROLE: RoleId = "e01";
const CHAMAN_ROLE: RoleId = "e03";
const ILLUSION_DRAG_ROLE: RoleId = "a06";
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

interface PlayerCircleProps {
  players: Player[];
  totalSlots: number;
  onDropPlayer: (playerId: string, position: number | null) => void;
  isGM?: boolean;
  roleAssignments?: Record<string, RoleId>;
  playerStatuses?: Record<string, PlayerStatus>;
  permanentlyDead?: Set<string>;
  onPlayerStatusChange?: (playerId: string, status: PlayerStatus, source?: string) => void;
  isPlaying?: boolean;
  poisonedPlayerId?: string | null;
  illusionPlayerId?: string | null;
  onSetIllusion?: (playerId: string) => void;
  isBruxaPermaDead?: boolean;
  isMarionetista?: boolean;
  chamanCharges?: number;
  onChamanChargeToggle?: (index: number) => void;
  onChamanDrop?: (targetPlayerId: string) => void;
  isBruxaPoisoned?: boolean;
  compact?: boolean;
  foxDisabled?: boolean;
  onFoxDisabledToggle?: () => void;
  juizCharges?: number;
  onJuizChargeToggle?: (idx: number) => void;
  acusadorCharges?: number;
  onAcusadorChargeToggle?: (idx: number) => void;
  lobisomemVampiroUsed?: boolean;
  onLobisomemVampiroToggle?: () => void;
  vampireVictimKeepsPower?: boolean;
  onVampireVictimToggle?: () => void;
  playerEffects?: Record<string, Set<StatusEffect>>;
  gameCyclePhase?: "night" | "day" | "tribunal";
  availableEffects?: (playerId: string) => StatusEffect[];
  onToggleEffect?: (playerId: string, effect: StatusEffect) => void;
  onExecute?: (playerId: string) => void;
  onDragAction?: (action: string, targetPlayerId: string, sourcePlayerId?: string | null) => void;
  amanteUsed?: boolean;
  onAmanteToggle?: () => void;
  isAmante?: (playerId: string) => boolean;
}

export const PlayerCircle = ({
  players,
  totalSlots,
  onDropPlayer,
  isGM,
  roleAssignments,
  playerStatuses = {},
  permanentlyDead = new Set(),
  onPlayerStatusChange,
  isPlaying,
  poisonedPlayerId,
  illusionPlayerId,
  onSetIllusion,
  isBruxaPermaDead = false,
  isMarionetista = false,
  chamanCharges = 0,
  onChamanChargeToggle,
  onChamanDrop,
  isBruxaPoisoned = false,
  compact = false,
  foxDisabled = false,
  onFoxDisabledToggle,
  juizCharges = 0,
  onJuizChargeToggle,
  acusadorCharges = 0,
  onAcusadorChargeToggle,
  lobisomemVampiroUsed = false,
  onLobisomemVampiroToggle,
  vampireVictimKeepsPower = true,
  onVampireVictimToggle,
  playerEffects: _playerEffects = {},
  gameCyclePhase = "night",
  availableEffects: _availableEffects,
  onToggleEffect: _onToggleEffect,
  onExecute: _onExecute,
  onDragAction,
  amanteUsed = false,
  onAmanteToggle,
  isAmante,
}: PlayerCircleProps) => {
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const roleLabel = useRoleLabel();
  const t = useT();
  const lang = useLanguage();
  const seatedPlayers = players.filter((p) => p.seat_position !== null);

  const scale = compact ? 0.65 : 1;
  const baseSize = Math.min(260, 80 + totalSlots * 12);
  const radiusX = Math.min(520, baseSize * 2.0) * scale;
  const radiusY = Math.min(280, baseSize * 0.95) * scale;

  const isChamanPoisoned = useMemo(() => {
    if (!poisonedPlayerId || !roleAssignments) return false;
    return roleAssignments[poisonedPlayerId] === CHAMAN_ROLE;
  }, [poisonedPlayerId, roleAssignments]);

  const handleDrop = (e: React.DragEvent, position: number) => {
    e.preventDefault();
    const action = e.dataTransfer.getData("action");
    const sourcePlayerId = e.dataTransfer.getData("sourcePlayerId") || null;
    if (action && isPlaying && onPlayerStatusChange) {
      const seated = seatedPlayers.find((p) => p.seat_position === position);
      if (!seated) return;

      if (action === "poison") {
        onPlayerStatusChange(seated.id, "poisoned");
        onDragAction?.("__catch__", seated.id, sourcePlayerId);
      } else if (action === "kill") {
        if (roleAssignments?.[seated.id] === "e02" && poisonedPlayerId === seated.id) {
          toast.warning(getToast("warnBruxaPoisonedImmune", lang));
          return;
        }
        onPlayerStatusChange(seated.id, "dead-this-night", "e01");
        onDragAction?.("__catch__", seated.id, sourcePlayerId);
      } else if (action === "chaman") {
        if (isChamanPoisoned) {
          toast.warning(getToast("warnChamanPoisoned", lang));
          return;
        }
        onChamanDrop?.(seated.id);
        onDragAction?.("__catch__", seated.id, sourcePlayerId);
      } else if (action === "illusion") {
        onSetIllusion?.(seated.id);
        onDragAction?.("__catch__", seated.id, sourcePlayerId);
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
    const status = playerStatuses[playerId];
    const isPDead = permanentlyDead.has(playerId);
    const effects = _playerEffects[playerId] || new Set<StatusEffect>();
    if (isPDead) return "grayscale opacity-50";
    if (effects.has("werewolf_turned")) return ""; // handled by glow
    if (effects.has("evil_being")) return ""; // handled by glow
    if (playerId === poisonedPlayerId) return "ring-2 ring-green-500";
    if (playerId === illusionPlayerId) return "ring-2 ring-purple-500";
    return "";
  };

  const getBorderClass = (playerId: string) => {
    const status = playerStatuses[playerId];
    const effects = _playerEffects[playerId] || new Set<StatusEffect>();
    if (effects.has("incendiado")) return "border-orange-500";
    if (playerId === illusionPlayerId) return "border-purple-500";
    if (playerId === poisonedPlayerId) return "border-green-500";
    if (status === "dead-this-night") return "border-destructive";
    return "border-primary/40";
  };

  const getGlowStyle = (playerId: string): React.CSSProperties => {
    const effects = _playerEffects[playerId] || new Set<StatusEffect>();
    if (effects.has("werewolf_turned") || effects.has("evil_being")) {
      return { boxShadow: "0 0 12px 3px rgba(239,68,68,0.5)" };
    }
    return {};
  };

  const getDragProps = (playerId: string) => {
    if (!isPlaying || !roleAssignments) return {};
    const role = roleAssignments[playerId];
    const isPDead = permanentlyDead.has(playerId);

    // Role-based drag actions
    const dragActions: Record<string, { action: string; check?: () => string | null }> = {};

    if (role === POISON_DRAG_ROLE && !isPDead) {
      dragActions.poison = { action: "poison" };
    }
    if (role === KILL_DRAG_ROLE) {
      dragActions.kill = {
        action: "kill",
        check: () => {
          if (poisonedPlayerId) {
            const pr = roleAssignments[poisonedPlayerId];
            if (pr && (["e01", "m01", "m02", "m03"] as RoleId[]).includes(pr)) {
              return getToast("warnLobosPoisoned", lang);
            }
          }
          return null;
        },
      };
    }
    if (role === CHAMAN_ROLE && !isPDead) {
      dragActions.chaman = {
        action: "chaman",
        check: () => isChamanPoisoned ? getToast("warnChamanPoisoned", lang) : null,
      };
    }
    if (role === ILLUSION_DRAG_ROLE && !isPDead) {
      dragActions.illusion = { action: "illusion" };
    }

    // Additional role drags
    if (ROLE_DRAG_ACTIONS[role] && !isPDead) {
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
        const role = seated && roleAssignments?.[seated.id];
        const roleDef = role ? ROLES[role] : null;
        const status = seated ? (playerStatuses[seated.id] || "alive") : "alive";
        const isPermanentlyDead = seated ? permanentlyDead.has(seated.id) : false;
        const dragProps = seated ? getDragProps(seated.id) : {};
        const hasDrag = !!dragProps.draggable;
        const isThisIllusion = seated ? seated.id === illusionPlayerId : false;
        const isThisPoisoned = seated ? seated.id === poisonedPlayerId : false;
        const isThisBruxaPoisoned = seated ? (role === "e02" && isThisPoisoned) : false;
        const isChaman = role === CHAMAN_ROLE;
        const isFox = role === ("v04" as RoleId);
        const effects = seated ? (_playerEffects[seated.id] || new Set<StatusEffect>()) : new Set<StatusEffect>();
        const effectsList = Array.from(effects);

        const playerNode = seated ? (
          <div
            draggable={hasDrag}
            onDragStart={dragProps.onDragStart}
          >
            <motion.div
              layout
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`flex flex-col items-center cursor-pointer ${getStatusClasses(seated.id)} ${hasDrag ? "cursor-grab active:cursor-grabbing" : ""}`}
              onClick={() => {
                if (isGM && isPlaying && onPlayerStatusChange) {
                  setOpenPopoverId(openPopoverId === seated.id ? null : seated.id);
                } else if (isGM && !roleAssignments) {
                  handleUnseat(seated.id);
                }
              }}
            >
              {/* Status effect icons above player image */}
              {effectsList.length > 0 && (
                <div className="flex gap-0.5 mb-0.5 flex-wrap justify-center max-w-[80px]">
                  {effectsList.map(eff => STATUS_EFFECT_ICONS[eff] ? (
                    <img key={eff} src={STATUS_EFFECT_ICONS[eff]} alt={eff} className="h-3.5 w-3.5" />
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
                      src={roleDef.image}
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
                {isThisPoisoned && !isThisBruxaPoisoned && (
                  <img src={poisonedIcon} alt="envenenado" className="absolute -bottom-1 -right-1 w-5 h-5" />
                )}
                {/* Bruxa immunity icon when poisoned */}
                {isThisBruxaPoisoned && (
                  <>
                    <img src={imunityIcon} alt="imunidade" className="absolute -top-1 -left-1 w-5 h-5" />
                    <img src={poisonedIcon} alt="envenenado" className="absolute -bottom-1 -right-1 w-5 h-5" />
                  </>
                )}
                {/* Capuchinho werewolf immunity icon */}
                {effects.has("immunity_werewolf") && (
                  <img src={immunityWerewolfIcon} alt="imunidade lobisomens" className="absolute -top-1 -left-1 w-5 h-5" />
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
              {/* Chaman charge boxes */}
              {isGM && isChaman && !isPermanentlyDead && onChamanChargeToggle && (
                <div className="flex gap-1 mt-0.5" onClick={(e) => e.stopPropagation()}>
                  {[0, 1].map((idx) => (
                    <Checkbox
                      key={idx}
                      checked={(chamanCharges ?? 0) > idx}
                      onCheckedChange={() => onChamanChargeToggle(idx)}
                      className="h-4 w-4 border-primary data-[state=checked]:bg-primary"
                    />
                  ))}
                </div>
              )}
              {/* Fox checkbox */}
              {isGM && isFox && !isPermanentlyDead && onFoxDisabledToggle && (
                <div className="flex items-center gap-1 mt-0.5" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={foxDisabled}
                    onCheckedChange={() => onFoxDisabledToggle()}
                    className="h-4 w-4 border-primary data-[state=checked]:bg-primary"
                  />
                  <span className="text-[9px] text-muted-foreground">⚡</span>
                </div>
              )}
              {/* Juiz (v13) checkboxes */}
              {isGM && role === ("v13" as RoleId) && !isPermanentlyDead && onJuizChargeToggle && (
                <div className="flex gap-1 mt-0.5" onClick={(e) => e.stopPropagation()}>
                  {[0, 1].map((idx) => (
                    <Checkbox
                      key={idx}
                      checked={(juizCharges ?? 0) > idx}
                      onCheckedChange={() => onJuizChargeToggle(idx)}
                      className="h-4 w-4 border-primary data-[state=checked]:bg-primary"
                    />
                  ))}
                </div>
              )}
              {/* Acusador (v14) checkboxes */}
              {isGM && role === ("v14" as RoleId) && !isPermanentlyDead && onAcusadorChargeToggle && (
                <div className="flex gap-1 mt-0.5" onClick={(e) => e.stopPropagation()}>
                  {[0, 1].map((idx) => (
                    <Checkbox
                      key={idx}
                      checked={(acusadorCharges ?? 0) > idx}
                      onCheckedChange={() => onAcusadorChargeToggle(idx)}
                      className="h-4 w-4 border-primary data-[state=checked]:bg-primary"
                    />
                  ))}
                </div>
              )}
              {/* Lobisomem Vampiro (m03) used checkbox */}
              {isGM && role === ("m03" as RoleId) && !isPermanentlyDead && onLobisomemVampiroToggle && (
                <div className="flex gap-1 mt-0.5" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={lobisomemVampiroUsed}
                    onCheckedChange={() => onLobisomemVampiroToggle()}
                    className="h-4 w-4 border-primary data-[state=checked]:bg-primary"
                  />
                </div>
              )}
              {/* Amante Secreto (as01b) used checkbox */}
              {isGM && role === ("as01b" as RoleId) && !isPermanentlyDead && onAmanteToggle && (
                <div className="flex gap-1 mt-0.5" onClick={(e) => e.stopPropagation()} title={t("amanteCheckboxLabel")}>
                  <Checkbox
                    checked={amanteUsed}
                    onCheckedChange={() => onAmanteToggle()}
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
        const showIllusion = isMarionetista;
        const showExecutado = gameCyclePhase === "tribunal";
        const availableEffectsForPlayer = seated && _availableEffects ? _availableEffects(seated.id) : [];

        const wrappedNode = seated && isGM && isPlaying && onPlayerStatusChange ? (
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
            poisonDisabled={isBruxaPermaDead}
            activeEffects={effects}
            availableEffects={availableEffectsForPlayer}
            onSetPoisoned={() => {
              onPlayerStatusChange(seated.id, "poisoned");
              setOpenPopoverId(null);
            }}
            onSetDead={() => {
              if (role === "e02" && poisonedPlayerId === seated.id) {
                toast.warning(getToast("warnBruxaPoisonedImmune", lang));
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
