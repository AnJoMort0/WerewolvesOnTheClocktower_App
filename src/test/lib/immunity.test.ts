import { describe, expect, it } from "vitest";
import type { StatusEffect } from "@/lib/effects";
import { WEREWOLF_ROLES, type RoleId } from "@/lib/roles";
import { hasAttackImmunity, resolveProtectedDeaths } from "@/lib/immunity";

function pendingDeath(overrides: Partial<Parameters<typeof resolveProtectedDeaths>[0]> = {}) {
  return {
    statuses: { victim: "dead-this-night" as const },
    effects: { victim: new Set<StatusEffect>() },
    killSources: { victim: "e01" },
    killSourcePlayerIds: { victim: "attacker" },
    permanentlyDead: new Set<string>(),
    abilityRoles: { victim: "v01" as RoleId },
    isWerewolfAttack: (source: string) => WEREWOLF_ROLES.includes(source as RoleId),
    ...overrides,
  };
}

describe("immunity applied after a red X", () => {
  it.each<StatusEffect>(["immunity_full", "immunity_cupid", "immunity_onetime", "immunity_werewolf"])(
    "%s saves a pending werewolf victim and clears the kill attribution",
    (effect) => {
      const state = pendingDeath();
      expect(resolveProtectedDeaths(state).savedPlayerIds).toEqual([]);
      state.effects.victim.add(effect);
      const result = resolveProtectedDeaths(state);
      expect(result.statuses.victim).toBe("alive");
      expect(result.killSources.victim).toBeUndefined();
      expect(result.killSourcePlayerIds.victim).toBeUndefined();
      expect(result.savedPlayerIds).toEqual(["victim"]);
      expect(state.statuses.victim).toBe("dead-this-night");
      expect(state.effects.victim.has(effect)).toBe(true);
    },
  );

  it.each(["v08", "v10", "soldier", "executado", "s01-suicide", "manual"])(
    "werewolf-only immunity does not cancel %s",
    (source) => {
      const result = resolveProtectedDeaths(pendingDeath({
        effects: { victim: new Set(["immunity_werewolf"]) },
        killSources: { victim: source },
      }));
      expect(result.statuses.victim).toBe("dead-this-night");
      expect(result.savedPlayerIds).toEqual([]);
    },
  );

  it.each(["a01", "a02", "a03", "a04"])("uses the copied attack classification for %s", (source) => {
    const result = resolveProtectedDeaths(pendingDeath({
      effects: { victim: new Set(["immunity_werewolf"]) },
      killSources: { victim: source },
      isWerewolfAttack: (_source, sourcePlayerId) => sourcePlayerId === "attacker",
    }));
    expect(result.statuses.victim).toBe("alive");
  });

  it("spends a one-use shield only on a pending death, so the next attack can kill", () => {
    const state = pendingDeath({ effects: { victim: new Set(["immunity_onetime", "webbed"]) } });
    const saved = resolveProtectedDeaths(state);
    expect(saved.effects.victim).toEqual(new Set(["webbed"]));
    expect(hasAttackImmunity(saved.effects.victim, true)).toBe(false);
    const nextAttack = resolveProtectedDeaths({ ...state, effects: saved.effects });
    expect(nextAttack.statuses.victim).toBe("dead-this-night");
    const living = resolveProtectedDeaths({ ...state, statuses: { victim: "alive" } });
    expect(living.effects.victim.has("immunity_onetime")).toBe(true);
  });

  it("does not revive permanent deaths, including inconsistent old red-X snapshots", () => {
    for (const status of ["dead", "dead-this-night"] as const) {
      const result = resolveProtectedDeaths(pendingDeath({
        statuses: { victim: status },
        permanentlyDead: new Set(["victim"]),
        effects: { victim: new Set(["immunity_full", "immunity_onetime"]) },
      }));
      expect(result.statuses.victim).toBe(status);
      expect(result.effects.victim.has("immunity_onetime")).toBe(true);
      expect(result.savedPlayerIds).toEqual([]);
    }
  });

  it("preserves the Big Bad Wolf execution exception when Red Hood is in game", () => {
    const state = pendingDeath({
      effects: { victim: new Set(["immunity_full"]) },
      killSources: { victim: "executado" },
      abilityRoles: { victim: "m01", redHood: "v08b" },
    });
    expect(resolveProtectedDeaths(state).statuses.victim).toBe("dead-this-night");
    expect(resolveProtectedDeaths({ ...state, abilityRoles: { victim: "m01" } }).statuses.victim).toBe("alive");
  });

  it("does not treat other effects as immunity", () => {
    const result = resolveProtectedDeaths(pendingDeath({
      effects: { victim: new Set(["lover", "webbed", "evil_being"]) },
    }));
    expect(result.savedPlayerIds).toEqual([]);
  });
});

describe("protection and linked Lover deaths", () => {
  const lovers = () => pendingDeath({
    statuses: { victim: "dead-this-night", lover: "dead-this-night" },
    effects: { victim: new Set(["lover"]), lover: new Set(["lover"]) },
    killSources: { victim: "e01", lover: "s01-suicide" },
  });

  it("Cupid saves both Lovers when protection is added after their red Xs", () => {
    const state = lovers();
    state.effects.victim.add("immunity_cupid");
    state.effects.lover.add("immunity_cupid");
    expect(resolveProtectedDeaths(state).statuses).toEqual({ victim: "alive", lover: "alive" });
  });

  it("saving the attacked Lover cancels the suicide without spending the partner's shield", () => {
    const state = lovers();
    state.effects.victim.add("immunity_full");
    state.effects.lover.add("immunity_onetime");
    const result = resolveProtectedDeaths(state);
    expect(result.statuses).toEqual({ victim: "alive", lover: "alive" });
    expect(result.effects.lover.has("immunity_onetime")).toBe(true);
  });

  it("protecting only the suicidal Lover does not save the attacked one", () => {
    const state = lovers();
    state.effects.lover.add("immunity_onetime");
    const result = resolveProtectedDeaths(state);
    expect(result.statuses).toEqual({ victim: "dead-this-night", lover: "alive" });
    expect(result.effects.lover.has("immunity_onetime")).toBe(false);
    expect(result.savedSuicidePlayerIds).toEqual(["lover"]);
  });

  it("does not cancel an independent attack on the other Lover", () => {
    const state = lovers();
    state.effects.victim.add("immunity_full");
    state.killSources.lover = "v10";
    expect(resolveProtectedDeaths(state).statuses).toEqual({ victim: "alive", lover: "dead-this-night" });
  });
});
