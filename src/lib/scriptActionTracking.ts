import type { ActorPowerState } from "@/lib/actor";
import type { RoleId } from "@/lib/roles";

// The GM may untick a use to correct a mistake. Only spending a use is an action.
const numericUses = ["shamanCharges", "paranoidCharges", "angelCharges", "bigBadWolfCharges", "cupidCharges", "judgeCharges", "accuserCharges"] as const;
const usedFlags = ["foxDisabled", "monkeyDisabled", "werewolfSeerUsed", "vampireWolfUsed", "spiderDayChangeUsed", "motherCurseChangeUsed"] as const;

export function changedPowerUse(before: ActorPowerState, after: ActorPowerState): { used: boolean; indexes: number[] } | null {
  for (const key of numericUses) {
    if (before[key] !== after[key]) return {
      used: after[key] > before[key],
      indexes: [0, 1].filter((index) => (before[key] > index) !== (after[key] > index)),
    };
  }
  for (const key of usedFlags) {
    if (before[key] !== after[key]) return { used: after[key], indexes: [0] };
  }
  return null;
}

export function nightPowerUseKey(nightNumber: number, role: RoleId, actorId: string, useIndex: number): string {
  return `${nightNumber}:${role}:${actorId}:${useIndex}`;
}

export function getNightActors(
  actionLineActors: Record<string, string[]>,
  actionLineKeys: Set<string>,
  usedPowerKeys: Set<string>,
  nightNumber: number,
): Set<string> {
  const prefix = `${nightNumber}:`;
  return new Set([
    ...Object.entries(actionLineActors)
      .filter(([key]) => key.startsWith(prefix) && actionLineKeys.has(key))
      .flatMap(([, ids]) => ids),
    ...[...usedPowerKeys]
      .filter((key) => key.startsWith(prefix))
      .map((key) => key.split(":").slice(2, -1).join(":")),
  ]);
}
