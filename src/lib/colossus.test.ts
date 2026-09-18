import { describe, expect, it } from "vitest";
import { canColossusRetaliate, isColossusTarget, placeColossusLines, resolveColossusTarget } from "./colossus";
import { applyPhoneCommand, getPhoneParticipants, getPhoneView, reconcilePhoneSession, type PhonePlayer, type PhoneSession, type PhoneWorld } from "./phoneActions";
import { EXTRA_DEATH_ROLES, MIME_COPY_ROLES, NO_UNCONDITIONAL_SCRIPT_ROLES, ROLES } from "./roles";
import { getScripts } from "./i18n";
import { RULEBOOK_CHARACTER_ORDER, RULEBOOK_NIGHT_SCRIPT } from "./rulebookContent";
import { getLittleGirlAnswerKind, LITTLE_GIRL_POISONED_ANSWERS } from "./gameRules";
import { resolveKillerCard } from "@/components/game/RevealModal";
import { getActiveSeasonalRoleIds, resolveRoleImage } from "./skinPacks";

const player = (id: string, overrides: Partial<PhonePlayer> = {}): PhonePlayer => ({
  id, name: id, seat_position: 0, dead: false, redX: false, canWake: true, powerless: false,
  werewolfTurned: false, evil: false, mime: false, abilityRole: "v02", ...overrides,
});
const world: PhoneWorld = { packBlocked: false, players: [
  player("colossus", { abilityRole: "v27", redX: true, colossusReady: true }),
  player("acted", { actedTonight: true }), player("waiting"),
  player("host", { actedTonight: true, host: true }),
  player("victim", { actedTonight: true, redX: true }), player("ghost", { actedTonight: true, dead: true }),
] };
const session: PhoneSession = { id: "retaliation", mode: "colossus", lineKey: "2:normal:colossus", sourcePlayerId: "colossus", participantIds: ["colossus"], votes: {}, sequences: {} };

describe("Colossus retaliation", () => {
  it("only wakes for an unspent Werewolf death, including copied abilities", () => {
    const ready = { abilityRole: "v27", redX: true, dead: false, powerless: false, attackedByWerewolves: true, used: false, host: false, burned: false };
    expect(canColossusRetaliate(ready)).toBe(true);
    for (const blocked of [{ attackedByWerewolves: false }, { used: true }, { dead: true }, { redX: false }, { powerless: true }, { host: true }, { burned: true }, { abilityRole: "a04" }]) {
      expect(canColossusRetaliate({ ...ready, ...blocked })).toBe(false);
    }
    expect(getPhoneParticipants("colossus", "colossus", world)).toEqual(["colossus"]);
    expect(getPhoneParticipants("colossus", "colossus", { ...world, players: [player("colossus", { abilityRole: "v27", objectiveRole: "a04", colossusReady: true })] })).toEqual(["colossus"]);
  });

  it("only exposes living, completed-script participants without Host", () => {
    expect(world.players.filter(isColossusTarget).map((p) => p.id)).toEqual(["acted"]);
    expect(getPhoneView(session, "colossus", world)!.players.filter((p) => p.selectable).map((p) => p.id)).toEqual(["acted"]);
    for (const targetPlayerId of ["waiting", "host", "victim", "ghost", "colossus"]) {
      expect(applyPhoneCommand(session, "colossus", { id: "choose", sessionId: session.id, sequence: 1, type: "confirm", targetPlayerId }, world).session?.pendingTargetPlayerId).toBeUndefined();
    }
  });

  it("proposes a target without killing, and withdraws an invalidated proposal", () => {
    const result = applyPhoneCommand(session, "colossus", { id: "choose", sessionId: session.id, sequence: 1, type: "confirm", targetPlayerId: "acted" }, world);
    expect(result.action).toBeUndefined();
    expect(result.completedSession).toBeUndefined();
    expect(result.session?.pendingTargetPlayerId).toBe("acted");
    const changed = { ...world, players: world.players.map((p) => p.id === "acted" ? { ...p, host: true } : p) };
    expect(reconcilePhoneSession(result.session, changed)?.pendingTargetPlayerId).toBeUndefined();
    expect(reconcilePhoneSession(result.session, { ...world, players: world.players.map((p) => p.id === "colossus" ? { ...p, colossusReady: false } : p) })).toBeNull();
  });

  it("poison always redirects to another eligible target, or kills nobody", () => {
    expect(resolveColossusTarget(world.players, "acted", false)).toBe("acted");
    expect(resolveColossusTarget(world.players, "acted", true)).toBeNull();
    const players = [...world.players, player("alternative", { actedTonight: true })];
    expect(resolveColossusTarget(players, "acted", true)).toBe("alternative");
    expect(resolveColossusTarget(players, "host", true)).toBeNull();
  });

  it("randomizes after the hunt, keeps the surrounding order, and is stable within a night", () => {
    const lines = ["before", "hunt", "seer", "colossus", "monkey", "girl", "end"];
    const order = (seed: number) => placeColossusLines(lines, (line) => line === "colossus", (line) => line === "hunt", seed, (line) => line);
    const positions = new Set<number>();
    for (let night = 0; night < 100; night++) {
      const seed = night / 100;
      const shuffled = order(seed);
      expect(shuffled.indexOf("colossus")).toBeGreaterThan(shuffled.indexOf("hunt"));
      expect(shuffled.filter((line) => line !== "colossus")).toEqual(lines.filter((line) => line !== "colossus"));
      expect(order(seed)).toEqual(shuffled);
      positions.add(shuffled.indexOf("colossus"));
    }
    expect(positions.size).toBeGreaterThan(3);
  });

  it("keeps the same relative turn when conditional lines disappear", () => {
    const full = ["before", "hunt", "seer", "colossus", "monkey", "shaman", "girl", "end"];
    const order = (lines: string[], seed: number) => placeColossusLines(lines, (line) => line === "colossus", (line) => line === "hunt", seed, (line) => line,
      { getOrder: (line) => full.indexOf(line), lastOrder: full.length - 1 });
    for (let night = 0; night < 100; night++) {
      const seed = night / 100;
      const remove = (line: string) => line !== "seer" && line !== "shaman";
      expect(order(full.filter(remove), seed)).toEqual(order(full, seed).filter(remove));
    }
  });

  it.each(["en", "fr", "pt"] as const)("registers the ordered card and printed script in %s", (language) => {
    expect(RULEBOOK_CHARACTER_ORDER[RULEBOOK_CHARACTER_ORDER.indexOf("v09") + 1]).toBe("v27");
    const lines = getScripts(language).normalNight;
    expect(lines.find((line) => line.requires?.includes("v27"))).toMatchObject({ conditionKey: "colossusAttacked", phoneMode: "colossus" });
    const printed = RULEBOOK_NIGHT_SCRIPT.normalNight;
    expect(printed[printed.findIndex((line) => line.id === "normal-s02") + 1].id).toBe("normal-v27");
    expect(EXTRA_DEATH_ROLES).toContain("v27");
    expect(NO_UNCONDITIONAL_SCRIPT_ROLES).toContain("v27");
    expect(MIME_COPY_ROLES).toContain("v27");
  });

  it("identifies Colossus to Little Girl and discovers all three image variants", () => {
    expect(resolveKillerCard("v27", {}, null, "en")).toMatchObject({ roleId: "v27", image: ROLES.v27.image });
    expect(getLittleGirlAnswerKind("v27")).toBe("colossus");
    expect(LITTLE_GIRL_POISONED_ANSWERS).toContainEqual({ kind: "colossus", roleId: "v27" });
    expect(resolveRoleImage("v27", { skinPackId: "thiercelieux" }).src).not.toBe(ROLES.v27.image);
    expect(getActiveSeasonalRoleIds("seasonal", new Date(2026, 9, 31))).toContain("v27");
  });
});
