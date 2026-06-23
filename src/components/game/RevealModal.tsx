import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { ROLES, type RoleId } from "@/lib/roles";
import { getRoleLabel, t, type Language } from "@/lib/i18n";
import ghostExecutedIcon from "@/assets/icons/ghost_executed.png";
import villagerIcon from "@/assets/icons/villager.png";
import { Checkbox } from "@/components/ui/checkbox";

export type RevealCard = {
  /** Optional player name (Menina shows; Faroleiro hides) */
  name?: string;
  /** Image URL to display */
  image: string;
  /** Label under the image */
  label: string;
  /** Optional checkbox state for Faroleiro reveal */
  checkboxes?: boolean[];
  /** Optional roleId so the card image can link to the rulebook anchor */
  roleId?: RoleId;
};

interface RevealModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  cards: RevealCard[];
  /** When provided, card images become anchor links to the rulebook */
  language?: Language;
}

function rulebookUrl(lang: Language | undefined, roleId: RoleId | undefined): string | null {
  if (!roleId) return null;
  const file = (lang === "fr") ? "Rulebook_FR.html" : "Rulebook_PT.html";
  return `https://anjomort0.github.io/WerewolvesOnTheClocktower/${file}#${roleId}`;
}

export const RevealModal = ({ open, onClose, title, subtitle, cards, language }: RevealModalProps) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-card border border-border rounded-2xl p-6 max-w-lg w-full space-y-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl text-blue-400">{title}</h2>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {subtitle && <p className="text-muted-foreground text-sm">{subtitle}</p>}

            <div className="grid grid-cols-2 gap-4">
              {cards.map((c, i) => {
                const href = rulebookUrl(language, c.roleId);
                const imageBlock = (
                  <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-primary/40 shadow-lg">
                    <img src={c.image} alt={c.label} className="w-full h-full object-cover" />
                  </div>
                );
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-secondary border border-border rounded-xl p-4 flex flex-col items-center gap-2"
                  >
                    {href ? (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="block">
                        {imageBlock}
                      </a>
                    ) : imageBlock}
                    {c.name && <span className="font-body text-sm text-foreground">{c.name}</span>}
                    <span className="font-display text-xs text-blue-400 text-center">{c.label}</span>
                    {c.checkboxes && (
                      <div className="flex gap-1 mt-1">
                        {c.checkboxes.map((checked, idx) => (
                          <Checkbox key={idx} checked={checked} disabled className="h-4 w-4 border-primary data-[state=checked]:bg-primary" />
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

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
  if (source === "soldado") {
    const role = ROLES["v09"];
    return { image: role.image, label: getRoleLabel("v09", lang), roleId: "v09" };
  }
  if (illusionPlayerId) {
    const illusionRole = roleAssignments[illusionPlayerId];
    if (illusionRole === source) {
      const role = ROLES["a06"];
      return { image: role.image, label: getRoleLabel("a06", lang), roleId: "a06" };
    }
  }
  if (source === "v07-poisoned") {
    return { image: ROLES["v07"].image, label: getRoleLabel("v07", lang), roleId: "v07" };
  }
  const role = ROLES[source as RoleId];
  if (role) return { image: role.image, label: getRoleLabel(source as RoleId, lang), roleId: source as RoleId };
  return { image: villagerIcon, label: t("unknown", lang) };
}
