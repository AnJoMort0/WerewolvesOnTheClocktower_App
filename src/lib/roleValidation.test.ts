import { describe, expect, it } from "vitest";
import { getExpectedWerewolfCount } from "@/lib/roles";
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

  it("shares expected werewolf and duplicate role helpers", () => {
    expect(getExpectedWerewolfCount(11)).toBe(2);
    expect(getExpectedWerewolfCount(12)).toBe(3);
    expect(getDuplicateUniqueRoles(["l03", "l03", "l04", "l04", "l04", "e02", "e02"])).toEqual(new Set(["e02"]));
  });
});
