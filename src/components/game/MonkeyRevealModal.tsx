import { useState } from "react";
import { Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GameModal, GamePanel } from "./GameModal";
import { RevealCardGallery } from "./RevealCardGallery";
import { PhoneActionScreen } from "./PhoneActionScreen";
import { getRoleLabel, getTranslation, type Language } from "@/lib/i18n";
import { ROLES, type RoleId } from "@/lib/roles";
import type { PhoneView } from "@/lib/phoneActions";

export function MonkeyRevealModal({ session, language, pending = false, connected = true, embedded = false, onConfirm, onClose, onReopen, onRoleClick }: {
  session: PhoneView;
  language: Language;
  pending?: boolean;
  connected?: boolean;
  embedded?: boolean;
  onConfirm: (playerId: string) => void;
  onClose?: () => void;
  onReopen?: () => void;
  onRoleClick?: (roleId: RoleId) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const text = getTranslation(language).ui.monkeyReveal;
  const revealed = session.monkeyReveal;
  const target = session.players.find((p) => p.id === (revealed?.targetPlayerId ?? selected));
  if (session.visible === false) return onReopen ? (
    <Button variant="secondary" disabled={pending || !connected} onClick={onReopen}>
      <Eye className="mr-2 h-4 w-4" />{text.reopen}
    </Button>
  ) : null;
  const footer = <div className="flex flex-col gap-2">
    {!revealed && <Button disabled={!target?.selectable || pending || !connected} onClick={() => target && onConfirm(target.id)}>
      <Eye className="mr-2 h-4 w-4" />{text.confirm}{target ? `: ${target.name}` : ""}
    </Button>}
    {onClose && <Button variant="secondary" onClick={onClose} disabled={pending || !connected}>
      <X className="mr-2 h-4 w-4" />{text.close}
    </Button>}
  </div>;
  const content = revealed ? (
    <div data-testid="monkey-revealed-card">
      <RevealCardGallery language={language} onRoleClick={onRoleClick} cards={[{
        roleId: revealed.roleId, image: ROLES[revealed.roleId].image, label: getRoleLabel(revealed.roleId, language),
      }]} />
    </div>
  ) : <>
    <PhoneActionScreen session={session} playerId="monkey-selection" language={language}
      pending={pending} connected={connected} selectedPlayerId={selected} showHeader={false} unframed
      onSend={(_type, id) => { if (id) setSelected(id); }} />
    {session.error && <p role="status" className="text-sm text-muted-foreground">{text.noCard}</p>}
  </>;
  const title = getRoleLabel("v26", language);
  const subtitle = revealed ? target?.name : text.choose;
  return embedded
    ? <GamePanel title={title} subtitle={subtitle} footer={footer}>{content}</GamePanel>
    : <GameModal open onClose={onClose ?? (() => undefined)} title={title} subtitle={subtitle} closeLabel={text.close}
      showCloseButton={false} dismissible={!!onClose && !pending && connected} footer={footer}>{content}</GameModal>;
}
