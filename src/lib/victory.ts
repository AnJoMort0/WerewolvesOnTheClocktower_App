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

export function detectAutomaticVictory(players: VictoryPlayer[]): AutomaticWinKind | null {
  const alive = players.filter((player) => player.alive);
  if (alive.length === 0) return null;

  const secretLover = alive.find((player) => player.role === "as01b");
  if (alive.length === 2 && secretLover && alive.some((player) => player.id !== secretLover.id && isLover(player))) {
    return "secretLover";
  }

  if (alive.length === 1 && alive[0].role === "s02") return "whiteWolf";

  const aliveLovers = alive.filter(isLover);
  const loversOnly = aliveLovers.length > 0
    && alive.every((player) => isLover(player) || player.role === "s01")
    && !aliveLovers.some((player) => player.role === "as01b");
  if (loversOnly) return "lovers";

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
