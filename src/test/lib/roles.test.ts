import { describe, expect, it, vi } from "vitest";
import { assignRoles, canRandomlyAssignRole, EXTRA_DEATH_ROLES, INFO_ROLES, LIMITED_USE_ROLES, NO_UNCONDITIONAL_SCRIPT_ROLES, ROLES, WEREWOLF_ROLES, type RoleId } from "@/lib/roles";

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
    const assignedRoles = assignRoles(100, true);

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

    expect(wolves).toContain("s02");
    expect(specialCount).toBe(SPECIAL_WEREWOLVES.length);
    expect(normalCount).toBe(wolves.length - specialCount);
  });
});

describe("random assignment eligibility", () => {
  it("never draws Lame Characters in normal-sized games, even with seasonal preference", () => {
    let seed = 916;
    const random = vi.spyOn(Math, "random").mockImplementation(() => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    });
    try {
      for (const advanced of [false, true]) {
        for (const count of [8, 10, 12, 16, 24]) {
          for (let draw = 0; draw < 40; draw++) {
            const roles = assignRoles(count, advanced, ["l02", "l03", "l04", "l05", "l06"]);
            expect(roles.filter((id) => ROLES[id].category === "l")).toEqual([]);
          }
        }
      }
    } finally {
      random.mockRestore();
    }
  });

  it("uses Lame Characters once the main pool is exhausted and keeps complete families", () => {
    for (const advanced of [false, true]) {
      const roles = assignRoles(100, advanced, ["l04"]);
      expect(roles).toHaveLength(100);
      expect(roles.filter((id) => id === "l03")).toHaveLength(2);
      expect(roles.filter((id) => id === "l04")).toHaveLength(3);
      expect(roles).toContain("l01");
      for (const id of ["l02", "l05", "l06"] as const) expect(roles).toContain(id);
      for (const role of Object.values(ROLES)) {
        if (role.category === "l" || WEREWOLF_ROLES.includes(role.id) || (!advanced && role.category === "a")) continue;
        if (canRandomlyAssignRole(role.id, roles, 100)) expect(roles).toContain(role.id);
      }
    }
  });

  it("enforces contextual and player-count thresholds", () => {
    expect(canRandomlyAssignRole("v01", ["v07"], 12)).toBe(false);
    expect(canRandomlyAssignRole("v01", ["v07", "v08"], 12)).toBe(true);
    expect(canRandomlyAssignRole("v06", [], 11)).toBe(false);
    expect(canRandomlyAssignRole("v06", [], 12)).toBe(true);
    expect(canRandomlyAssignRole("v21", ["e03", "v10"], 12)).toBe(false);
    expect(canRandomlyAssignRole("v21", ["e03", "v10", "s01"], 12)).toBe(true);
    expect(canRandomlyAssignRole("f02", ["v07"], 12)).toBe(false);
    expect(canRandomlyAssignRole("f02", ["v07", "v08"], 12)).toBe(true);
    expect(canRandomlyAssignRole("a01", ["e04"], 12)).toBe(false);
    expect(canRandomlyAssignRole("a01", ["v02"], 12)).toBe(true);
    for (const count of [8, 12, 15, 16, 19, 20, 24, 60]) {
      expect(canRandomlyAssignRole("s02", [], count)).toBe(count >= 16);
    }
  });

  it("keeps extra Evil Beings out of drafts below twelve players", () => {
    const extraEvilRoles = ["m01", "m02", "m03", "m04", "m05", "s02", "a06"] as const;
    for (const role of extraEvilRoles) {
      expect(canRandomlyAssignRole(role, [], 11)).toBe(false);
    }
    for (const role of ["m01", "m02", "m03", "m04", "m05", "a06"] as const) {
      expect(canRandomlyAssignRole(role, [], 12)).toBe(true);
    }

    for (const count of [8, 9, 10, 11]) {
      for (let draw = 0; draw < 50; draw++) {
        const roles = assignRoles(count, true);
        expect(roles.filter((role) => extraEvilRoles.includes(role as typeof extraEvilRoles[number]))).toEqual([]);
        expect(roles).toContain("e02");
      }
    }
  });

  it("keeps every generated lot valid, including linked roles and families", () => {
    for (const count of [8, 11, 12, 16, 19, 20, 40, 60]) {
      for (let draw = 0; draw < 40; draw++) {
        const roles = assignRoles(count, draw % 2 === 0);
        expect(roles).toHaveLength(count);
        expect(roles.some((id) => INFO_ROLES.includes(id))).toBe(true);
        if (roles.includes("a01")) expect(roles.filter((id) => id !== "a01").some((id) => INFO_ROLES.includes(id))).toBe(true);
        if (roles.includes("v01")) expect(roles.filter((id) => EXTRA_DEATH_ROLES.includes(id)).length).toBeGreaterThanOrEqual(2);
        if (roles.includes("v21")) expect(roles.filter((id) => LIMITED_USE_ROLES.includes(id)).length).toBeGreaterThanOrEqual(3);
        if (roles.includes("f02")) expect(roles.filter((id) => NO_UNCONDITIONAL_SCRIPT_ROLES.includes(id)).length).toBeGreaterThanOrEqual(2);
        if (roles.includes("v08b")) expect(roles).toContain("v08");
        if (roles.includes("as01b")) expect(roles).toContain("s01");
        for (const id of new Set(roles)) {
          if (id === "e01" || id === "l01") continue;
          expect(roles.filter((role) => role === id)).toHaveLength(ROLES[id].groupSize ?? 1);
        }
        if (draw % 2 === 1) expect(roles.some((id) => ROLES[id].category === "a")).toBe(false);
      }
    }
  });

  it("raises advanced and seasonal odds without guaranteeing a card", () => {
    // Repeatable pseudo-random stream makes probability assertions deterministic.
    const sample = (preferred: RoleId[] = []) => {
      let seed = 731;
      const random = vi.spyOn(Math, "random").mockImplementation(() => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed / 4294967296;
      });
      let advanced = 0;
      let seasonal = 0;
      for (let draw = 0; draw < 1500; draw++) {
        const roles = assignRoles(12, true, preferred);
        if (roles.some((id) => ROLES[id].category === "a")) advanced++;
        if (roles.includes("v24")) seasonal++;
      }
      random.mockRestore();
      return { advanced, seasonal };
    };
    const baseline = sample();
    const preferred = sample(["v24"]);
    expect(baseline.advanced).toBeGreaterThan(750);
    expect(baseline.advanced).toBeLessThan(1500);
    expect(preferred.seasonal).toBeGreaterThan(baseline.seasonal);
    expect(preferred.seasonal).toBeLessThan(1500);
  });
});
