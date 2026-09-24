import type { PlayerStatus, StatusEffect } from "@/lib/effects";
import type { RoleId } from "@/lib/roles";

export function hasAttackImmunity(effects: ReadonlySet<StatusEffect>, werewolfAttack: boolean): boolean {
  return effects.has("immunity_full")
    || effects.has("immunity_cupid")
    || effects.has("immunity_onetime")
    || (werewolfAttack && effects.has("immunity_werewolf"));
}

interface PendingDeathState {
  statuses: Record<string, PlayerStatus>;
  effects: Record<string, Set<StatusEffect>>;
  killSources: Record<string, string>;
  killSourcePlayerIds: Record<string, string>;
  permanentlyDead: ReadonlySet<string>;
  abilityRoles: Record<string, RoleId>;
  isWerewolfAttack: (source: string, sourcePlayerId?: string) => boolean;
}

// Run before deaths become permanent, while the protection for this turn still exists.
export function resolveProtectedDeaths(state: PendingDeathState) {
  const statuses = { ...state.statuses };
  const effects = { ...state.effects };
  const killSources = { ...state.killSources };
  const killSourcePlayerIds = { ...state.killSourcePlayerIds };
  const savedPlayerIds: string[] = [];
  const savedSuicidePlayerIds: string[] = [];
  const redHoodInGame = Object.values(state.abilityRoles).includes("v08b");
  const pendingIds = Object.keys(statuses).filter((id) => (
    statuses[id] === "dead-this-night" && !state.permanentlyDead.has(id)
  ));
  const save = (id: string) => {
    if (killSources[id] === "s01-suicide") savedSuicidePlayerIds.push(id);
    statuses[id] = "alive";
    delete killSources[id];
    delete killSourcePlayerIds[id];
    savedPlayerIds.push(id);
  };
  const protect = (id: string) => {
    const source = killSources[id] ?? "manual";
    if (source === "executado" && state.abilityRoles[id] === "m01" && redHoodInGame) return;
    const currentEffects = effects[id] ?? new Set<StatusEffect>();
    if (!hasAttackImmunity(currentEffects, state.isWerewolfAttack(source, killSourcePlayerIds[id]))) return;
    if (currentEffects.has("immunity_onetime")) {
      effects[id] = new Set(currentEffects);
      effects[id].delete("immunity_onetime");
    }
    save(id);
  };

  for (const id of pendingIds) {
    if (killSources[id] !== "s01-suicide") protect(id);
  }

  // Saving the attacked Lover also cancels the dependent suicide, without spending its shield.
  const loverIds = Object.keys(effects).filter((id) => effects[id].has("lover"));
  const savedAttackedLover = savedPlayerIds.some((id) => loverIds.includes(id));
  const loverStillDying = loverIds.some((id) => (
    state.permanentlyDead.has(id) || statuses[id] === "dead"
    || (statuses[id] === "dead-this-night" && killSources[id] !== "s01-suicide")
  ));
  for (const id of pendingIds) {
    if (killSources[id] !== "s01-suicide") continue;
    if (savedAttackedLover && !loverStillDying && loverIds.includes(id)) save(id);
    else protect(id);
  }

  return { statuses, effects, killSources, killSourcePlayerIds, savedPlayerIds, savedSuicidePlayerIds };
}
