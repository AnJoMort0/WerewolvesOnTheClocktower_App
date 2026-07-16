import { describe, expect, it } from "vitest";
import { ROLES } from "@/lib/roles";
import {
  getActiveSeasonalEvents,
  getDefaultSkinPackForPath,
  getRulebookSkinOptions,
  resolveRoleImage,
} from "@/lib/skinPacks";

describe("skin packs", () => {
  it("uses route defaults for fresh devices", () => {
    expect(getDefaultSkinPackForPath("/gm/abc")).toBe("default");
    expect(getDefaultSkinPackForPath("/host/abc")).toBe("default");
    expect(getDefaultSkinPackForPath("/play/player-1")).toBe("seasonal");
    expect(getDefaultSkinPackForPath("/rulebook")).toBe("seasonal");
  });

  it("detects seasonal windows with expected overlap priority", () => {
    expect(getActiveSeasonalEvents(new Date(2026, 9, 31))).toContain("halloween");
    expect(getActiveSeasonalEvents(new Date(2026, 11, 25))).toEqual(["new_years", "christmas"]);
    expect(getActiveSeasonalEvents(new Date(2026, 0, 7))).toEqual(["new_years"]);
    expect(getActiveSeasonalEvents(new Date(2026, 6, 17))).toEqual([]);
  });

  it("resolves skinpack images with default fallback", () => {
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

  it("offers rulebook previews for static, seasonal, and flexible alternatives", () => {
    const options = getRulebookSkinOptions("a02", "pt").map((option) => option.value);
    expect(options).toContain("default");
    expect(options).toContain("thiercelieux");
    expect(options).toContain("dynamic:good");
    expect(options).toContain("dynamic:evil");
    expect(options).toContain("dynamic:solo");
  });
});
