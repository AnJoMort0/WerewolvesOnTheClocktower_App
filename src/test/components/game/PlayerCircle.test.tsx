import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PlayerCircle } from "@/components/game/PlayerCircle";
import { EMPTY_ACTOR_POWER_STATE } from "@/lib/actor";
import { getEffectLabel, getRoleLabel } from "@/lib/i18n";
import { ROLES } from "@/lib/roles";
import { resolveRoleImage } from "@/lib/skinPacks";

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

  it("drags an eligible Mother to apply her Curse and disables dragging when she cannot act", () => {
    const props = {
      isGM: true, isPlaying: true, totalSlots: 2, onDropPlayer: vi.fn(),
      players: [
        { id: "mother", name: "Mother", seat_position: 0, character: "m07", is_alive: true },
        { id: "target", name: "Target", seat_position: 1, character: "v01", is_alive: true },
      ],
      roleAssignments: { mother: "m07" as const, target: "v01" as const },
      abilityRoleAssignments: { mother: "m07" as const, target: "v01" as const },
    };
    const { container, rerender } = render(<PlayerCircle {...props}
      motherCurseActionSourcePlayerIds={new Set(["mother"])} />);
    const draggable = container.querySelector<HTMLElement>('[draggable="true"]')!;
    const dataTransfer = { setData: vi.fn(), effectAllowed: "" };
    fireEvent.dragStart(draggable, { dataTransfer });
    expect(dataTransfer.setData).toHaveBeenCalledWith("action", "role-m07");
    expect(dataTransfer.setData).toHaveBeenCalledWith("sourcePlayerId", "mother");

    rerender(<PlayerCircle {...props} motherCurseActionSourcePlayerIds={new Set()} />);
    expect(container.querySelector('[draggable="true"]')).toBeNull();
  });

  it("makes lobby seats movable and lets an unplaced Traveller use a gap", () => {
    const onInsertPlayer = vi.fn();
    const { container, getByLabelText } = render(<PlayerCircle
      isGM
      totalSlots={2}
      allowSeatDrag
      insertionPlayerId="traveller"
      onInsertPlayer={onInsertPlayer}
      onDropPlayer={vi.fn()}
      players={[
        { id: "alice", name: "Alice", seat_position: 0, character: null, is_alive: true },
        { id: "bob", name: "Bob", seat_position: 1, character: null, is_alive: true },
      ]}
    />);

    expect(container.querySelectorAll('[draggable="true"]')).toHaveLength(2);
    const dataTransfer = { getData: (key: string) => key === "playerId" ? "traveller" : "", setData: vi.fn(), effectAllowed: "" };
    fireEvent.drop(getByLabelText("Insert after seat 1"), { dataTransfer });
    expect(onInsertPlayer).toHaveBeenCalledWith("traveller", 0);
  });

  it("lets any lobby player be dropped between occupied seats", () => {
    const onInsertPlayer = vi.fn();
    const { getByLabelText } = render(<PlayerCircle
      isGM
      totalSlots={3}
      allowSeatDrag
      onInsertPlayer={onInsertPlayer}
      onDropPlayer={vi.fn()}
      players={[
        { id: "alice", name: "Alice", seat_position: 0, character: null, is_alive: true },
        { id: "bob", name: "Bob", seat_position: 1, character: null, is_alive: true },
        { id: "charlie", name: "Charlie", seat_position: null, character: null, is_alive: true },
      ]}
    />);
    const dataTransfer = { getData: (key: string) => key === "playerId" ? "charlie" : "", setData: vi.fn(), effectAllowed: "" };
    fireEvent.drop(getByLabelText("Insert after seat 1"), { dataTransfer });
    expect(onInsertPlayer).toHaveBeenCalledWith("charlie", 0);
  });

  it("makes an unused Gunslinger draggable and disables the drag after use", () => {
    const player = { id: "gunslinger", name: "Gunslinger", seat_position: 0, character: "t03", is_alive: true };
    const props = { isGM: true, isPlaying: true, totalSlots: 1, onDropPlayer: vi.fn(), players: [player],
      roleAssignments: { gunslinger: "t03" as const }, abilityRoleAssignments: { gunslinger: "t03" as const },
      onTravellerPowerUsedToggle: vi.fn() };
    const { container, getByRole, rerender } = render(<PlayerCircle {...props} usedTravellerPowerIds={new Set()} />);
    const draggable = container.querySelector<HTMLElement>('[draggable="true"]')!;
    const dataTransfer = { setData: vi.fn(), effectAllowed: "" };
    fireEvent.dragStart(draggable, { dataTransfer });
    expect(dataTransfer.setData).toHaveBeenCalledWith("action", "role-t03");
    expect(getByRole("checkbox", { name: "Ação usada" })).not.toBeChecked();

    rerender(<PlayerCircle {...props} usedTravellerPowerIds={new Set(["gunslinger"])} />);
    expect(container.querySelector('[draggable="true"]')).toBeNull();
    expect(getByRole("checkbox", { name: "Ação usada" })).toBeChecked();
  });

  it("drags the Devil's Advocate and shows the poisoned execution marker", () => {
    const { container, getByLabelText } = render(<PlayerCircle isGM isPlaying totalSlots={1} onDropPlayer={vi.fn()}
      players={[{ id: "advocate", name: "Advocate", seat_position: 0, character: "t04", is_alive: true }]}
      roleAssignments={{ advocate: "t04" }} abilityRoleAssignments={{ advocate: "t04" }}
      playerEffects={{ advocate: new Set(["devil_advocate_execution"]) }} />);
    const draggable = container.querySelector<HTMLElement>('[draggable="true"]')!;
    const dataTransfer = { setData: vi.fn(), effectAllowed: "" };
    fireEvent.dragStart(draggable, { dataTransfer });

    expect(dataTransfer.setData).toHaveBeenCalledWith("action", "role-t04");
    expect(getByLabelText(getEffectLabel("devil_advocate_execution", "pt"))).toBeInTheDocument();
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

  it("shows Traveller alignment skins to the GM while keeping the public circle neutral", () => {
    const player = { id: "traveller", name: "Traveller", seat_position: 0, character: "t01", is_alive: true };
    const { getByAltText, rerender } = render(<PlayerCircle isGM isPlaying totalSlots={1}
      onDropPlayer={vi.fn()} players={[player]} roleAssignments={{ traveller: "t01" }}
      objectiveRoleAssignments={{ traveller: "t01" }} playerEffects={{ traveller: new Set(["evil_being"]) }} />);
    const roleLabel = getRoleLabel("t01", "pt");
    expect(getByAltText(roleLabel)).toHaveAttribute("src", resolveRoleImage("t01", {
      flexible: { objectiveRoleId: "t01", effects: ["evil_being"] },
    }).src);

    rerender(<PlayerCircle totalSlots={1} onDropPlayer={vi.fn()} players={[player]}
      roleAssignments={{ traveller: "t01" }} publicRoleAssignments={{ traveller: "t01" }}
      playerEffects={{ traveller: new Set(["evil_being"]) }} hideSensitiveInfo />);
    expect(getByAltText(roleLabel)).toHaveAttribute("src", ROLES.t01.image);
  });
});
