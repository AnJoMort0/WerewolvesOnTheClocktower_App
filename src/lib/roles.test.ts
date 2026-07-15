import { describe, expect, it } from "vitest";
import { assignRoles, ROLES, WEREWOLF_ROLES, type RoleId } from "./roles";

const SPECIAL_WEREWOLVES: RoleId[] = ["m01", "m02", "m03", "m06", "s02"];
const IMPLEMENTED_NEW_ROLES: RoleId[] = ["v24", "v25", "m06", "l05", "l06"];

function wolfRolesFor(playerCount: number) {
  return assignRoles(playerCount, true).filter((role) => WEREWOLF_ROLES.includes(role));
}

describe("assignRoles werewolf balance", () => {
  it("registers new rulebook roles for manual assignment", () => {
    for (const roleId of IMPLEMENTED_NEW_ROLES) {
      expect(ROLES).toHaveProperty(roleId);
    }

    expect(WEREWOLF_ROLES).toContain("m06");
  });

  it("allows implemented new rulebook roles in automatic assignment", () => {
    const assignedRoles = assignRoles(60, true);

    for (const roleId of IMPLEMENTED_NEW_ROLES) {
      expect(assignedRoles).toContain(roleId);
    }
  });

  it("uses exactly two normal werewolves for 8 to 11 players", () => {
    for (const playerCount of [8, 9, 10, 11]) {
      const wolves = wolfRolesFor(playerCount);

      expect(wolves).toHaveLength(2);
      expect(wolves.every((role) => role === "e01")).toBe(true);
    }
  });

  it("adds one werewolf-type role per four players from 12 players upward", () => {
    const cases = [
      [12, 3],
      [15, 3],
      [16, 4],
      [19, 4],
      [20, 5],
      [23, 5],
      [24, 6],
      [35, 8],
      [40, 10],
      [60, 15],
    ] as const;

    for (const [playerCount, expectedWolfCount] of cases) {
      expect(wolfRolesFor(playerCount)).toHaveLength(expectedWolfCount);
    }
  });

  it("keeps one normal werewolf from 12 players upward and fills with special werewolves first", () => {
    for (const playerCount of [12, 16, 20]) {
      const wolves = wolfRolesFor(playerCount);
      const normalCount = wolves.filter((role) => role === "e01").length;
      const specialCount = wolves.filter((role) => SPECIAL_WEREWOLVES.includes(role)).length;

      expect(normalCount).toBe(1);
      expect(specialCount).toBe(wolves.length - 1);
    }
  });

  it("adds extra normal werewolves only after every special werewolf slot is used", () => {
    const wolves = wolfRolesFor(60);
    const normalCount = wolves.filter((role) => role === "e01").length;
    const specialCount = wolves.filter((role) => SPECIAL_WEREWOLVES.includes(role)).length;

    expect(specialCount).toBe(SPECIAL_WEREWOLVES.length);
    expect(normalCount).toBe(wolves.length - SPECIAL_WEREWOLVES.length);
  });
});
