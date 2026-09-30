import { ShieldCheck, Skull, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GameModal } from "@/components/game/GameModal";
import { ROLES, type RoleId } from "@/lib/roles";
import { getRoleLabel, getTranslation, t, type Language } from "@/lib/i18n";
import type { TravellerAlignment } from "@/lib/travellers";
import werewolfIcon from "@/assets/display/icons/werewolf.webp";

type AlignmentPlayer = {
  id: string;
  name: string;
  isWerewolf: boolean;
  isAlive?: boolean;
};

export function TravellerAlignmentModal({
  open,
  language,
  alignment,
  roleId,
  players,
  gmMirror = false,
  onAcknowledge,
}: {
  open: boolean;
  language: Language;
  alignment: TravellerAlignment;
  roleId: RoleId;
  players: AlignmentPlayer[];
  gmMirror?: boolean;
  onAcknowledge: () => void;
}) {
  const copy = getTranslation(language).ui.travellers;
  const evil = alignment === "evil";
  const total = Math.max(players.length, 1);

  return <GameModal
    open={open}
    onClose={onAcknowledge}
    title={evil ? copy.revealEvilTitle : copy.revealVillagerTitle}
    subtitle={evil ? copy.revealEvilBody : copy.revealVillagerBody}
    closeLabel={t("close", language)}
    dismissible={false}
    showCloseButton={gmMirror}
    wide={evil}
    className={evil ? "border-destructive/70" : "border-emerald-500/60"}
    footer={!gmMirror ? <Button type="button" onClick={onAcknowledge} className="w-full font-display tracking-wider">
      {copy.understood}
    </Button> : undefined}
  >
    <div className="space-y-5 text-center">
      <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 ${evil ? "border-destructive bg-destructive/15 text-destructive" : "border-emerald-400 bg-emerald-500/15 text-emerald-300"}`}>
        {evil ? <Skull className="h-10 w-10" /> : <ShieldCheck className="h-10 w-10" />}
      </div>
      <div className="flex items-center justify-center gap-3 rounded-lg border border-border/60 bg-background/40 p-3">
        <img src={ROLES[roleId].image} alt="" className="h-12 w-12 rounded-md" />
        <div className="text-left">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{copy.publicRole}</p>
          <p className="font-display text-lg">{getRoleLabel(roleId, language)}</p>
        </div>
      </div>
      {evil && <div className="space-y-3">
        <p className="font-display text-sm text-destructive">{copy.revealWerewolves}</p>
        <div className="relative mx-auto" style={{ width: 300, height: 300 }}>
          {players.map((player, index) => {
            const angle = (2 * Math.PI * index) / total - Math.PI / 2;
            const x = 126 * Math.cos(angle) + 150;
            const y = 126 * Math.sin(angle) + 150;
            return <div key={player.id} className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center" style={{ left: x, top: y }}>
              <span className={`relative flex h-11 w-11 items-center justify-center rounded-full border-2 ${player.isWerewolf ? "border-destructive bg-destructive/25 shadow-[0_0_14px_hsl(var(--destructive)/0.55)]" : "border-border/50 bg-card"} ${player.isAlive === false ? "opacity-50 grayscale" : ""}`}>
                {player.isWerewolf
                  ? <img src={werewolfIcon} alt="" className="h-8 w-8 rounded-full" />
                  : <span className="font-display text-xs font-bold">{player.name.charAt(0).toUpperCase()}</span>}
                {player.isAlive === false && <X className="absolute h-7 w-7 text-muted-foreground" strokeWidth={3} />}
              </span>
              <span className={`mt-1 max-w-20 truncate text-[10px] ${player.isWerewolf ? "font-semibold text-destructive" : "text-muted-foreground"}`}>{player.name}</span>
            </div>;
          })}
        </div>
      </div>}
    </div>
  </GameModal>;
}
