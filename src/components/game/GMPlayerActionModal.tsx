import { GameModal } from "./GameModal";
import { PhoneActionScreen } from "./PhoneActionScreen";
import { getTranslation, t, type Language } from "@/lib/i18n";
import type { PlayerActionMirror } from "@/hooks/usePlayerActionMirrors";
import type { PhoneView } from "@/lib/phoneActions";
import { PHONE_MODE } from "@/lib/phoneActionModes";
import { RotateCcw, Target, Waypoints } from "lucide-react";

export type GMPlayerActionModalMode = PlayerActionMirror & { completedTargetPlayerId?: string };

export function GMPlayerActionModal({ mode, players, language, onClose, onConfirm }: {
  mode: GMPlayerActionModalMode;
  players: Array<{ id: string; name: string; seat_position: number | null; dead: boolean }>;
  language: Language;
  onClose: () => void;
  onConfirm: (targetPlayerId: string) => void;
}) {
  const resurrect = mode.kind === "v18-resurrect", web = mode.kind === "v23-web";
  const title = t(resurrect ? "resurrectionMode" : web ? "webMode" : "assassinationMode", language);
  const instructions = t(resurrect ? "resurrectionChooseTarget" : web ? "webChooseTarget" : "assassinationChooseTarget", language);
  const view: PhoneView = {
    id: mode.id,
    mode: resurrect || web ? PHONE_MODE.EVIL_WITCH_POISON : PHONE_MODE.HUNTER_ASSASSINATION,
    sourcePlayerId: mode.actorPlayerId,
    participantIds: [mode.actorPlayerId],
    votes: {},
    pendingTargetPlayerId: mode.completedTargetPlayerId,
    completed: !!mode.completedTargetPlayerId,
    players: players.map((player) => ({ ...player, redX: false, marker: null,
      selectable: resurrect ? player.dead : !player.dead && (web || player.id !== mode.actorPlayerId) })),
  };
  return <GameModal open title={title} subtitle={`${players.find((player) => player.id === mode.actorPlayerId)?.name ?? ""}: ${instructions}`}
    onClose={onClose} closeLabel={getTranslation(language).ui.phoneActions.close}>
    <PhoneActionScreen key={mode.id} session={view} playerId="gm" language={language} pending={false} connected gmControlled showHeader={false}
      unframed
      appearance={{ title, icon: resurrect ? RotateCcw : web ? Waypoints : Target,
        border: resurrect ? "border-emerald-500/50 ring-emerald-500/10" : web ? "border-cyan-500/50 ring-cyan-500/10" : "border-destructive/50 ring-destructive/10",
        accent: resurrect ? "text-emerald-300" : web ? "text-cyan-300" : "text-destructive" }}
      confirmLabel={t(resurrect ? "resurrectPlayer" : web ? "changeWeb" : "assassinationConfirm", language)}
      showPoisonConfirmation={false} onSend={(type, target) => { if (type === "confirm" && target) onConfirm(target); }} />
  </GameModal>;
}
