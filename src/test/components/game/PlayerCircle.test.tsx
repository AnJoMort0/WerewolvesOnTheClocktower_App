import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PlayerCircle } from "@/components/game/PlayerCircle";
import { EMPTY_ACTOR_POWER_STATE } from "@/lib/actor";

describe("PlayerCircle drag and power controls", () => {
  it("drags Monkey and ready Colossus copies with their own source IDs", () => {
    const { container, rerender } = render(<PlayerCircle isGM isPlaying totalSlots={4} onDropPlayer={vi.fn()}
      players={["colossus", "actor", "monkey", "waiting"].map((id, seat_position) => ({ id, name: id, seat_position, character: "v27", is_alive: true }))}
      roleAssignments={{ colossus: "v27", actor: "v27", monkey: "v26", waiting: "v27" }}
      baseRoleAssignments={{ colossus: "v27", actor: "a04", monkey: "v26", waiting: "v27" }}
      abilityRoleAssignments={{ colossus: "v27", actor: "v27", monkey: "v26", waiting: "v27" }}
      playerStatuses={{ colossus: "dead-this-night", actor: "dead-this-night" }}
      colossusReadyPlayerIds={new Set(["colossus", "actor"])} />);
    const sources = Array.from(container.querySelectorAll('[draggable="true"]'));
    expect(sources).toHaveLength(3);
    sources.forEach((node, index) => {
      const dataTransfer = { setData: vi.fn(), effectAllowed: "" };
      fireEvent.dragStart(node, { dataTransfer });
      expect(dataTransfer.setData).toHaveBeenCalledWith("sourcePlayerId", ["colossus", "actor", "monkey"][index]);
      expect(dataTransfer.setData).toHaveBeenCalledWith("action", index === 2 ? "role-v26" : "role-v27");
    });
    rerender(<PlayerCircle isGM isPlaying totalSlots={1} onDropPlayer={vi.fn()}
      players={[{ id: "colossus", name: "Colossus", seat_position: 0, character: "v27", is_alive: false }]}
      roleAssignments={{ colossus: "v27" }} playerStatuses={{ colossus: "dead" }} permanentlyDead={new Set(["colossus"])}
      colossusReadyPlayerIds={new Set()} />);
    expect(container.querySelector('[draggable="true"]')).toBeNull();
  });
  it("hides the exhaustion checkbox during the first night", () => {
    const props = { isGM: true, isPlaying: true, totalSlots: 1, onDropPlayer: vi.fn(),
      players: [{ id: "monkey", name: "Monkey", seat_position: 0, character: "v26", is_alive: true }],
      roleAssignments: { monkey: "v26" as const }, onMonkeyDisabledToggle: vi.fn() };
    const { queryByRole, getByRole, rerender } = render(<PlayerCircle {...props} showFoxCheckbox={false} />);
    expect(queryByRole("checkbox", { name: "Poder esgotado" })).toBeNull();
    rerender(<PlayerCircle {...props} showFoxCheckbox />);
    expect(getByRole("checkbox", { name: "Poder esgotado" })).not.toBeChecked();
  });

  it("does not make Little Girl draggable from the player circle", () => {
    const { container } = render(<PlayerCircle isGM isPlaying totalSlots={1} onDropPlayer={vi.fn()}
      players={[{ id: "girl", name: "Little Girl", seat_position: 0, character: "v01", is_alive: true }]}
      roleAssignments={{ girl: "v01" }} />);

    expect(container.querySelector('[draggable="true"]')).toBeNull();
    expect(container.querySelector("img")?.closest('[draggable="true"]')).toBeNull();
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
