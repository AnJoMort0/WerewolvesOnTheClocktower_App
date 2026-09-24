import type { RoleId } from "@/lib/roles";

/**
 * Drag actions shared by the night script, player circle, and GM player list.
 * Screen-specific actions (such as the Werewolf hunt) stay with their screen.
 */
export const ROLE_DRAG_ACTIONS = {
  v08: "role-v08",
  v09: "role-v09",
  v10: "role-v10",
  v11: "role-v11",
  v12: "role-v12",
  v15: "role-v15",
  v16: "role-v16",
  v17: "role-v17",
  v18: "role-v18",
  v19: "role-v19",
  v22: "role-v22",
  v23: "role-v23",
  v24: "role-v24",
  v26: "role-v26",
  v27: "role-v27",
  m03: "role-m03",
  m05: "role-m05",
  s02: "role-s02",
  f01: "role-f01",
  a02: "role-a02",
  a04: "role-a04",
  a05: "role-a05",
  l02: "role-l02",
  l06: "role-l06",
} as const satisfies Partial<Record<RoleId, string>>;

export type SharedRoleDragRole = keyof typeof ROLE_DRAG_ACTIONS;

export function getRoleDragAction(roleId: RoleId): string | undefined {
  return ROLE_DRAG_ACTIONS[roleId as SharedRoleDragRole];
}
