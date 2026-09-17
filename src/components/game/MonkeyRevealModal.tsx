import { useState } from "react";
import { Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PhoneActionScreen } from "./PhoneActionScreen";
import { getRoleLabel, getTranslation, type Language } from "@/lib/i18n";
import { resolveRoleImage } from "@/lib/skinPacks";
import { useSkinPack } from "@/lib/skinPackContext";
import type { PhoneView } from "@/lib/phoneActions";
import type { RoleId } from "@/lib/roles";

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
  const { skinPackId } = useSkinPack();
  const text = getTranslation(language).ui.monkeyReveal;
  const revealed = session.monkeyReveal;
  const target = session.players.find((p) => p.id === (revealed?.targetPlayerId ?? selected));
  return <>
    {session.visible === false && onReopen && (
      <Button variant="secondary" disabled={pending || !connected} onClick={onReopen}>
        <Eye className="mr-2 h-4 w-4" />{text.reopen}
      </Button>
    )}
    <Dialog open={session.visible !== false} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent showCloseButton={false} className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getRoleLabel("v26", language)}</DialogTitle>
          <DialogDescription>{revealed ? target?.name : text.choose}</DialogDescription>
        </DialogHeader>
        {revealed ? (
          <div className="flex flex-col items-center gap-3" data-testid="monkey-revealed-card">
            <button type="button" onClick={() => onRoleClick?.(revealed.roleId)} className="block rounded-lg">
              <img className="h-56 w-56 rounded-lg object-contain" src={resolveRoleImage(revealed.roleId, { skinPackId }).src}
                alt={getRoleLabel(revealed.roleId, language)} />
            </button>
            <p className="font-display">{getRoleLabel(revealed.roleId, language)}</p>
          </div>
        ) : <>
          <PhoneActionScreen session={session} playerId="monkey-selection" language={language}
            pending={pending} connected={connected} selectedPlayerId={selected}
            onSend={(_type, id) => { if (id) setSelected(id); }} />
          {session.error && <p role="status" className="text-sm text-muted-foreground">{text.noCard}</p>}
          <Button disabled={!target?.selectable || pending || !connected} onClick={() => target && onConfirm(target.id)}>
            <Eye className="mr-2 h-4 w-4" />{text.confirm}{target ? `: ${target.name}` : ""}
          </Button>
        </>}
        <Button variant="secondary" onClick={onClose} disabled={pending || !connected}>
          <X className="mr-2 h-4 w-4" />{text.close}
        </Button>
      </DialogContent>
    </Dialog>
  </>;
}
