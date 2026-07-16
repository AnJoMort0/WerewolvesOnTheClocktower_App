import {
  ROLES,
  WEREWOLF_ROLES,
  getExpectedWerewolfCount,
  isUniqueRole,
  type RoleId,
} from "@/lib/roles";
import {
  format,
  getRoleLabel,
  getValidation,
  type Language,
} from "@/lib/i18n";

export const ESSENTIAL_ROLES: RoleId[] = ["e02", "e03", "e04"];

export function getDuplicateUniqueRoles(roleIds: readonly RoleId[]): Set<RoleId> {
  const counts = countRoles(roleIds);
  const duplicates = new Set<RoleId>();
  for (const [roleId, count] of Object.entries(counts) as Array<[RoleId, number]>) {
    if (roleId === "l03" && count <= 2) continue;
    if (roleId === "l04" && count <= 3) continue;
    if (isUniqueRole(roleId) && count > 1) duplicates.add(roleId);
  }
  return duplicates;
}

export function validateRoleSelection(roleIds: readonly RoleId[], language: Language): string[] {
  const warnings: string[] = [];
  const assignedRoles = new Set(roleIds);

  for (const essential of ESSENTIAL_ROLES) {
    if (!assignedRoles.has(essential)) {
      warnings.push(format(getValidation("essentialMissing", language), { label: getRoleLabel(essential, language) }));
    }
  }

  const expectedWerewolves = getExpectedWerewolfCount(roleIds.length);
  const werewolfCount = roleIds.filter((roleId) => WEREWOLF_ROLES.includes(roleId)).length;
  if (werewolfCount < expectedWerewolves) {
    warnings.push(format(getValidation("fewWerewolves", language), { n: werewolfCount, expected: expectedWerewolves }));
  }

  const counts = countRoles(roleIds);
  for (const roleId of getDuplicateUniqueRoles(roleIds)) {
    if (roleId === "l03" || roleId === "l04") continue;
    warnings.push(format(getValidation("duplicateRole", language), { label: getRoleLabel(roleId, language), n: counts[roleId] }));
  }

  if (assignedRoles.has("v08b") && !assignedRoles.has("v08")) {
    warnings.push(getValidation("littleRedNeedsHunter", language));
  }

  if (assignedRoles.has("as01b") && !assignedRoles.has("s01")) {
    warnings.push(getValidation("secretLoverNeedsCupid", language));
  }

  const sistersCount = roleIds.filter((roleId) => roleId === "l03").length;
  if (assignedRoles.has("l03") && sistersCount !== 2) {
    warnings.push(format(getValidation("sistersCount", language), { n: sistersCount }));
  }

  const brothersCount = roleIds.filter((roleId) => roleId === "l04").length;
  if (assignedRoles.has("l04") && brothersCount !== 3) {
    warnings.push(format(getValidation("brothersCount", language), { n: brothersCount }));
  }

  return warnings;
}

function addOrReplaceRole(
  roleIds: RoleId[],
  roleId: RoleId,
  protectedRoles: Set<RoleId>,
  options: { allowDuplicate?: boolean } = {},
) {
  if (!options.allowDuplicate && roleIds.includes(roleId)) return false;
  const replacementIndex = findReplacementIndex(roleIds, protectedRoles, roleId);
  if (replacementIndex >= 0) {
    roleIds[replacementIndex] = roleId;
    protectedRoles.add(roleId);
    return true;
  }
  return false;
}

function findReplacementIndex(roleIds: RoleId[], protectedRoles: Set<RoleId>, replacementRole: RoleId): number {
  const counts = countRoles(roleIds);
  const duplicateUniqueIndex = roleIds.findIndex((roleId) => {
    if (roleId === replacementRole) return false;
    if (protectedRoles.has(roleId)) return false;
    if (!isUniqueRole(roleId)) return false;
    if (roleId === "l03" || roleId === "l04") return false;
    return counts[roleId] > 1;
  });
  if (duplicateUniqueIndex >= 0) return duplicateUniqueIndex;

  const fillerIndex = roleIds.findIndex((roleId) => roleId !== replacementRole && roleId === "l01" && !protectedRoles.has(roleId));
  if (fillerIndex >= 0) return fillerIndex;

  const optionalIndex = roleIds.findIndex((roleId) => {
    if (roleId === replacementRole) return false;
    if (protectedRoles.has(roleId)) return false;
    if (ESSENTIAL_ROLES.includes(roleId)) return false;
    if (WEREWOLF_ROLES.includes(roleId)) return false;
    if (roleId === "l03" || roleId === "l04") return false;
    if (roleIds.some((otherRoleId) => ROLES[otherRoleId].requires === roleId)) return false;
    return true;
  });
  if (optionalIndex >= 0) return optionalIndex;

  return roleIds.findIndex((roleId) => roleId !== replacementRole && !protectedRoles.has(roleId));
}

function countRoles(roleIds: readonly RoleId[]): Record<RoleId, number> {
  return roleIds.reduce((counts, roleId) => {
    counts[roleId] = (counts[roleId] ?? 0) + 1;
    return counts;
  }, {} as Record<RoleId, number>);
}

function normalizeGroupCount(roleIds: RoleId[], roleId: RoleId, expected: number, protectedRoles: Set<RoleId>) {
  let count = roleIds.filter((id) => id === roleId).length;
  if (count === 0) return;

  while (count < expected) {
    if (!addOrReplaceRole(roleIds, roleId, protectedRoles, { allowDuplicate: true })) break;
    count = roleIds.filter((id) => id === roleId).length;
  }

  while (count > expected) {
    let index = -1;
    for (let i = roleIds.length - 1; i >= 0; i -= 1) {
      if (roleIds[i] === roleId) {
        index = i;
        break;
      }
    }
    if (index < 0) break;
    roleIds[index] = "l01";
    count -= 1;
  }
}

function normalizeUniqueDuplicates(roleIds: RoleId[]) {
  const counts = countRoles(roleIds);
  const kept = new Map<RoleId, number>();
  for (let index = 0; index < roleIds.length; index += 1) {
    const roleId = roleIds[index];
    if (roleId === "l03" || roleId === "l04" || !isUniqueRole(roleId) || counts[roleId] <= 1) continue;
    const currentKept = kept.get(roleId) ?? 0;
    if (currentKept === 0) {
      kept.set(roleId, 1);
      continue;
    }
    roleIds[index] = "l01";
  }
}

export function autoFixRoleSelection(roleIds: readonly RoleId[]): RoleId[] {
  const next = [...roleIds];
  const protectedRoles = new Set<RoleId>();

  for (const roleId of ESSENTIAL_ROLES) {
    addOrReplaceRole(next, roleId, protectedRoles);
  }

  const expectedWerewolves = getExpectedWerewolfCount(next.length);
  while (next.filter((roleId) => WEREWOLF_ROLES.includes(roleId)).length < expectedWerewolves) {
    if (!addOrReplaceRole(next, "e01", protectedRoles, { allowDuplicate: true })) break;
    const werewolfCount = next.filter((roleId) => WEREWOLF_ROLES.includes(roleId)).length;
    if (werewolfCount >= expectedWerewolves) break;
  }

  if (next.includes("v08b")) addOrReplaceRole(next, "v08", protectedRoles);
  if (next.includes("as01b")) addOrReplaceRole(next, "s01", protectedRoles);

  normalizeGroupCount(next, "l03", 2, protectedRoles);
  normalizeGroupCount(next, "l04", 3, protectedRoles);
  normalizeUniqueDuplicates(next);

  return next;
}
