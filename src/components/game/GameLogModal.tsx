import { useMemo, useState } from "react";
import { ArrowRight, CircleSlash, Clock, ScrollText, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getEffectLabel, getGameOver, getRoleLabel, getWinLabel, type Language } from "@/lib/i18n";
import { ROLES, type RoleId } from "@/lib/roles";
import type { GameLogEvent, GameLogPlayerSnapshot, GameLogPhase } from "@/lib/gameLog";
import type { PlayerStatus, StatusEffect } from "@/components/game/PlayerStatusPopover";
import { STATUS_EFFECT_ICONS } from "@/components/game/PlayerStatusPopover";
import poisonedIcon from "@/assets/icons/poisoned.png";
import illusionIcon from "@/assets/icons/illusion.png";
import ghostIcon from "@/assets/icons/ghost.png";
import ghostExecutedIcon from "@/assets/icons/ghost_executed.png";
import ghostRessurectIcon from "@/assets/icons/ghost_ressurect.png";
import villagerIcon from "@/assets/icons/villager.png";

type Player = {
  id: string;
  name: string;
  seat_position: number | null;
  character: string | null;
  is_alive: boolean;
};

interface GameLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language: Language;
  events: GameLogEvent[];
  players: Player[];
  roleAssignments: Record<string, RoleId>;
  playerStatuses: Record<string, PlayerStatus>;
  permanentlyDead: Set<string>;
  playerEffects: Record<string, Set<StatusEffect>>;
  poisonedPlayerId: string | null;
  illusionPlayerId: string | null;
}

const TEXT: Record<Language, {
  title: string;
  finalCircle: string;
  empty: string;
  clearHighlight: string;
  selected: string;
  system: string;
  unknownPlayer: string;
  noRole: string;
  close: string;
  phaseLabels: Record<GameLogPhase, string>;
  actionLabels: Record<GameLogEvent["action"], string>;
}> = {
  pt: {
    title: "Registo do jogo",
    finalCircle: "Círculo final",
    empty: "Ainda não há acontecimentos registados.",
    clearHighlight: "Limpar destaque",
    selected: "A destacar",
    system: "Sistema",
    unknownPlayer: "Jogador",
    noRole: "Sem carta",
    close: "Fechar",
    phaseLabels: {
      setup: "Preparação",
      night: "Noite",
      day: "Dia",
      tribunal: "Tribunal",
      "game-over": "Fim do jogo",
    },
    actionLabels: {
      phase: "Mudança de fase",
      kill: "Morte",
      execute: "Execução",
      permanent_death: "Morte permanente",
      resurrect: "Ressuscitou",
      poison: "Envenenado",
      cure_poison: "Veneno removido",
      illusion: "Ilusão",
      clear_illusion: "Ilusão removida",
      effect_add: "Efeito aplicado",
      effect_remove: "Efeito removido",
      role_change: "Carta alterada",
      game_over: "Fim do jogo",
    },
  },
  fr: {
    title: "Journal de partie",
    finalCircle: "Cercle final",
    empty: "Aucun événement enregistré pour le moment.",
    clearHighlight: "Effacer le surlignage",
    selected: "Surligné",
    system: "Système",
    unknownPlayer: "Joueur",
    noRole: "Sans carte",
    close: "Fermer",
    phaseLabels: {
      setup: "Préparation",
      night: "Nuit",
      day: "Jour",
      tribunal: "Tribunal",
      "game-over": "Fin de partie",
    },
    actionLabels: {
      phase: "Changement de phase",
      kill: "Mort",
      execute: "Exécution",
      permanent_death: "Mort permanente",
      resurrect: "Ressuscité",
      poison: "Empoisonné",
      cure_poison: "Poison retiré",
      illusion: "Illusion",
      clear_illusion: "Illusion retirée",
      effect_add: "Effet appliqué",
      effect_remove: "Effet retiré",
      role_change: "Carte modifiée",
      game_over: "Fin de partie",
    },
  },
};

function getEventIcon(event: GameLogEvent) {
  if (event.effect && STATUS_EFFECT_ICONS[event.effect]) return STATUS_EFFECT_ICONS[event.effect];
  if (event.action === "poison" || event.action === "cure_poison") return poisonedIcon;
  if (event.action === "illusion" || event.action === "clear_illusion") return illusionIcon;
  if (event.action === "execute") return ghostExecutedIcon;
  if (event.action === "resurrect") return ghostRessurectIcon;
  if (event.action === "kill" || event.action === "permanent_death") return ghostIcon;
  return null;
}

function getEventParticipants(event: GameLogEvent) {
  return new Set([
    ...(event.participants ?? []),
    event.actor?.id,
    event.target?.id,
    event.secondaryTarget?.id,
  ].filter(Boolean) as string[]);
}

function getPhaseGroupKey(event: GameLogEvent) {
  return `${event.phase}:${event.phaseNumber}`;
}

function getPhaseGroupLabel(event: GameLogEvent, language: Language) {
  const phase = TEXT[language].phaseLabels[event.phase];
  if (event.phase === "setup" || event.phase === "game-over") return phase;
  return `${phase} ${event.phaseNumber}`;
}

function roleLabel(role: RoleId | null | undefined, language: Language, fallback: string) {
  return role ? getRoleLabel(role, language) : fallback;
}

function PlayerMiniCard({
  player,
  role,
  language,
  selected,
  noRoleLabel,
}: {
  player?: GameLogPlayerSnapshot | null;
  role?: RoleId | null;
  language: Language;
  selected?: boolean;
  noRoleLabel: string;
}) {
  const displayRole = player?.role ?? role ?? null;
  const roleDef = displayRole ? ROLES[displayRole] : null;
  return (
    <div className={`min-w-[92px] max-w-[112px] rounded-md border bg-card/70 p-2 text-center ${selected ? "border-primary shadow-[0_0_0_2px_hsl(var(--primary)/0.35)]" : "border-border"}`}>
      <div className="mx-auto h-14 w-14 overflow-hidden rounded-md border border-border/70 bg-muted">
        {roleDef ? (
          <img src={roleDef.image} alt="" className="h-full w-full object-cover" />
        ) : (
          <img src={villagerIcon} alt="" className="h-full w-full object-cover opacity-40" />
        )}
      </div>
      <div className="mt-1 truncate text-xs font-display text-foreground" title={player?.name ?? undefined}>
        {player?.name ?? roleLabel(displayRole, language, noRoleLabel)}
      </div>
      <div className="truncate text-[10px] text-muted-foreground" title={roleLabel(displayRole, language, noRoleLabel)}>
        {roleLabel(displayRole, language, noRoleLabel)}
      </div>
      {player && <StatusBadges player={player} language={language} compact />}
    </div>
  );
}

function StatusBadges({ player, language, compact = false }: { player: GameLogPlayerSnapshot; language: Language; compact?: boolean }) {
  const badges: Array<{ key: string; icon: string; label: string; tone?: string }> = [];
  if (player.permanentlyDead) badges.push({ key: "perma", icon: ghostIcon, label: TEXT[language].actionLabels.permanent_death, tone: "opacity-60" });
  else if (player.status === "dead-this-night") badges.push({ key: "redx", icon: ghostIcon, label: TEXT[language].actionLabels.kill });
  if (player.poisoned) badges.push({ key: "poison", icon: poisonedIcon, label: TEXT[language].actionLabels.poison });
  if (player.illusion) badges.push({ key: "illusion", icon: illusionIcon, label: TEXT[language].actionLabels.illusion });
  player.effects.forEach((effect) => badges.push({ key: effect, icon: STATUS_EFFECT_ICONS[effect], label: getEffectLabel(effect, language) }));

  if (badges.length === 0) return null;
  const visible = compact ? badges.slice(0, 5) : badges;
  return (
    <div className={`mt-1 flex flex-wrap justify-center gap-1 ${compact ? "min-h-4" : ""}`}>
      {visible.map((badge) => (
        <img
          key={badge.key}
          src={badge.icon}
          alt=""
          title={badge.label}
          className={`h-4 w-4 rounded-sm ${badge.tone ?? ""}`}
        />
      ))}
      {visible.length < badges.length && (
        <span className="rounded-sm border border-border/70 px-1 text-[10px] text-muted-foreground">
          +{badges.length - visible.length}
        </span>
      )}
    </div>
  );
}

function FinalCircle({
  players,
  roleAssignments,
  playerStatuses,
  permanentlyDead,
  playerEffects,
  poisonedPlayerId,
  illusionPlayerId,
  selectedPlayerId,
  onSelect,
  language,
}: Omit<GameLogModalProps, "open" | "onOpenChange" | "events"> & {
  selectedPlayerId: string | null;
  onSelect: (playerId: string) => void;
}) {
  const seated = useMemo(() => (
    players
      .filter((player) => player.seat_position !== null)
      .sort((a, b) => (a.seat_position ?? 0) - (b.seat_position ?? 0))
  ), [players]);

  const count = Math.max(seated.length, 1);
  const cardW = 76;
  const cardH = 102;
  const radiusX = Math.min(320, 90 + count * 10);
  const radiusY = Math.min(170, 62 + count * 5);
  const width = radiusX * 2 + cardW + 28;
  const height = radiusY * 2 + cardH + 28;
  const centerX = width / 2;
  const centerY = height / 2;

  return (
    <div className="overflow-x-auto">
      <div className="relative mx-auto" style={{ width, height }}>
        {seated.map((player, index) => {
          const angle = count === 1 ? -Math.PI / 2 : -Math.PI / 2 + (index / count) * Math.PI * 2;
          const x = centerX + Math.cos(angle) * radiusX - cardW / 2;
          const y = centerY + Math.sin(angle) * radiusY - cardH / 2;
          const role = roleAssignments[player.id] ?? null;
          const roleDef = role ? ROLES[role] : null;
          const effects = playerEffects[player.id] ?? new Set<StatusEffect>();
          const snapshot: GameLogPlayerSnapshot = {
            id: player.id,
            name: player.name,
            role,
            status: playerStatuses[player.id] ?? "alive",
            permanentlyDead: permanentlyDead.has(player.id),
            poisoned: poisonedPlayerId === player.id,
            illusion: illusionPlayerId === player.id,
            effects: Array.from(effects),
          };
          const selected = selectedPlayerId === player.id;
          return (
            <button
              type="button"
              key={player.id}
              onClick={() => onSelect(player.id)}
              className={`absolute rounded-md border bg-card/90 p-1.5 text-center transition ${selected ? "border-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.25)]" : "border-border hover:border-primary/60"}`}
              style={{ left: x, top: y, width: cardW, minHeight: cardH }}
              title={player.name}
            >
              <div className={`mx-auto h-12 w-12 overflow-hidden rounded-md border border-border/70 bg-muted ${snapshot.permanentlyDead ? "grayscale opacity-60" : ""}`}>
                {roleDef ? (
                  <img src={roleDef.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <img src={villagerIcon} alt="" className="h-full w-full object-cover opacity-40" />
                )}
              </div>
              <div className="mt-1 truncate text-[11px] font-display text-foreground">{player.name}</div>
              <StatusBadges player={snapshot} language={language} compact />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function GameLogModal({
  open,
  onOpenChange,
  language,
  events,
  players,
  roleAssignments,
  playerStatuses,
  permanentlyDead,
  playerEffects,
  poisonedPlayerId,
  illusionPlayerId,
}: GameLogModalProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const copy = TEXT[language];
  const selectedPlayer = selectedPlayerId ? players.find((player) => player.id === selectedPlayerId) : null;

  const groups = useMemo(() => {
    const grouped: Array<{ key: string; label: string; events: GameLogEvent[]; firstCreatedAt: number }> = [];
    const byKey = new Map<string, { key: string; label: string; events: GameLogEvent[]; firstCreatedAt: number }>();
    for (const event of events) {
      const key = getPhaseGroupKey(event);
      let group = byKey.get(key);
      if (!group) {
        group = {
          key,
          label: getPhaseGroupLabel(event, language),
          events: [],
          firstCreatedAt: event.createdAt,
        };
        byKey.set(key, group);
        grouped.push(group);
      }
      group.events.push(event);
      group.firstCreatedAt = Math.min(group.firstCreatedAt, event.createdAt);
    }
    grouped.sort((a, b) => a.firstCreatedAt - b.firstCreatedAt);
    grouped.forEach((group) => group.events.sort((a, b) => a.createdAt - b.createdAt));
    return grouped;
  }, [events, language]);

  const handleSelectPlayer = (playerId: string) => {
    setSelectedPlayerId((current) => current === playerId ? null : playerId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[calc(100vh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-none flex-col gap-0 overflow-hidden border-border bg-background p-0 sm:rounded-lg md:h-[calc(100vh-3rem)] md:w-[calc(100vw-3rem)]">
        <DialogHeader className="border-b border-border px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3 pr-9">
            <ScrollText className="h-5 w-5 shrink-0 text-primary" />
            <DialogTitle className="min-w-0 flex-1 truncate font-display text-xl text-gradient-blood">
              {copy.title}
            </DialogTitle>
            {selectedPlayer && (
              <Button type="button" size="sm" variant="secondary" onClick={() => setSelectedPlayerId(null)}>
                <X className="mr-2 h-4 w-4" />
                {copy.clearHighlight}
              </Button>
            )}
          </div>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 sm:px-6">
          <section className="mx-auto max-w-7xl py-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-display text-lg text-foreground">{copy.finalCircle}</h2>
              {selectedPlayer && (
                <div className="rounded-md border border-primary/40 bg-primary/10 px-3 py-1 text-xs text-primary">
                  {copy.selected}: {selectedPlayer.name}
                </div>
              )}
            </div>
            <FinalCircle
              language={language}
              players={players}
              roleAssignments={roleAssignments}
              playerStatuses={playerStatuses}
              permanentlyDead={permanentlyDead}
              playerEffects={playerEffects}
              poisonedPlayerId={poisonedPlayerId}
              illusionPlayerId={illusionPlayerId}
              selectedPlayerId={selectedPlayerId}
              onSelect={handleSelectPlayer}
            />
          </section>

          <section className="mx-auto max-w-7xl space-y-4 pb-4">
            {groups.length === 0 ? (
              <div className="rounded-md border border-dashed border-border bg-card/40 p-6 text-center text-sm text-muted-foreground">
                {copy.empty}
              </div>
            ) : (
              groups.map((group) => (
                <div key={group.key} className="rounded-md border border-border bg-card/40">
                  <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                    <Clock className="h-4 w-4 text-primary" />
                    <h3 className="font-display text-base text-foreground">{group.label}</h3>
                  </div>
                  <div className="divide-y divide-border/70">
                    {group.events.map((event) => {
                      const participants = getEventParticipants(event);
                      const highlighted = !!selectedPlayerId && participants.has(selectedPlayerId);
                      const eventIcon = getEventIcon(event);
                      const actionLabel = event.effect
                        ? `${copy.actionLabels[event.action]}: ${getEffectLabel(event.effect, language)}`
                        : event.title ?? copy.actionLabels[event.action];
                      const actorSelected = !!event.actor && event.actor.id === selectedPlayerId;
                      const targetSelected = !!event.target && event.target.id === selectedPlayerId;

                      return (
                        <div
                          key={event.id}
                          className={`p-3 transition ${highlighted ? "bg-primary/10 ring-1 ring-inset ring-primary/30" : "bg-transparent"}`}
                        >
                          <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center">
                            <div className="flex justify-center md:w-36">
                              {event.actor || event.actorRole ? (
                                <PlayerMiniCard
                                  player={event.actor}
                                  role={event.actorRole}
                                  language={language}
                                  selected={actorSelected}
                                  noRoleLabel={copy.noRole}
                                />
                              ) : (
                                <div className="flex min-h-[88px] min-w-[92px] items-center justify-center rounded-md border border-border bg-muted/30 px-2 text-center text-xs text-muted-foreground">
                                  {copy.system}
                                </div>
                              )}
                            </div>

                            <div className="flex min-w-[132px] flex-1 items-center justify-center gap-2 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background">
                                  {eventIcon ? (
                                    <img src={eventIcon} alt="" className="h-6 w-6" />
                                  ) : (
                                    <CircleSlash className="h-5 w-5 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="max-w-[220px] text-xs font-medium text-foreground">{actionLabel}</div>
                                {event.detail && <div className="max-w-[260px] text-[11px] text-muted-foreground">{event.detail}</div>}
                                {event.winKind && (
                                  <div className="text-[11px] text-muted-foreground">
                                    {getGameOver("winSubtitlePrefix", language)} {getWinLabel(event.winKind, language)}
                                  </div>
                                )}
                              </div>
                              {(event.target || event.secondaryTarget) && <ArrowRight className="hidden h-4 w-4 text-muted-foreground md:block" />}
                            </div>

                            <div className="flex justify-center gap-2 md:w-44">
                              {event.target ? (
                                <PlayerMiniCard
                                  player={event.target}
                                  language={language}
                                  selected={targetSelected}
                                  noRoleLabel={copy.noRole}
                                />
                              ) : event.secondaryTarget ? null : (
                                <div className="hidden min-h-[88px] min-w-[92px] md:block" />
                              )}
                              {event.secondaryTarget && (
                                <PlayerMiniCard
                                  player={event.secondaryTarget}
                                  language={language}
                                  selected={event.secondaryTarget.id === selectedPlayerId}
                                  noRoleLabel={copy.noRole}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
