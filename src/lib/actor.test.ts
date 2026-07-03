import { describe, expect, it } from "vitest";
import {
  encodeActorCharacter,
  getEffectiveRoleAssignments,
  parsePlayerCharacter,
  shouldShowActorBadge,
} from "@/lib/actor";

describe("Actor role encoding", () => {
  it("keeps Actor as the base identity while exposing the copied role privately", () => {
    const encoded = encodeActorCharacter("m01");
    expect(parsePlayerCharacter(encoded)).toEqual({
      baseRole: "a04",
      displayRole: "m01",
      actorCopiedRole: "m01",
      drunkardReplacementRole: null,
    });
  });

  it("replaces only Actor in the effective mechanic assignments", () => {
    expect(getEffectiveRoleAssignments({ actor: "a04", seer: "e04" }, "v10")).toEqual({
      actor: "v10",
      seer: "e04",
    });
  });

  it("hides a copied Drunkard behind the same replacement card and mechanics", () => {
    const encoded = encodeActorCharacter("a01", "v02");
    expect(parsePlayerCharacter(encoded)).toEqual({
      baseRole: "a04",
      displayRole: "v02",
      actorCopiedRole: "a01",
      drunkardReplacementRole: "v02",
    });
    expect(shouldShowActorBadge(encoded)).toBe(true);
    expect(getEffectiveRoleAssignments({ actor: "a04", drunkard: "a01" }, "a01", "v02")).toEqual({
      actor: "v02",
      drunkard: "v02",
    });
  });
});
