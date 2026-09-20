import { ROLES, type RoleId } from "@/lib/roles";
import { getRoleLabel, t, type Language } from "@/lib/i18n";
import ghostExecutedIcon from "@/assets/display/icons/ghost_executed.webp";
import villagerIcon from "@/assets/display/icons/villager.webp";
import { Button } from "@/components/ui/button";
import { GameModal } from "./GameModal";
import { RevealCardGallery, type RevealCard } from "./RevealCardGallery";

export type { RevealCard } from "./RevealCardGallery";

interface RevealModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  cards: RevealCard[];
  language?: Language;
  dismissible?: boolean;
  actionLabel?: string;
  onRoleClick?: (roleId: RoleId) => void;
}

export const RevealModal = ({ open, onClose, title, subtitle, cards, language = "pt", dismissible = true, actionLabel, onRoleClick }: RevealModalProps) => (
  <GameModal open={open} onClose={onClose} title={title} subtitle={subtitle}
    closeLabel={t("close", language)} dismissible={dismissible} wide={cards.length > 1}
    footer={actionLabel ? <Button type="button" onClick={onClose} className="w-full font-display tracking-wider">
      {actionLabel}
    </Button> : undefined}>
    <RevealCardGallery cards={cards} language={language} onRoleClick={onRoleClick} />
  </GameModal>
);

/** Resolve killer card image + label from a kill source string */
export function resolveKillerCard(
  source: string | undefined,
  roleAssignments: Record<string, RoleId>,
  illusionPlayerId: string | null,
  lang: Language = "pt",
): { image: string; label: string; roleId?: RoleId } {
  if (!source || source === "manual") {
    return { image: villagerIcon, label: t("revealManual", lang) };
  }
  if (source === "executado") {
    return { image: ghostExecutedIcon, label: t("execution", lang) };
  }
  if (illusionPlayerId) {
    const illusionRole = roleAssignments[illusionPlayerId];
    const sourceRole = source === "soldier" || source === "soldado" ? "v09"
      : source === "s01-suicide" ? "s01"
      : source;
    if (illusionRole === sourceRole) {
      const role = ROLES["a06"];
      return { image: role.image, label: getRoleLabel("a06", lang), roleId: "a06" };
    }
  }
  if (source === "soldier" || source === "soldado") {
    const role = ROLES["v09"];
    return { image: role.image, label: t("littleGirlSoldier", lang), roleId: "v09" };
  }
  if (source === "s01-suicide") {
    const role = ROLES["s01"];
    return { image: role.image, label: t("littleGirlSuicide", lang), roleId: "s01" };
  }
  if (source === "e01") {
    const role = ROLES["e01"];
    return { image: role.image, label: t("littleGirlWerewolves", lang), roleId: "e01" };
  }
  if (source === "v07-poisoned") {
    return { image: ROLES["v07"].image, label: getRoleLabel("v07", lang), roleId: "v07" };
  }
  const role = ROLES[source as RoleId];
  if (role) return { image: role.image, label: getRoleLabel(source as RoleId, lang), roleId: source as RoleId };
  return { image: villagerIcon, label: t("unknown", lang) };
}
