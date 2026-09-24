import { PHONE_MODE } from "@/lib/phoneActionModes";
import { describe, expect, it } from "vitest";
import { getScripts } from "@/lib/i18n";
import type { RoleId } from "@/lib/roles";
import {
  applyPhoneCommand, getFoxTargetPlayerIds, getHuntConsensus, getPhoneMinimumTargetCount, getPhoneParticipants,
  getPhoneTargetCount, getPhoneView, getRoleActionPhoneConfig, getScriptPhoneMode,
  reconcilePhoneSession, resolveFoxReveal, resolveGypsyReveal,
  type PhonePlayer, type PhoneSession, type PhoneWorld,
} from "@/lib/phoneActions";

export const phonePlayer = (id: string, role: RoleId, overrides: Partial<PhonePlayer> = {}): PhonePlayer => ({
  id, name: id, seat_position: 0, dead: false, redX: false, abilityRole: role, objectiveRole: role,
  werewolfTurned: false, evil: false, mime: false, canWake: true, powerless: false, ...overrides,
});
const world: PhoneWorld = { packBlocked: false, players: [
  phonePlayer("wolf", "e01"), phonePlayer("hiddenWolf", "m06"), phonePlayer("puppeteer", "v06"),
  phonePlayer("witch", "e02"), phonePlayer("shaman", "e03"), phonePlayer("villager", "v02"),
] };
const hunt = (): PhoneSession => ({
  id: "night-hunt", mode: PHONE_MODE.WEREWOLF_HUNT, lineKey: "hunt-line", sourcePlayerId: null,
  participantIds: ["wolf", "hiddenWolf", "puppeteer"], votes: {}, sequences: {},
});

describe("GM-controlled phone rules", () => {
  it("keeps every phone mode unique and descriptively named", () => {
    const modes = Object.values(PHONE_MODE);
    expect(new Set(modes)).toHaveLength(modes.length);
    expect(modes.every((mode) => /^[a-z]+(?:-[a-z]+)+$/.test(mode))).toBe(true);
  });

  it.each(["pt", "fr", "en"] as const)("finds the allies line independently of the %s wording", (language) => {
    expect(getScripts(language).secondNight.filter((line) => getScriptPhoneMode(line) === PHONE_MODE.WEREWOLF_ALLIES)).toHaveLength(1);
  });

  it.each(["pt", "fr", "en"] as const)("registers Fox Tamer controls on both scripts in %s", (language) => {
    const scripts = getScripts(language);
    expect(scripts.firstNight.find((line) => line.requires?.includes("v04"))?.phoneMode).toBe(PHONE_MODE.FOX_TAMER_CHECK);
    expect(scripts.normalNight.find((line) => line.requires?.includes("v04"))?.phoneMode).toBe(PHONE_MODE.FOX_TAMER_CHECK);
  });

  it.each(["pt", "fr", "en"] as const)("registers Spider Tamer controls for the first web and its replacement in %s", (language) => {
    const scripts = getScripts(language);
    expect(scripts.firstNight.find((line) => line.requires?.includes("v23"))?.phoneMode).toBe(PHONE_MODE.SPIDER_TAMER_WEB);
    expect(scripts.normalNight.find((line) => line.conditionKey === "spiderWebbedDied")?.phoneMode).toBe(PHONE_MODE.SPIDER_TAMER_WEB);
  });

  it.each(["pt", "fr", "en"] as const)("registers Priest and Sleepwalker controls in %s", (language) => {
    const scripts = getScripts(language).normalNight;
    expect(scripts.find((line) => line.requires?.includes("v25"))?.phoneMode).toBe(PHONE_MODE.PRIEST_CONFESSION);
    expect(scripts.find((line) => line.requires?.includes("v16"))?.phoneMode).toBe(PHONE_MODE.SLEEPWALKER_VISIT);
  });

  it.each(["pt", "fr", "en"] as const)("registers Gypsy and Pyromaniac controls in %s", (language) => {
    const scripts = getScripts(language).normalNight;
    expect(scripts.find((line) => line.requires?.includes("v12"))?.phoneMode).toBe(PHONE_MODE.GYPSY_POISON_CHECK);
    expect(scripts.find((line) => line.requires?.includes("v15"))?.phoneMode).toBe(PHONE_MODE.PYROMANIAC_BURN);
  });

  it.each(["pt", "fr", "en"] as const)("registers every new role action on the intended script line in %s", (language) => {
    const scripts = getScripts(language);
    expect(scripts.firstNight.find((line) => line.requires?.includes("s01"))?.phoneMode).toBe(PHONE_MODE.CUPID_PAIR);
    expect(scripts.firstNight.find((line) => line.requires?.includes("m05"))?.phoneMode).toBe(PHONE_MODE.EVIL_CUPID_PAIR);
    expect(scripts.secondNight.find((line) => line.requires?.includes("a02"))?.phoneMode).toBe(PHONE_MODE.WOLF_DOG_CHOOSE_OWNER);
    expect(scripts.secondNight.find((line) => line.requires?.includes("l02"))?.phoneMode).toBe(PHONE_MODE.WILD_CHILD_CHOOSE_PARENT);
    const normal = scripts.normalNight;
    expect(normal.find((line) => line.conditionKey === "hunterDied")?.phoneMode).toBe(PHONE_MODE.HUNTER_ASSASSINATION);
    expect(normal.find((line) => line.conditionKey === "soldierDied")?.phoneMode).toBe(PHONE_MODE.SOLDIER_ASSASSINATION);
    expect(normal.find((line) => line.conditionKey === "whitewolfNight")?.phoneMode).toBe(PHONE_MODE.WHITE_WEREWOLF_ASSASSINATION);
    expect(normal.find((line) => line.conditionKey === "secretLoverBetrayed")?.phoneMode).toBeUndefined();
    const roleModes = [
      ["v09", PHONE_MODE.CAPTAIN_APPOINT_SOLDIER],
      ["v11", PHONE_MODE.VILLAGE_ELDER_ASSIGN_VOTES],
      ["v17", PHONE_MODE.SAVIOUR_PROTECT],
      ["v19", PHONE_MODE.PROPHET_MARK],
      ["v24", PHONE_MODE.VINTNER_POISON],
      ["f01", PHONE_MODE.THIEF_REVOKE_VOTE],
      ["a05", PHONE_MODE.GRAVE_ROBBER_SWAP],
      ["a06", PHONE_MODE.ILLUSIONIST_HIDE],
      ["as01b", PHONE_MODE.SECRET_LOVER_CHECK],
      ["l06", PHONE_MODE.DEVOUT_SERVANT_SAVE],
    ] as const;
    for (const [role, mode] of roleModes) {
      expect(normal.find((line) => line.requires?.includes(role))?.phoneMode).toBe(mode);
    }
  });

  it("supports copied roles and death-triggered Hunter and Soldier actions", () => {
    const changed: PhoneWorld = { packBlocked: false, players: [
      phonePlayer("copy", "v17", { objectiveRole: "a04" }),
      phonePlayer("hunter", "v08", { dead: true, canWake: false }),
      phonePlayer("soldier", "v01", { dead: true, canWake: false, soldier: true }),
      phonePlayer("poisonedRobber", "a05", { actingPoisoned: true }),
    ] };
    expect(getPhoneParticipants(PHONE_MODE.SAVIOUR_PROTECT, "copy", changed)).toEqual(["copy"]);
    expect(getPhoneParticipants(PHONE_MODE.HUNTER_ASSASSINATION, "hunter", changed)).toEqual(["hunter"]);
    expect(getPhoneParticipants(PHONE_MODE.SOLDIER_ASSASSINATION, "soldier", changed)).toEqual(["soldier"]);
    expect(getPhoneParticipants(PHONE_MODE.GRAVE_ROBBER_SWAP, "poisonedRobber", changed)).toEqual([]);
    expect(getRoleActionPhoneConfig(PHONE_MODE.ILLUSIONIST_HIDE).dragAction).toBe("illusion");
    expect(getRoleActionPhoneConfig(PHONE_MODE.SOLDIER_ASSASSINATION).dragAction).toBe("role-soldier-kill");
  });

  it("limits victim-only roles and White Werewolf targets", () => {
    const changed: PhoneWorld = { packBlocked: false, players: [
      phonePlayer("white", "s02"),
      phonePlayer("wolf", "e01"),
      phonePlayer("turned", "v01", { werewolfTurned: true }),
      phonePlayer("villager", "v01"),
      phonePlayer("victim", "v01", { redX: true }),
    ] };
    const whiteSession: PhoneSession = { id: "white", mode: PHONE_MODE.WHITE_WEREWOLF_ASSASSINATION, lineKey: "white", sourcePlayerId: "white", participantIds: ["white"], votes: {}, sequences: {} };
    expect(getPhoneView(whiteSession, "white", changed)?.players.filter((player) => player.selectable).map((player) => player.id)).toEqual(["wolf", "turned"]);
    const soloView = getPhoneView({ ...whiteSession, whiteWolfSolo: true }, "white", changed)!;
    expect(soloView.players.find((player) => player.id === "villager")?.selectable).toBe(true);
    const victimSession: PhoneSession = { ...whiteSession, mode: PHONE_MODE.DEVOUT_SERVANT_SAVE };
    expect(getPhoneView(victimSession, "white", changed)?.players.filter((player) => player.selectable).map((player) => player.id)).toEqual(["victim"]);
  });

  it("does not offer a copied Evil Cupid's surviving Enemy as the replacement", () => {
    const changed: PhoneWorld = { packBlocked: false, players: [
      phonePlayer("dog", "m05", { objectiveRole: "a02" }),
      phonePlayer("enemy", "v01", { enemySourceIds: ["dog"] }),
      phonePlayer("available", "v02"),
    ] };
    const session: PhoneSession = { id: "enemy", mode: PHONE_MODE.EVIL_CUPID_REPLACE, lineKey: "enemy", sourcePlayerId: "dog", participantIds: ["dog"], votes: {}, sequences: {} };
    const selectable = getPhoneView(session, "dog", changed)?.players.filter((player) => player.selectable).map((player) => player.id);
    expect(selectable).toContain("available");
    expect(selectable).not.toContain("enemy");
  });

  it("accepts both members of a pair and an optional second poisoned White Werewolf victim", () => {
    const changed: PhoneWorld = { packBlocked: false, players: [
      phonePlayer("cupid", "s01"), phonePlayer("one", "v01"), phonePlayer("two", "v02"),
      phonePlayer("white", "s02", { actingPoisoned: true }), phonePlayer("wolf", "e01"), phonePlayer("otherWolf", "m01"),
    ] };
    const pair: PhoneSession = { id: "pair", mode: PHONE_MODE.CUPID_PAIR, lineKey: "pair", sourcePlayerId: "cupid", participantIds: ["cupid"], votes: {}, sequences: {}, minTargetCount: 2, targetCount: 2 };
    expect(applyPhoneCommand(pair, "cupid", { id: "one", sessionId: "pair", sequence: 1, type: "confirm", targetPlayerIds: ["one"] }, changed).action).toBeUndefined();
    expect(applyPhoneCommand(pair, "cupid", { id: "two", sessionId: "pair", sequence: 1, type: "confirm", targetPlayerIds: ["one", "two"] }, changed).action).toMatchObject({
      action: PHONE_MODE.CUPID_PAIR, sourcePlayerId: "cupid", targetPlayerIds: ["one", "two"],
    });
    expect(getPhoneMinimumTargetCount(PHONE_MODE.WHITE_WEREWOLF_ASSASSINATION)).toBe(1);
    expect(getPhoneTargetCount(PHONE_MODE.WHITE_WEREWOLF_ASSASSINATION, "white", changed)).toBe(2);
    const white: PhoneSession = { id: "white", mode: PHONE_MODE.WHITE_WEREWOLF_ASSASSINATION, lineKey: "white", sourcePlayerId: "white", participantIds: ["white"], votes: {}, sequences: {}, minTargetCount: 1, targetCount: 2 };
    expect(applyPhoneCommand(white, "white", { id: "one-wolf", sessionId: "white", sequence: 1, type: "confirm", targetPlayerIds: ["wolf"] }, changed).action?.targetPlayerIds).toEqual(["wolf"]);
    expect(applyPhoneCommand(white, "white", { id: "two-wolves", sessionId: "white", sequence: 1, type: "confirm", targetPlayerIds: ["wolf", "otherWolf"] }, changed).action?.targetPlayerIds).toEqual(["wolf", "otherWolf"]);
  });

  it("automatically tells the Secret Lover whether the chosen identity is exposed", () => {
    const changed: PhoneWorld = { packBlocked: false, players: [
      phonePlayer("secret", "as01b"),
      phonePlayer("lover", "v01", { lover: true }),
      phonePlayer("protected", "v02", { lover: true, identityProtected: true }),
      phonePlayer("other", "v03"),
    ] };
    const session: PhoneSession = { id: "secret", mode: PHONE_MODE.SECRET_LOVER_CHECK, lineKey: "secret", sourcePlayerId: "secret", participantIds: ["secret"], votes: {}, sequences: {}, targetCount: 1 };
    const correct = applyPhoneCommand(session, "secret", { id: "correct", sessionId: "secret", sequence: 1, type: "confirm", targetPlayerId: "lover" }, changed);
    expect(correct).toMatchObject({ session: { approvalResult: "accepted", pendingTargetPlayerId: "lover" }, completedSession: { approvalResult: "accepted" }, action: { action: PHONE_MODE.SECRET_LOVER_CHECK, targetPlayerId: "lover" } });
    expect(reconcilePhoneSession(correct.session, changed)?.approvalResult).toBe("accepted");
    const protectedResult = applyPhoneCommand(session, "secret", { id: "protected", sessionId: "secret", sequence: 1, type: "confirm", targetPlayerId: "protected" }, changed);
    expect(protectedResult.session?.approvalResult).toBe("denied");
    expect(protectedResult.action).toBeUndefined();
    const wrong = applyPhoneCommand(session, "secret", { id: "wrong", sessionId: "secret", sequence: 1, type: "confirm", targetPlayerId: "other" }, changed);
    expect(wrong.session?.approvalResult).toBe("denied");
    expect(wrong.action).toBeUndefined();
  });

  it("lets copied Spider powers choose a living web target and completes the script action", () => {
    const changed: PhoneWorld = { packBlocked: false, players: [
      phonePlayer("dog", "v23", { objectiveRole: "a02", seat_position: 0 }),
      phonePlayer("target", "v01", { seat_position: 1 }),
      phonePlayer("ghost", "v01", { seat_position: 2, dead: true }),
    ] };
    expect(getPhoneParticipants(PHONE_MODE.SPIDER_TAMER_WEB, "dog", changed)).toEqual(["dog"]);
    const session: PhoneSession = { id: "web", mode: PHONE_MODE.SPIDER_TAMER_WEB, lineKey: "web-line", sourcePlayerId: "dog", participantIds: ["dog"], votes: {}, sequences: {} };
    const confirmed = applyPhoneCommand(session, "dog", {
      id: "select", sessionId: "web", sequence: 1, type: "select", targetPlayerId: "target",
    }, changed);
    expect(confirmed).toMatchObject({
      session: { pendingTargetPlayerId: "target" },
      completedSession: { pendingTargetPlayerId: "target" },
      action: { action: PHONE_MODE.SPIDER_TAMER_WEB, sourcePlayerId: "dog", targetPlayerId: "target" },
    });
    expect(applyPhoneCommand(session, "dog", {
      id: "dead", sessionId: "web", sequence: 1, type: "select", targetPlayerId: "ghost",
    }, changed).action).toBeUndefined();
  });

  it("lets a copied Sleepwalker confirm a visit and keeps the selection visible", () => {
    const changed: PhoneWorld = { packBlocked: false, players: [
      phonePlayer("actor", "v16", { objectiveRole: "a04", seat_position: 0 }),
      phonePlayer("target", "v01", { seat_position: 1 }),
    ] };
    expect(getPhoneParticipants(PHONE_MODE.SLEEPWALKER_VISIT, "actor", changed)).toEqual(["actor"]);
    const session: PhoneSession = { id: "visit", mode: PHONE_MODE.SLEEPWALKER_VISIT, lineKey: "visit-line", sourcePlayerId: "actor", participantIds: ["actor"], votes: {}, sequences: {} };
    const result = applyPhoneCommand(session, "actor", {
      id: "visit", sessionId: "visit", sequence: 1, type: "confirm", targetPlayerId: "target",
    }, changed);
    expect(result).toMatchObject({
      session: { pendingTargetPlayerId: "target" },
      completedSession: { pendingTargetPlayerId: "target" },
      action: { action: PHONE_MODE.SLEEPWALKER_VISIT, sourcePlayerId: "actor", targetPlayerId: "target" },
    });
  });

  it("lets living players and Ghosts confess, excludes the Priest, and blocks a poisoned copied Priest", () => {
    const changed: PhoneWorld = { packBlocked: false, players: [
      phonePlayer("mime", "v25", { objectiveRole: "a03", mime: true, seat_position: 0 }),
      phonePlayer("living", "v01", { seat_position: 1 }),
      phonePlayer("ghost", "v03", { seat_position: 2, dead: true, canWake: false }),
    ] };
    expect(getPhoneParticipants(PHONE_MODE.PRIEST_CONFESSION, "mime", changed)).toEqual(["mime"]);
    const session: PhoneSession = { id: "confess", mode: PHONE_MODE.PRIEST_CONFESSION, lineKey: "priest-line", sourcePlayerId: "mime", participantIds: ["mime"], votes: {}, sequences: {} };
    const view = getPhoneView(session, "mime", changed)!;
    expect(view.players.filter((player) => player.selectable).map((player) => player.id)).toEqual(["living", "ghost"]);
    const proposed = applyPhoneCommand(session, "mime", {
      id: "ghost", sessionId: "confess", sequence: 1, type: "confirm", targetPlayerId: "ghost",
    }, changed);
    expect(proposed).toEqual({ session: expect.objectContaining({ pendingTargetPlayerId: "ghost" }) });
    const poisoned = { ...changed, players: changed.players.map((player) => player.id === "mime" ? { ...player, actingPoisoned: true } : player) };
    expect(getPhoneParticipants(PHONE_MODE.PRIEST_CONFESSION, "mime", poisoned)).toEqual([]);
  });

  it("checks the selected player and nearest living neighbours around the circle", () => {
    const players = [
      phonePlayer("one", "v01", { seat_position: 0 }),
      phonePlayer("dead", "v01", { seat_position: 1, dead: true }),
      phonePlayer("three", "v01", { seat_position: 2 }),
      phonePlayer("four", "v01", { seat_position: 3 }),
    ];
    expect(getFoxTargetPlayerIds(players, "three")).toEqual(["one", "three", "four"]);
    expect(getFoxTargetPlayerIds(players, "one")).toEqual(["four", "one", "three"]);
  });

  it("resolves truthful, poisoned, first-night, runaway, and Illusionist Fox information", () => {
    const players = [
      phonePlayer("fox", "v04", { seat_position: 0 }),
      phonePlayer("left", "v01", { seat_position: 1 }),
      phonePlayer("target", "v01", { seat_position: 2 }),
      phonePlayer("wolf", "e01", { seat_position: 3 }),
      phonePlayer("outside", "v01", { seat_position: 4 }),
    ];
    expect(resolveFoxReveal("fox", "target", { packBlocked: false, nightNumber: 2, players })).toMatchObject({
      playerIds: ["left", "target", "wolf"], result: "evil", foxRanAway: false,
    });
    const clearPlayers = players.map((player) => player.id === "wolf" ? { ...player, objectiveRole: "v01" as const, abilityRole: "v01" as const } : player);
    expect(resolveFoxReveal("fox", "target", { packBlocked: false, nightNumber: 1, players: clearPlayers })).toMatchObject({ result: "clear", foxRanAway: false });
    expect(resolveFoxReveal("fox", "target", { packBlocked: false, nightNumber: 2, players: clearPlayers })).toMatchObject({ result: "clear", foxRanAway: true });
    const poisoned = clearPlayers.map((player) => player.id === "fox" ? { ...player, actingPoisoned: true } : player);
    expect(resolveFoxReveal("fox", "target", { packBlocked: false, nightNumber: 2, players: poisoned })).toMatchObject({ result: "evil", foxRanAway: false });
    const illusion = players.map((player) => player.id === "left" ? { ...player, illusion: true } : player);
    expect(resolveFoxReveal("fox", "target", { packBlocked: false, nightNumber: 2, players: illusion })).toMatchObject({ result: "confused", foxRanAway: false });
  });

  it("supports a (Were)wolf Tamer using the Fox power and preserves the confirmed result", () => {
    const changed: PhoneWorld = { packBlocked: false, nightNumber: 2, players: [
      phonePlayer("dog", "v04", { objectiveRole: "m06", seat_position: 0 }),
      phonePlayer("left", "v01", { seat_position: 1 }),
      phonePlayer("target", "v01", { seat_position: 2 }),
      phonePlayer("right", "v01", { seat_position: 3 }),
    ] };
    expect(getPhoneParticipants(PHONE_MODE.FOX_TAMER_CHECK, "dog", changed)).toEqual(["dog"]);
    const session: PhoneSession = { id: "fox", mode: PHONE_MODE.FOX_TAMER_CHECK, lineKey: "fox-line", sourcePlayerId: "dog", participantIds: ["dog"], votes: {}, sequences: {} };
    const result = applyPhoneCommand(session, "dog", { id: "confirm", sessionId: "fox", sequence: 1, type: "confirm", targetPlayerId: "target" }, changed);
    expect(result.action).toMatchObject({ action: PHONE_MODE.FOX_TAMER_CHECK, sourcePlayerId: "dog", foxReveal: { result: "clear", foxRanAway: true } });
    const exhausted = { ...changed, players: changed.players.map((player) => player.id === "dog" ? { ...player, foxDisabled: true, powerless: true } : player) };
    expect(reconcilePhoneSession(result.session, exhausted)?.foxReveal?.targetPlayerId).toBe("target");
  });

  it("checks the Gypsy's chosen trio and transfers the actual poisoned target without revealing who it was", () => {
    const changed: PhoneWorld = { packBlocked: false, players: [
      phonePlayer("gypsy", "v12", { seat_position: 0 }),
      phonePlayer("left", "v01", { seat_position: 1, poisoned: true }),
      phonePlayer("target", "v02", { seat_position: 2 }),
      phonePlayer("right", "v03", { seat_position: 3 }),
      phonePlayer("outside", "v04", { seat_position: 4, poisoned: true }),
    ] };
    expect(resolveGypsyReveal("target", changed)).toEqual({
      reveal: { targetPlayerId: "target", playerIds: ["left", "target", "right"], poisoned: true },
      poisonedPlayerId: "left",
    });
    const session: PhoneSession = { id: "gypsy", mode: PHONE_MODE.GYPSY_POISON_CHECK, lineKey: "gypsy-line", sourcePlayerId: "gypsy", participantIds: ["gypsy"], votes: {}, sequences: {} };
    const result = applyPhoneCommand(session, "gypsy", {
      id: "confirm", sessionId: "gypsy", sequence: 1, type: "confirm", targetPlayerId: "target",
    }, changed);
    expect(result.action).toMatchObject({ action: PHONE_MODE.GYPSY_POISON_CHECK, sourcePlayerId: "gypsy", targetPlayerId: "left" });
    expect(result.session?.gypsyReveal).toEqual({ targetPlayerId: "target", playerIds: ["left", "target", "right"], poisoned: true });
    expect(JSON.stringify(getPhoneView(result.session, "gypsy", changed))).not.toContain("poisonedPlayerId");
  });

  it("only offers the Pyromaniac the acquitted target belonging to that copied power", () => {
    const changed: PhoneWorld = { packBlocked: false, players: [
      phonePlayer("pyro", "v15", { objectiveRole: "a04" }),
      phonePlayer("own", "v01", { acquitted: true, acquittedSourceIds: ["pyro"] }),
      phonePlayer("other", "v02", { acquitted: true, acquittedSourceIds: ["another"] }),
      phonePlayer("ordinary", "v03"),
    ] };
    expect(getPhoneParticipants(PHONE_MODE.PYROMANIAC_BURN, "pyro", changed)).toEqual(["pyro"]);
    const session: PhoneSession = { id: "pyro", mode: PHONE_MODE.PYROMANIAC_BURN, lineKey: "pyro-line", sourcePlayerId: "pyro", participantIds: ["pyro"], votes: {}, sequences: {} };
    expect(getPhoneView(session, "pyro", changed)?.players.filter((player) => player.selectable).map((player) => player.id)).toEqual(["own"]);
    expect(applyPhoneCommand(session, "pyro", {
      id: "burn", sessionId: "pyro", sequence: 1, type: "confirm", targetPlayerId: "own",
    }, changed).action).toMatchObject({ action: PHONE_MODE.PYROMANIAC_BURN, targetPlayerId: "own", sourcePlayerId: "pyro" });
  });

  it("requires every wolf and the Puppeteer to agree", () => {
    let session = hunt();
    for (const id of session.participantIds) {
      expect(getHuntConsensus(session)).toBeNull();
      session = applyPhoneCommand(session, id, {
        id, sessionId: session.id, sequence: 1, type: "select", targetPlayerId: "villager",
      }, world).session!;
    }
    expect(getHuntConsensus(session)).toBe("villager");
    session = applyPhoneCommand(session, "puppeteer", {
      id: "change", sessionId: session.id, sequence: 2, type: "select", targetPlayerId: "witch",
    }, world).session!;
    expect(getHuntConsensus(session)).toBeNull();
  });

  it("shows the Puppeteer as a wolf, including on the allies map", () => {
    const session = { ...hunt(), mode: PHONE_MODE.WEREWOLF_ALLIES };
    for (const viewer of session.participantIds) {
      const view = getPhoneView(session, viewer, world)!;
      expect(view.players.find((p) => p.id === "puppeteer")?.marker).toBe("werewolf");
      expect(view.players.find((p) => p.id === "witch")?.marker).toBe("evil");
      expect(view.players.find((p) => p.id === "hiddenWolf")?.marker).toBe("werewolf");
    }
    expect(getPhoneView(session, "villager", world)).toBeNull();
    expect(getPhoneView(hunt(), "wolf", world)?.players.find((p) => p.id === "witch")?.marker).toBeNull();
  });

  it("includes turned players and copied wolf objectives, but not a villager Mime", () => {
    const changed = { ...world, players: [...world.players,
      phonePlayer("turned", "v03", { werewolfTurned: true, powerless: true }),
      phonePlayer("actor", "e01", { objectiveRole: "e01" }),
      phonePlayer("mime", "e01", { mime: true, objectiveRole: "a03" }),
    ] };
    expect(getPhoneParticipants(PHONE_MODE.WEREWOLF_HUNT, null, changed)).toEqual(["wolf", "hiddenWolf", "puppeteer", "turned", "actor"]);
    const solo: PhoneSession = { ...hunt(), sourcePlayerId: "mime", participantIds: ["mime"] };
    expect(getPhoneView(solo, "mime", changed)?.players.every((p) => p.marker === null)).toBe(true);
  });

  it("does not let the Puppeteer hunt alone or a blocked pack act", () => {
    expect(getPhoneParticipants(PHONE_MODE.WEREWOLF_HUNT, null, { ...world, packBlocked: true })).toEqual([]);
    expect(getPhoneParticipants(PHONE_MODE.WEREWOLF_HUNT, null, { ...world, players: [phonePlayer("puppeteer", "v06")] })).toEqual([]);
  });

  it("resets consensus when participants change and revokes a copied power that changed", () => {
    const session = { ...hunt(), votes: { wolf: "villager", hiddenWolf: "villager", puppeteer: "villager" } };
    const changed = { ...world, players: world.players.map((p) => p.id === "puppeteer" ? { ...p, canWake: false } : p) };
    expect(reconcilePhoneSession(session, changed)?.votes).toEqual({});
    const witch = { ...session, mode: PHONE_MODE.EVIL_WITCH_POISON, sourcePlayerId: "witch", participantIds: ["witch"] };
    expect(reconcilePhoneSession(witch, { ...world, players: world.players.map((p) => p.id === "witch" ? { ...p, abilityRole: "v01" as const } : p) })).toBeNull();
  });

  it("rejects outsiders, expired sessions, and older selections", () => {
    const session = { ...hunt(), sequences: { wolf: 10 } };
    const command = { id: "stale", sessionId: session.id, sequence: 9, type: "select" as const, targetPlayerId: "villager" };
    expect(applyPhoneCommand(session, "wolf", command, world).session?.votes).toEqual({});
    expect(applyPhoneCommand(session, "villager", { ...command, sequence: 11 }, world).session?.votes).toEqual({});
    expect(applyPhoneCommand(session, "wolf", { ...command, sequence: 11, sessionId: "old" }, world).session?.votes).toEqual({});
  });

  it("poisons once with the actual copied source and permits self-poisoning", () => {
    const changed = { ...world, players: [...world.players, phonePlayer("mime", "e02", { mime: true, objectiveRole: "a03" })] };
    const session: PhoneSession = { ...hunt(), mode: PHONE_MODE.EVIL_WITCH_POISON, sourcePlayerId: "mime", participantIds: ["mime"] };
    const command = { id: "poison", sessionId: session.id, sequence: 1, type: "confirm" as const, targetPlayerId: "mime" };
    const result = applyPhoneCommand(session, "mime", command, changed);
    expect(result).toMatchObject({
      session: { completed: true, pendingTargetPlayerId: "mime" },
      completedSession: { completed: true, pendingTargetPlayerId: "mime" },
      action: { action: PHONE_MODE.EVIL_WITCH_POISON, sourcePlayerId: "mime", targetPlayerId: "mime" },
    });
    expect(applyPhoneCommand(result.session, "mime", command, changed).action).toBeUndefined();
  });

  it("only exposes red Xs to the Shaman, who can save or ignore", () => {
    const changed = { ...world, players: [...world.players,
      phonePlayer("victim", "v01", { redX: true }), phonePlayer("ghost", "v03", { dead: true, canWake: false }),
    ] };
    const session: PhoneSession = { ...hunt(), mode: PHONE_MODE.SHAMAN_SAVE, sourcePlayerId: "shaman", participantIds: ["shaman"] };
    const view = getPhoneView(session, "shaman", changed)!;
    expect(view.players.filter((p) => p.selectable).map((p) => p.id)).toEqual(["victim"]);
    expect(view.players.find((p) => p.id === "victim")?.redX).toBe(true);
    const packView = getPhoneView(hunt(), "wolf", changed)!;
    expect(packView.players.find((p) => p.id === "victim")).toMatchObject({ redX: false, selectable: true });
    const command = { id: "save", sessionId: session.id, sequence: 1, type: "confirm" as const, targetPlayerId: "victim" };
    expect(applyPhoneCommand(session, "shaman", command, changed).action?.targetPlayerId).toBe("victim");
    expect(applyPhoneCommand(session, "shaman", { ...command, targetPlayerId: "ghost" }, changed).action).toBeUndefined();
    expect(applyPhoneCommand(session, "shaman", { ...command, type: "ignore" }, changed)).toMatchObject({
      session: { completed: true, ignored: true },
      completedSession: { completed: true, ignored: true },
    });
  });
});
