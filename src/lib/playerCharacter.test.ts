import { describe, expect, it } from "vitest";
import {
  encodePlayerCharacterMetadata,
  parsePlayerCharacterMetadata,
  stripPlayerCharacterMetadata,
} from "@/lib/playerCharacter";
import { parsePlayerCharacter } from "@/lib/actor";

describe("private player character metadata", () => {
  it("round-trips a Dog-Wolf owner role and objective effects", () => {
    const character = encodePlayerCharacterMetadata("a02", {
      ownerRole: "e02",
      ownerPlayerId: "owner-player",
      objectiveRole: "a01",
      objectiveEffects: ["evil_being", "namorado"],
      dogActorCopiedRole: "v16",
    });
    expect(stripPlayerCharacterMetadata(character)).toBe("a02");
    expect(parsePlayerCharacterMetadata(character)).toEqual({
      ownerRole: "e02",
      ownerPlayerId: "owner-player",
      objectiveRole: "a01",
      objectiveEffects: ["evil_being", "namorado"],
      dogActorCopiedRole: "v16",
    });
    expect(parsePlayerCharacter(character).baseRole).toBe("a02");
  });

  it("keeps Actor identity parsing intact when metadata is present", () => {
    const character = encodePlayerCharacterMetadata("a04:a02", {
      ownerRole: "v03",
      ownerPlayerId: "owner",
      objectiveRole: "v03",
      dogActorCopiedRole: null,
    });
    expect(parsePlayerCharacter(character)).toMatchObject({
      baseRole: "a04",
      displayRole: "a02",
      actorCopiedRole: "a02",
    });
  });
});
