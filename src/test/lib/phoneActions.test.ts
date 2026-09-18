import { describe, expect, it } from "vitest";
import { getScripts } from "@/lib/i18n";
import type { RoleId } from "@/lib/roles";
import {
  applyPhoneCommand, getHuntConsensus, getPhoneParticipants, getPhoneView, getScriptPhoneMode, reconcilePhoneSession,
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
