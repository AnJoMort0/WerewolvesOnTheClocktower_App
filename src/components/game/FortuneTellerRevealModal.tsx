import { useMemo } from "react";
import { ROLES, type RoleId } from "@/lib/roles";
import { useLanguage, getRoleLabel, useT } from "@/lib/i18n";
import { RevealModal, type RevealCard } from "./RevealModal";
import villagerIcon from "@/assets/display/icons/villager.webp";

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

  const cards: RevealCard[] = deadPlayerIds.map((pid) => {
    const player = players.find((p) => p.id === pid);
    const displayRole = isFortuneTellerPoisoned && fakeRoleMap?.[pid]
      ? fakeRoleMap[pid]
      : illusionIds.has(pid) ? "a06" : roleAssignments[pid];
    const roleDef = displayRole ? ROLES[displayRole] : null;
    return {
      name: player?.name ?? "?",
      image: roleDef?.image ?? villagerIcon,
      label: displayRole ? getRoleLabel(displayRole, lang) : "?",
      roleId: roleDef ? displayRole : undefined,
    };
  });

  return <RevealModal open={open} onClose={onClose} language={lang}
    title={t("revealFortuneTellerTitle")} subtitle={t("revealFortuneTellerSubtitle")}
    cards={cards} dismissible={dismissible} onRoleClick={onRoleClick} />;
};
