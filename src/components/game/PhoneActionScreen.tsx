import { useState } from "react";
import { Check, Crosshair, FlaskConical, RotateCcw, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, getTranslation, type Language } from "@/lib/i18n";
import type { PhoneCommand, PhoneView } from "@/lib/phoneActions";
import werewolfIcon from "@/assets/icons/werewolf.png";
import evilBeingIcon from "@/assets/icons/evil_being.png";

export function PhoneActionScreen({ session, playerId, language, pending, connected, onSend }: {
  session: PhoneView;
  playerId: string;
  language: Language;
  pending: boolean;
  connected: boolean;
  onSend: (type: PhoneCommand["type"], targetPlayerId?: string) => void;
}) {
  const text = getTranslation(language).ui.phoneActions;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = session.mode === "hunt" ? session.votes[playerId] : selectedId;
  const target = session.players.find((p) => p.id === selected && p.selectable);
  const players = [...session.players].sort((a, b) => (a.seat_position ?? 999) - (b.seat_position ?? 999));
  const diameter = Math.max(280, players.length * 30);
  const Icon = session.mode === "poison" ? FlaskConical : session.mode === "shaman" ? RotateCcw
    : session.mode === "allies" ? Users : Crosshair;
  const theme = session.mode === "poison" ? "bg-green-950 text-green-100 border-green-500"
    : session.mode === "shaman" ? "bg-cyan-950 text-cyan-100 border-cyan-400"
    : "bg-red-950 text-red-100 border-red-400";

  return (
    <section aria-label={text[session.mode]} className={`space-y-4 border-y px-2 py-5 ${theme}`}>
      <h2 className="flex items-center justify-center gap-2 font-display text-xl font-bold">
        <Icon className="h-6 w-6 shrink-0" />{text[session.mode]}
      </h2>
      <div className="overflow-auto pb-2">
        <div className="relative mx-auto" style={{ width: diameter, height: diameter }}>
          <Icon className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 opacity-50" />
          {players.map((player, index) => {
            const angle = 2 * Math.PI * index / Math.max(1, players.length) - Math.PI / 2;
            const radius = diameter / 2 - 38;
            const voters = Object.entries(session.votes).filter(([, id]) => id === player.id)
              .map(([id]) => session.players.find((p) => p.id === id)?.name ?? "");
            return (
              <button
                key={player.id}
                type="button"
                aria-label={player.name}
                aria-pressed={session.mode === "allies" ? undefined : selected === player.id}
                disabled={!player.selectable || !connected || (pending && session.mode !== "hunt")}
                onClick={() => session.mode === "hunt" ? onSend("select", player.id) : setSelectedId(player.id)}
                className="absolute flex w-[68px] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
                style={{ left: diameter / 2 + radius * Math.cos(angle), top: diameter / 2 + radius * Math.sin(angle) }}
                title={player.name}
              >
                <span className={`relative flex h-11 w-11 items-center justify-center rounded-full border-2 ${
                  selected === player.id ? "border-white ring-2 ring-white/50" : player.marker ? "border-red-400" : "border-white/40"
                } ${player.marker ? "bg-red-800" : "bg-black/30"} ${player.dead ? "opacity-40" : ""}`}>
                  {player.marker
                    ? <img src={player.marker === "werewolf" ? werewolfIcon : evilBeingIcon} alt="" draggable={false} className="h-8 w-8 object-contain" />
                    : <span className="font-bold">{player.name.charAt(0).toUpperCase()}</span>}
                  {(player.redX || player.dead) && <X className={`absolute h-9 w-9 ${player.redX ? "text-red-500" : "text-gray-400"}`} strokeWidth={3} />}
                  {voters.length > 0 && (
                    <span title={voters.join(", ")} className="absolute -right-3 -top-2 flex items-center gap-0.5 rounded bg-white px-1 text-xs font-bold text-red-900">
                      <Crosshair className="h-3 w-3" />{voters.length}
                    </span>
                  )}
                </span>
                <span className="max-w-full truncate text-xs">{player.name}</span>
              </button>
            );
          })}
        </div>
      </div>
      {!connected && <p role="status" className="text-sm">{text.reconnecting}</p>}
      {pending && <p role="status" className="text-sm">{text.waiting}</p>}
      {session.mode === "poison" && target && <p className="break-words text-sm">{format(text.poisonConfirm, { target: target.name })}</p>}
      {(session.mode === "poison" || session.mode === "shaman") && (
        <div className="flex justify-center gap-2">
          {session.mode === "shaman" && (
            <Button variant="secondary" disabled={pending || !connected} onClick={() => onSend("ignore")}>
              <X className="mr-2 h-4 w-4" />{text.ignore}
            </Button>
          )}
          <Button disabled={!target || pending || !connected} onClick={() => target && onSend("confirm", target.id)}>
            <Check className="mr-2 h-4 w-4" />{session.mode === "shaman" ? text.save : text.confirm}
          </Button>
        </div>
      )}
    </section>
  );
}
