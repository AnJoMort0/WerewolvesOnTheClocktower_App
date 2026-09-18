import { useState } from "react";
import { Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GameModal } from "./GameModal";
import { RevealCardGallery } from "./RevealCardGallery";
import { PhoneActionScreen } from "./PhoneActionScreen";
import { getRoleLabel, getTranslation, type Language } from "@/lib/i18n";
import { ROLES, type RoleId } from "@/lib/roles";
import type { PhoneView } from "@/lib/phoneActions";

export function MonkeyRevealModal({ session, language, pending = false, connected = true, onConfirm, onClose, onReopen, onRoleClick }: {
  session: PhoneView;
  language: Language;
  pending?: boolean;
  connected?: boolean;
  onConfirm: (playerId: string) => void;
  onClose: () => void;
  onReopen?: () => void;
  onRoleClick?: (roleId: RoleId) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const text = getTranslation(language).ui.monkeyReveal;
  const revealed = session.monkeyReveal;
  const target = session.players.find((p) => p.id === (revealed?.targetPlayerId ?? selected));
  return <>
    {session.visible === false && onReopen && (
      <Button variant="secondary" disabled={pending || !connected} onClick={onReopen}>
        <Eye className="mr-2 h-4 w-4" />{text.reopen}
      </Button>
    )}
    <GameModal open={session.visible !== false} onClose={onClose} title={getRoleLabel("v26", language)}
      subtitle={revealed ? target?.name : text.choose} closeLabel={text.close}
      showCloseButton={false} dismissible={!pending && connected}
      footer={<div className="flex flex-col gap-2">
        {!revealed && <Button disabled={!target?.selectable || pending || !connected} onClick={() => target && onConfirm(target.id)}>
          <Eye className="mr-2 h-4 w-4" />{text.confirm}{target ? `: ${target.name}` : ""}
        </Button>}
        <Button variant="secondary" onClick={onClose} disabled={pending || !connected}>
          <X className="mr-2 h-4 w-4" />{text.close}
        </Button>
      </div>}>
        {revealed ? (
          <div data-testid="monkey-revealed-card">
            <RevealCardGallery language={language} onRoleClick={onRoleClick} cards={[{
              roleId: revealed.roleId, image: ROLES[revealed.roleId].image, label: getRoleLabel(revealed.roleId, language),
            }]} />
          </div>
        ) : <>
          <PhoneActionScreen session={session} playerId="monkey-selection" language={language}
            pending={pending} connected={connected} selectedPlayerId={selected} showHeader={false}
            onSend={(_type, id) => { if (id) setSelected(id); }} />
          {session.error && <p role="status" className="text-sm text-muted-foreground">{text.noCard}</p>}
        </>}
    </GameModal>
  </>;
}
