import { describe, expect, it } from "vitest";
import { ROLES } from "@/lib/roles";
import {
  getActiveSeasonalEvents,
  getActiveSeasonalRoleIds,
  getDefaultSkinPackForPath,
  getRulebookSkinOptions,
  getSkinPackLabel,
  resolveRoleImage,
} from "@/lib/skinPacks";

describe("skin packs", () => {
  it("prefers only currently active seasonal cards when the seasonal pack is selected", () => {
    const christmas = new Date(2026, 11, 25);
    expect(getActiveSeasonalRoleIds("seasonal", christmas).sort()).toEqual(["l04", "v24"]);
    expect(getActiveSeasonalRoleIds("default", christmas)).toEqual([]);
    expect(getActiveSeasonalRoleIds("thiercelieux", christmas)).toEqual([]);
    expect(getActiveSeasonalRoleIds("seasonal", new Date(2026, 6, 17))).toEqual([]);
  });
  it("uses route defaults for fresh devices", () => {
    expect(getDefaultSkinPackForPath("/gm/abc")).toBe("default");
    expect(getDefaultSkinPackForPath("/host/abc")).toBe("default");
    expect(getDefaultSkinPackForPath("/play/player-1")).toBe("seasonal");
    expect(getDefaultSkinPackForPath("/rulebook")).toBe("seasonal");
  });

  it("translates skinpack labels", () => {
    expect(getSkinPackLabel("default", "pt")).toBe("Padrão");
    expect(getSkinPackLabel("seasonal", "fr")).toBe("Défaut (saisonnier)");
    expect(getSkinPackLabel("thiercelieux", "pt")).toBe("Aldeia Velha");
  });

  it("detects seasonal windows with expected overlap priority", () => {
    expect(getActiveSeasonalEvents(new Date(2026, 9, 31))).toContain("halloween");
    expect(getActiveSeasonalEvents(new Date(2026, 11, 25))).toEqual(["new_years", "christmas"]);
    expect(getActiveSeasonalEvents(new Date(2026, 0, 7))).toEqual(["new_years"]);
    expect(getActiveSeasonalEvents(new Date(2026, 6, 17))).toEqual([]);
  });

  it("resolves skinpack images with default fallback", () => {
    expect(resolveRoleImage("v26", { skinPackId: "thiercelieux" }).src).not.toBe(ROLES.v26.image);
    expect(resolveRoleImage("e04", { skinPackId: "thiercelieux" }).src).not.toBe(ROLES.e04.image);
    expect(resolveRoleImage("e01", { skinPackId: "thiercelieux" }).src).toBe(ROLES.e01.image);
  });

  it("only uses dynamic flexible skins when objective context is provided", () => {
    expect(resolveRoleImage("f01", { skinPackId: "default" }).src).toBe(ROLES.f01.image);
    expect(resolveRoleImage("f01", {
      skinPackId: "default",
      flexible: { objectiveRoleId: "e02", effects: [] },
    }).source).toBe("dynamic");
    expect(resolveRoleImage("a02", {
      skinPackId: "default",
      flexible: { objectiveRoleId: "s02", effects: [] },
    }).variant).toBe("solo");
  });

  it.each(["a02", "f01", "f02"] as const)("keeps %s neutral before its side is chosen", (roleId) => {
    for (const objectiveRoleId of [null, roleId]) {
      expect(resolveRoleImage(roleId, { flexible: { objectiveRoleId, nightNumber: 1 } })).toEqual({
        src: ROLES[roleId].image, source: "default",
      });
    }
    expect(resolveRoleImage(roleId, { flexible: { effects: ["evil_being"], nightNumber: 1 } }).variant).toBe("evil");
    expect(resolveRoleImage(roleId, { flexible: { objectiveRoleId: "v01", nightNumber: 2 } }).variant).toBe("good");
  });

  it("keeps an ownerless Dog neutral on later nights and resolves an owner's known side", () => {
    expect(resolveRoleImage("a02", { flexible: { objectiveRoleId: "a02", nightNumber: 3 } }).source).toBe("default");
    expect(resolveRoleImage("a02", { flexible: { objectiveRoleId: "f02", nightNumber: 1 } }).source).toBe("default");
    expect(resolveRoleImage("a02", { flexible: { objectiveRoleId: "f02", nightNumber: 2 } }).variant).toBe("good");
    expect(resolveRoleImage("a02", { flexible: { objectiveRoleId: "e01" } }).variant).toBe("evil");
    expect(resolveRoleImage("a02", { flexible: { objectiveRoleId: "s02" } }).variant).toBe("solo");
  });

  it.each(["f01", "f02"] as const)("shows %s's chosen side from the second night", (roleId) => {
    expect(resolveRoleImage(roleId, { flexible: { nightNumber: 2 } }).variant).toBe("good");
    expect(resolveRoleImage(roleId, { flexible: { nightNumber: 2, effects: ["evil_being"] } }).variant).toBe("evil");
  });

  it("offers rulebook previews for static, seasonal, and flexible alternatives", () => {
    const options = getRulebookSkinOptions("a02", "pt", "seasonal").map((option) => option.value);
    expect(options).toContain("default");
    expect(options).toContain("thiercelieux");
    expect(options).toContain("dynamic:good");
    expect(options).toContain("dynamic:evil");
    expect(options).toContain("dynamic:solo");
  });

  it("names the rulebook current-skin option after the active skinpack", () => {
    const defaultOptions = getRulebookSkinOptions("a02", "pt", "default");
    expect(defaultOptions[0]).toEqual({ value: "device", label: "Padrão" });
    expect(defaultOptions.map((option) => option.value)).not.toContain("default");

    const thiercelieuxOptions = getRulebookSkinOptions("a02", "pt", "thiercelieux");
    expect(thiercelieuxOptions[0]).toEqual({ value: "device", label: "Aldeia Velha" });
    expect(thiercelieuxOptions.map((option) => option.value)).toContain("default");
    expect(thiercelieuxOptions.map((option) => option.value)).not.toContain("thiercelieux");
  });
});
