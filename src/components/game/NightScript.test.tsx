import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NightScript } from "@/components/game/NightScript";
import { LanguageContext } from "@/lib/i18n";

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
