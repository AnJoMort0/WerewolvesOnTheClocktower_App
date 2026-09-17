import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useT, useLanguage, getEffectLabel } from "@/lib/i18n";
import type { StatusEffect } from "@/lib/effects";
import poisonedIcon from "@/assets/display/icons/poisoned.webp";
import ghostIcon from "@/assets/display/icons/ghost.webp";
import illusionIcon from "@/assets/display/icons/illusion.webp";
import ghostRessurectIcon from "@/assets/display/icons/ghost_ressurect.webp";
import ghostExecutedIcon from "@/assets/display/icons/ghost_executed.webp";
import soldierIcon from "@/assets/display/icons/soldier.webp";
import voteAgainstIcon from "@/assets/display/icons/vote_against.webp";
import voteDoubleIcon from "@/assets/display/icons/vote_double.webp";
import voteInnocentIcon from "@/assets/display/icons/vote_innocent.webp";
import asleepIcon from "@/assets/display/icons/asleep.webp";
import immunityFullIcon from "@/assets/display/icons/imunity_full.webp";
import ghostProphecyIcon from "@/assets/display/icons/ghost_prophecy.webp";
import voteAccusedIcon from "@/assets/display/icons/vote_accused.webp";
import voteAccusedLastNightIcon from "@/assets/display/icons/vote_accused_last_nigt.webp";
import werewolfIcon from "@/assets/display/icons/werewolf.webp";
import enemyIcon from "@/assets/display/icons/enemy.webp";
import immunityOnetimeIcon from "@/assets/display/icons/imunity_onetime.webp";
import loverIcon from "@/assets/display/icons/lover.webp";
import immunityCupidIcon from "@/assets/display/icons/imunity_cupid.webp";
import evilBeingIcon from "@/assets/display/icons/evil_being.webp";
import voteRevokedIcon from "@/assets/display/icons/vote_revoked.webp";
import adoptiveDadIcon from "@/assets/display/icons/adoptive_dad.webp";
import burnedIcon from "@/assets/display/icons/burned.webp";
import tetanusIcon from "@/assets/display/icons/tetanus.webp";
import webbedIcon from "@/assets/display/icons/webbed.webp";
import caughtIcon from "@/assets/display/icons/caught.webp";
import spiedOnIcon from "@/assets/display/icons/spied_on.webp";
import immunityWerewolfIcon from "@/assets/display/icons/imunity_werewolf.webp";
import dugUpIcon from "@/assets/display/icons/dug_up.webp";
import idolIcon from "@/assets/display/icons/idol.webp";
import ownerIcon from "@/assets/display/icons/owner.webp";
import dogIdolIcon from "@/assets/display/icons/idol_dog.webp";
import dogAdoptiveDadIcon from "@/assets/display/icons/adoptive_dad_dog.webp";
import dogEnemyIcon from "@/assets/display/icons/enemy_dog.webp";
import dogDugUpIcon from "@/assets/display/icons/dug_up_dog.webp";
import mimeDugUpIcon from "@/assets/display/icons/dug_up_mime.webp";

export type PlayerStatus = "alive" | "poisoned" | "dead-this-night" | "dead";
export type { StatusEffect };

export const STATUS_EFFECT_ICONS: Record<StatusEffect, string> = {
  soldier: soldierIcon,
  vote_against: voteAgainstIcon,
  vote_double: voteDoubleIcon,
  acquitted: voteInnocentIcon,
  host: asleepIcon,
  immunity_full: immunityFullIcon,
  prophecy: ghostProphecyIcon,
  accused: voteAccusedIcon,
  accused_next: voteAccusedLastNightIcon,
  werewolf_turned: werewolfIcon,
  enemy: enemyIcon,
  immunity_onetime: immunityOnetimeIcon,
  lover: loverIcon,
  immunity_cupid: immunityCupidIcon,
  evil_being: evilBeingIcon,
  vote_revoked: voteRevokedIcon,
  adoptive_dad: adoptiveDadIcon,
  burned: burnedIcon,
  immunity_werewolf: immunityWerewolfIcon,
  tetanus: tetanusIcon,
  webbed: webbedIcon,
  caught: caughtIcon,
  spied_on: spiedOnIcon,
  dug_up: dugUpIcon,
  idol: idolIcon,
  idol_dog: dogIdolIcon,
  adoptive_dad_dog: dogAdoptiveDadIcon,
  enemy_dog: dogEnemyIcon,
  dug_up_dog: dogDugUpIcon,
  dug_up_mime: mimeDugUpIcon,
  owner: ownerIcon,
};

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
  showExecutado?: boolean;
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
  showExecutado = false,
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
      icon: ghostRessurectIcon,
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
