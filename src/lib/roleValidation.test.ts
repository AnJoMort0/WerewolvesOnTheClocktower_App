import { describe, expect, it } from "vitest";
import { autoFixRoleSelection, validateRoleSelection } from "@/lib/roleValidation";

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
});
