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
