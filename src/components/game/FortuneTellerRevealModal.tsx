import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { ROLES, type RoleId } from "@/lib/roles";
import { useLanguage, getRoleLabel, useT } from "@/lib/i18n";
import { resolveRoleImage } from "@/lib/skinPacks";
import { useSkinPack } from "@/lib/skinPackContext";
import { Button } from "@/components/ui/button";

interface FortuneTellerRevealModalProps {
  open: boolean;
  onClose: () => void;
  deadPlayerIds: string[];
  illusionPlayerId: string | null;
  illusionPlayerIds?: Iterable<string>;
  roleAssignments: Record<string, RoleId>;
  players: Array<{ id: string; name: string }>;
  isFortuneTellerPoisoned?: boolean;
  precomputedFakeMap?: Record<string, string> | null;
  dismissible?: boolean;
  onRoleClick?: (roleId: RoleId) => void;
}

export const FortuneTellerRevealModal = ({
  open,
  onClose,
  deadPlayerIds,
  illusionPlayerId,
  illusionPlayerIds,
  roleAssignments,
  players,
  isFortuneTellerPoisoned = false,
  precomputedFakeMap = null,
  dismissible = true,
  onRoleClick,
}: FortuneTellerRevealModalProps) => {
  const lang = useLanguage();
  const t = useT();
  const { skinPackId } = useSkinPack();
  const illusionIds = useMemo(
    () => new Set(illusionPlayerIds ?? (illusionPlayerId ? [illusionPlayerId] : [])),
    [illusionPlayerId, illusionPlayerIds],
  );

  const fakeRoleMap = useMemo(() => {
    if (precomputedFakeMap) return precomputedFakeMap as Record<string, RoleId>;
    if (!isFortuneTellerPoisoned || deadPlayerIds.length === 0) return null;

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
  }, [isFortuneTellerPoisoned, deadPlayerIds, roleAssignments, precomputedFakeMap]);

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-4 backdrop-blur-sm"
          onClick={dismissible ? onClose : undefined}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="max-h-[80vh] w-full max-w-lg space-y-6 overflow-y-auto rounded-lg border border-border bg-card p-5 shadow-xl paper-texture sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl text-blue-400">{t("revealFortuneTellerTitle")}</h2>
              {dismissible && (
                <Button type="button" size="icon" variant="ghost" onClick={onClose} aria-label={t("close")} title={t("close")}>
                  <X className="h-5 w-5" />
                </Button>
              )}
            </div>

            <p className="text-muted-foreground text-sm">{t("revealFortuneTellerSubtitle")}</p>

            <div className="grid grid-cols-2 gap-4">
              {deadPlayerIds.map((pid) => {
                const player = players.find((p) => p.id === pid);
                const actualRole = roleAssignments[pid];

                let displayRole: RoleId;
                if (isFortuneTellerPoisoned && fakeRoleMap?.[pid]) {
                  displayRole = fakeRoleMap[pid] as RoleId;
                } else if (illusionIds.has(pid)) {
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
                    className="flex flex-col items-center gap-2 rounded-lg border border-border bg-secondary p-4"
                  >
                    {roleDef && (
                      <button
                        type="button"
                        onClick={() => onRoleClick?.(displayRole)}
                        className="block h-24 w-24 overflow-hidden rounded-md border-2 border-primary/40 shadow-md"
                      >
                        <img
                          src={resolveRoleImage(displayRole, { skinPackId }).src}
                          alt={label}
                          className="w-full h-full object-cover"
                        />
                      </button>
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
