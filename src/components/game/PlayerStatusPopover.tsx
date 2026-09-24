import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useT, useLanguage, getEffectLabel } from "@/lib/i18n";
import type { PlayerStatus, StatusEffect } from "@/lib/effects";
import { STATUS_EFFECT_ICONS } from "@/lib/effectPresentation";
import poisonedIcon from "@/assets/display/icons/poisoned.webp";
import ghostIcon from "@/assets/display/icons/ghost.webp";
import illusionIcon from "@/assets/display/icons/illusion.webp";
import ghostResurrectIcon from "@/assets/display/icons/ghost_resurrect.webp";
import ghostExecutedIcon from "@/assets/display/icons/ghost_executed.webp";

interface PlayerStatusPopoverProps {
  children: React.ReactNode;
  status: PlayerStatus;
  isPermanentlyDead?: boolean;
  isPoisoned?: boolean;
  onSetPoisoned: () => void;
  onSetDead: () => void;
  onSetAlive: () => void;
  onSetPermaDead?: () => void;
  onSetIllusion?: () => void;
  onSetExecuted?: () => void;
  onToggleEffect?: (effect: StatusEffect) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showPoison?: boolean;
  showIllusion?: boolean;
  isIllusion?: boolean;
  activeEffects?: Set<StatusEffect>;
  availableEffects?: StatusEffect[];
  /** When true, hide the poison option (Evil Witch is perma-dead) */
  poisonDisabled?: boolean;
}

export const PlayerStatusPopover = ({
  children,
  status,
  isPermanentlyDead,
  isPoisoned = false,
  onSetPoisoned,
  onSetDead,
  onSetAlive,
  onSetPermaDead,
  onSetIllusion,
  onSetExecuted,
  onToggleEffect,
  open,
  onOpenChange,
  showPoison = true,
  showIllusion = false,
  isIllusion = false,
  activeEffects = new Set(),
  availableEffects = [],
  poisonDisabled = false,
}: PlayerStatusPopoverProps) => {
  const t = useT();
  const lang = useLanguage();
  const activeEffectsList = Array.from(activeEffects);
  const canPoison = showPoison && !poisonDisabled;

  // Removal entries collected at bottom for consistency
  type Remover = { key: string; icon: string; label: string; onClick: () => void; className: string };
  const removers: Remover[] = [];

  if (isPermanentlyDead || status === "dead-this-night") {
    removers.push({
      key: "alive",
      icon: ghostResurrectIcon,
      label: t("actionResurrect"),
      onClick: onSetAlive,
      className: "text-green-400 hover:text-green-300",
    });
  }
  if (isPoisoned) {
    removers.push({
      key: "poison",
      icon: poisonedIcon,
      label: t("removePoison"),
      onClick: onSetPoisoned,
      className: "text-green-400 hover:text-green-300",
    });
  }
  if (isIllusion && onSetIllusion) {
    removers.push({
      key: "illusion",
      icon: illusionIcon,
      label: t("removeIllusion"),
      onClick: onSetIllusion,
      className: "text-purple-400 hover:text-purple-300",
    });
  }
  for (const effect of activeEffectsList) {
    removers.push({
      key: `eff-${effect}`,
      icon: STATUS_EFFECT_ICONS[effect],
      label: `${t("removePrefix")}${getEffectLabel(effect, lang)}`,
      onClick: () => onToggleEffect?.(effect),
      className: "text-blue-400 hover:text-blue-300",
    });
  }

  const showAliveActions = !isPermanentlyDead && status !== "dead-this-night";

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-auto p-2 flex flex-col gap-1 max-h-[400px] overflow-y-auto" side="top" align="center">
        {/* Action verbs at top */}
        {showAliveActions && (
          <>
            {canPoison && !isPoisoned && (
              <Button size="sm" variant="ghost" className="justify-start gap-2 text-muted-foreground hover:text-green-300" onClick={onSetPoisoned}>
                <img src={poisonedIcon} alt="" className="h-4 w-4" />
                {t("actionPoison")}
              </Button>
            )}
            <Button size="sm" variant="ghost" className="justify-start gap-2 text-destructive hover:text-destructive/80" onClick={onSetDead}>
              <img src={ghostIcon} alt="" className="h-4 w-4" />
              {t("actionKill")}
            </Button>
            {onSetExecuted && (
              <Button size="sm" variant="ghost" className="justify-start gap-2 text-orange-400 hover:text-orange-300" onClick={onSetExecuted}>
                <img src={ghostExecutedIcon} alt="" className="h-4 w-4" />
                {t("actionExecute")}
              </Button>
            )}
            {showIllusion && onSetIllusion && !isIllusion && (
              <Button size="sm" variant="ghost" className="justify-start gap-2 text-muted-foreground hover:text-purple-300" onClick={onSetIllusion}>
                <img src={illusionIcon} alt="" className="h-4 w-4" />
                {t("actionIllusion")}
              </Button>
            )}
          </>
        )}

        {status === "dead-this-night" && !isPermanentlyDead && onSetPermaDead && (
          <Button size="sm" variant="ghost" className="justify-start gap-2 text-muted-foreground hover:text-muted-foreground/80" onClick={onSetPermaDead}>
            <img src={ghostIcon} alt="" className="h-4 w-4 opacity-50" />
            {t("actionPermaDeath")}
          </Button>
        )}

        {/* Allow poison toggle on perma-dead too (for dead Witch exception cases) */}
        {(isPermanentlyDead || status === "dead-this-night") && canPoison && !isPoisoned && (
          <Button size="sm" variant="ghost" className="justify-start gap-2 text-muted-foreground hover:text-green-300" onClick={onSetPoisoned}>
            <img src={poisonedIcon} alt="" className="h-4 w-4" />
            {t("actionPoison")}
          </Button>
        )}
        {(status === "dead-this-night") && showIllusion && onSetIllusion && !isIllusion && (
          <Button size="sm" variant="ghost" className="justify-start gap-2 text-muted-foreground hover:text-purple-300" onClick={onSetIllusion}>
            <img src={illusionIcon} alt="" className="h-4 w-4" />
            {t("actionIllusion")}
          </Button>
        )}

        {/* Available effects to add */}
        {availableEffects
          .filter((eff) => !activeEffects.has(eff))
          .map((effect) => (
            <Button
              key={effect}
              size="sm"
              variant="ghost"
              className="justify-start gap-2 text-muted-foreground hover:text-blue-300"
              onClick={() => onToggleEffect?.(effect)}
            >
              {STATUS_EFFECT_ICONS[effect] && (
                <img src={STATUS_EFFECT_ICONS[effect]} alt="" className="h-4 w-4" />
              )}
              {getEffectLabel(effect, lang)}
            </Button>
          ))}

        {/* All removers collected at bottom */}
        {removers.length > 0 && (
          <>
            <div className="border-t border-border/30 my-1" />
            {removers.map((r) => (
              <Button
                key={r.key}
                size="sm"
                variant="ghost"
                className={`justify-start gap-2 ${r.className}`}
                onClick={r.onClick}
              >
                {r.icon && <img src={r.icon} alt="" className="h-4 w-4" />}
                {r.label}
              </Button>
            ))}
          </>
        )}
      </PopoverContent>
    </Popover>
  );
};
