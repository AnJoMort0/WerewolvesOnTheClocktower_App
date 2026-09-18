/** A Colossus retaliates once while marked as this night's Werewolf victim. */
export function canColossusRetaliate(player: {
  abilityRole?: string; redX: boolean; dead: boolean; powerless: boolean;
  attackedByWerewolves: boolean; used: boolean; host: boolean; burned: boolean;
}): boolean {
  return player.abilityRole === "v27" && player.redX && !player.dead
    && !player.powerless && player.attackedByWerewolves && !player.used
    && !player.host && !player.burned;
}

export function isColossusTarget(player: {
  dead: boolean; redX: boolean; actedTonight?: boolean; host?: boolean;
}): boolean {
  return !player.dead && !player.redX && !!player.actedTonight && !player.host;
}

/** Poison redirects to a different eligible target; it never falls back to the
 * selected victim when no alternative exists. */
export function resolveColossusTarget<T extends { id: string; dead: boolean; redX: boolean; actedTonight?: boolean; host?: boolean }>(
  players: T[], selectedId: string, poisoned: boolean, random = Math.random,
): string | null {
  if (!players.some((player) => player.id === selectedId && isColossusTarget(player))) return null;
  if (!poisoned) return selectedId;
  const alternatives = players.filter((player) => player.id !== selectedId && isColossusTarget(player));
  return alternatives[Math.floor(random() * alternatives.length)]?.id ?? null;
}

/** Preserve the surrounding script, inserting each retaliation after the hunt.
 * A saved nightly seed keeps positions stable as checkboxes and victims change. */
export function placeColossusLines<T>(items: T[], isColossus: (item: T) => boolean,
  isHunt: (item: T) => boolean, seed: number, identity: (item: T) => string,
  scriptOrder?: { getOrder: (item: T) => number | null; lastOrder: number }): T[] {
  const retaliation = items.filter(isColossus);
  if (retaliation.length === 0) return items;
  const result = items.filter((item) => !isColossus(item));
  const huntIndex = result.findIndex(isHunt);
  if (huntIndex < 0) return items;
  for (const item of retaliation) {
    let hash = Math.floor(seed * 0xffffffff) >>> 0;
    for (const char of identity(item)) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
    const fraction = hash / 0x100000000;
    let index = huntIndex + 1 + Math.floor(fraction * (result.length - huntIndex));
    if (scriptOrder) {
      // Anchor to the full script, so disappearing conditional lines cannot
      // move the retaliation past a surviving character's turn.
      const huntOrder = scriptOrder.getOrder(result[huntIndex]) ?? huntIndex;
      const anchor = huntOrder + Math.floor(fraction * (scriptOrder.lastOrder - huntOrder + 1));
      index = result.findIndex((candidate, position) => position > huntIndex && !isColossus(candidate)
        && (scriptOrder.getOrder(candidate) ?? -1) > anchor);
      if (index < 0) index = result.length;
    }
    result.splice(index, 0, item);
  }
  return result;
}
