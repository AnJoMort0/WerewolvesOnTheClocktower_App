import { describe, expect, it } from "vitest";
import {
  advanceDogWolfStateForNight,
  createDogWolfState,
  createInheritedDogWolfState,
  getDogsFollowingOwner,
  getDogWolfAbilityRoleAssignments,
  getDogWolfObjectiveRole,
  getDogWolfObjectiveRoleAssignments,
  getDogWolfPlayerIds,
} from "@/lib/dogWolf";

describe("Dog-Wolf role model", () => {
  it("tracks original and Actor Dog-Wolf instances independently", () => {
    expect(getDogWolfPlayerIds({ dog: "a02", actor: "a04" }, "actor", "a02")).toEqual(["dog", "actor"]);
  });

  it("gives Actor the copied Dog-Wolf's owner with fresh power state", () => {
    const original = createDogWolfState("owner");
    original.powerState.chamanCharges = 2;
    original.powerState.foxDisabled = true;

    expect(createInheritedDogWolfState(original)).toEqual(createDogWolfState("owner"));
  });

  it("copies an alive owner's current mechanical role without changing the Dog-Wolf identity", () => {
    const states = { dog: createDogWolfState("owner") };
    expect(getDogWolfAbilityRoleAssignments({ dog: "a02", owner: "e02" }, states)).toEqual({
      dog: "e02",
      owner: "e02",
    });
    expect(getDogWolfObjectiveRole("dog", { dog: "a02", owner: "e02" }, states)).toBe("e02");
  });

  it("stops copied actions while the owner is dead but preserves the objective", () => {
    const states = { dog: createDogWolfState("owner") };
    expect(getDogWolfAbilityRoleAssignments({ dog: "a02", owner: "v02" }, states, ["owner"]).dog).toBe("a02");
    expect(getDogWolfObjectiveRole("dog", { dog: "a02", owner: "v02" }, states)).toBe("v02");
  });

  it("keeps an independent objective after a Dog transformation", () => {
    const state = createDogWolfState("owner");
    state.objectiveRoleOverride = "s02";
    expect(getDogWolfObjectiveRole("dog", { dog: "a02", owner: "v02" }, { dog: state })).toBe("s02");
  });

  it("copies the Dog Actor's dead Idol at the beginning of the next night", () => {
    const state = createDogWolfState("actor");
    state.actorModeActive = true;
    state.actorIdolPlayerId = "idol";
    expect(advanceDogWolfStateForNight(state, { idol: "a01" }, ["idol"], "v16")).toMatchObject({
      actorCopiedRole: "a01",
      independentRole: "v16",
      objectiveRoleOverride: "a01",
    });
  });

  it("turns a Dog copying the Wild Kid into a Werewolf when its own father dies", () => {
    const state = createDogWolfState("child");
    state.adoptiveDadPlayerId = "father";
    expect(advanceDogWolfStateForNight(state, {}, ["father"], null)).toMatchObject({
      independentRole: "e01",
      objectiveRoleOverride: "e01",
    });
  });

  it("keeps a dead Dog's copied power for its prophecy wake-up only", () => {
    const states = { dog: createDogWolfState("owner") };
    expect(getDogWolfAbilityRoleAssignments(
      { dog: "a02", owner: "v19" },
      states,
      ["dog"],
      ["dog"],
    ).dog).toBe("v19");
  });

  it("can inherit an owner's true objective separately from the role being performed", () => {
    const states = { dog: createDogWolfState("drunkard") };
    expect(getDogWolfObjectiveRoleAssignments({ dog: "a02", drunkard: "a01" }, states)).toEqual({
      dog: "a01",
      drunkard: "a01",
    });
  });

  it("finds only active dogs following an owner", () => {
    const states = {
      dog: createDogWolfState("owner"),
      actor: createDogWolfState("owner"),
    };
    expect(getDogsFollowingOwner("owner", states, ["actor"])).toEqual(["actor"]);
  });
});
