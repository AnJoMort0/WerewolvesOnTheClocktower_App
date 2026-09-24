import { useState } from "react";
import { CheckCircle2, SearchCheck, X, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GameModal, GamePanel } from "./GameModal";
import { PhoneActionScreen } from "./PhoneActionScreen";
import { getRoleLabel, getTranslation, type Language } from "@/lib/i18n";
import type { PhoneView } from "@/lib/phoneActions";

export function GypsyRevealModal({ session, language, pending = false, connected = true, embedded = false, onConfirm, onClose, onReopen }: {
  session: PhoneView;
  language: Language;
  pending?: boolean;
  connected?: boolean;
  embedded?: boolean;
  onConfirm: (playerId: string) => void;
  onClose?: () => void;
  onReopen?: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const text = getTranslation(language).ui.gypsyReveal;
  const revealed = session.gypsyReveal;
  const targetId = revealed?.targetPlayerId ?? selected;
  const target = session.players.find((player) => player.id === targetId);

  if (session.visible === false) return onReopen ? (
    <Button variant="secondary" disabled={pending || !connected} onClick={onReopen}>
      <SearchCheck className="mr-2 h-4 w-4" />{text.reopen}
    </Button>
  ) : null;

  const footer = <div className="flex flex-col gap-2">
    {!revealed && <Button disabled={!target?.selectable || pending || !connected} onClick={() => target && onConfirm(target.id)}>
      <SearchCheck className="mr-2 h-4 w-4" />{text.confirm}{target ? `: ${target.name}` : ""}
    </Button>}
    {onClose && <Button variant="secondary" onClick={onClose} disabled={pending || !connected}>
      <X className="mr-2 h-4 w-4" />{text.close}
    </Button>}
  </div>;
  const content = <div className="space-y-4">
    <PhoneActionScreen session={session} playerId="gypsy-selection" language={language}
      pending={pending} connected={connected} selectedPlayerId={targetId} showHeader={false} unframed
      readOnly={!!revealed} onSend={(_type, id) => { if (id) setSelected(id); }} />
    {revealed && <div role="status" className={`rounded-lg border p-4 text-center ${revealed.poisoned
      ? "border-purple-400/50 bg-purple-500/10 text-purple-100"
      : "border-slate-400/50 bg-slate-500/10 text-slate-100"}`}>
      {revealed.poisoned
        ? <CheckCircle2 className="mx-auto mb-2 h-9 w-9" />
        : <XCircle className="mx-auto mb-2 h-9 w-9" />}
      <p className="font-display text-lg font-semibold">{revealed.poisoned ? text.poisoned : text.clear}</p>
    </div>}
  </div>;
  const title = getRoleLabel("v12", language);
  const subtitle = revealed ? target?.name : text.choose;
  return embedded
    ? <GamePanel title={title} subtitle={subtitle} footer={footer}>{content}</GamePanel>
    : <GameModal open onClose={onClose ?? (() => undefined)} title={title} subtitle={subtitle} closeLabel={text.close}
      showCloseButton={false} dismissible={!!onClose && !pending && connected} footer={footer}>{content}</GameModal>;
}
