import { useState } from "react";
import { Shirt, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GameModal, GamePanel } from "./GameModal";
import { PhoneActionScreen } from "./PhoneActionScreen";
import { getEffectLabel, getRoleLabel, getTranslation, type Language } from "@/lib/i18n";
import { STATUS_EFFECT_ICONS } from "@/lib/effectPresentation";
import { WASHERWOMAN_CLOTHES } from "@/lib/washerwoman";
import type { PhoneView } from "@/lib/phoneActions";

export function WasherwomanRevealModal({ session, language, pending = false, connected = true, embedded = false, onConfirm, onClose, onReopen }: {
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
  const revealed = session.washerwomanReveal;
  const targetId = revealed?.targetPlayerId ?? selected;
  const target = session.players.find((player) => player.id === targetId);
  const title = getRoleLabel("a07", language);

  if (session.visible === false) return onReopen ? <Button variant="secondary" disabled={pending || !connected} onClick={onReopen}>
    <Shirt className="mr-2 h-4 w-4" />{actions.reopen}
  </Button> : null;

  const footer = <div className="flex flex-col gap-2">
    {!revealed && <Button disabled={!target?.selectable || pending || !connected} onClick={() => target && onConfirm(target.id)}>
      <Shirt className="mr-2 h-4 w-4" />{actions.confirm}
    </Button>}
    {onClose && <Button variant="secondary" onClick={onClose} disabled={pending || !connected}>
      <X className="mr-2 h-4 w-4" />{actions.close}
    </Button>}
  </div>;

  const content = <div className="space-y-4">
    <PhoneActionScreen session={session} playerId="washerwoman-selection" language={language}
      pending={pending} connected={connected} selectedPlayerId={targetId} showHeader={false} unframed
      readOnly={!!revealed} onSelectionChange={setSelected} onSend={() => undefined} />
    {revealed && <div role="status" className="rounded-lg border border-cyan-400/50 bg-cyan-500/10 p-4 text-cyan-100">
      {revealed.numbers.length === 0 ? <strong className="block text-center font-display text-4xl">0</strong>
        : <div className="grid gap-2 sm:grid-cols-2">{revealed.numbers.map((number) => {
          const effect = WASHERWOMAN_CLOTHES[number - 1];
          return <div key={number} className="flex items-center gap-3 rounded-lg border border-cyan-300/25 bg-background/40 px-3 py-2">
            <img src={STATUS_EFFECT_ICONS[effect]} alt="" className="h-9 w-9 object-contain" />
            <span className="font-display text-xl">{number}. {getEffectLabel(effect, language)}</span>
          </div>;
        })}</div>}
    </div>}
  </div>;
  const subtitle = revealed ? target?.name : undefined;
  return embedded
    ? <GamePanel title={title} subtitle={subtitle} footer={footer}>{content}</GamePanel>
    : <GameModal open onClose={onClose ?? (() => undefined)} title={title} subtitle={subtitle} closeLabel={actions.close}
      showCloseButton={false} dismissible={!!onClose && !pending && connected} footer={footer}>{content}</GameModal>;
}
