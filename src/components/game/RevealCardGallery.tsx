import { ROLES, type RoleId } from "@/lib/roles";
import { getRoleLabel, type Language } from "@/lib/i18n";
import { resolveRoleImage } from "@/lib/skinPacks";
import { useSkinPack } from "@/lib/skinPackContext";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export type RevealCard = {
  name?: string;
  image: string;
  label: string;
  checkboxes?: boolean[];
  roleId?: RoleId;
  cornerRoleId?: RoleId;
};

/** One layout for all revealed cards, including copied powers and charge markers. */
export function RevealCardGallery({ cards, language, onRoleClick }: {
  cards: RevealCard[];
  language: Language;
  onRoleClick?: (roleId: RoleId) => void;
}) {
  const { skinPackId } = useSkinPack();
  const single = cards.length === 1;
  return <div className={cn("grid gap-3 sm:gap-4", single ? "grid-cols-1" : "grid-cols-2", cards.length >= 3 && cards.length !== 4 && "sm:grid-cols-3")}>
    {cards.map((card, index) => {
      const image = card.roleId ? resolveRoleImage(card.roleId, { skinPackId }).src : card.image;
      const cornerRole = card.cornerRoleId ? ROLES[card.cornerRoleId] : null;
      const imageBlock = <div className={cn("relative aspect-square max-w-full overflow-hidden rounded-lg border-2 border-primary/40 bg-background/30 shadow-md",
        single ? "w-[min(16rem,45dvh)]" : "w-28 sm:w-36")}>
        <img src={image} alt={card.label} className="h-full w-full object-contain" />
        {cornerRole && <img src={resolveRoleImage(card.cornerRoleId!, { skinPackId }).src}
          alt={getRoleLabel(card.cornerRoleId!, language)}
          className={cn("absolute bottom-1 right-1 rounded border border-cyan-300 object-contain shadow",
            single ? "h-12 w-12" : "h-8 w-8")} />}
      </div>;
      return <div key={index} className={cn("flex min-w-0 flex-col items-center gap-2",
        single ? "py-3" : "rounded-lg border border-border bg-secondary/60 p-3 sm:p-4")}>
        {card.roleId && onRoleClick ? <button type="button" onClick={() => onRoleClick(card.roleId!)}
          className="max-w-full rounded-lg transition-colors hover:ring-2 hover:ring-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {imageBlock}
        </button> : imageBlock}
        {card.name && <p className="max-w-full break-words text-center font-body text-sm text-foreground">{card.name}</p>}
        <p className={cn("max-w-full break-words text-center font-display text-blue-400", single ? "text-lg" : "text-sm")}>{card.label}</p>
        {!!card.checkboxes?.length && <div className="mt-1 flex gap-1">
          {card.checkboxes.map((checked, charge) => <Checkbox key={charge} checked={checked} disabled
            className="h-4 w-4 border-primary data-[state=checked]:bg-primary" />)}
        </div>}
      </div>;
    })}
  </div>;
}
