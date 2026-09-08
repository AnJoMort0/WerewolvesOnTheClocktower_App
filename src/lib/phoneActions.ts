import { EVIL_ROLES, WEREWOLF_ROLES, type RoleId } from "@/lib/roles";
import type { ScriptLine } from "@/lib/i18n/types";

export type PhoneMode = "hunt" | "allies" | "poison" | "shaman";
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
};
export type PhoneWorld = { players: PhonePlayer[]; packBlocked: boolean };
export type PhoneSession = {
  id: string;
  lineKey: string;
  mode: PhoneMode;
  sourcePlayerId: string | null;
  participantIds: string[];
  votes: Record<string, string>;
  sequences: Record<string, number>;
};
export type PhoneCommand = {
  id: string;
  sessionId: string;
  sequence: number;
  type: "select" | "confirm" | "ignore";
  targetPlayerId?: string;
};
export type PhoneAction = { action: "kill" | "poison" | "shaman"; targetPlayerId: string; sourcePlayerId: string | null };
export type PhoneView = Pick<PhoneSession, "id" | "mode" | "votes" | "participantIds"> & {
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

export function getPhoneParticipants(mode: PhoneMode, sourcePlayerId: string | null, world: PhoneWorld): string[] {
  if (sourcePlayerId) {
    const player = world.players.find((p) => p.id === sourcePlayerId);
    if (!player?.canWake || player.powerless) return [];
    const matches = mode === "poison" ? player.abilityRole === "e02"
      : mode === "shaman" ? player.abilityRole === "e03"
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
  if (session.mode === "allies" || player.dead) return false;
  if (session.mode === "shaman") return player.redX;
  // The Witch can target herself, and pending victims may still be poisoned before dawn.
  if (session.mode === "poison") return true;
  // Match the GM's unrestricted kill targeting; do not disclose other pending night kills.
  return true;
}

export function reconcilePhoneSession(session: PhoneSession | null, world: PhoneWorld): PhoneSession | null {
  if (!session) return null;
  const participantIds = getPhoneParticipants(session.mode, session.sourcePlayerId, world);
  if (participantIds.length === 0) return null;
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
} {
  session = reconcilePhoneSession(session, world);
  if (!session || command.sessionId !== session.id || !session.participantIds.includes(actorId)
    || !Number.isFinite(command.sequence) || command.sequence <= (session.sequences[actorId] ?? 0)) return { session };
  const next = { ...session, sequences: { ...session.sequences, [actorId]: command.sequence } };
  if (command.type === "ignore" && session.mode === "shaman") return { session: null };
  const target = world.players.find((p) => p.id === command.targetPlayerId);
  if (!target || !isPhoneTarget(session, target)) return { session: next };
  if (session.mode === "hunt" && command.type === "select") {
    return { session: { ...next, votes: { ...session.votes, [actorId]: target.id } } };
  }
  if ((session.mode === "poison" || session.mode === "shaman") && command.type === "confirm") {
    return { session: null, action: { action: session.mode, targetPlayerId: target.id, sourcePlayerId: actorId } };
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
