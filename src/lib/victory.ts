import { EVIL_ROLES, WEREWOLF_ROLES, type RoleId } from "@/lib/roles";
import type { WinKind } from "@/lib/i18n";

export type AutomaticWinKind = Exclude<WinKind, "tie">;

export type VictoryPlayer = {
  id: string;
  role: RoleId;
  alive: boolean;
  effects?: Iterable<string>;
};

const hasEffect = (player: VictoryPlayer, effect: string) =>
  player.effects ? new Set(player.effects).has(effect) : false;

const isEvil = (player: VictoryPlayer) =>
  EVIL_ROLES.includes(player.role)
  || hasEffect(player, "evil_being")
  || hasEffect(player, "werewolf_turned");

const isWerewolf = (player: VictoryPlayer) =>
  WEREWOLF_ROLES.includes(player.role) || hasEffect(player, "werewolf_turned");

const isLover = (player: VictoryPlayer) => hasEffect(player, "namorado");

export function playerWinsVictoryGroup(
  player: VictoryPlayer,
  kind: AutomaticWinKind,
  players: VictoryPlayer[] = [player],
): boolean {
  if (kind === "village") {
    return !isEvil(player)
      && player.role !== "s01"
      && player.role !== "s02"
      && player.role !== "as01b"
      && !isLover(player);
  }
  if (kind === "werewolves") return isEvil(player);
  if (kind === "lovers") return player.role === "s01" || isLover(player);
  if (kind === "whiteWolf") return player.role === "s02";
  if (kind === "secretLover") {
    const secretLoverExists = players.some((candidate) => candidate.role === "as01b");
    return player.role === "as01b" || (secretLoverExists && player.alive && isLover(player));
  }
  return false;
}

export function playerWinsAnyVictoryGroup(
  player: VictoryPlayer,
  kinds: Iterable<AutomaticWinKind>,
  players: VictoryPlayer[] = [player],
): boolean {
  for (const kind of kinds) {
    if (playerWinsVictoryGroup(player, kind, players)) return true;
  }
  return false;
}

export function detectAutomaticVictory(players: VictoryPlayer[]): AutomaticWinKind | null {
  const alive = players.filter((player) => player.alive);
  if (alive.length === 0) return null;

  const secretLover = alive.find((player) => player.role === "as01b");
  if (alive.length === 2 && secretLover && alive.some((player) => player.id !== secretLover.id && isLover(player))) {
    return "secretLover";
  }

  const aliveLovers = alive.filter(isLover);
  const loversOnly = aliveLovers.length >= 2
    && alive.every((player) => isLover(player) || player.role === "s01")
    && !aliveLovers.some((player) => player.role === "as01b");
  if (loversOnly) return "lovers";

  // Living lovers keep pursuing their own endgame, blocking all faction wins.
  if (aliveLovers.length > 0) return null;

  if (alive.length === 1 && alive[0].role === "s02") return "whiteWolf";

  // The White Werewolf must be eliminated before the werewolf faction can win.
  if (alive.some((player) => player.role === "s02")) return null;

  if (alive.every(isEvil)) return "werewolves";
  if (!alive.some(isWerewolf)) return "village";

  return null;
}

export function getVictoryStateSignature(players: VictoryPlayer[], phaseKey: string): string {
  const playerState = [...players]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((player) => {
      const relevantEffects = ["evil_being", "namorado", "werewolf_turned"]
        .filter((effect) => hasEffect(player, effect))
        .join(",");
      return `${player.id}:${player.role}:${player.alive ? "1" : "0"}:${relevantEffects}`;
    })
    .join("|");
  return `${phaseKey}|${playerState}`;
}
