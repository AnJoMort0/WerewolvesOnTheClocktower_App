import { describe, expect, it } from "vitest";
import { getScripts } from "@/lib/i18n";
import type { RoleId } from "@/lib/roles";
import {
  applyPhoneCommand, getFoxTargetPlayerIds, getHuntConsensus, getPhoneParticipants, getPhoneView, getScriptPhoneMode,
  reconcilePhoneSession, resolveFoxReveal,
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
  id: "night-hunt", mode: "hunt", lineKey: "hunt-line", sourcePlayerId: null,
  participantIds: ["wolf", "hiddenWolf", "puppeteer"], votes: {}, sequences: {},
});

describe("GM-controlled phone rules", () => {
  it.each(["pt", "fr", "en"] as const)("finds the allies line independently of the %s wording", (language) => {
    expect(getScripts(language).secondNight.filter((line) => getScriptPhoneMode(line) === "allies")).toHaveLength(1);
  });

  it.each(["pt", "fr", "en"] as const)("registers Fox Tamer controls on both scripts in %s", (language) => {
    const scripts = getScripts(language);
    expect(scripts.firstNight.find((line) => line.requires?.includes("v04"))?.phoneMode).toBe("fox");
    expect(scripts.normalNight.find((line) => line.requires?.includes("v04"))?.phoneMode).toBe("fox");
  });

  it.each(["pt", "fr", "en"] as const)("registers Spider Tamer controls for the first web and its replacement in %s", (language) => {
    const scripts = getScripts(language);
    expect(scripts.firstNight.find((line) => line.requires?.includes("v23"))?.phoneMode).toBe("web");
    expect(scripts.normalNight.find((line) => line.conditionKey === "spiderWebbedDied")?.phoneMode).toBe("web");
  });

  it("lets copied Spider powers choose a living web target and completes the script action", () => {
    const changed: PhoneWorld = { packBlocked: false, players: [
      phonePlayer("dog", "v23", { objectiveRole: "a02", seat_position: 0 }),
      phonePlayer("target", "v01", { seat_position: 1 }),
      phonePlayer("ghost", "v01", { seat_position: 2, dead: true }),
    ] };
    expect(getPhoneParticipants("web", "dog", changed)).toEqual(["dog"]);
    const session: PhoneSession = { id: "web", mode: "web", lineKey: "web-line", sourcePlayerId: "dog", participantIds: ["dog"], votes: {}, sequences: {} };
    const confirmed = applyPhoneCommand(session, "dog", {
      id: "confirm", sessionId: "web", sequence: 1, type: "confirm", targetPlayerId: "target",
    }, changed);
    expect(confirmed).toMatchObject({
      session: null,
      completedSession: session,
      action: { action: "web", sourcePlayerId: "dog", targetPlayerId: "target" },
    });
    expect(applyPhoneCommand(session, "dog", {
      id: "dead", sessionId: "web", sequence: 1, type: "confirm", targetPlayerId: "ghost",
    }, changed).action).toBeUndefined();
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
    expect(getPhoneParticipants("fox", "dog", changed)).toEqual(["dog"]);
    const session: PhoneSession = { id: "fox", mode: "fox", lineKey: "fox-line", sourcePlayerId: "dog", participantIds: ["dog"], votes: {}, sequences: {} };
    const result = applyPhoneCommand(session, "dog", { id: "confirm", sessionId: "fox", sequence: 1, type: "confirm", targetPlayerId: "target" }, changed);
    expect(result.action).toMatchObject({ action: "fox", sourcePlayerId: "dog", foxReveal: { result: "clear", foxRanAway: true } });
    const exhausted = { ...changed, players: changed.players.map((player) => player.id === "dog" ? { ...player, foxDisabled: true, powerless: true } : player) };
    expect(reconcilePhoneSession(result.session, exhausted)?.foxReveal?.targetPlayerId).toBe("target");
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
    const session = { ...hunt(), mode: "allies" as const };
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
    expect(getPhoneParticipants("hunt", null, changed)).toEqual(["wolf", "hiddenWolf", "puppeteer", "turned", "actor"]);
    const solo: PhoneSession = { ...hunt(), sourcePlayerId: "mime", participantIds: ["mime"] };
    expect(getPhoneView(solo, "mime", changed)?.players.every((p) => p.marker === null)).toBe(true);
  });

  it("does not let the Puppeteer hunt alone or a blocked pack act", () => {
    expect(getPhoneParticipants("hunt", null, { ...world, packBlocked: true })).toEqual([]);
    expect(getPhoneParticipants("hunt", null, { ...world, players: [phonePlayer("puppeteer", "v06")] })).toEqual([]);
  });

  it("resets consensus when participants change and revokes a copied power that changed", () => {
    const session = { ...hunt(), votes: { wolf: "villager", hiddenWolf: "villager", puppeteer: "villager" } };
    const changed = { ...world, players: world.players.map((p) => p.id === "puppeteer" ? { ...p, canWake: false } : p) };
    expect(reconcilePhoneSession(session, changed)?.votes).toEqual({});
    const witch = { ...session, mode: "poison" as const, sourcePlayerId: "witch", participantIds: ["witch"] };
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
    const session: PhoneSession = { ...hunt(), mode: "poison", sourcePlayerId: "mime", participantIds: ["mime"] };
    const command = { id: "poison", sessionId: session.id, sequence: 1, type: "confirm" as const, targetPlayerId: "mime" };
    const result = applyPhoneCommand(session, "mime", command, changed);
    expect(result).toMatchObject({ session: null, completedSession: session, action: { action: "poison", sourcePlayerId: "mime", targetPlayerId: "mime" } });
    expect(applyPhoneCommand(result.session, "mime", command, changed).action).toBeUndefined();
  });

  it("only exposes red Xs to the Shaman, who can save or ignore", () => {
    const changed = { ...world, players: [...world.players,
      phonePlayer("victim", "v01", { redX: true }), phonePlayer("ghost", "v03", { dead: true, canWake: false }),
    ] };
    const session: PhoneSession = { ...hunt(), mode: "shaman", sourcePlayerId: "shaman", participantIds: ["shaman"] };
    const view = getPhoneView(session, "shaman", changed)!;
    expect(view.players.filter((p) => p.selectable).map((p) => p.id)).toEqual(["victim"]);
    expect(view.players.find((p) => p.id === "victim")?.redX).toBe(true);
    const packView = getPhoneView(hunt(), "wolf", changed)!;
    expect(packView.players.find((p) => p.id === "victim")).toMatchObject({ redX: false, selectable: true });
    const command = { id: "save", sessionId: session.id, sequence: 1, type: "confirm" as const, targetPlayerId: "victim" };
    expect(applyPhoneCommand(session, "shaman", command, changed).action?.targetPlayerId).toBe("victim");
    expect(applyPhoneCommand(session, "shaman", { ...command, targetPlayerId: "ghost" }, changed).action).toBeUndefined();
    expect(applyPhoneCommand(session, "shaman", { ...command, type: "ignore" }, changed)).toEqual({ session: null, completedSession: session });
  });
});
