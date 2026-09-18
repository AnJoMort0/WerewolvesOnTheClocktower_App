import { useState } from "react";
import { Check, Crosshair, Eye, FlaskConical, RotateCcw, Users, X, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, getTranslation, type Language } from "@/lib/i18n";
import type { PhoneCommand, PhoneView } from "@/lib/phoneActions";
import werewolfIcon from "@/assets/display/icons/werewolf.webp";
import evilBeingIcon from "@/assets/display/icons/evil_being.webp";

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

export function PhoneActionScreen({ session, playerId, language, pending, connected, onSend, readOnly = false, selectedPlayerId, showHeader = true, gmControlled = false, confirmLabel, showPoisonConfirmation = true, appearance }: {
  session: PhoneView;
  playerId: string;
  language: Language;
  pending: boolean;
  connected: boolean;
  onSend: (type: PhoneCommand["type"], targetPlayerId?: string) => void;
  readOnly?: boolean;
  selectedPlayerId?: string | null;
  showHeader?: boolean;
  gmControlled?: boolean;
  confirmLabel?: string;
  showPoisonConfirmation?: boolean;
  appearance?: { title: string; icon: LucideIcon; border: string; accent: string };
}) {
  const text = getTranslation(language).ui.phoneActions;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = session.pendingTargetPlayerId ?? (selectedPlayerId !== undefined ? selectedPlayerId : session.mode === "hunt" && !gmControlled ? session.votes[playerId] : selectedId);
  const target = session.players.find((p) => p.id === selected && p.selectable);
  const players = [...session.players].sort((a, b) => (a.seat_position ?? 999) - (b.seat_position ?? 999));
  const mapHeight = Math.max(MAP_MIN_HEIGHT, players.length * PLAYER_ARC_SPACE);
  const verticalRadius = mapHeight / 2 - PLAYER_EDGE_SPACE;
  const angles = getEllipseAngles(players.length, MAP_MAX_WIDTH * MAP_HORIZONTAL_RADIUS, verticalRadius);
  const Icon = appearance?.icon ?? (session.mode === "poison" ? FlaskConical : session.mode === "shaman" ? RotateCcw
    : session.mode === "monkey" ? Eye : session.mode === "allies" ? Users : Crosshair);
  const title = appearance?.title ?? (session.mode === "monkey" ? getTranslation(language).roleLabels.v26
    : session.mode === "colossus" ? getTranslation(language).roleLabels.v27 : text[session.mode]);
  const theme = appearance ?? (session.mode === "poison"
    ? { border: "border-emerald-500/50 ring-emerald-500/10", accent: "text-emerald-300" }
    : session.mode === "shaman"
    ? { border: "border-moon/50 ring-moon/10", accent: "text-moon" }
    : { border: "border-primary/60 ring-primary/10", accent: "text-primary" });

  return (
    <section
      aria-label={title}
      className={`space-y-4 overflow-hidden rounded-lg border bg-card/90 p-4 shadow-md ring-1 ring-inset paper-texture ${theme.border}`}
    >
      {showHeader && <header className="flex items-center justify-center gap-2 border-b border-border/60 pb-3">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-background/40 ${theme.accent}`}>
          <Icon className="h-4 w-4" />
        </span>
        <h2 className={`font-display text-xl font-bold ${theme.accent}`}>{title}</h2>
      </header>}
      {session.mode === "colossus" && <p className="text-center text-sm text-muted-foreground">{text.colossusInstructions}</p>}
      <div className="min-w-0 overflow-hidden pb-1">
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
                aria-pressed={session.mode === "allies" ? undefined : selected === player.id}
                disabled={readOnly || !!session.pendingTargetPlayerId || !player.selectable || !connected || (pending && session.mode !== "hunt")}
                onClick={() => (session.mode === "hunt" && !gmControlled) || session.mode === "monkey" ? onSend("select", player.id) : setSelectedId(player.id)}
                className={`absolute flex w-[3.25rem] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 transition-opacity ${player.selectable ? "cursor-pointer" : "cursor-default"}`}
                style={{
                  left: `${50 + MAP_HORIZONTAL_RADIUS * 100 * Math.cos(angle)}%`,
                  top: mapHeight / 2 + verticalRadius * Math.sin(angle),
                }}
                title={player.name}
              >
                <span className={`relative flex h-11 w-11 items-center justify-center rounded-full border-2 ${
                  selected === player.id ? "border-gold ring-2 ring-gold/30" : player.marker ? "border-primary" : "border-border"
                } ${player.marker ? "bg-primary/25" : session.mode === "colossus" && player.selectable ? "bg-emerald-500/25 text-emerald-200" : "bg-background/70"} ${player.dead || (session.mode === "colossus" && !player.selectable) ? "opacity-40" : ""}`}>
                  {player.marker
                    ? <img src={player.marker === "werewolf" ? werewolfIcon : evilBeingIcon} alt="" draggable={false} className="h-8 w-8 object-contain" />
                    : <span className="font-bold">{player.name.charAt(0).toUpperCase()}</span>}
                  {(player.redX || player.dead) && <X className={`absolute h-9 w-9 ${player.redX ? "text-destructive" : "text-muted-foreground"}`} strokeWidth={3} />}
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
      </div>
      {!connected && <p role="status" className="text-sm">{text.reconnecting}</p>}
      {pending && session.mode !== "hunt" && <p role="status" className="text-sm text-muted-foreground">{text.waiting}</p>}
      {session.pendingTargetPlayerId && <p role="status" className="text-center text-sm text-muted-foreground">{text.waiting}</p>}
      {showPoisonConfirmation && session.mode === "poison" && target && <p className="break-words text-sm">{format(text.poisonConfirm, { target: target.name })}</p>}
      {!readOnly && (session.mode === "poison" || session.mode === "shaman" || session.mode === "colossus" || (gmControlled && session.mode === "hunt")) && (
        <div className="flex justify-center gap-2">
          {session.mode === "shaman" && (
            <Button variant="secondary" disabled={pending || !connected} onClick={() => onSend("ignore")}>
              <X className="mr-2 h-4 w-4" />{text.ignore}
            </Button>
          )}
          <Button disabled={!target || pending || !connected || !!session.pendingTargetPlayerId} onClick={() => target && onSend("confirm", target.id)}>
            <Check className="mr-2 h-4 w-4" />{confirmLabel ?? (session.mode === "shaman" ? text.save : text.confirm)}
          </Button>
        </div>
      )}
    </section>
  );
}
