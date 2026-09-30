import { Check, Move, UserPlus, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { GameModal } from "@/components/game/GameModal";
import { RoleSelector } from "@/components/game/RoleSelector";
import { ROLES, type RoleId } from "@/lib/roles";
import { format, getRoleLabel, getTranslation, t, type Language } from "@/lib/i18n";
import type { TravellerAlignment } from "@/lib/travellers";

export type TravellerControlPlayer = {
  id: string;
  name: string;
  traveller_role: string | null;
  traveller_alignment: string | null;
};

export function TravellerInviteModal({ open, onClose, joinUrl, language }: {
  open: boolean;
  onClose: () => void;
  joinUrl: string;
  language: Language;
}) {
  const copy = getTranslation(language).ui.travellers;
  return <GameModal open={open} onClose={onClose} title={copy.qrTitle} subtitle={copy.qrDescription} closeLabel={t("close", language)}>
    <div className="flex flex-col items-center gap-4 py-3">
      <div className="rounded-xl bg-parchment p-4 shadow-lg">
        <QRCodeSVG value={joinUrl} size={280} bgColor="hsl(40, 30%, 85%)" fgColor="hsl(30, 10%, 8%)" />
      </div>
      <p className="break-all text-center text-xs text-muted-foreground">{joinUrl}</p>
    </div>
  </GameModal>;
}

export function TravellerRequestPanel({ player, language, onAccept, onDeny }: {
  player: TravellerControlPlayer;
  language: Language;
  onAccept: () => void;
  onDeny: () => void;
}) {
  const copy = getTranslation(language).ui.travellers;
  return <aside className="fixed right-4 top-4 z-[70] w-[calc(100vw-2rem)] max-w-sm rounded-xl border border-gold/60 bg-card p-4 shadow-2xl paper-texture">
    <div className="flex items-start gap-3">
      <UserPlus className="mt-0.5 h-6 w-6 shrink-0 text-gold" />
      <div className="min-w-0 flex-1">
        <h2 className="font-display text-lg text-gold">{copy.requestTitle}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{format(copy.requestDescription, { name: player.name })}</p>
      </div>
    </div>
    <div className="mt-4 grid grid-cols-2 gap-2">
      <Button type="button" variant="secondary" onClick={onDeny}><X className="mr-2 h-4 w-4" />{copy.deny}</Button>
      <Button type="button" onClick={onAccept}><Check className="mr-2 h-4 w-4" />{copy.accept}</Button>
    </div>
  </aside>;
}

export function TravellerAssignmentCard({ player, roleId, alignment, language, onRoleChange, onConfirm }: {
  player: TravellerControlPlayer;
  roleId: RoleId;
  alignment: TravellerAlignment;
  language: Language;
  onRoleChange: (roleId: RoleId) => void;
  onConfirm: () => void;
}) {
  const copy = getTranslation(language).ui.travellers;
  return <section className="space-y-3 rounded-lg border border-gold/50 bg-gold/5 p-3">
    <div className="flex items-center gap-3">
      <img src={ROLES[roleId].image} alt="" className="h-12 w-12 rounded-md" />
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-display text-gold">{player.name}</h3>
        <p className={`text-xs font-semibold ${alignment === "evil" ? "text-destructive" : "text-emerald-300"}`}>
          {alignment === "evil" ? copy.alignmentEvil : copy.alignmentVillager}
        </p>
      </div>
    </div>
    <RoleSelector value={roleId} onChange={onRoleChange} travellerOnly />
    <Button type="button" className="w-full font-display" onClick={onConfirm}>
      {copy.confirmAssignment}
    </Button>
  </section>;
}

export function TravellerPlacementToken({ player, roleId, language }: {
  player: TravellerControlPlayer;
  roleId: RoleId;
  language: Language;
}) {
  const copy = getTranslation(language).ui.travellers;
  return <div className="flex max-w-44 flex-col items-center gap-2 rounded-xl border border-dashed border-gold bg-card/95 p-3 text-center shadow-xl">
    <p className="text-[10px] text-muted-foreground">{copy.placeInstruction}</p>
    <div
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("playerId", player.id);
        event.dataTransfer.effectAllowed = "move";
      }}
      className="cursor-grab rounded-full border-2 border-gold bg-gold/10 p-1 shadow-[0_0_16px_rgba(234,179,8,0.35)] active:cursor-grabbing"
      title={`${player.name} — ${getRoleLabel(roleId, language)}`}
    >
      <img src={ROLES[roleId].image} alt="" className="h-14 w-14 rounded-full" />
    </div>
    <p className="max-w-full truncate font-display text-sm text-gold">{player.name}</p>
    <Move className="h-4 w-4 text-gold" />
  </div>;
}
