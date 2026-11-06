import { useState } from "react";
import { SearchCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GameModal, GamePanel } from "./GameModal";
import { PhoneActionScreen } from "./PhoneActionScreen";
import { getRoleLabel, getTranslation, type Language } from "@/lib/i18n";
import type { PhoneView } from "@/lib/phoneActions";

export function InvestigatorRevealModal({ session, language, pending = false, connected = true, embedded = false, onConfirm, onClose, onReopen }: {
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
  const actions = getTranslation(language).ui.actions;
  const revealed = session.investigatorReveal;
  const targetId = revealed?.targetPlayerId ?? selected;
  const target = session.players.find((player) => player.id === targetId);
  const title = getRoleLabel("v29", language);

  if (session.visible === false) return onReopen ? (
    <Button variant="secondary" disabled={pending || !connected} onClick={onReopen}>
      <SearchCheck className="mr-2 h-4 w-4" />{actions.reopen}
    </Button>
  ) : null;

  const footer = <div className="flex flex-col gap-2">
    {!revealed && <Button disabled={!target?.selectable || pending || !connected} onClick={() => target && onConfirm(target.id)}>
      <SearchCheck className="mr-2 h-4 w-4" />{actions.confirm}
    </Button>}
    {onClose && <Button variant="secondary" onClick={onClose} disabled={pending || !connected}>
      <X className="mr-2 h-4 w-4" />{actions.close}
    </Button>}
  </div>;
  const content = <div className="space-y-4">
    <PhoneActionScreen session={session} playerId="investigator-selection" language={language}
      pending={pending} connected={connected} selectedPlayerId={targetId} showHeader={false} unframed
      readOnly={!!revealed} onSelectionChange={setSelected} onSend={() => undefined} />
    {revealed && <div role="status" className="rounded-lg border border-sky-400/50 bg-sky-500/10 p-4 text-center text-sky-100">
      <strong className="font-display text-4xl">{revealed.count}</strong>
    </div>}
  </div>;
  const subtitle = revealed ? target?.name : undefined;
  return embedded
    ? <GamePanel title={title} subtitle={subtitle} footer={footer}>{content}</GamePanel>
    : <GameModal open onClose={onClose ?? (() => undefined)} title={title} subtitle={subtitle} closeLabel={actions.close}
      showCloseButton={false} dismissible={!!onClose && !pending && connected} footer={footer}>{content}</GameModal>;
}
