import { describe, expect, it } from "vitest";
import { EVIL_ROLES, EXTRA_DEATH_ROLES } from "./roles";
import { getScripts } from "./i18n";
import { RULEBOOK_CHARACTER_ORDER, RULEBOOK_NIGHT_SCRIPT } from "./rulebookContent";
import { applyPhoneCommand, getPhoneView, reconcilePhoneSession, shouldExhaustMonkeyPower, type PhonePlayer, type PhoneSession, type PhoneWorld } from "./phoneActions";

const player = (id: string, role: PhonePlayer["abilityRole"], extra: Partial<PhonePlayer> = {}): PhonePlayer => ({
  id, name: id, seat_position: 0, abilityRole: role, displayRole: role,
  dead: false, redX: false, canWake: true, powerless: false, mime: false, evil: false, werewolfTurned: false, ...extra,
});
const world: PhoneWorld = { packBlocked: false, players: [player("monkey", "v26"), player("wolf", "e01"), player("seer", "e04"), player("shaman", "e03")] };
const session = (): PhoneSession => ({ id: "monkey-session", mode: "monkey", lineKey: "monkey-line", sourcePlayerId: "monkey", participantIds: ["monkey"], votes: {}, sequences: {} });
const reveal = (target: string, changed = world) => applyPhoneCommand(session(), "monkey", { id: "confirm", sessionId: "monkey-session", sequence: 1, type: "confirm", targetPlayerId: target }, changed);

describe("Monkey Tamer", () => {
  it("reveals Evil Beings safely on the first night and exhausts powers from the second night", () => {
    const evilCard = reveal("wolf").action!.monkeyReveal!;
    expect(evilCard).toMatchObject({ roleId: "e01", evil: true });
    expect(shouldExhaustMonkeyPower(evilCard, 1)).toBe(false);
    expect(shouldExhaustMonkeyPower(evilCard, 2)).toBe(true);
    expect(shouldExhaustMonkeyPower(evilCard, 3)).toBe(true);
    expect(shouldExhaustMonkeyPower(reveal("seer").action!.monkeyReveal!, 2)).toBe(false);
  });

  it("reveals the chosen card once and flags only revealed Evil Being cards", () => {
    expect(EXTRA_DEATH_ROLES).not.toContain("v26");
    const result = reveal("wolf");
    expect(result.action).toMatchObject({ action: "monkey", sourcePlayerId: "monkey", monkeyReveal: { roleId: "e01", evil: true } });
    expect(result.completedSession?.lineKey).toBe("monkey-line");
    expect(reveal("seer").action?.monkeyReveal).toMatchObject({ roleId: "e04", evil: false });
    expect(applyPhoneCommand(result.session, "monkey", { id: "again", sessionId: "monkey-session", sequence: 2, type: "confirm", targetPlayerId: "seer" }, world).action).toBeUndefined();
    expect(getPhoneView(result.session, "seer", world)).toBeNull();
    const view = getPhoneView(result.session, "monkey", world)!;
    expect(view.monkeyReveal?.roleId).toBe("e01");
    expect(view.players.every((p) => !("displayRole" in p))).toBe(true);
  });

  it("poison always returns another in-game non-evil card, including for good targets", () => {
    const poisoned = { ...world, players: world.players.map((p) => p.id === "monkey" ? { ...p, actingPoisoned: true } : p) };
    for (const target of world.players) {
      for (let draw = 0; draw < 20; draw++) {
        const result = reveal(target.id, poisoned).action!.monkeyReveal!;
        expect(EVIL_ROLES).not.toContain(result.roleId);
        expect(result.roleId).not.toBe(target.displayRole);
        expect(world.players.some((p) => p.id !== target.id && p.displayRole === result.roleId)).toBe(true);
        expect(result.evil).toBe(false);
      }
    }
  });

  it("never invents a false card when no valid poisoned alternative exists", () => {
    const result = reveal("monkey", { packBlocked: false, players: [player("monkey", "v26", { actingPoisoned: true }), player("wolf", "e01")] });
    expect(result.session?.error).toBe("noSafeCard");
    expect(result.action).toBeUndefined();
    expect(result.completedSession).toBeUndefined();
  });

  it("retains the result after power loss without death so it can be reopened", () => {
    const result = reveal("wolf");
    const disabled = { ...world, players: world.players.map((p) => p.id === "monkey" ? { ...p, monkeyDisabled: true, powerless: true } : p) };
    expect(reconcilePhoneSession(result.session, disabled)?.monkeyReveal?.roleId).toBe("e01");
    expect(reconcilePhoneSession(session(), disabled)).toBeNull();
    const closed = applyPhoneCommand(result.session, "monkey", { id: "close", sessionId: "monkey-session", sequence: 2, type: "close" }, disabled);
    expect(closed.session?.visible).toBe(false);
    const reopened = applyPhoneCommand(closed.session, "monkey", { id: "reopen", sessionId: "monkey-session", sequence: 3, type: "reopen" }, disabled);
    expect(reopened.session?.visible).toBe(true);
    expect(reopened.session?.monkeyReveal).toEqual(result.session?.monkeyReveal);
    expect(getPhoneView(reopened.session, "monkey", disabled)?.players.find((p) => p.id === "monkey")).toMatchObject({ dead: false, redX: false });
    expect(reopened.action).toBeUndefined();
  });

  it("can inspect Ghost cards and resolves an illusion to the Illusionist card", () => {
    expect(reveal("seer", { ...world, players: world.players.map((p) => p.id === "seer" ? { ...p, dead: true } : p) }).action?.monkeyReveal?.roleId).toBe("e04");
    expect(reveal("seer", { ...world, players: world.players.map((p) => p.id === "seer" ? { ...p, illusion: true } : p) }).action?.monkeyReveal).toMatchObject({ roleId: "a06", evil: true });
  });

  it.each(["pt", "fr", "en"] as const)("registers the card and ordered script in %s", (language) => {
    expect(RULEBOOK_CHARACTER_ORDER[RULEBOOK_CHARACTER_ORDER.indexOf("v05") + 1]).toBe("v26");
    const lines = getScripts(language).normalNight;
    expect(lines[lines.findIndex((line) => line.requires?.includes("v05")) + 1].requires).toEqual(["v26"]);
    expect(getScripts(language).firstNight.some((line) => line.requires?.includes("v26"))).toBe(true);
    const analog = RULEBOOK_NIGHT_SCRIPT.normalNight;
    expect(analog[analog.findIndex((line) => line.id === "normal-v05") + 1].id).toBe("normal-v26");
  });
});
