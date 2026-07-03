import { fireEvent, render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NightScript } from "@/components/game/NightScript";
import { LanguageContext } from "@/lib/i18n";
import { EMPTY_ACTOR_POWER_STATE } from "@/lib/actor";
import { createDogWolfState } from "@/lib/dogWolf";

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

  it("completes both owner and Dog lines when they perform one shared action", async () => {
    const onLineCompletedChange = vi.fn();
    const props = {
      ...baseProps,
      activeRoles: new Set(["e02" as const, "a02" as const]),
      roleAssignments: { owner: "e02" as const, dog: "a02" as const },
      baseRoleAssignments: { owner: "e02" as const, dog: "a02" as const },
      abilityRoleAssignments: { owner: "e02" as const, dog: "e02" as const },
      dogWolfPlayerIds: ["dog"],
      dogWolfStates: { dog: createDogWolfState("owner") },
      players: [
        { id: "owner", name: "Owner", seat_position: 0 },
        { id: "dog", name: "Dog", seat_position: 1 },
      ],
      autoCompleteRole: "e02" as const,
      autoCompleteSourcePlayerIds: ["owner", "dog"],
      onLineCompletedChange,
    };
    const { rerender } = render(
      <LanguageContext.Provider value="pt">
        <NightScript {...props} autoCompleteVersion={1} />
      </LanguageContext.Provider>,
    );

    rerender(
      <LanguageContext.Provider value="pt">
        <NightScript {...props} autoCompleteVersion={2} />
      </LanguageContext.Provider>,
    );

    await waitFor(() => expect(onLineCompletedChange).toHaveBeenCalledTimes(2));
    expect(onLineCompletedChange.mock.calls.map(([key]) => key)).toEqual(expect.arrayContaining([
      expect.stringContaining(":normal:"),
      expect.stringContaining(":dog:dog"),
    ]));
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
    expect(line.textContent).toContain("Ator");
    expect(line.textContent).not.toContain("Sonâmbulo");
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

    expect(container.textContent).toContain("Ator");
    expect(container.textContent).not.toContain("Domador da Raposa");
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

describe("NightScript Dog-Wolf copy", () => {
  it("adds a parenthesized Dog line beneath the owner's line with an independent drag source", () => {
    const transfers = [
      { setData: vi.fn(), effectAllowed: "" },
      { setData: vi.fn(), effectAllowed: "" },
    ];
    const { container } = render(
      <LanguageContext.Provider value="pt">
        <NightScript
          {...baseProps}
          activeRoles={new Set(["e02", "a02"])}
          roleAssignments={{ owner: "e02", dog: "a02" }}
          baseRoleAssignments={{ owner: "e02", dog: "a02" }}
          abilityRoleAssignments={{ owner: "e02", dog: "e02" }}
          dogWolfPlayerIds={["dog"]}
          dogWolfStates={{ dog: createDogWolfState("owner") }}
          players={[
            { id: "owner", name: "Owner", seat_position: 0 },
            { id: "dog", name: "Dog", seat_position: 1 },
          ]}
        />
      </LanguageContext.Provider>,
    );

    const draggableLines = Array.from(container.querySelectorAll('[draggable="true"]')) as HTMLElement[];
    expect(draggableLines).toHaveLength(2);
    expect(draggableLines[1].textContent).toContain("(O Cão");
    expect(draggableLines[1].querySelector('img[alt="Cão-Lobo"]')).toBeNull();
    draggableLines.forEach((line, index) => fireEvent.dragStart(line, { dataTransfer: transfers[index] }));
    expect(transfers[0].setData).toHaveBeenCalledWith("sourcePlayerId", "owner");
    expect(transfers[1].setData).toHaveBeenCalledWith("sourcePlayerId", "dog");
  });

  it("keeps owner and Dog poison states independent", () => {
    const { container } = render(
      <LanguageContext.Provider value="pt">
        <NightScript
          {...baseProps}
          activeRoles={new Set(["e02", "a02"])}
          roleAssignments={{ owner: "e02", dog: "a02" }}
          abilityRoleAssignments={{ owner: "e02", dog: "e02" }}
          dogWolfPlayerIds={["dog"]}
          dogWolfStates={{ dog: createDogWolfState("owner") }}
          poisonedPlayerIds={new Set(["dog"])}
          players={[
            { id: "owner", name: "Owner", seat_position: 0 },
            { id: "dog", name: "Dog", seat_position: 1 },
          ]}
        />
      </LanguageContext.Provider>,
    );

    const draggableLines = Array.from(container.querySelectorAll('[draggable="true"]')) as HTMLElement[];
    expect(draggableLines[0].firstElementChild?.className).not.toContain("bg-green-900/30");
    expect(draggableLines[1].firstElementChild?.className).toContain("bg-green-900/30");
  });

  it("shows the Dog-Wolf choice line when the copied Dog-Wolf had no owner", () => {
    const { container } = render(
      <LanguageContext.Provider value="pt">
        <NightScript
          {...baseProps}
          activeRoles={new Set(["a02"])}
          roleAssignments={{ actor: "a02", dog: "a02" }}
          baseRoleAssignments={{ actor: "a04", dog: "a02" }}
          dogWolfPlayerIds={["dog", "actor"]}
          dogWolfStates={{ dog: createDogWolfState(), actor: createDogWolfState() }}
          permanentlyDead={new Set(["dog"])}
          actorPlayerId="actor"
          actorCopiedRole="a02"
          nightNumber={4}
          players={[
            { id: "actor", name: "Actor", seat_position: 0 },
            { id: "dog", name: "Dog", seat_position: 1 },
            { id: "owner", name: "Owner", seat_position: 2 },
          ]}
        />
      </LanguageContext.Provider>,
    );

    expect(container.textContent).toContain("Cão-Lobo acorda");
  });

  it("shows each Spider eye only for players caught in that source's own web", () => {
    const onSpiderReveal = vi.fn();
    const { container } = render(
      <LanguageContext.Provider value="pt">
        <NightScript
          {...baseProps}
          activeRoles={new Set(["v23", "a02"])}
          roleAssignments={{ owner: "v23", dog: "a02" }}
          abilityRoleAssignments={{ owner: "v23", dog: "v23" }}
          dogWolfPlayerIds={["dog"]}
          dogWolfStates={{ dog: createDogWolfState("owner") }}
          conditionKeys={{ spiderHasCaught: true }}
          spiderCaughtBySource={{ dog: ["visitor"] }}
          onSpiderReveal={onSpiderReveal}
          players={[
            { id: "owner", name: "Owner", seat_position: 0 },
            { id: "dog", name: "Dog", seat_position: 1 },
            { id: "visitor", name: "Visitor", seat_position: 2 },
          ]}
        />
      </LanguageContext.Provider>,
    );

    const eyeButtons = Array.from(container.querySelectorAll("button"))
      .filter((button) => button.querySelector("svg.lucide-eye"));
    expect(eyeButtons).toHaveLength(1);
    fireEvent.click(eyeButtons[0]);
    expect(onSpiderReveal).toHaveBeenCalledWith("dog");
  });

  it("does not let Dog-as-Cupid create a second pair of Lovers", () => {
    const { container } = render(
      <LanguageContext.Provider value="pt">
        <NightScript
          {...baseProps}
          nightNumber={1}
          activeRoles={new Set(["s01", "a02"])}
          roleAssignments={{ owner: "s01", dog: "a02" }}
          baseRoleAssignments={{ owner: "s01", dog: "a02" }}
          abilityRoleAssignments={{ owner: "s01", dog: "s01" }}
          dogWolfPlayerIds={["dog"]}
          dogWolfStates={{ dog: createDogWolfState("owner") }}
          players={[
            { id: "owner", name: "Owner", seat_position: 0 },
            { id: "dog", name: "Dog", seat_position: 1 },
          ]}
        />
      </LanguageContext.Provider>,
    );

    expect(container.querySelectorAll('[draggable="true"]')).toHaveLength(1);
    expect(container.textContent).toContain("C\u00e3o");
  });

  it("keeps Dog-as-Evil-Cupid standalone until two living enemies are selected", () => {
    const state = createDogWolfState("owner");
    state.enemyPlayerIds = ["enemy-one"];
    const { container } = render(
      <LanguageContext.Provider value="pt">
        <NightScript
          {...baseProps}
          activeRoles={new Set(["m05", "a02"])}
          roleAssignments={{ owner: "m05", dog: "a02", "enemy-one": "v02" }}
          baseRoleAssignments={{ owner: "m05", dog: "a02", "enemy-one": "v02" }}
          abilityRoleAssignments={{ owner: "m05", dog: "m05", "enemy-one": "v02" }}
          dogWolfPlayerIds={["dog"]}
          dogWolfStates={{ dog: state }}
          players={[
            { id: "owner", name: "Owner", seat_position: 0 },
            { id: "dog", name: "Dog", seat_position: 1 },
            { id: "enemy-one", name: "Enemy", seat_position: 2 },
          ]}
        />
      </LanguageContext.Provider>,
    );

    const dogLine = Array.from(container.querySelectorAll('[draggable="true"]'))
      .find((line) => line.textContent?.includes("C\u00e3o"));
    expect(dogLine).toBeTruthy();
    expect(dogLine?.textContent?.trim().startsWith("(")).toBe(false);
  });
});
