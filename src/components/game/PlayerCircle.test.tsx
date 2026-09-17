import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PlayerCircle } from "./PlayerCircle";
import { EMPTY_ACTOR_POWER_STATE } from "@/lib/actor";

describe("Monkey power controls in the GM circle", () => {
  it("hides the exhaustion checkbox during the first night", () => {
    const props = { isGM: true, isPlaying: true, totalSlots: 1, onDropPlayer: vi.fn(),
      players: [{ id: "monkey", name: "Monkey", seat_position: 0, character: "v26", is_alive: true }],
      roleAssignments: { monkey: "v26" as const }, onMonkeyDisabledToggle: vi.fn() };
    const { queryByRole, getByRole, rerender } = render(<PlayerCircle {...props} showFoxCheckbox={false} />);
    expect(queryByRole("checkbox", { name: "Poder esgotado" })).toBeNull();
    rerender(<PlayerCircle {...props} showFoxCheckbox />);
    expect(getByRole("checkbox", { name: "Poder esgotado" })).not.toBeChecked();
  });

  it("allows restoring exhausted powers independently without changing player status", () => {
    const onMonkeyDisabledToggle = vi.fn(), onIndependentPowerStateChange = vi.fn(), onPlayerStatusChange = vi.fn();
    const { getAllByRole, rerender } = render(<PlayerCircle isGM isPlaying totalSlots={2}
      players={[{ id: "monkey", name: "Monkey", seat_position: 0, character: "v26", is_alive: true },
        { id: "actor", name: "Actor", seat_position: 1, character: "a04:v26", is_alive: true }]}
      onDropPlayer={vi.fn()} onPlayerStatusChange={onPlayerStatusChange}
      roleAssignments={{ monkey: "v26", actor: "v26" }} baseRoleAssignments={{ monkey: "v26", actor: "a04" }}
      monkeyDisabled onMonkeyDisabledToggle={onMonkeyDisabledToggle}
      independentPowerStates={{ actor: { ...EMPTY_ACTOR_POWER_STATE, monkeyDisabled: true } }}
      onIndependentPowerStateChange={onIndependentPowerStateChange} />);
    const checkboxes = getAllByRole("checkbox", { name: "Poder esgotado" });
    expect(checkboxes).toHaveLength(2);
    checkboxes.forEach((checkbox) => { expect(checkbox).toBeChecked(); fireEvent.click(checkbox); });
    expect(onMonkeyDisabledToggle).toHaveBeenCalledOnce();
    expect(onIndependentPowerStateChange).toHaveBeenCalledExactlyOnceWith("actor",
      expect.objectContaining({ monkeyDisabled: false }));
    expect(onPlayerStatusChange).not.toHaveBeenCalled();
    rerender(<PlayerCircle totalSlots={1} isPlaying onDropPlayer={vi.fn()}
      players={[{ id: "monkey", name: "Monkey", seat_position: 0, character: "v26", is_alive: true }]}
      roleAssignments={{ monkey: "v26" }} monkeyDisabled onMonkeyDisabledToggle={onMonkeyDisabledToggle} />);
    expect(document.querySelector('button[role="checkbox"]')).toBeNull();
  });
});
