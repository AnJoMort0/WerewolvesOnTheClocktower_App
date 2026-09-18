import { describe, expect, it } from "vitest";
import { resolveKillerCard } from "@/components/game/RevealModal";
import { ROLES } from "@/lib/roles";

describe("resolveKillerCard", () => {
  it("uses the Captain card with a Soldier label for soldier kills", () => {
    expect(resolveKillerCard("soldier", {}, null, "pt")).toMatchObject({
      image: ROLES.v09.image,
      label: "Soldado",
      roleId: "v09",
    });
    expect(resolveKillerCard("soldado", {}, null, "pt")).toMatchObject({
      image: ROLES.v09.image,
      label: "Soldado",
      roleId: "v09",
    });
  });

  it("uses the plural Werewolves label for the normal werewolf kill", () => {
    expect(resolveKillerCard("e01", {}, null, "pt")).toMatchObject({
      image: ROLES.e01.image,
      label: "Lobisomens",
      roleId: "e01",
    });
  });
});
