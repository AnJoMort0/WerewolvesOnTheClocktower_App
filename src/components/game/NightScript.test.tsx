import { fireEvent, render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NightScript } from "@/components/game/NightScript";
import { LanguageContext } from "@/lib/i18n";
import { EMPTY_ACTOR_POWER_STATE } from "@/lib/actor";

const baseProps = {
  activeRoles: new Set(["e02" as const]),
  permanentlyDead: new Set<string>(),
  poisonedPlayerId: null,
  illusionPlayerId: null,
  roleAssignments: { witch: "e02" as const },
  nightNumber: 2,
  onEndNight: vi.fn(),
  chamanCharges: 0,
  onChamanChargeToggle: vi.fn(),
  lastNightDeadPlayerIds: [],
  players: [{ id: "witch", name: "Witch", seat_position: 0 }],
  foxDisabled: false,
  onFoxDisabledToggle: vi.fn(),
  nightTargetedPlayerIds: new Set<string>(),
};

describe("NightScript progress", () => {
  it("does not replay a historical auto-complete event after remounting", async () => {
    const onLineCompletedChange = vi.fn();
    const { rerender } = render(
      <LanguageContext.Provider value="pt">
        <NightScript
          {...baseProps}
          autoCompleteRole="e02"
          autoCompleteVersion={4}
          onLineCompletedChange={onLineCompletedChange}
        />
      </LanguageContext.Provider>,
    );

    expect(onLineCompletedChange).not.toHaveBeenCalled();

    rerender(
      <LanguageContext.Provider value="pt">
        <NightScript
          {...baseProps}
          autoCompleteRole="e02"
          autoCompleteVersion={5}
          onLineCompletedChange={onLineCompletedChange}
        />
      </LanguageContext.Provider>,
    );

    await waitFor(() => expect(onLineCompletedChange).toHaveBeenCalledTimes(1));
  });
});

describe("NightScript conditional behavior", () => {
  it("renders a distinct intoxicated Drunkard line that keeps the Drunkard as its source", () => {
    const dataTransfer = { setData: vi.fn(), effectAllowed: "" };
    const props = {
      ...baseProps,
      activeRoles: new Set(["v16" as const]),
      roleAssignments: { drunkard: "v16" as const },
      baseRoleAssignments: { drunkard: "a01" as const },
      players: [{ id: "drunkard", name: "Drunkard", seat_position: 0 }],
    };
    const { container, rerender } = render(
      <LanguageContext.Provider value="pt">
        <NightScript {...props} />
      </LanguageContext.Provider>,
    );

    const line = container.querySelector('[draggable="true"]') as HTMLElement;
    expect(line).toBeTruthy();
    expect(line.querySelector('img[alt="Bêbado"]')).toBeTruthy();
    expect(line.firstElementChild?.className).toContain("bg-green-900/30");
    fireEvent.dragStart(line, { dataTransfer });
    expect(dataTransfer.setData).toHaveBeenCalledWith("sourcePlayerId", "drunkard");

    rerender(
      <LanguageContext.Provider value="pt">
        <NightScript {...props} poisonedPlayerId="drunkard" />
      </LanguageContext.Provider>,
    );
    expect(container.querySelector('[draggable="true"]')?.firstElementChild?.className).not.toContain("bg-green-900/30");
  });

  it("inverts Bear Tamer information for the Drunkard and restores truth when poisoned", () => {
    const props = {
      ...baseProps,
      activeRoles: new Set(["v02" as const, "l01" as const]),
      roleAssignments: { drunkard: "v02" as const, left: "l01" as const, right: "l01" as const },
      baseRoleAssignments: { drunkard: "a01" as const, left: "l01" as const, right: "l01" as const },
      players: [
        { id: "drunkard", name: "Drunkard", seat_position: 0 },
        { id: "left", name: "Left", seat_position: 1 },
        { id: "right", name: "Right", seat_position: 2 },
      ],
    };
    const { container, rerender } = render(
      <LanguageContext.Provider value="pt">
        <NightScript {...props} />
      </LanguageContext.Provider>,
    );

    expect(container.textContent).toContain("O Urso rosna.");
    expect(container.textContent).not.toContain("O Urso não rosna.");

    rerender(
      <LanguageContext.Provider value="pt">
        <NightScript {...props} poisonedPlayerId="drunkard" />
      </LanguageContext.Provider>,
    );
    expect(container.textContent).toContain("O Urso não rosna.");
  });

  it("shows the v12 line only while a poisoned character exists", () => {
    const props = {
      ...baseProps,
      activeRoles: new Set(["v12" as const]),
      roleAssignments: { gypsy: "v12" as const },
      players: [{ id: "gypsy", name: "Gypsy", seat_position: 0 }],
    };
    const { container, rerender } = render(
      <LanguageContext.Provider value="pt">
        <NightScript {...props} conditionKeys={{ poisonedCharacterPresent: false }} />
      </LanguageContext.Provider>,
    );

    expect(container.textContent).not.toContain("indica 3 vizinhos");

    rerender(
      <LanguageContext.Provider value="pt">
        <NightScript {...props} conditionKeys={{ poisonedCharacterPresent: true }} />
      </LanguageContext.Provider>,
    );
    expect(container.textContent).toContain("indica 3 vizinhos");
  });

  it("makes only Cupid's first-night line draggable", () => {
    const cupidProps = {
      ...baseProps,
      activeRoles: new Set(["s01" as const]),
      roleAssignments: { cupid: "s01" as const },
      players: [{ id: "cupid", name: "Cupid", seat_position: 0 }],
      conditionKeys: { cupidoHasCharges: true },
    };
    const { container, rerender } = render(
      <LanguageContext.Provider value="pt">
        <NightScript {...cupidProps} nightNumber={1} />
      </LanguageContext.Provider>,
    );

    const draggableText = () => Array.from(container.querySelectorAll('[draggable="true"]'))
      .map((element) => element.textContent || "");
    expect(draggableText().some((text) => text.includes("escolhe dois jogadores"))).toBe(true);

    rerender(
      <LanguageContext.Provider value="pt">
        <NightScript {...cupidProps} nightNumber={2} />
      </LanguageContext.Provider>,
    );
    expect(container.textContent).toContain("decide com o polegar");
    expect(draggableText().some((text) => text.includes("decide com o polegar"))).toBe(false);
  });

  it("changes the White Werewolf instruction when no other werewolf remains", () => {
    const whiteWolfProps = {
      ...baseProps,
      activeRoles: new Set(["s02" as const]),
      roleAssignments: { white: "s02" as const },
      players: [{ id: "white", name: "White Wolf", seat_position: 0 }],
      nightNumber: 3,
    };
    const { container, rerender } = render(
      <LanguageContext.Provider value="pt">
        <NightScript {...whiteWolfProps} conditionKeys={{ whitewolfNight: true, whitewolfSolo: true }} />
      </LanguageContext.Provider>,
    );
    expect(container.textContent).toContain("escolhe mais um jogador");

    rerender(
      <LanguageContext.Provider value="pt">
        <NightScript {...whiteWolfProps} conditionKeys={{ whitewolfNight: true, whitewolfSolo: false }} />
      </LanguageContext.Provider>,
    );
    expect(container.textContent).toContain("escolhe o Lobisomem que quer matar");
  });
});

describe("NightScript Actor copy", () => {
  it("lets Actor inherit the hidden Drunkard replacement and poison inversion", () => {
    const dataTransfer = { setData: vi.fn(), effectAllowed: "" };
    const props = {
      ...baseProps,
      activeRoles: new Set(["v16" as const]),
      roleAssignments: { actor: "v16" as const, drunkard: "v16" as const },
      baseRoleAssignments: { actor: "a04" as const, drunkard: "a01" as const },
      permanentlyDead: new Set(["drunkard"]),
      players: [
        { id: "actor", name: "Actor", seat_position: 0 },
        { id: "drunkard", name: "Drunkard", seat_position: 1 },
      ],
      actorPlayerId: "actor",
      actorCopiedRole: "a01" as const,
    };
    const { container, rerender } = render(
      <LanguageContext.Provider value="pt">
        <NightScript {...props} />
      </LanguageContext.Provider>,
    );

    const line = container.querySelector('[draggable="true"]') as HTMLElement;
    expect(line.textContent).toContain("Sonâmbulo");
    expect(line.textContent).not.toContain("Ator");
    expect(line.querySelector('img[alt="Bêbado"]')).toBeTruthy();
    expect(line.firstElementChild?.className).toContain("bg-green-900/30");
    fireEvent.dragStart(line, { dataTransfer });
    expect(dataTransfer.setData).toHaveBeenCalledWith("sourcePlayerId", "actor");

    rerender(
      <LanguageContext.Provider value="pt">
        <NightScript {...props} poisonedPlayerId="actor" />
      </LanguageContext.Provider>,
    );
    expect(container.querySelector('[draggable="true"]')?.firstElementChild?.className).not.toContain("bg-green-900/30");
  });

  it("uses Actor's fresh Fox state when the copied Drunkard was the Fox Tamer", () => {
    const onActorPowerStateChange = vi.fn();
    const { container } = render(
      <LanguageContext.Provider value="pt">
        <NightScript
          {...baseProps}
          activeRoles={new Set(["v04"])}
          roleAssignments={{ actor: "v04", drunkard: "v04" }}
          baseRoleAssignments={{ actor: "a04", drunkard: "a01" }}
          permanentlyDead={new Set(["drunkard"])}
          players={[
            { id: "actor", name: "Actor", seat_position: 0 },
            { id: "drunkard", name: "Drunkard", seat_position: 1 },
          ]}
          actorPlayerId="actor"
          actorCopiedRole="a01"
          actorPowerState={{ ...EMPTY_ACTOR_POWER_STATE, foxDisabled: false }}
          onActorPowerStateChange={onActorPowerStateChange}
          foxDisabled
        />
      </LanguageContext.Provider>,
    );

    expect(container.textContent).toContain("Domador da Raposa");
    const foxCheckbox = Array.from(container.querySelectorAll('button[role="checkbox"]'))
      .find((checkbox) => !checkbox.hasAttribute("data-line-checkbox"));
    fireEvent.click(foxCheckbox!);
    expect(onActorPowerStateChange).toHaveBeenCalledWith(expect.objectContaining({ foxDisabled: true }));
  });

  it("shows Actor in place of a copied role and keeps a separate line when that role is also in play", () => {
    const actorProps = {
      ...baseProps,
      activeRoles: new Set(["e02" as const]),
      roleAssignments: { actor: "e02" as const, witch: "e02" as const },
      baseRoleAssignments: { actor: "a04" as const, witch: "e02" as const },
      players: [
        { id: "actor", name: "Actor", seat_position: 0 },
        { id: "witch", name: "Witch", seat_position: 1 },
      ],
      actorPlayerId: "actor",
      actorCopiedRole: "e02" as const,
    };
    const { container } = render(
      <LanguageContext.Provider value="pt">
        <NightScript {...actorProps} />
      </LanguageContext.Provider>,
    );

    expect(container.textContent).toContain("Bruxa Malvada");
    expect(container.textContent).toContain("Ator");
  });

  it("adds Actor to the shared werewolf wake-up line", () => {
    const actorProps = {
      ...baseProps,
      activeRoles: new Set(["e01" as const, "m01" as const]),
      roleAssignments: { wolf: "e01" as const, actor: "m01" as const },
      baseRoleAssignments: { wolf: "e01" as const, actor: "a04" as const },
      players: [
        { id: "wolf", name: "Wolf", seat_position: 0 },
        { id: "actor", name: "Actor", seat_position: 1 },
      ],
      actorPlayerId: "actor",
      actorCopiedRole: "m01" as const,
      conditionKeys: { lobisomemMauHasCharges: true },
    };
    const { container } = render(
      <LanguageContext.Provider value="pt">
        <NightScript {...actorProps} />
      </LanguageContext.Provider>,
    );

    expect(container.textContent).toContain("Lobisomens (+ Ator)");
  });

  it("does not keep a second script line for the dead Idol", () => {
    const { container } = render(
      <LanguageContext.Provider value="pt">
        <NightScript
          {...baseProps}
          activeRoles={new Set(["e02"])}
          roleAssignments={{ actor: "e02", idol: "e02" }}
          baseRoleAssignments={{ actor: "a04", idol: "e02" }}
          permanentlyDead={new Set(["idol"])}
          players={[
            { id: "actor", name: "Actor", seat_position: 0 },
            { id: "idol", name: "Idol", seat_position: 1 },
          ]}
          actorPlayerId="actor"
          actorCopiedRole="e02"
        />
      </LanguageContext.Provider>,
    );

    expect(container.textContent).toContain("Ator");
    expect(container.textContent).not.toContain("Bruxa Malvada");
  });

  it("keeps the prophetic Idol as the owner of their final role action", () => {
    const idolTransfer = { setData: vi.fn(), effectAllowed: "" };
    const actorTransfer = { setData: vi.fn(), effectAllowed: "" };
    const { container } = render(
      <LanguageContext.Provider value="pt">
        <NightScript
          {...baseProps}
          nightNumber={4}
          activeRoles={new Set(["e02"])}
          roleAssignments={{ actor: "e02", idol: "e02" }}
          baseRoleAssignments={{ actor: "a04", idol: "e02" }}
          permanentlyDead={new Set(["idol"])}
          players={[
            { id: "actor", name: "Actor", seat_position: 0 },
            { id: "idol", name: "Idol", seat_position: 1 },
          ]}
          actorPlayerId="actor"
          actorCopiedRole="e02"
          profeciaGhostPlayerIds={new Set(["idol"])}
        />
      </LanguageContext.Provider>,
    );

    const lines = Array.from(container.querySelectorAll('[draggable="true"]'));
    const idolLine = lines.find((line) => line.textContent?.includes("Bruxa Malvada"));
    const actorLine = lines.find((line) => line.textContent?.includes("Ator"));
    fireEvent.dragStart(idolLine!, { dataTransfer: idolTransfer });
    fireEvent.dragStart(actorLine!, { dataTransfer: actorTransfer });

    expect(idolTransfer.setData).toHaveBeenCalledWith("sourcePlayerId", "idol");
    expect(actorTransfer.setData).toHaveBeenCalledWith("sourcePlayerId", "actor");
  });

  it("keeps the dead Hunter as owner of the pending ghost kill and separately calls Actor for the card change", () => {
    const dataTransfer = { setData: vi.fn(), effectAllowed: "" };
    const { container } = render(
      <LanguageContext.Provider value="pt">
        <NightScript
          {...baseProps}
          activeRoles={new Set(["v08"])}
          roleAssignments={{ actor: "v08", hunter: "v08" }}
          baseRoleAssignments={{ actor: "a04", hunter: "v08" }}
          permanentlyDead={new Set(["hunter"])}
          lastNightDeadPlayerIds={["hunter"]}
          players={[
            { id: "actor", name: "Actor", seat_position: 0 },
            { id: "hunter", name: "Hunter", seat_position: 1 },
          ]}
          actorPlayerId="actor"
          actorCopiedRole="v08"
          actorCopyNoticeNight={2}
          conditionKeys={{ cacadorDied: true }}
          deathTriggeredSourcePlayerIds={{ cacadorDied: ["hunter"] }}
        />
      </LanguageContext.Provider>,
    );

    const ghostLine = Array.from(container.querySelectorAll('[draggable="true"]'))
      .find((element) => element.textContent?.includes("Fantasma"));
    expect(ghostLine?.textContent).toContain("Caçador");
    expect(container.textContent).toContain("papel ao qual irá responder");
    fireEvent.dragStart(ghostLine!, { dataTransfer });
    expect(dataTransfer.setData).toHaveBeenCalledWith("sourcePlayerId", "hunter");
  });

  it("keeps Actor's copied Hunter ghost action after Actor dies", () => {
    const { container } = render(
      <LanguageContext.Provider value="pt">
        <NightScript
          {...baseProps}
          activeRoles={new Set(["v08"])}
          roleAssignments={{ actor: "v08", hunter: "v08" }}
          baseRoleAssignments={{ actor: "a04", hunter: "v08" }}
          permanentlyDead={new Set(["actor", "hunter"])}
          lastNightDeadPlayerIds={["actor"]}
          players={[
            { id: "actor", name: "Actor", seat_position: 0 },
            { id: "hunter", name: "Hunter", seat_position: 1 },
          ]}
          actorPlayerId="actor"
          actorCopiedRole="v08"
          conditionKeys={{ cacadorDied: true }}
          deathTriggeredSourcePlayerIds={{ cacadorDied: ["actor"] }}
        />
      </LanguageContext.Provider>,
    );

    expect(container.textContent).toContain("Fantasma do Ator");
  });

  it("calls a dead Actor as the copied role on the prophecy night", () => {
    const { container } = render(
      <LanguageContext.Provider value="pt">
        <NightScript
          {...baseProps}
          nightNumber={4}
          roleAssignments={{ actor: "e02", idol: "v03" }}
          baseRoleAssignments={{ actor: "a04", idol: "v03" }}
          permanentlyDead={new Set(["actor", "idol"])}
          players={[
            { id: "actor", name: "Actor", seat_position: 0 },
            { id: "idol", name: "Idol", seat_position: 1 },
          ]}
          actorPlayerId="actor"
          actorCopiedRole="e02"
          profeciaGhostPlayerIds={new Set(["actor"])}
        />
      </LanguageContext.Provider>,
    );

    expect(container.textContent).toContain("Ator");
    expect(container.textContent).not.toContain("Bruxa Malvada");
  });

  it("tracks the dead Soldier as owner of the analogous ghost kill", () => {
    const dataTransfer = { setData: vi.fn(), effectAllowed: "" };
    const { container } = render(
      <LanguageContext.Provider value="pt">
        <NightScript
          {...baseProps}
          conditionKeys={{ soldadoDied: true }}
          deathTriggeredSourcePlayerIds={{ soldadoDied: ["soldier"] }}
        />
      </LanguageContext.Provider>,
    );
    const ghostLine = Array.from(container.querySelectorAll('[draggable="true"]'))
      .find((element) => element.textContent?.includes("SOLDADO"));
    fireEvent.dragStart(ghostLine!, { dataTransfer });
    expect(dataTransfer.setData).toHaveBeenCalledWith("sourcePlayerId", "soldier");
  });
});
