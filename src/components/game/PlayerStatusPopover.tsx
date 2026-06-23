import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useT, useLanguage, getEffectLabel } from "@/lib/i18n";
import poisonedIcon from "@/assets/icons/poisoned.png";
import ghostIcon from "@/assets/icons/ghost.png";
import illusionIcon from "@/assets/icons/illusion.png";
import ghostRessurectIcon from "@/assets/icons/ghost_ressurect.png";
import ghostExecutedIcon from "@/assets/icons/ghost_executed.png";
import soldierIcon from "@/assets/icons/soldier.png";
import voteAgainstIcon from "@/assets/icons/vote_against.png";
import voteDoubleIcon from "@/assets/icons/vote_double.png";
import voteInnocentIcon from "@/assets/icons/vote_innocent.png";
import asleepIcon from "@/assets/icons/asleep.png";
import immunityFullIcon from "@/assets/icons/imunity_full.png";
import ghostProphecyIcon from "@/assets/icons/ghost_prophecy.png";
import voteAccusedIcon from "@/assets/icons/vote_accused.png";
import werewolfIcon from "@/assets/icons/werewolf.png";
import enemyIcon from "@/assets/icons/enemy.png";
import immunityOnetimeIcon from "@/assets/icons/imunity_onetime.png";
import loverIcon from "@/assets/icons/lover.png";
import immunityCupidIcon from "@/assets/icons/imunity_cupid.png";
import evilBeingIcon from "@/assets/icons/evil_being.png";
import voteRevokedIcon from "@/assets/icons/vote_revoked.png";
import adoptiveDadIcon from "@/assets/icons/adoptive_dad.png";
import burnedIcon from "@/assets/icons/burned.png";
import tetanusIcon from "@/assets/icons/tetanus.png";
import webbedIcon from "@/assets/icons/webbed.png";
import caughtIcon from "@/assets/icons/caught.png";
import spiedOnIcon from "@/assets/icons/spied_on.png";
import immunityWerewolfIcon from "@/assets/icons/imunity_werewolf.png";

export type PlayerStatus = "alive" | "poisoned" | "dead-this-night" | "dead";

export type StatusEffect =
  | "soldado"
  | "vote_against"
  | "vote_double"
  | "inocentado"
  | "hospede"
  | "immunity_full"
  | "profecia"
  | "acusado"
  | "werewolf_turned"
  | "enemy"
  | "immunity_onetime"
  | "namorado"
  | "immunity_cupid"
  | "evil_being"
  | "vote_revoked"
  | "adoptive_dad"
  | "incendiado"
  | "immunity_werewolf"
  | "tetanus"
  | "webbed"
  | "caught"
  | "spied_on";

export const STATUS_EFFECT_ICONS: Record<StatusEffect, string> = {
  soldado: soldierIcon,
  vote_against: voteAgainstIcon,
  vote_double: voteDoubleIcon,
  inocentado: voteInnocentIcon,
  hospede: asleepIcon,
  immunity_full: immunityFullIcon,
  profecia: ghostProphecyIcon,
  acusado: voteAccusedIcon,
  werewolf_turned: werewolfIcon,
  enemy: enemyIcon,
  immunity_onetime: immunityOnetimeIcon,
  namorado: loverIcon,
  immunity_cupid: immunityCupidIcon,
  evil_being: evilBeingIcon,
  vote_revoked: voteRevokedIcon,
  adoptive_dad: adoptiveDadIcon,
  incendiado: burnedIcon,
  immunity_werewolf: immunityWerewolfIcon,
  tetanus: tetanusIcon,
  webbed: webbedIcon,
  caught: caughtIcon,
  spied_on: spiedOnIcon,
};

/** @deprecated Use getEffectLabel(effect, lang) instead for i18n. */
export const STATUS_EFFECT_LABELS: Record<StatusEffect, string> = {
  soldado: "Soldado",
  vote_against: "2 Votos Contra",
  vote_double: "Vota a Dobrar",
  inocentado: "Inocentado",
  hospede: "Hóspede",
  immunity_full: "Imunidade Total",
  profecia: "Profecía",
  acusado: "Acusado",
  werewolf_turned: "Virar Lobisomem",
  enemy: "Inimigo",
  immunity_onetime: "Imunidade Única",
  namorado: "Namorado",
  immunity_cupid: "Imunidade de Cúpido",
  evil_being: "Criatura Malvada",
  vote_revoked: "Voto Roubado",
  adoptive_dad: "Pai Adotivo",
  incendiado: "Incendiado",
  immunity_werewolf: "Imunidade Lobisomens",
  tetanus: "Tétano",
  webbed: "Fazer uma Teia",
  caught: "Apanhado",
  spied_on: "Espiado",
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
  /** When true, hide the Envenenar option (Bruxa Malvada is perma-dead) */
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

        {/* Allow poison toggle on perma-dead too (for dead Bruxa exception cases) */}
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
