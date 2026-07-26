import { useMemo, useState } from "react";
import { ArrowRight, CircleSlash, Clock, Minus, ScrollText, Trophy, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getEffectLabel, getGameOver, getRoleLabel, getWinLabel, type Language } from "@/lib/i18n";
import { ROLES, type RoleId } from "@/lib/roles";
import { resolveRoleImage } from "@/lib/skinPacks";
import { useSkinPack } from "@/lib/skinPackContext";
import type { GameLogEvent, GameLogPlayerSnapshot, GameLogPhase } from "@/lib/gameLog";
import type { PlayerStatus, StatusEffect } from "@/components/game/PlayerStatusPopover";
import { STATUS_EFFECT_ICONS } from "@/components/game/PlayerStatusPopover";
import { PlayerCircle } from "@/components/game/PlayerCircle";
import poisonedIcon from "@/assets/icons/poisoned.png";
import illusionIcon from "@/assets/icons/illusion.png";
import ghostIcon from "@/assets/icons/ghost.png";
import ghostExecutedIcon from "@/assets/icons/ghost_executed.png";
import ghostRessurectIcon from "@/assets/icons/ghost_ressurect.png";
import villagerIcon from "@/assets/icons/villager.png";
import cardSwitchIcon from "@/assets/icons/card_switch.png";

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
  poisonedPlayerIds?: Set<string>;
  illusionPlayerId: string | null;
  illusionPlayerIds?: Set<string>;
}

const TEXT: Record<Language, {
  title: string;
  finalCircle: string;
  empty: string;
  clearHighlight: string;
  selected: string;
  system: string;
  village: string;
  hideEvent: string;
  unknownPlayer: string;
  noRole: string;
  close: string;
  permanentDeath: string;
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
    village: "Aldeia",
    hideEvent: "Ocultar acontecimento",
    unknownPlayer: "Jogador",
    noRole: "Sem carta",
    close: "Fechar",
    permanentDeath: "Morte permanente",
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
      resurrect: "Ressuscitou",
      poison: "Envenenado",
      illusion: "Ilusão",
      effect_add: "Efeito aplicado",
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
    village: "Village",
    hideEvent: "Masquer l’événement",
    unknownPlayer: "Joueur",
    noRole: "Sans carte",
    close: "Fermer",
    permanentDeath: "Mort permanente",
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
      resurrect: "Ressuscité",
      poison: "Empoisonné",
      illusion: "Illusion",
      effect_add: "Effet appliqué",
      role_change: "Carte modifiée",
      game_over: "Fin de partie",
    },
  },
  en: {
    title: "Game log",
    finalCircle: "Final circle",
    empty: "No events recorded yet.",
    clearHighlight: "Clear highlight",
    selected: "Highlighting",
    system: "System",
    village: "Village",
    hideEvent: "Hide event",
    unknownPlayer: "Player",
    noRole: "No card",
    close: "Close",
    permanentDeath: "Permanent death",
    phaseLabels: {
      setup: "Setup",
      night: "Night",
      day: "Day",
      tribunal: "Tribunal",
      "game-over": "Game over",
    },
    actionLabels: {
      phase: "Phase change",
      kill: "Death",
      execute: "Execution",
      resurrect: "Resurrected",
      poison: "Poisoned",
      illusion: "Illusion",
      effect_add: "Effect applied",
      role_change: "Card changed",
      game_over: "Game over",
    },
  },
};

function getEventIcon(event: GameLogEvent) {
  if (event.effect && STATUS_EFFECT_ICONS[event.effect]) return STATUS_EFFECT_ICONS[event.effect];
  if (event.action === "poison") return poisonedIcon;
  if (event.action === "illusion") return illusionIcon;
  if (event.action === "execute") return ghostExecutedIcon;
  if (event.action === "resurrect") return ghostRessurectIcon;
  if (event.action === "kill") return ghostIcon;
  if (event.action === "role_change") return cardSwitchIcon;
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
  const { skinPackId } = useSkinPack();
  const displayRole = player?.role ?? role ?? null;
  const roleDef = displayRole ? ROLES[displayRole] : null;
  return (
    <div className={`min-w-[58px] max-w-[70px] rounded-md border bg-card/70 p-1 text-center ${selected ? "border-primary shadow-[0_0_0_2px_hsl(var(--primary)/0.35)]" : "border-border"}`}>
      <div className="mx-auto h-9 w-9 overflow-hidden rounded-md border border-border/70 bg-muted">
        {roleDef ? (
          <img src={resolveRoleImage(roleDef.id, { skinPackId }).src} alt="" className="h-full w-full object-cover" />
        ) : (
          <img src={villagerIcon} alt="" className="h-full w-full object-cover opacity-40" />
        )}
      </div>
      <div className="mt-1 truncate text-[11px] font-display text-foreground" title={player?.name ?? undefined}>
        {player?.name ?? roleLabel(displayRole, language, noRoleLabel)}
      </div>
      <div className="truncate text-[10px] text-muted-foreground" title={roleLabel(displayRole, language, noRoleLabel)}>
        {roleLabel(displayRole, language, noRoleLabel)}
      </div>
      {player && <StatusBadges player={player} language={language} compact />}
    </div>
  );
}

function VillageMiniCard({ label }: { label: string }) {
  return (
    <div className="min-w-[58px] max-w-[70px] rounded-md border border-border bg-card/70 p-1 text-center">
      <div className="mx-auto h-9 w-9 overflow-hidden rounded-md border border-border/70 bg-muted">
        <img src={villagerIcon} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="mt-1 truncate text-[11px] font-display text-foreground">{label}</div>
    </div>
  );
}

function StatusBadges({ player, language, compact = false }: { player: GameLogPlayerSnapshot; language: Language; compact?: boolean }) {
  const badges: Array<{ key: string; icon: string; label: string; tone?: string }> = [];
  if (player.permanentlyDead) badges.push({ key: "perma", icon: ghostIcon, label: TEXT[language].permanentDeath, tone: "opacity-60" });
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
          className={`h-3.5 w-3.5 rounded-sm ${badge.tone ?? ""}`}
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
  poisonedPlayerIds,
  illusionPlayerId,
  illusionPlayerIds,
  selectedPlayerId,
  onSelect,
}: Omit<GameLogModalProps, "open" | "onOpenChange" | "events"> & {
  selectedPlayerId: string | null;
  onSelect: (playerId: string) => void;
}) {
  const totalSlots = Math.max(players.filter((player) => player.seat_position !== null).length, 1);

  return (
    <div className="overflow-x-auto">
      <div className="mx-auto w-max">
        <PlayerCircle
          players={players}
          totalSlots={totalSlots}
          onDropPlayer={() => undefined}
          isGM
          roleAssignments={roleAssignments}
          playerStatuses={playerStatuses}
          permanentlyDead={permanentlyDead}
          poisonedPlayerId={poisonedPlayerId}
          poisonedPlayerIds={poisonedPlayerIds}
          illusionPlayerId={illusionPlayerId}
          illusionPlayerIds={illusionPlayerIds}
          playerEffects={playerEffects}
          onPlayerClick={onSelect}
          selectedPlayerId={selectedPlayerId}
          allowFlexibleRoleSkins={false}
        />
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
  poisonedPlayerIds,
  illusionPlayerId,
  illusionPlayerIds,
}: GameLogModalProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [hiddenEventIds, setHiddenEventIds] = useState<Set<string>>(() => new Set());
  const copy = TEXT[language];
  const selectedPlayer = selectedPlayerId ? players.find((player) => player.id === selectedPlayerId) : null;

  const groups = useMemo(() => {
    const hiddenLegacyActions = new Set(["permanent_death", "cure_poison", "clear_illusion", "effect_remove"]);
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
      if (event.action !== "phase" && !hiddenLegacyActions.has(event.action) && !hiddenEventIds.has(event.id)) {
        group.events.push(event);
      }
      group.firstCreatedAt = Math.min(group.firstCreatedAt, event.createdAt);
    }
    grouped.sort((a, b) => a.firstCreatedAt - b.firstCreatedAt);
    grouped.forEach((group) => group.events.sort((a, b) => a.createdAt - b.createdAt));
    return grouped;
  }, [events, hiddenEventIds, language]);

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
              poisonedPlayerIds={poisonedPlayerIds}
              illusionPlayerId={illusionPlayerId}
              illusionPlayerIds={illusionPlayerIds}
              selectedPlayerId={selectedPlayerId}
              onSelect={handleSelectPlayer}
            />
          </section>

          <section className="mx-auto grid max-w-7xl grid-cols-1 gap-3 pb-4 xl:grid-cols-2">
            {groups.length === 0 ? (
              <div className="rounded-md border border-dashed border-border bg-card/40 p-6 text-center text-sm text-muted-foreground">
                {copy.empty}
              </div>
            ) : (
              groups.map((group) => (
                <div key={group.key} className="self-start rounded-md border border-border bg-card/40">
                  <div className={`flex items-center gap-2 px-3 py-2 ${group.events.length > 0 ? "border-b border-border" : ""}`}>
                    <Clock className="h-4 w-4 text-primary" />
                    <h3 className="font-display text-sm text-foreground">{group.label}</h3>
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
                          className={`relative p-2 pr-8 transition ${highlighted ? "bg-primary/10 ring-1 ring-inset ring-primary/30" : "bg-transparent"}`}
                        >
                          <button
                            type="button"
                            onClick={() => setHiddenEventIds((current) => new Set(current).add(event.id))}
                            className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
                            title={copy.hideEvent}
                            aria-label={copy.hideEvent}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <div className="grid grid-cols-[58px_minmax(64px,1fr)_minmax(58px,145px)] items-center gap-2">
                            <div className="flex justify-center">
                              {event.action === "execute" ? (
                                <VillageMiniCard label={copy.village} />
                              ) : event.actor || event.actorRole ? (
                                <PlayerMiniCard
                                  player={event.actor}
                                  role={event.actorRole}
                                  language={language}
                                  selected={actorSelected}
                                  noRoleLabel={copy.noRole}
                                />
                              ) : (
                                <div className="flex min-h-[64px] min-w-[58px] items-center justify-center rounded-md border border-border bg-muted/30 px-1 text-center text-[10px] text-muted-foreground">
                                  {copy.system}
                                </div>
                              )}
                            </div>

                            <div className="flex min-w-0 items-center justify-center gap-1 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background">
                                  {event.action === "game_over" ? (
                                    <Trophy className="h-5 w-5 text-yellow-400" />
                                  ) : eventIcon ? (
                                    <img src={eventIcon} alt="" className="h-5 w-5" />
                                  ) : (
                                    <CircleSlash className="h-5 w-5 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="max-w-[150px] text-[11px] font-medium leading-tight text-foreground">{actionLabel}</div>
                                {event.detail && <div className="max-w-[260px] text-[11px] text-muted-foreground">{event.detail}</div>}
                                {event.winKind && (
                                  <div className="text-[11px] text-muted-foreground">
                                    {getGameOver("winSubtitlePrefix", language)} {getWinLabel(event.winKind, language)}
                                  </div>
                                )}
                              </div>
                              {(event.target || event.secondaryTarget) && <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                            </div>

                            <div className="flex justify-center gap-1">
                              {event.target ? (
                                <PlayerMiniCard
                                  player={event.target}
                                  language={language}
                                  selected={targetSelected}
                                  noRoleLabel={copy.noRole}
                                />
                              ) : event.secondaryTarget ? null : (
                                <div className="min-h-[64px] min-w-[58px]" />
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
