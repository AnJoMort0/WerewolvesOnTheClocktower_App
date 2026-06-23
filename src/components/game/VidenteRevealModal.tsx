import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { ROLES, type RoleId } from "@/lib/roles";
import { useLanguage, getRoleLabel, useT } from "@/lib/i18n";

interface VidenteRevealModalProps {
  open: boolean;
  onClose: () => void;
  deadPlayerIds: string[];
  illusionPlayerId: string | null;
  roleAssignments: Record<string, RoleId>;
  players: Array<{ id: string; name: string }>;
  isVidentePoisoned?: boolean;
  precomputedFakeMap?: Record<string, string> | null;
}

function rulebookUrl(lang: "pt" | "fr", roleId: RoleId): string {
  const file = lang === "fr" ? "Rulebook_FR.html" : "Rulebook_PT.html";
  return `https://anjomort0.github.io/WerewolvesOnTheClocktower/${file}#${roleId}`;
}

export const VidenteRevealModal = ({
  open,
  onClose,
  deadPlayerIds,
  illusionPlayerId,
  roleAssignments,
  players,
  isVidentePoisoned = false,
  precomputedFakeMap = null,
}: VidenteRevealModalProps) => {
  const lang = useLanguage();
  const t = useT();

  const fakeRoleMap = useMemo(() => {
    if (precomputedFakeMap) return precomputedFakeMap as Record<string, RoleId>;
    if (!isVidentePoisoned || deadPlayerIds.length === 0) return null;

    const inPlayRoles = Object.values(roleAssignments).filter((r) => r !== "e04");
    const uniqueInPlay = [...new Set(inPlayRoles)];
    const deadActualRoles = new Set(deadPlayerIds.map((pid) => roleAssignments[pid]).filter(Boolean));
    const candidateRoles = uniqueInPlay.filter((r) => !deadActualRoles.has(r));

    const map: Record<string, RoleId> = {};
    const usedIndices = new Set<number>();

    for (const pid of deadPlayerIds) {
      if (candidateRoles.length === 0) break;
      let idx: number;
      do {
        idx = Math.floor(Math.random() * candidateRoles.length);
      } while (usedIndices.has(idx) && usedIndices.size < candidateRoles.length);
      usedIndices.add(idx);
      map[pid] = candidateRoles[idx];
    }
    return map;
  }, [isVidentePoisoned, deadPlayerIds, roleAssignments, precomputedFakeMap]);

  if (!open) return null;

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
            className="bg-card border border-border rounded-2xl p-6 max-w-lg w-full space-y-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl text-blue-400">{t("revealVidenteTitle")}</h2>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-muted-foreground text-sm">{t("revealVidenteSubtitle")}</p>

            <div className="grid grid-cols-2 gap-4">
              {deadPlayerIds.map((pid) => {
                const player = players.find((p) => p.id === pid);
                const actualRole = roleAssignments[pid];

                let displayRole: RoleId;
                if (isVidentePoisoned && fakeRoleMap?.[pid]) {
                  displayRole = fakeRoleMap[pid] as RoleId;
                } else if (pid === illusionPlayerId) {
                  displayRole = "a06" as RoleId;
                } else {
                  displayRole = actualRole;
                }

                const roleDef = displayRole ? ROLES[displayRole] : null;
                const label = displayRole ? getRoleLabel(displayRole, lang) : "?";

                return (
                  <motion.div
                    key={pid}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-secondary border border-border rounded-xl p-4 flex flex-col items-center gap-2"
                  >
                    {roleDef && (
                      <a
                        href={rulebookUrl(lang, displayRole)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-24 h-24 rounded-xl overflow-hidden border-2 border-primary/40 shadow-lg block"
                      >
                        <img
                          src={roleDef.image}
                          alt={label}
                          className="w-full h-full object-cover"
                        />
                      </a>
                    )}
                    <span className="font-body text-sm text-foreground">{player?.name ?? "?"}</span>
                    <span className="font-display text-xs text-blue-400">{label}</span>
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
