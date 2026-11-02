import type { RoleId } from "@/lib/roles";

/** The owner's Beginner Mode selection; the rulebook keeps its own display order. */
export const BEGINNER_ROLE_IDS: readonly RoleId[] = [
  "e01", "e02", "e03", "e04",
  "v01", "v02", "v03", "v06", "v07", "v08", "v10", "v11", "v13", "v14", "v17", "v18",
  "m01", "m02", "m04", "s01", "s02", "f01", "f02",
  "l01", "l02", "l04", "l05", "l06",
];

export const BEGINNER_EXTRA_IDS = ["x01", "x02", "x02.1", "x03", "x.s01"] as const;

export const BEGINNER_CHARACTER_IDS: ReadonlySet<string> = new Set([...BEGINNER_ROLE_IDS, ...BEGINNER_EXTRA_IDS]);
export const BEGINNER_ROLE_SET: ReadonlySet<RoleId> = new Set(BEGINNER_ROLE_IDS);
