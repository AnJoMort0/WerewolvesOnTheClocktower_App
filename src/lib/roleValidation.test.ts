import { describe, expect, it } from "vitest";
import { WEREWOLF_ROLES, getExpectedWerewolfCount } from "@/lib/roles";
import { autoFixRoleSelection, getDuplicateUniqueRoles, validateRoleSelection } from "@/lib/roleValidation";

describe("role validation", () => {
  it("warns about duplicated unique roles in the analog role list", () => {
    const warnings = validateRoleSelection(["e02", "e02", "e03", "e04", "e01", "e01"], "pt");
    expect(warnings.some((warning) => warning.includes("duplicado"))).toBe(true);
  });

  it("auto-fixes extra unique duplicates without removing repeatable roles", () => {
    const fixed = autoFixRoleSelection(["e02", "e02", "e03", "e04", "e01", "e01"]);
    expect(fixed.filter((roleId) => roleId === "e02")).toHaveLength(1);
    expect(fixed.filter((roleId) => roleId === "e01")).toHaveLength(2);
  });

  it("adds repeatable roles without looping when a fix needs multiple replacements", () => {
    const fixed = autoFixRoleSelection([
      "e02", "e03", "e04", "e01", "l03", "l04",
      "v01", "v02", "v03", "v04", "v05", "v06",
    ]);
    expect(fixed.filter((roleId) => WEREWOLF_ROLES.includes(roleId))).toHaveLength(3);
    expect(fixed.filter((roleId) => roleId === "l03")).toHaveLength(2);
    expect(fixed.filter((roleId) => roleId === "l04")).toHaveLength(3);
  });

  it("shares expected werewolf and duplicate role helpers", () => {
    expect(getExpectedWerewolfCount(11)).toBe(2);
    expect(getExpectedWerewolfCount(12)).toBe(3);
    expect(getDuplicateUniqueRoles(["l03", "l03", "l04", "l04", "l04", "e02", "e02"])).toEqual(new Set(["e02"]));
  });
});
