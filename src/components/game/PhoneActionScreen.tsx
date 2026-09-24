import { useEffect, useState } from "react";
import { Check, Crosshair, X, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RevealCardGallery } from "./RevealCardGallery";
import { format, getRoleLabel, getTranslation, type Language } from "@/lib/i18n";
import { canIgnoreRoleActionPhoneMode, getFoxTargetPlayerIds, getRoleActionPhoneConfig, isRoleActionPhoneMode, type PhoneCommand, type PhoneView } from "@/lib/phoneActions";
import { PHONE_MODE, isAssassinationPhoneMode } from "@/lib/phoneActionModes";
import { PHONE_ACTION_PRESENTATION } from "@/lib/phoneActionPresentation";
import { ROLES, type RoleId } from "@/lib/roles";
import werewolfIcon from "@/assets/display/icons/werewolf.webp";
import evilBeingIcon from "@/assets/display/icons/evil_being.webp";
import ghostIcon from "@/assets/display/icons/ghost.webp";

const MAP_MAX_WIDTH = 304;
const MAP_MIN_HEIGHT = 264;
const MAP_HORIZONTAL_RADIUS = 0.38;
const PLAYER_EDGE_SPACE = 38;
const PLAYER_ARC_SPACE = 34;

function getEllipseAngles(count: number, radiusX: number, radiusY: number): number[] {
  if (count <= 0) return [];
  const sampleCount = Math.max(360, count * 24);
  const startAngle = -Math.PI / 2;
  const samples = [{ angle: startAngle, distance: 0 }];
  let previousX = radiusX * Math.cos(startAngle);
  let previousY = radiusY * Math.sin(startAngle);

  for (let index = 1; index <= sampleCount; index += 1) {
    const angle = startAngle + (2 * Math.PI * index) / sampleCount;
    const x = radiusX * Math.cos(angle);
    const y = radiusY * Math.sin(angle);
    samples.push({ angle, distance: samples[index - 1].distance + Math.hypot(x - previousX, y - previousY) });
    previousX = x;
    previousY = y;
  }

  const perimeter = samples[samples.length - 1].distance;
  return Array.from({ length: count }, (_, index) => {
    const target = (perimeter * index) / count;
    const sample = samples.find((candidate) => candidate.distance >= target) ?? samples[samples.length - 1];
    return sample.angle;
  });
}

export function PhoneActionScreen({ session, playerId, language, pending, connected, onSend, onRoleClick, readOnly = false, selectedPlayerId, showHeader = true, showSelectionStatus = true, unframed = false, gmControlled = false, confirmLabel, showPoisonConfirmation = true, appearance }: {
  session: PhoneView;
  playerId: string;
  language: Language;
  pending: boolean;
  connected: boolean;
  onSend: (type: PhoneCommand["type"], targetPlayerId?: string, targetPlayerIds?: string[]) => void;
  onRoleClick?: (roleId: RoleId) => void;
  readOnly?: boolean;
  selectedPlayerId?: string | null;
  showHeader?: boolean;
  showSelectionStatus?: boolean;
  unframed?: boolean;
  gmControlled?: boolean;
  confirmLabel?: string;
  showPoisonConfirmation?: boolean;
  appearance?: { title: string; icon: LucideIcon; border: string; accent: string };
}) {
  const text = getTranslation(language).ui.phoneActions;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  useEffect(() => {
    setSelectedId(null);
    setSelectedIds([]);
  }, [session.id]);
  const isRoleAction = isRoleActionPhoneMode(session.mode);
  const roleActionConfig = isRoleActionPhoneMode(session.mode) ? getRoleActionPhoneConfig(session.mode) : null;
  const selected = session.foxReveal?.targetPlayerId ?? session.gypsyReveal?.targetPlayerId ?? session.priestReveal?.targetPlayerId ?? session.pendingTargetPlayerId
    ?? (selectedPlayerId !== undefined ? selectedPlayerId
      : session.mode === PHONE_MODE.WEREWOLF_HUNT && !gmControlled ? session.votes[playerId] : selectedId);
  const target = session.players.find((p) => p.id === selected && p.selectable);
  const resultTarget = session.players.find((player) => player.id === session.pendingTargetPlayerId);
  const resultTargets = (session.pendingTargetPlayerIds ?? (session.pendingTargetPlayerId ? [session.pendingTargetPlayerId] : []))
    .map((id) => session.players.find((player) => player.id === id))
    .filter((player): player is PhoneView["players"][number] => !!player);
  const roleSelectedIds = session.pendingTargetPlayerIds ?? (session.pendingTargetPlayerId ? [session.pendingTargetPlayerId] : selectedIds);
  const roleTargets = roleSelectedIds.map((id) => session.players.find((player) => player.id === id && player.selectable))
    .filter((player): player is PhoneView["players"][number] => !!player);
  const selectedSet = new Set(isRoleAction ? roleSelectedIds : selected ? [selected] : []);
  const players = [...session.players].sort((a, b) => (a.seat_position ?? 999) - (b.seat_position ?? 999));
  const actor = players.find((player) => player.id === (session.sourcePlayerId ?? session.participantIds[0]));
  const selectsImmediately = session.mode === PHONE_MODE.SPIDER_TAMER_WEB;
  const confirmsSelection = session.mode === PHONE_MODE.PRIEST_CONFESSION || session.mode === PHONE_MODE.SLEEPWALKER_VISIT;
  const roleSelectionCount = session.targetCount ?? 1;
  const roleMinimumSelectionCount = session.minTargetCount ?? roleSelectionCount;
  const highlightsEligibility = session.mode === PHONE_MODE.COLOSSUS_RETALIATION
    || session.mode === PHONE_MODE.PYROMANIAC_BURN;
  const neighborhoodTargetIds = new Set((session.mode === PHONE_MODE.FOX_TAMER_CHECK || session.mode === PHONE_MODE.GYPSY_POISON_CHECK) && selected
    ? session.foxReveal?.playerIds ?? session.gypsyReveal?.playerIds ?? getFoxTargetPlayerIds(players, selected)
    : []);
  const mapHeight = Math.max(MAP_MIN_HEIGHT, players.length * PLAYER_ARC_SPACE);
  const verticalRadius = mapHeight / 2 - PLAYER_EDGE_SPACE;
  const angles = getEllipseAngles(players.length, MAP_MAX_WIDTH * MAP_HORIZONTAL_RADIUS, verticalRadius);
  const presentation = PHONE_ACTION_PRESENTATION[session.mode];
  const Icon = appearance?.icon ?? presentation.icon;
  const title = appearance?.title ?? (session.mode === PHONE_MODE.MONKEY_TAMER_REVEAL ? getTranslation(language).roleLabels.v26
    : session.mode === PHONE_MODE.FOX_TAMER_CHECK ? getTranslation(language).roleLabels.v04
    : session.mode === PHONE_MODE.GYPSY_POISON_CHECK ? getTranslation(language).roleLabels.v12
    : session.mode === PHONE_MODE.SPIDER_TAMER_WEB ? getTranslation(language).roleLabels.v23
    : session.mode === PHONE_MODE.PRIEST_CONFESSION ? getTranslation(language).roleLabels.v25
    : session.mode === PHONE_MODE.SLEEPWALKER_VISIT ? getTranslation(language).roleLabels.v16
    : session.mode === PHONE_MODE.COLOSSUS_RETALIATION ? getTranslation(language).roleLabels.v27
    : session.mode === PHONE_MODE.SOLDIER_ASSASSINATION ? text.soldier
    : roleActionConfig ? getRoleLabel(roleActionConfig.roleId, language)
    : session.mode === PHONE_MODE.WEREWOLF_HUNT ? text.hunt
    : session.mode === PHONE_MODE.WEREWOLF_ALLIES ? text.allies
    : session.mode === PHONE_MODE.EVIL_WITCH_POISON ? text.poison : text.shaman);
  const theme = appearance ?? (session.mode === PHONE_MODE.EVIL_WITCH_POISON
    ? { border: "border-emerald-500/50 ring-emerald-500/10", accent: "text-emerald-300" }
    : session.mode === PHONE_MODE.SHAMAN_SAVE
    ? { border: "border-moon/50 ring-moon/10", accent: "text-moon" }
    : session.mode === PHONE_MODE.FOX_TAMER_CHECK
    ? { border: "border-amber-500/50 ring-amber-500/10", accent: "text-amber-300" }
    : session.mode === PHONE_MODE.GYPSY_POISON_CHECK
    ? { border: "border-purple-500/50 ring-purple-500/10", accent: "text-purple-300" }
    : session.mode === PHONE_MODE.SPIDER_TAMER_WEB
    ? { border: "border-cyan-500/50 ring-cyan-500/10", accent: "text-cyan-300" }
    : session.mode === PHONE_MODE.PRIEST_CONFESSION
    ? { border: "border-amber-300/50 ring-amber-300/10", accent: "text-amber-200" }
    : session.mode === PHONE_MODE.SLEEPWALKER_VISIT
    ? { border: "border-blue-400/50 ring-blue-400/10", accent: "text-blue-300" }
    : { border: "border-primary/60 ring-primary/10", accent: "text-primary" });
  const completedTargets = resultTargets.map((player) => player.name).join(", ");
  const completedText = session.ignored
    ? format(text.ignoredComplete, { actor: actor?.name ?? "" })
    : isAssassinationPhoneMode(session.mode)
      ? session.mode === PHONE_MODE.WEREWOLF_HUNT && !session.sourcePlayerId
        ? format(text.huntComplete, { targets: completedTargets })
        : format(text.assassinationComplete, { actor: actor?.name ?? "", targets: completedTargets })
      : format(text.selectionComplete, { actor: actor?.name ?? "", targets: completedTargets });

  const content = <>
      {showHeader && <header className="flex items-center justify-center gap-2 border-b border-border/60 pb-3">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-background/40 ${theme.accent}`}>
          <Icon className="h-4 w-4" />
        </span>
        <h2 className={`font-display text-xl font-bold ${theme.accent}`}>{title}</h2>
      </header>}
      {session.mode === PHONE_MODE.COLOSSUS_RETALIATION && <p className="text-center text-sm text-muted-foreground">{text.colossusInstructions}</p>}
      {session.approvalResult ? <div role="status" className={`flex flex-col items-center gap-3 rounded-lg border p-6 text-center ${
        session.approvalResult === "accepted" ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-200" : "border-destructive/50 bg-destructive/10 text-destructive"
      }`}>
        {session.approvalResult === "accepted" ? <Check className="h-12 w-12" /> : <X className="h-12 w-12" />}
        {resultTarget && <span className="text-sm text-foreground">{resultTarget.name}</span>}
        <strong className="font-display text-xl">{session.approvalResult === "accepted" ? text.approved : text.denied}</strong>
      </div> : session.priestReveal ? <div data-testid="priest-revealed-card">
        {target && <p className="mb-3 text-center font-display text-lg text-foreground">{target.name}</p>}
        <RevealCardGallery language={language} onRoleClick={onRoleClick} cards={[{
          roleId: session.priestReveal.roleId,
          image: ROLES[session.priestReveal.roleId].image,
          label: getRoleLabel(session.priestReveal.roleId, language),
        }]} />
      </div> : session.completed ? <div role="status" className="flex flex-col items-center gap-3 rounded-lg border border-primary/40 bg-primary/10 p-6 text-center">
        <Icon className={`h-12 w-12 ${appearance?.accent ?? presentation.iconClass}`} />
        <strong className="font-display text-lg text-foreground">{completedText}</strong>
      </div> : <div className="min-w-0 overflow-hidden pb-1">
        <div
          data-testid="phone-action-map"
          className="relative mx-auto w-full max-w-[19rem]"
          style={{ height: mapHeight }}
        >
          <Icon className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 opacity-50" />
          {players.map((player, index) => {
            const angle = angles[index];
            const voters = Object.entries(session.votes).filter(([, id]) => id === player.id)
              .map(([id]) => session.players.find((p) => p.id === id)?.name ?? "");
            return (
              <button
                key={player.id}
                type="button"
                aria-label={player.name}
                aria-pressed={session.mode === PHONE_MODE.WEREWOLF_ALLIES ? undefined : selectedSet.has(player.id)}
                disabled={readOnly || !!session.pendingTargetPlayerId || !!session.approvalResult || !player.selectable || !connected || (pending && session.mode !== PHONE_MODE.WEREWOLF_HUNT)}
                onClick={() => (session.mode === PHONE_MODE.WEREWOLF_HUNT && !gmControlled)
                  || session.mode === PHONE_MODE.MONKEY_TAMER_REVEAL || session.mode === PHONE_MODE.FOX_TAMER_CHECK
                  || session.mode === PHONE_MODE.GYPSY_POISON_CHECK || selectsImmediately
                  ? onSend("select", player.id) : isRoleAction
                  ? setSelectedIds((current) => current.includes(player.id)
                    ? current.filter((id) => id !== player.id)
                    : roleSelectionCount === 1 ? [player.id]
                    : current.length < roleSelectionCount ? [...current, player.id] : [...current.slice(1), player.id])
                  : setSelectedId(player.id)}
                className={`absolute flex w-[3.25rem] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 transition-opacity ${player.selectable ? "cursor-pointer" : "cursor-default"}`}
                style={{
                  left: `${50 + MAP_HORIZONTAL_RADIUS * 100 * Math.cos(angle)}%`,
                  top: mapHeight / 2 + verticalRadius * Math.sin(angle),
                }}
                title={player.name}
              >
                <span className={`relative flex h-11 w-11 items-center justify-center rounded-full border-2 ${
                  selectedSet.has(player.id) ? "border-gold ring-2 ring-gold/30"
                  : neighborhoodTargetIds.has(player.id) ? "border-amber-400 ring-2 ring-amber-400/20"
                  : session.mode === PHONE_MODE.PYROMANIAC_BURN && player.selectable ? "border-orange-400 ring-2 ring-orange-400/25"
                  : session.mode === PHONE_MODE.COLOSSUS_RETALIATION && player.selectable ? "border-emerald-400 ring-2 ring-emerald-400/25"
                  : player.marker ? "border-primary" : "border-border"
                } ${neighborhoodTargetIds.has(player.id) ? "bg-amber-500/20 text-amber-100"
                  : session.mode === PHONE_MODE.PYROMANIAC_BURN && player.selectable ? "bg-orange-500/25 text-orange-100"
                  : session.mode === PHONE_MODE.COLOSSUS_RETALIATION && player.selectable ? "bg-emerald-500/25 text-emerald-200"
                  : player.marker ? "bg-primary/25" : "bg-background/70"} ${
                  (player.dead && session.mode !== PHONE_MODE.PRIEST_CONFESSION) || (highlightsEligibility && !player.selectable)
                    ? "grayscale opacity-30" : ""
                }`}>
                  {player.marker
                    ? <img src={player.marker === "werewolf" ? werewolfIcon : evilBeingIcon} alt="" draggable={false} className="h-8 w-8 object-contain" />
                    : <span className="font-bold">{player.name.charAt(0).toUpperCase()}</span>}
                  {(player.redX || (player.dead && session.mode !== PHONE_MODE.PRIEST_CONFESSION)) && <X className={`absolute h-9 w-9 ${player.redX ? "text-destructive" : "text-muted-foreground"}`} strokeWidth={3} />}
                  {player.dead && session.mode === PHONE_MODE.PRIEST_CONFESSION && <img src={ghostIcon} alt="" data-testid={`ghost-marker-${player.id}`}
                    className="absolute h-9 w-9 object-contain drop-shadow" />}
                  {voters.length > 0 && (
                    <span title={voters.join(", ")} className="absolute -right-2 -top-2 flex min-w-5 items-center justify-center gap-0.5 rounded-sm border border-primary/50 bg-card px-1 text-xs font-bold text-foreground shadow">
                      <Crosshair className="h-3 w-3" />{voters.length}
                    </span>
                  )}
                </span>
                <span className="max-w-full truncate text-xs text-foreground">{player.name}</span>
              </button>
            );
          })}
        </div>
      </div>}
      {!connected && <p role="status" className="text-sm">{text.reconnecting}</p>}
      {pending && session.mode !== PHONE_MODE.WEREWOLF_HUNT && <p role="status" className="text-sm text-muted-foreground">{text.waiting}</p>}
      {showSelectionStatus && !session.completed && !session.approvalResult && session.pendingTargetPlayerId && target && <p role="status" className="text-center text-sm text-muted-foreground">
        {session.mode === PHONE_MODE.COLOSSUS_RETALIATION ? text.waiting : format(text.selection, { actor: actor?.name ?? "", target: target.name })}
      </p>}
      {showPoisonConfirmation && session.mode === PHONE_MODE.EVIL_WITCH_POISON && target && <p className="break-words text-sm">{format(text.poisonConfirm, { target: target.name })}</p>}
      {!readOnly && !session.completed && !session.priestReveal && !session.approvalResult
        && (session.mode === PHONE_MODE.EVIL_WITCH_POISON || session.mode === PHONE_MODE.SHAMAN_SAVE
          || session.mode === PHONE_MODE.COLOSSUS_RETALIATION || confirmsSelection || isRoleAction
          || gmControlled && session.mode === PHONE_MODE.WEREWOLF_HUNT) && (
        <div className="flex justify-center gap-2">
          {(session.mode === PHONE_MODE.SHAMAN_SAVE
            || isRoleActionPhoneMode(session.mode) && canIgnoreRoleActionPhoneMode(session.mode)) && (
            <Button variant="secondary" disabled={pending || !connected} onClick={() => onSend("ignore")}>
              <X className="mr-2 h-4 w-4" />{text.ignore}
            </Button>
          )}
          <Button disabled={isRoleAction ? roleTargets.length < roleMinimumSelectionCount || roleTargets.length > roleSelectionCount || pending || !connected || !!session.pendingTargetPlayerId
            : !target || pending || !connected || !!session.pendingTargetPlayerId}
            onClick={() => isRoleAction
              ? roleTargets.length >= roleMinimumSelectionCount && roleTargets.length <= roleSelectionCount
                && onSend("confirm", roleTargets[0].id, roleTargets.map((player) => player.id))
              : target && onSend("confirm", target.id)}>
            <Check className="mr-2 h-4 w-4" />{confirmLabel ?? (session.mode === PHONE_MODE.SHAMAN_SAVE ? text.save : text.confirm)}
          </Button>
        </div>
      )}
  </>;

  if (unframed) return <div className="space-y-4">{content}</div>;

  return (
    <section
      aria-label={title}
      className={`space-y-4 overflow-hidden rounded-lg border bg-card/90 p-4 shadow-md ring-1 ring-inset paper-texture ${theme.border}`}
    >
      {content}
    </section>
  );
}
