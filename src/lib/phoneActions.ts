import { EVIL_ROLES, WEREWOLF_ROLES, type RoleId } from "@/lib/roles";
import type { ScriptLine } from "@/lib/i18n/types";
import { isColossusTarget } from "@/lib/colossus";

export type PhoneMode = "hunt" | "allies" | "poison" | "shaman" | "monkey" | "fox" | "colossus";
export type MonkeyReveal = { targetPlayerId: string; roleId: RoleId; evil: boolean };
export type FoxReveal = {
  targetPlayerId: string;
  playerIds: string[];
  result: "evil" | "clear" | "confused";
  foxRanAway: boolean;
};
export function shouldExhaustMonkeyPower(reveal: MonkeyReveal, nightNumber: number): boolean {
  return nightNumber > 1 && reveal.evil;
}
export type PhonePlayer = {
  id: string;
  name: string;
  seat_position: number | null;
  dead: boolean;
  redX: boolean;
  abilityRole?: RoleId;
  objectiveRole?: RoleId;
  werewolfTurned: boolean;
  evil: boolean;
  mime: boolean;
  canWake: boolean;
  powerless: boolean;
  displayRole?: RoleId;
  actingPoisoned?: boolean;
  illusion?: boolean;
  foxDisabled?: boolean;
  monkeyDisabled?: boolean;
  colossusReady?: boolean;
  actedTonight?: boolean;
  host?: boolean;
};
export type PhoneWorld = { players: PhonePlayer[]; packBlocked: boolean; nightNumber?: number };
export type PhoneSession = {
  id: string;
  lineKey: string;
  mode: PhoneMode;
  sourcePlayerId: string | null;
  progressOrder?: number | null;
  participantIds: string[];
  votes: Record<string, string>;
  sequences: Record<string, number>;
  visible?: boolean;
  monkeyReveal?: MonkeyReveal;
  foxReveal?: FoxReveal;
  error?: "noSafeCard";
  pendingTargetPlayerId?: string;
};
export type PhoneCommand = {
  id: string;
  sessionId: string;
  sequence: number;
  type: "select" | "confirm" | "ignore" | "close" | "reopen";
  targetPlayerId?: string;
};
export type PhoneAction = {
  action: "kill" | "poison" | "shaman" | "monkey" | "fox" | "colossus";
  targetPlayerId: string;
  sourcePlayerId: string | null;
  monkeyReveal?: MonkeyReveal;
  foxReveal?: FoxReveal;
};
export type PhoneView = Pick<PhoneSession, "id" | "mode" | "votes" | "participantIds"> & {
  visible?: boolean;
  monkeyReveal?: MonkeyReveal;
  foxReveal?: FoxReveal;
  error?: "noSafeCard";
  pendingTargetPlayerId?: string;
  players: Array<Pick<PhonePlayer, "id" | "name" | "seat_position"> & {
    selectable: boolean;
    redX: boolean;
    dead: boolean;
    marker: "werewolf" | "evil" | null;
  }>;
};

export function getScriptPhoneMode(line: ScriptLine): PhoneMode | null {
  return line.phoneMode ?? null;
}

function looksLikeWerewolf(player: PhonePlayer) {
  return !player.mime && (player.werewolfTurned
    || (!!player.objectiveRole && WEREWOLF_ROLES.includes(player.objectiveRole))
    || player.abilityRole === "v06");
}

function countsAsEvilBeing(player: PhonePlayer) {
  const objectiveRole = player.objectiveRole ?? player.abilityRole;
  return player.evil || player.werewolfTurned || (!!objectiveRole && EVIL_ROLES.includes(objectiveRole));
}

/** The selected living player and their nearest living neighbours around the seating circle. */
export function getFoxTargetPlayerIds(
  players: ReadonlyArray<Pick<PhonePlayer, "id" | "seat_position" | "dead">>,
  targetPlayerId: string,
): string[] {
  const seated = [...players]
    .filter((player) => player.seat_position !== null)
    .sort((left, right) => left.seat_position! - right.seat_position!);
  const targetIndex = seated.findIndex((player) => player.id === targetPlayerId && !player.dead);
  if (targetIndex === -1) return [];
  const findNeighbor = (direction: 1 | -1) => {
    for (let distance = 1; distance < seated.length; distance += 1) {
      const index = (targetIndex + direction * distance + seated.length) % seated.length;
      if (!seated[index].dead) return seated[index].id;
    }
    return null;
  };
  return [...new Set([findNeighbor(-1), targetPlayerId, findNeighbor(1)].filter((id): id is string => !!id))];
}

export function resolveFoxReveal(sourcePlayerId: string, targetPlayerId: string, world: PhoneWorld): FoxReveal | null {
  const source = world.players.find((player) => player.id === sourcePlayerId);
  const playerIds = getFoxTargetPlayerIds(world.players, targetPlayerId);
  if (!source || playerIds.length === 0) return null;
  const targets = playerIds.map((id) => world.players.find((player) => player.id === id)).filter((player): player is PhonePlayer => !!player);
  const confused = targets.some((player) => player.illusion);
  const actualEvil = targets.some(countsAsEvilBeing);
  const shownEvil = source.actingPoisoned ? !actualEvil : actualEvil;
  return {
    targetPlayerId,
    playerIds,
    result: confused ? "confused" : shownEvil ? "evil" : "clear",
    foxRanAway: !confused && !source.actingPoisoned && (world.nightNumber ?? 1) > 1 && !actualEvil,
  };
}

export function getPhoneParticipants(mode: PhoneMode, sourcePlayerId: string | null, world: PhoneWorld): string[] {
  if (sourcePlayerId) {
    const player = world.players.find((p) => p.id === sourcePlayerId);
    if (!player?.canWake || player.powerless) return [];
    const matches = mode === "poison" ? player.abilityRole === "e02"
      : mode === "shaman" ? player.abilityRole === "e03"
      : mode === "monkey" ? player.abilityRole === "v26" && !player.monkeyDisabled
      : mode === "fox" ? player.abilityRole === "v04" && !player.foxDisabled
      : mode === "colossus" ? player.abilityRole === "v27" && !!player.colossusReady
      : mode === "hunt" && !!player.abilityRole && WEREWOLF_ROLES.includes(player.abilityRole);
    return matches ? [sourcePlayerId] : [];
  }
  if (mode !== "hunt" && mode !== "allies") return [];
  if (mode === "hunt" && world.packBlocked) return [];
  const pack = world.players.filter((p) => p.canWake && looksLikeWerewolf(p));
  const hasWolf = pack.some((p) => p.werewolfTurned || (!!p.objectiveRole && WEREWOLF_ROLES.includes(p.objectiveRole)));
  return hasWolf ? pack.map((p) => p.id) : [];
}

export function isPhoneTarget(session: PhoneSession, player: PhonePlayer): boolean {
  // The Monkey can inspect any card, including their own or a Ghost's.
  if (session.mode === "monkey") return !session.monkeyReveal && !!(player.displayRole ?? player.abilityRole);
  if (session.mode === "fox") return !session.foxReveal && !player.dead;
  if (session.mode === "colossus") return isColossusTarget(player);
  if (session.mode === "allies" || player.dead) return false;
  if (session.mode === "shaman") return player.redX;
  // The Witch can target herself, and pending victims may still be poisoned before dawn.
  if (session.mode === "poison") return true;
  // Match the GM's unrestricted kill targeting; do not disclose other pending night kills.
  return true;
}

export function reconcilePhoneSession(session: PhoneSession | null, world: PhoneWorld): PhoneSession | null {
  if (!session) return null;
  // Keep a resolved card available even after its source loses powers or dies.
  if (session.mode === "monkey" && session.monkeyReveal) {
    return world.players.some((p) => p.id === session.sourcePlayerId && p.abilityRole === "v26") ? session : null;
  }
  if (session.mode === "fox" && session.foxReveal) {
    return world.players.some((p) => p.id === session.sourcePlayerId && p.abilityRole === "v04") ? session : null;
  }
  const participantIds = getPhoneParticipants(session.mode, session.sourcePlayerId, world);
  if (participantIds.length === 0) return null;
  if (session.pendingTargetPlayerId && !world.players.some((p) => p.id === session.pendingTargetPlayerId && isPhoneTarget(session, p))) {
    return { ...session, pendingTargetPlayerId: undefined };
  }
  if (participantIds.join() !== session.participantIds.join()) {
    return { ...session, participantIds, votes: {} };
  }
  const votes = Object.fromEntries(Object.entries(session.votes).filter(([, targetId]) => (
    world.players.some((p) => p.id === targetId && isPhoneTarget(session, p))
  )));
  return Object.keys(votes).length === Object.keys(session.votes).length ? session : { ...session, votes };
}

export function getHuntConsensus(session: PhoneSession | null): string | null {
  if (!session || session.mode !== "hunt" || session.participantIds.length === 0) return null;
  const firstVote = session.votes[session.participantIds[0]];
  return firstVote && session.participantIds.every((id) => session.votes[id] === firstVote) ? firstVote : null;
}

export function applyPhoneCommand(session: PhoneSession | null, actorId: string, command: PhoneCommand, world: PhoneWorld): {
  session: PhoneSession | null;
  action?: PhoneAction;
  completedSession?: PhoneSession;
} {
  session = reconcilePhoneSession(session, world);
  if (!session || command.sessionId !== session.id || !session.participantIds.includes(actorId)
    || !Number.isFinite(command.sequence) || command.sequence <= (session.sequences[actorId] ?? 0)) return { session };
  const next = { ...session, sequences: { ...session.sequences, [actorId]: command.sequence } };
  if ((session.mode === "monkey" || session.mode === "fox") && (command.type === "close" || command.type === "reopen")) {
    return { session: { ...next, visible: command.type === "reopen" } };
  }
  if (command.type === "ignore" && session.mode === "shaman") return { session: null, completedSession: session };
  const target = world.players.find((p) => p.id === command.targetPlayerId);
  if (!target || !isPhoneTarget(session, target)) return { session: next };
  if (session.mode === "colossus" && command.type === "confirm" && !session.pendingTargetPlayerId) {
    // Player confirmation only proposes a victim. The GM is the kill authority.
    return { session: { ...next, pendingTargetPlayerId: target.id } };
  }
  if (session.mode === "monkey" && command.type === "confirm") {
    const source = world.players.find((p) => p.id === actorId)!;
    const targetRole = target.displayRole ?? target.abilityRole!;
    let roleId: RoleId = target.illusion ? "a06" : targetRole;
    if (source.actingPoisoned) {
      // False information must be another in-game, non-evil card. Never fall
      // back to the pointed player's card or invent an out-of-game character.
      const candidates = world.players.filter((p) => p.id !== target.id && !p.evil
        && !!(p.displayRole ?? p.abilityRole) && (p.displayRole ?? p.abilityRole) !== targetRole
        && !EVIL_ROLES.includes((p.displayRole ?? p.abilityRole)!));
      if (candidates.length === 0) return { session: { ...next, error: "noSafeCard" } };
      const alternative = candidates[Math.floor(Math.random() * candidates.length)];
      roleId = (alternative.displayRole ?? alternative.abilityRole)!;
    }
    const monkeyReveal = { targetPlayerId: target.id, roleId, evil: EVIL_ROLES.includes(roleId) };
    const revealed = { ...next, visible: true, error: undefined, monkeyReveal };
    return { session: revealed, completedSession: revealed,
      action: { action: "monkey", targetPlayerId: target.id, sourcePlayerId: actorId, monkeyReveal } };
  }
  if (session.mode === "fox" && command.type === "confirm") {
    const foxReveal = resolveFoxReveal(actorId, target.id, world);
    if (!foxReveal) return { session: next };
    const revealed = { ...next, visible: true, foxReveal };
    return { session: revealed, completedSession: revealed,
      action: { action: "fox", targetPlayerId: target.id, sourcePlayerId: actorId, foxReveal } };
  }
  if (session.mode === "hunt" && command.type === "select") {
    return { session: { ...next, votes: { ...session.votes, [actorId]: target.id } } };
  }
  if ((session.mode === "poison" || session.mode === "shaman") && command.type === "confirm") {
    return { session: null, completedSession: session, action: { action: session.mode, targetPlayerId: target.id, sourcePlayerId: actorId } };
  }
  return { session: next };
}

export function getPhoneView(session: PhoneSession | null, viewerId: string, world: PhoneWorld): PhoneView | null {
  if (!session?.participantIds.includes(viewerId)) return null;
  const viewerIsMime = world.players.some((p) => p.id === viewerId && p.mime);
  return {
    id: session.id,
    mode: session.mode,
    participantIds: session.participantIds,
    votes: session.votes,
    pendingTargetPlayerId: session.pendingTargetPlayerId,
    ...((session.mode === "monkey" || session.mode === "fox") ? {
      visible: session.visible !== false,
      ...(session.mode === "monkey" ? { monkeyReveal: session.monkeyReveal, error: session.error } : { foxReveal: session.foxReveal }),
    } : {}),
    players: world.players.map((p) => ({
      id: p.id,
      name: p.name,
      seat_position: p.seat_position,
      selectable: isPhoneTarget(session, p),
      // Only Shaman's night action reveals pending deaths.
      redX: session.mode === "shaman" && p.redX,
      dead: p.dead,
      marker: (session.mode === "hunt" || session.mode === "allies") && !viewerIsMime && looksLikeWerewolf(p)
        ? "werewolf"
        : session.mode === "allies" && (p.evil || (!!p.objectiveRole && EVIL_ROLES.includes(p.objectiveRole)))
        ? "evil" : null,
    })),
  };
}
