import { describe, expect, it } from "vitest";
import { encodeActorCharacter, getEffectiveRoleAssignments, parsePlayerCharacter } from "@/lib/actor";

describe("Actor role encoding", () => {
  it("keeps Actor as the base identity while exposing the copied role privately", () => {
    const encoded = encodeActorCharacter("m01");
    expect(parsePlayerCharacter(encoded)).toEqual({
      baseRole: "a04",
      displayRole: "m01",
      actorCopiedRole: "m01",
    });
  });

  it("replaces only Actor in the effective mechanic assignments", () => {
    expect(getEffectiveRoleAssignments({ actor: "a04", seer: "e04" }, "v10")).toEqual({
      actor: "v10",
      seer: "e04",
    });
  });
});
