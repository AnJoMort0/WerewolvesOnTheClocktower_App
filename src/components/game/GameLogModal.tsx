import { useMemo, useState } from "react";
import { ChevronDown, CircleSlash, Clock, Minus, ScrollText, Trophy, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getEffectLabel, getGameOver, getRoleLabel, getTranslation, getWinLabel, type Language } from "@/lib/i18n";
import { ROLES, type RoleId } from "@/lib/roles";
import { resolveRoleImage } from "@/lib/skinPacks";
import { useSkinPack } from "@/lib/skinPackContext";
import type { GameLogEvent, GameLogPlayerSnapshot, GameLogSnapshotPlayer } from "@/lib/gameLog";
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

interface GameLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language: Language;
  events: GameLogEvent[];
  players: GameLogSnapshotPlayer[];
  roleAssignments: Record<string, RoleId>;
  playerStatuses: Record<string, PlayerStatus>;
  permanentlyDead: Set<string>;
  playerEffects: Record<string, Set<StatusEffect>>;
  poisonedPlayerId: string | null;
  poisonedPlayerIds?: Set<string>;
  illusionPlayerId: string | null;
  illusionPlayerIds?: Set<string>;
}

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
  const phase = getTranslation(language).ui.gameLog.phaseLabels[event.phase];
  if (event.phase === "setup" || event.phase === "game-over") return phase;
  return `${phase} ${event.phaseNumber}`;
}

function roleLabel(role: RoleId | null | undefined, language: Language, fallback: string) {
  return role ? getRoleLabel(role, language) : fallback;
}

function ParticipantCell({
  player,
  role,
  language,
  selected,
  noRoleLabel,
  label,
  onSelect,
}: {
  player?: GameLogPlayerSnapshot | null;
  role?: RoleId | null;
  language: Language;
  selected?: boolean;
  noRoleLabel: string;
  label?: string;
  onSelect?: (playerId: string) => void;
}) {
  const { skinPackId } = useSkinPack();
  const displayRole = player?.role ?? role ?? null;
  const roleDef = displayRole ? ROLES[displayRole] : null;
  const primaryLabel = player?.name ?? label ?? roleLabel(displayRole, language, noRoleLabel);
  const content = (
    <>
      <div className="h-7 w-7 shrink-0 overflow-hidden rounded-sm border border-border/70 bg-muted">
        {roleDef ? (
          <img src={resolveRoleImage(roleDef.id, { skinPackId }).src} alt="" className="h-full w-full object-cover" />
        ) : (
          <img src={villagerIcon} alt="" className="h-full w-full object-cover opacity-40" />
        )}
      </div>
      <div className="min-w-0 flex-1 text-left">
        <div className="truncate font-display text-xs leading-tight text-foreground" title={primaryLabel}>
          {primaryLabel}
        </div>
        {player && (
          <div className="flex min-w-0 items-center gap-1">
            <span className="truncate text-[10px] leading-tight text-muted-foreground" title={roleLabel(displayRole, language, noRoleLabel)}>
              {roleLabel(displayRole, language, noRoleLabel)}
            </span>
            <StatusBadges player={player} language={language} inline />
          </div>
        )}
      </div>
    </>
  );
  const className = `flex min-w-0 items-center gap-1.5 rounded-sm px-1 py-0.5 transition ${selected ? "bg-primary/15 ring-1 ring-inset ring-primary/40" : "hover:bg-muted/60"}`;
  return player && onSelect ? (
    <button type="button" className={className} onClick={() => onSelect(player.id)} title={primaryLabel} aria-pressed={selected}>
      {content}
    </button>
  ) : <div className={className}>{content}</div>;
}

function StatusBadges({ player, language, compact = false, inline = false }: { player: GameLogPlayerSnapshot; language: Language; compact?: boolean; inline?: boolean }) {
  const copy = getTranslation(language).ui.gameLog;
  const badges: Array<{ key: string; icon: string; label: string; tone?: string }> = [];
  if (player.permanentlyDead) badges.push({ key: "perma", icon: ghostIcon, label: copy.permanentDeath, tone: "opacity-60" });
  else if (player.status === "dead-this-night") badges.push({ key: "redx", icon: ghostIcon, label: copy.actionLabels.kill });
  if (player.poisoned) badges.push({ key: "poison", icon: poisonedIcon, label: copy.actionLabels.poison });
  if (player.illusion) badges.push({ key: "illusion", icon: illusionIcon, label: copy.actionLabels.illusion });
  player.effects.forEach((effect) => badges.push({ key: effect, icon: STATUS_EFFECT_ICONS[effect], label: getEffectLabel(effect, language) }));

  if (badges.length === 0) return null;
  const visible = compact ? badges.slice(0, 5) : badges;
  return (
    <div className={inline ? "flex shrink-0 items-center gap-0.5" : `mt-1 flex flex-wrap justify-center gap-1 ${compact ? "min-h-4" : ""}`}>
      {visible.map((badge) => (
        <img
          key={badge.key}
          src={badge.icon}
          alt=""
          title={badge.label}
          className={`${inline ? "h-3 w-3" : "h-3.5 w-3.5"} rounded-sm ${badge.tone ?? ""}`}
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
  const copy = getTranslation(language).ui.gameLog;
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
      <DialogContent aria-describedby={undefined} className="flex h-[calc(100vh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-none flex-col gap-0 overflow-hidden border-border bg-background p-0 sm:rounded-lg md:h-[calc(100vh-3rem)] md:w-[calc(100vw-3rem)]">
        <DialogHeader className="border-b border-border px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3 pr-9">
            <ScrollText className="h-5 w-5 shrink-0 text-primary" />
            <DialogTitle className="min-w-0 flex-1 truncate font-display text-xl text-gradient-blood">
              {copy.title}
            </DialogTitle>
            {selectedPlayer && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setSelectedPlayerId(null)}
                className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                aria-label={copy.clearHighlight}
                title={copy.clearHighlight}
              >
                <X className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{copy.clearHighlight}</span>
              </Button>
            )}
          </div>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 sm:px-6">
          <section className="mx-auto max-w-7xl space-y-2 py-3">
            <details className="group rounded-md border border-border bg-card/40">
              <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 marker:content-none">
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                <h2 className="min-w-0 flex-1 font-display text-sm text-foreground">{copy.finalCircle}</h2>
                {selectedPlayer && (
                  <div data-selected-player className="max-w-[50%] truncate rounded-sm border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    {copy.selected}: {selectedPlayer.name}
                  </div>
                )}
              </summary>
              <div className="border-t border-border p-2">
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
              </div>
            </details>

            {groups.length === 0 ? (
              <div className="rounded-md border border-dashed border-border bg-card/40 p-6 text-center text-sm text-muted-foreground">
                {copy.empty}
              </div>
            ) : (
              groups.map((group) => (
                <details key={group.key} open className="group rounded-md border border-border bg-card/40">
                  <summary className={`flex cursor-pointer list-none items-center gap-2 px-3 py-1.5 marker:content-none ${group.events.length > 0 ? "border-b border-border" : ""}`}>
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                    <Clock className="h-4 w-4 text-primary" />
                    <h3 className="min-w-0 flex-1 truncate font-display text-sm text-foreground">{group.label}</h3>
                    <span className="min-w-5 rounded-sm bg-muted px-1.5 text-center text-[10px] text-muted-foreground">{group.events.length}</span>
                  </summary>
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
                          data-log-row
                          className={`grid grid-cols-[minmax(0,1fr)_1.5rem] items-center gap-1 px-1.5 py-1 transition sm:grid-cols-[3rem_minmax(0,1fr)_1.5rem] ${highlighted ? "bg-primary/10 ring-1 ring-inset ring-primary/30" : "bg-transparent"}`}
                        >
                          <time className="hidden text-center font-mono text-[10px] text-muted-foreground sm:block" dateTime={new Date(event.createdAt).toISOString()}>
                            {new Date(event.createdAt).toLocaleTimeString(language, { hour: "2-digit", minute: "2-digit" })}
                          </time>
                          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(4.5rem,0.9fr)_minmax(0,1fr)] items-center gap-1 sm:grid-cols-[minmax(0,1fr)_minmax(5.5rem,1.15fr)_minmax(0,1fr)] sm:gap-1.5">
                            {event.action === "execute" ? (
                              <ParticipantCell label={copy.village} language={language} noRoleLabel={copy.noRole} />
                            ) : event.actor || event.actorRole ? (
                              <ParticipantCell
                                player={event.actor}
                                role={event.actorRole}
                                language={language}
                                selected={actorSelected}
                                noRoleLabel={copy.noRole}
                                onSelect={handleSelectPlayer}
                              />
                            ) : (
                              <ParticipantCell label={copy.system} language={language} noRoleLabel={copy.noRole} />
                            )}

                            <div className="flex min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 text-center">
                              <div className="flex min-w-0 items-center justify-center gap-1">
                                {event.action === "game_over" ? (
                                  <Trophy className="h-4 w-4 shrink-0 text-yellow-400" />
                                ) : eventIcon ? (
                                  <img src={eventIcon} alt="" className="h-4 w-4 shrink-0" />
                                ) : (
                                  <CircleSlash className="h-4 w-4 shrink-0 text-muted-foreground" />
                                )}
                                <span className="text-[11px] font-medium leading-tight text-foreground">{actionLabel}</span>
                              </div>
                              {event.detail && <div className="text-[10px] leading-tight text-muted-foreground">{event.detail}</div>}
                              {event.winKind && (
                                <div className="text-[10px] leading-tight text-muted-foreground">
                                  {getGameOver("winSubtitlePrefix", language)} {getWinLabel(event.winKind, language)}
                                </div>
                              )}
                            </div>

                            <div className="grid min-w-0 gap-0.5">
                              {event.target ? (
                                <ParticipantCell
                                  player={event.target}
                                  language={language}
                                  selected={targetSelected}
                                  noRoleLabel={copy.noRole}
                                  onSelect={handleSelectPlayer}
                                />
                              ) : event.secondaryTarget ? null : (
                                <div className="h-px" />
                              )}
                              {event.secondaryTarget && (
                                <ParticipantCell
                                  player={event.secondaryTarget}
                                  language={language}
                                  selected={event.secondaryTarget.id === selectedPlayerId}
                                  noRoleLabel={copy.noRole}
                                  onSelect={handleSelectPlayer}
                                />
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setHiddenEventIds((current) => new Set(current).add(event.id))}
                            className="flex h-6 w-6 items-center justify-center rounded-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
                            title={copy.hideEvent}
                            aria-label={copy.hideEvent}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </details>
              ))
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
