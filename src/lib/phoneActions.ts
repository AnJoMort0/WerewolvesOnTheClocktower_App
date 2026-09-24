import { EVIL_ROLES, WEREWOLF_ROLES, type RoleId } from "@/lib/roles";
import type { ScriptLine } from "@/lib/i18n/types";
import { isColossusTarget } from "@/lib/colossus";
import { PHONE_MODE, type PhoneMode } from "@/lib/phoneActionModes";

const ROLE_ACTION_PHONE_MODES = {
  [PHONE_MODE.HUNTER_ASSASSINATION]: { roleId: "v08", dragAction: "role-v08" },
  [PHONE_MODE.SOLDIER_ASSASSINATION]: { roleId: "v09", dragAction: "role-soldier-kill" },
  [PHONE_MODE.WHITE_WEREWOLF_ASSASSINATION]: { roleId: "s02", dragAction: "role-s02" },
  [PHONE_MODE.CAPTAIN_APPOINT_SOLDIER]: { roleId: "v09", dragAction: "role-v09" },
  [PHONE_MODE.VILLAGE_ELDER_ASSIGN_VOTES]: { roleId: "v11", dragAction: "role-v11" },
  [PHONE_MODE.SAVIOUR_PROTECT]: { roleId: "v17", dragAction: "role-v17" },
  [PHONE_MODE.PROPHET_MARK]: { roleId: "v19", dragAction: "role-v19" },
  [PHONE_MODE.VINTNER_POISON]: { roleId: "v24", dragAction: "role-v24", canIgnore: true },
  [PHONE_MODE.PYROMANIAC_BURN]: { roleId: "v15", dragAction: "role-v15", canIgnore: true },
  [PHONE_MODE.EVIL_CUPID_PAIR]: { roleId: "m05", dragAction: "role-m05" },
  [PHONE_MODE.EVIL_CUPID_REPLACE]: { roleId: "m05", dragAction: "role-m05" },
  [PHONE_MODE.CUPID_PAIR]: { roleId: "s01", dragAction: "role-s01" },
  [PHONE_MODE.THIEF_REVOKE_VOTE]: { roleId: "f01", dragAction: "role-f01" },
  [PHONE_MODE.WOLF_DOG_CHOOSE_OWNER]: { roleId: "a02", dragAction: "role-a02" },
  [PHONE_MODE.ACTOR_CHOOSE_IDOL]: { roleId: "a04", dragAction: "role-a04" },
  [PHONE_MODE.ACTOR_CHANGE_IDOL]: { roleId: "a04", dragAction: "role-a04", canIgnore: true },
  [PHONE_MODE.GRAVE_ROBBER_SWAP]: { roleId: "a05", dragAction: "role-a05", canIgnore: true },
  [PHONE_MODE.ILLUSIONIST_HIDE]: { roleId: "a06", dragAction: "illusion" },
  [PHONE_MODE.SECRET_LOVER_CHECK]: { roleId: "as01b", dragAction: "role-as01b" },
  [PHONE_MODE.WILD_CHILD_CHOOSE_PARENT]: { roleId: "l02", dragAction: "role-l02" },
  [PHONE_MODE.DEVOUT_SERVANT_SAVE]: { roleId: "l06", dragAction: "role-l06", canIgnore: true },
} as const satisfies Partial<Record<PhoneMode, { roleId: RoleId; dragAction: string; canIgnore?: boolean }>>;
export type RoleActionPhoneMode = keyof typeof ROLE_ACTION_PHONE_MODES;
export function isRoleActionPhoneMode(mode: string): mode is RoleActionPhoneMode {
  return mode in ROLE_ACTION_PHONE_MODES;
}
export function getRoleActionPhoneConfig(mode: RoleActionPhoneMode) {
  return ROLE_ACTION_PHONE_MODES[mode];
}
export function canIgnoreRoleActionPhoneMode(mode: RoleActionPhoneMode): boolean {
  return "canIgnore" in ROLE_ACTION_PHONE_MODES[mode] && ROLE_ACTION_PHONE_MODES[mode].canIgnore === true;
}

const PHONE_MODES_THAT_CANNOT_TARGET_SELF = new Set<PhoneMode>([
  PHONE_MODE.WOLF_DOG_CHOOSE_OWNER,
  PHONE_MODE.ACTOR_CHOOSE_IDOL,
  PHONE_MODE.SECRET_LOVER_CHECK,
  PHONE_MODE.WILD_CHILD_CHOOSE_PARENT,
]);

export type MonkeyReveal = { targetPlayerId: string; roleId: RoleId; evil: boolean };
export type FoxReveal = {
  targetPlayerId: string;
  playerIds: string[];
  result: "evil" | "clear" | "confused";
  foxRanAway: boolean;
};
export type GypsyReveal = {
  targetPlayerId: string;
  playerIds: string[];
  poisoned: boolean;
};
export type PriestReveal = { targetPlayerId: string; roleId: RoleId };
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
  soldier?: boolean;
  lover?: boolean;
  identityProtected?: boolean;
  enemy?: boolean;
  enemySourceIds?: string[];
  poisoned?: boolean;
  acquitted?: boolean;
  acquittedSourceIds?: string[];
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
  gypsyReveal?: GypsyReveal;
  priestReveal?: PriestReveal;
  error?: "noSafeCard";
  pendingTargetPlayerId?: string;
  pendingTargetPlayerIds?: string[];
  minTargetCount?: number;
  targetCount?: number;
  approvalResult?: "accepted" | "denied";
  whiteWolfSolo?: boolean;
  completed?: boolean;
  ignored?: boolean;
};
export type PhoneCommand = {
  id: string;
  sessionId: string;
  sequence: number;
  type: "select" | "confirm" | "ignore" | "close" | "reopen";
  targetPlayerId?: string;
  targetPlayerIds?: string[];
};
export type PhoneAction = {
  action: "kill" | PhoneMode;
  targetPlayerId: string;
  targetPlayerIds?: string[];
  sourcePlayerId: string | null;
  monkeyReveal?: MonkeyReveal;
  foxReveal?: FoxReveal;
  gypsyReveal?: GypsyReveal;
};
export type PhoneView = Pick<PhoneSession, "id" | "mode" | "votes" | "participantIds"> & {
  sourcePlayerId?: string | null;
  visible?: boolean;
  monkeyReveal?: MonkeyReveal;
  foxReveal?: FoxReveal;
  gypsyReveal?: GypsyReveal;
  priestReveal?: PriestReveal;
  error?: "noSafeCard";
  pendingTargetPlayerId?: string;
  pendingTargetPlayerIds?: string[];
  minTargetCount?: number;
  targetCount?: number;
  approvalResult?: "accepted" | "denied";
  completed?: boolean;
  ignored?: boolean;
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

export function getPhoneTargetCount(mode: PhoneMode, sourcePlayerId: string | null, world: PhoneWorld): number {
  if (mode === PHONE_MODE.CUPID_PAIR || mode === PHONE_MODE.EVIL_CUPID_PAIR) return 2;
  if (mode === PHONE_MODE.WHITE_WEREWOLF_ASSASSINATION
    && world.players.some((player) => player.id === sourcePlayerId && player.actingPoisoned)) return 2;
  return 1;
}

export function getPhoneMinimumTargetCount(mode: PhoneMode): number {
  // Poison lets the White Werewolf kill one additional Werewolf; the second
  // victim remains optional and may not exist late in the game.
  return mode === PHONE_MODE.WHITE_WEREWOLF_ASSASSINATION ? 1
    : mode === PHONE_MODE.CUPID_PAIR || mode === PHONE_MODE.EVIL_CUPID_PAIR ? 2 : 1;
}

export function isWhiteWolfSolo(sourcePlayerId: string | null, world: PhoneWorld): boolean {
  return !!sourcePlayerId && !world.players.some((player) => player.id !== sourcePlayerId
    && !player.dead && !player.redX && looksLikeWerewolf(player));
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

export function resolveGypsyReveal(targetPlayerId: string, world: PhoneWorld): {
  reveal: GypsyReveal;
  poisonedPlayerId: string | null;
} | null {
  const playerIds = getFoxTargetPlayerIds(world.players, targetPlayerId);
  if (playerIds.length === 0) return null;
  const poisonedPlayerId = playerIds.find((id) => world.players.some((player) => player.id === id && player.poisoned)) ?? null;
  return {
    reveal: { targetPlayerId, playerIds, poisoned: !!poisonedPlayerId },
    poisonedPlayerId,
  };
}

export function getPhoneParticipants(mode: PhoneMode, sourcePlayerId: string | null, world: PhoneWorld): string[] {
  if (sourcePlayerId) {
    const player = world.players.find((p) => p.id === sourcePlayerId);
    if (!player || player.powerless) return [];
    if (isRoleActionPhoneMode(mode)) {
      const config = getRoleActionPhoneConfig(mode);
      const deathAction = mode === PHONE_MODE.HUNTER_ASSASSINATION || mode === PHONE_MODE.SOLDIER_ASSASSINATION;
      if (!deathAction && !player.canWake) return [];
      if (mode === PHONE_MODE.GRAVE_ROBBER_SWAP && player.actingPoisoned) return [];
      const matches = mode === PHONE_MODE.SOLDIER_ASSASSINATION ? !!player.soldier : player.abilityRole === config.roleId;
      return matches ? [sourcePlayerId] : [];
    }
    if (!player.canWake) return [];
    const matches = mode === PHONE_MODE.EVIL_WITCH_POISON ? player.abilityRole === "e02"
      : mode === PHONE_MODE.SHAMAN_SAVE ? player.abilityRole === "e03"
      : mode === PHONE_MODE.MONKEY_TAMER_REVEAL ? player.abilityRole === "v26" && !player.monkeyDisabled
      : mode === PHONE_MODE.FOX_TAMER_CHECK ? player.abilityRole === "v04" && !player.foxDisabled
      : mode === PHONE_MODE.GYPSY_POISON_CHECK ? player.abilityRole === "v12"
      : mode === PHONE_MODE.SPIDER_TAMER_WEB ? player.abilityRole === "v23"
      : mode === PHONE_MODE.PRIEST_CONFESSION ? player.abilityRole === "v25" && !player.actingPoisoned
      : mode === PHONE_MODE.SLEEPWALKER_VISIT ? player.abilityRole === "v16"
      : mode === PHONE_MODE.COLOSSUS_RETALIATION ? player.abilityRole === "v27" && !!player.colossusReady
      : mode === PHONE_MODE.WEREWOLF_HUNT && !!player.abilityRole && WEREWOLF_ROLES.includes(player.abilityRole);
    return matches ? [sourcePlayerId] : [];
  }
  if (mode !== PHONE_MODE.WEREWOLF_HUNT && mode !== PHONE_MODE.WEREWOLF_ALLIES) return [];
  if (mode === PHONE_MODE.WEREWOLF_HUNT && world.packBlocked) return [];
  const pack = world.players.filter((p) => p.canWake && looksLikeWerewolf(p));
  const hasWolf = pack.some((p) => p.werewolfTurned || (!!p.objectiveRole && WEREWOLF_ROLES.includes(p.objectiveRole)));
  return hasWolf ? pack.map((p) => p.id) : [];
}

export function isPhoneTarget(session: PhoneSession, player: PhonePlayer): boolean {
  if (session.completed) return false;
  if (isRoleActionPhoneMode(session.mode)) {
    if (session.approvalResult) return false;
    if (session.mode === PHONE_MODE.GRAVE_ROBBER_SWAP || session.mode === PHONE_MODE.DEVOUT_SERVANT_SAVE) {
      return player.redX && player.id !== session.sourcePlayerId;
    }
    if (session.mode === PHONE_MODE.WHITE_WEREWOLF_ASSASSINATION) {
      return player.id !== session.sourcePlayerId && !player.dead && !player.redX
        && (!!session.whiteWolfSolo || looksLikeWerewolf(player));
    }
    if (session.mode === PHONE_MODE.EVIL_CUPID_REPLACE
      && (player.enemy || !!session.sourcePlayerId && player.enemySourceIds?.includes(session.sourcePlayerId))) return false;
    if ((session.mode === PHONE_MODE.HUNTER_ASSASSINATION || session.mode === PHONE_MODE.SOLDIER_ASSASSINATION) && player.redX) return false;
    if (session.mode === PHONE_MODE.PYROMANIAC_BURN) {
      const sourceIds = player.acquittedSourceIds ?? [];
      return !!player.acquitted && !player.dead
        && (sourceIds.length === 0 || !!session.sourcePlayerId && sourceIds.includes(session.sourcePlayerId));
    }
    if (player.dead) return false;
    if (PHONE_MODES_THAT_CANNOT_TARGET_SELF.has(session.mode) && player.id === session.sourcePlayerId) return false;
    return true;
  }
  // The Monkey can inspect any card, including their own or a Ghost's.
  if (session.mode === PHONE_MODE.MONKEY_TAMER_REVEAL) return !session.monkeyReveal && !!(player.displayRole ?? player.abilityRole);
  if (session.mode === PHONE_MODE.FOX_TAMER_CHECK) return !session.foxReveal && !player.dead;
  if (session.mode === PHONE_MODE.GYPSY_POISON_CHECK) return !session.gypsyReveal && !player.dead;
  if (session.mode === PHONE_MODE.COLOSSUS_RETALIATION) return isColossusTarget(player);
  // Any other player may confess to the Priest, including a Ghost.
  if (session.mode === PHONE_MODE.PRIEST_CONFESSION) return player.id !== session.sourcePlayerId;
  if (session.mode === PHONE_MODE.WEREWOLF_ALLIES || player.dead) return false;
  if (session.mode === PHONE_MODE.SHAMAN_SAVE) return player.redX;
  // The Witch can target herself, and pending victims may still be poisoned before dawn.
  if (session.mode === PHONE_MODE.EVIL_WITCH_POISON) return true;
  // Match the GM's unrestricted kill targeting; do not disclose other pending night kills.
  return true;
}

export function reconcilePhoneSession(session: PhoneSession | null, world: PhoneWorld): PhoneSession | null {
  if (!session) return null;
  // Keep a resolved card available even after its source loses powers or dies.
  if (session.mode === PHONE_MODE.MONKEY_TAMER_REVEAL && session.monkeyReveal) {
    return world.players.some((p) => p.id === session.sourcePlayerId && p.abilityRole === "v26") ? session : null;
  }
  if (session.mode === PHONE_MODE.FOX_TAMER_CHECK && session.foxReveal) {
    return world.players.some((p) => p.id === session.sourcePlayerId && p.abilityRole === "v04") ? session : null;
  }
  if (session.mode === PHONE_MODE.GYPSY_POISON_CHECK && session.gypsyReveal) {
    return world.players.some((p) => p.id === session.sourcePlayerId && p.abilityRole === "v12") ? session : null;
  }
  if (session.mode === PHONE_MODE.PRIEST_CONFESSION && session.priestReveal) {
    return world.players.some((p) => p.id === session.sourcePlayerId && p.abilityRole === "v25") ? session : null;
  }
  if (session.mode === PHONE_MODE.SECRET_LOVER_CHECK && session.approvalResult) {
    return world.players.some((p) => p.id === session.sourcePlayerId && p.abilityRole === "as01b") ? session : null;
  }
  if (session.mode === PHONE_MODE.SLEEPWALKER_VISIT && session.pendingTargetPlayerId) {
    return world.players.some((p) => p.id === session.sourcePlayerId && p.abilityRole === "v16") ? session : null;
  }
  // Completed actions remain visible until the GM closes them, even when the
  // action itself changed a target or exhausted its source's power.
  if (session.completed) return session;
  const participantIds = getPhoneParticipants(session.mode, session.sourcePlayerId, world);
  if (participantIds.length === 0) return null;
  if (session.pendingTargetPlayerId && !world.players.some((p) => p.id === session.pendingTargetPlayerId && isPhoneTarget(session, p))) {
    return { ...session, pendingTargetPlayerId: undefined };
  }
  if (session.pendingTargetPlayerIds?.some((targetId) => !world.players.some((p) => p.id === targetId && isPhoneTarget(session, p)))) {
    return { ...session, pendingTargetPlayerIds: undefined };
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
  if (!session || session.mode !== PHONE_MODE.WEREWOLF_HUNT || session.participantIds.length === 0) return null;
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
  if (session.completed) return { session: next };
  if ((session.mode === PHONE_MODE.MONKEY_TAMER_REVEAL || session.mode === PHONE_MODE.FOX_TAMER_CHECK
      || session.mode === PHONE_MODE.GYPSY_POISON_CHECK)
    && (command.type === "close" || command.type === "reopen")) {
    return { session: { ...next, visible: command.type === "reopen" } };
  }
  if (command.type === "ignore" && (session.mode === PHONE_MODE.SHAMAN_SAVE
    || isRoleActionPhoneMode(session.mode) && canIgnoreRoleActionPhoneMode(session.mode))) {
    const completed = { ...next, completed: true, ignored: true };
    return { session: completed, completedSession: completed };
  }
  if (isRoleActionPhoneMode(session.mode) && command.type === "confirm") {
    const targetIds = [...new Set(command.targetPlayerIds?.length ? command.targetPlayerIds : command.targetPlayerId ? [command.targetPlayerId] : [])];
    const maximum = session.targetCount ?? 1;
    const minimum = session.minTargetCount ?? maximum;
    const valid = targetIds.length >= minimum && targetIds.length <= maximum && targetIds.every((targetId) => (
      world.players.some((player) => player.id === targetId && isPhoneTarget(session!, player))
    ));
    if (!valid) return { session: next };
    if (session.mode === PHONE_MODE.SECRET_LOVER_CHECK) {
      const chosen = world.players.find((player) => player.id === targetIds[0])!;
      const accepted = !!chosen.lover && !chosen.identityProtected;
      const resolved = {
        ...next,
        pendingTargetPlayerId: chosen.id,
        pendingTargetPlayerIds: [chosen.id],
        approvalResult: accepted ? "accepted" as const : "denied" as const,
      };
      return {
        session: resolved,
        completedSession: resolved,
        ...(accepted ? { action: { action: session.mode, targetPlayerId: chosen.id, targetPlayerIds: [chosen.id], sourcePlayerId: actorId } as PhoneAction } : {}),
      };
    }
    const completed = {
      ...next,
      pendingTargetPlayerId: targetIds[0],
      pendingTargetPlayerIds: targetIds,
      completed: true,
    };
    return {
      session: completed,
      completedSession: completed,
      action: { action: session.mode, targetPlayerId: targetIds[0], targetPlayerIds: targetIds, sourcePlayerId: actorId },
    };
  }
  const target = world.players.find((p) => p.id === command.targetPlayerId);
  if (!target || !isPhoneTarget(session, target)) return { session: next };
  if (session.mode === PHONE_MODE.COLOSSUS_RETALIATION && command.type === "confirm" && !session.pendingTargetPlayerId) {
    // Player confirmation only proposes a victim. The GM is the kill authority.
    return { session: { ...next, pendingTargetPlayerId: target.id } };
  }
  if (session.mode === PHONE_MODE.MONKEY_TAMER_REVEAL && command.type === "confirm") {
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
      action: { action: PHONE_MODE.MONKEY_TAMER_REVEAL, targetPlayerId: target.id, sourcePlayerId: actorId, monkeyReveal } };
  }
  if (session.mode === PHONE_MODE.FOX_TAMER_CHECK && command.type === "confirm") {
    const foxReveal = resolveFoxReveal(actorId, target.id, world);
    if (!foxReveal) return { session: next };
    const revealed = { ...next, visible: true, foxReveal };
    return { session: revealed, completedSession: revealed,
      action: { action: PHONE_MODE.FOX_TAMER_CHECK, targetPlayerId: target.id, sourcePlayerId: actorId, foxReveal } };
  }
  if (session.mode === PHONE_MODE.GYPSY_POISON_CHECK && command.type === "confirm") {
    const result = resolveGypsyReveal(target.id, world);
    if (!result) return { session: next };
    const revealed = { ...next, visible: true, gypsyReveal: result.reveal };
    return {
      session: revealed,
      completedSession: revealed,
      ...(result.poisonedPlayerId ? {
        action: {
          action: PHONE_MODE.GYPSY_POISON_CHECK,
          targetPlayerId: result.poisonedPlayerId,
          sourcePlayerId: actorId,
          gypsyReveal: result.reveal,
        } as PhoneAction,
      } : {}),
    };
  }
  if (session.mode === PHONE_MODE.WEREWOLF_HUNT && command.type === "select") {
    return { session: { ...next, votes: { ...session.votes, [actorId]: target.id } } };
  }
  if (session.mode === PHONE_MODE.PRIEST_CONFESSION && command.type === "confirm" && !session.pendingTargetPlayerId) {
    return { session: { ...next, pendingTargetPlayerId: target.id } };
  }
  if ((session.mode === PHONE_MODE.SPIDER_TAMER_WEB && command.type === "select"
    || session.mode === PHONE_MODE.SLEEPWALKER_VISIT && command.type === "confirm")
    && !session.pendingTargetPlayerId) {
    const selected = { ...next, pendingTargetPlayerId: target.id, completed: true };
    return { session: selected, completedSession: selected,
      action: { action: session.mode, targetPlayerId: target.id, sourcePlayerId: actorId } };
  }
  if ((session.mode === PHONE_MODE.EVIL_WITCH_POISON || session.mode === PHONE_MODE.SHAMAN_SAVE) && command.type === "confirm") {
    const completed = { ...next, pendingTargetPlayerId: target.id, completed: true };
    return { session: completed, completedSession: completed, action: { action: session.mode, targetPlayerId: target.id, sourcePlayerId: actorId } };
  }
  return { session: next };
}

export function getPhoneView(session: PhoneSession | null, viewerId: string, world: PhoneWorld): PhoneView | null {
  if (!session?.participantIds.includes(viewerId)) return null;
  const viewerIsMime = world.players.some((p) => p.id === viewerId && p.mime);
  return {
    id: session.id,
    mode: session.mode,
    sourcePlayerId: session.sourcePlayerId,
    participantIds: session.participantIds,
    votes: session.votes,
    pendingTargetPlayerId: session.pendingTargetPlayerId,
    pendingTargetPlayerIds: session.pendingTargetPlayerIds,
    minTargetCount: session.minTargetCount,
    targetCount: session.targetCount,
    approvalResult: session.approvalResult,
    completed: session.completed,
    ignored: session.ignored,
    ...((session.mode === PHONE_MODE.MONKEY_TAMER_REVEAL || session.mode === PHONE_MODE.FOX_TAMER_CHECK
      || session.mode === PHONE_MODE.GYPSY_POISON_CHECK) ? {
      visible: session.visible !== false,
      ...(session.mode === PHONE_MODE.MONKEY_TAMER_REVEAL
        ? { monkeyReveal: session.monkeyReveal, error: session.error }
        : session.mode === PHONE_MODE.FOX_TAMER_CHECK
        ? { foxReveal: session.foxReveal }
        : { gypsyReveal: session.gypsyReveal }),
    } : {}),
    ...(session.mode === PHONE_MODE.PRIEST_CONFESSION ? { priestReveal: session.priestReveal } : {}),
    players: world.players.map((p) => ({
      id: p.id,
      name: p.name,
      seat_position: p.seat_position,
      selectable: isPhoneTarget(session, p),
      // Only Shaman's night action reveals pending deaths.
      redX: (session.mode === PHONE_MODE.SHAMAN_SAVE || session.mode === PHONE_MODE.GRAVE_ROBBER_SWAP
        || session.mode === PHONE_MODE.DEVOUT_SERVANT_SAVE) && p.redX,
      dead: p.dead,
      marker: (session.mode === PHONE_MODE.WEREWOLF_HUNT || session.mode === PHONE_MODE.WEREWOLF_ALLIES
        || session.mode === PHONE_MODE.WHITE_WEREWOLF_ASSASSINATION) && !viewerIsMime && looksLikeWerewolf(p)
        ? "werewolf"
        : session.mode === PHONE_MODE.WEREWOLF_ALLIES && (p.evil || (!!p.objectiveRole && EVIL_ROLES.includes(p.objectiveRole)))
        ? "evil" : null,
    })),
  };
}
