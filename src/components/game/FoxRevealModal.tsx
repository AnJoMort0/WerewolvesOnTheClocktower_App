import { useState } from "react";
import { CircleHelp, PawPrint, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GameModal, GamePanel } from "./GameModal";
import { PhoneActionScreen } from "./PhoneActionScreen";
import { getRoleLabel, getTranslation, type Language } from "@/lib/i18n";
import type { PhoneView } from "@/lib/phoneActions";

export function FoxRevealModal({ session, language, pending = false, connected = true, embedded = false, onConfirm, onClose, onReopen }: {
  session: PhoneView;
  language: Language;
  pending?: boolean;
  connected?: boolean;
  embedded?: boolean;
  onConfirm: (playerId: string) => void;
  onClose: () => void;
  onReopen?: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const text = getTranslation(language).ui.foxReveal;
  const revealed = session.foxReveal;
  const targetId = revealed?.targetPlayerId ?? selected;
  const target = session.players.find((player) => player.id === targetId);
  const ResultIcon = revealed?.result === "evil" ? ThumbsUp : revealed?.result === "clear" ? ThumbsDown : CircleHelp;
  const resultText = revealed?.result === "evil" ? text.evil : revealed?.result === "clear" ? text.clear : text.confused;

  if (session.visible === false) return onReopen ? (
    <Button variant="secondary" disabled={pending || !connected} onClick={onReopen}>
      <PawPrint className="mr-2 h-4 w-4" />{text.reopen}
    </Button>
  ) : null;
  const footer = <div className="flex flex-col gap-2">
    {!revealed && <Button disabled={!target?.selectable || pending || !connected} onClick={() => target && onConfirm(target.id)}>
      <PawPrint className="mr-2 h-4 w-4" />{text.confirm}{target ? `: ${target.name}` : ""}
    </Button>}
    <Button variant="secondary" onClick={onClose} disabled={pending || !connected}>
      <X className="mr-2 h-4 w-4" />{text.close}
    </Button>
  </div>;
  const content = <div className="space-y-4">
    <PhoneActionScreen session={session} playerId="fox-selection" language={language}
      pending={pending} connected={connected} selectedPlayerId={targetId} showHeader={false} unframed
      readOnly={!!revealed} onSend={(_type, id) => { if (id) setSelected(id); }} />
    {revealed && <div role="status" className={`rounded-lg border p-4 text-center ${
      revealed.result === "evil" ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-200"
      : revealed.result === "clear" ? "border-rose-500/50 bg-rose-500/10 text-rose-100"
      : "border-violet-500/50 bg-violet-500/10 text-violet-200"
    }`}>
      <ResultIcon className="mx-auto mb-2 h-9 w-9" />
      <p className="font-display text-lg font-semibold">{resultText}</p>
      {revealed.foxRanAway && <p className="mt-2 text-sm">{text.ranAway}</p>}
    </div>}
  </div>;
  const title = getRoleLabel("v04", language);
  const subtitle = revealed ? target?.name : text.choose;
  return embedded
    ? <GamePanel title={title} subtitle={subtitle} footer={footer}>{content}</GamePanel>
    : <GameModal open onClose={onClose} title={title} subtitle={subtitle} closeLabel={text.close}
      showCloseButton={false} dismissible={!pending && connected} footer={footer}>{content}</GameModal>;
}
