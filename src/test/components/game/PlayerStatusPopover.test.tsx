import { useState } from "react";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PlayerStatusPopover } from "@/components/game/PlayerStatusPopover";

describe("PlayerStatusPopover", () => {
  it("does not preselect the first status action when opened", async () => {
    const Harness = () => {
      const [open, setOpen] = useState(false);
      return <PlayerStatusPopover
        status="alive"
        open={open}
        onOpenChange={setOpen}
        onSetPoisoned={vi.fn()}
        onSetDead={vi.fn()}
        onSetAlive={vi.fn()}
      >
        <button type="button">Player</button>
      </PlayerStatusPopover>;
    };
    const { getByRole } = render(<Harness />);
    const player = getByRole("button", { name: "Player" });
    player.focus();

    fireEvent.click(player);
    const firstAction = await waitFor(() => getByRole("button", { name: "Envenenar" }));

    expect(firstAction).not.toHaveFocus();
    expect(getByRole("dialog")).toHaveFocus();
  });

  it("offers exile instead of execution for a Traveller", async () => {
    const onSetExiled = vi.fn();
    const { getByRole, queryByRole } = render(<PlayerStatusPopover
      status="alive"
      isTraveller
      onSetPoisoned={vi.fn()}
      onSetDead={vi.fn()}
      onSetAlive={vi.fn()}
      onSetExecuted={vi.fn()}
      onSetExiled={onSetExiled}
    ><button type="button">Traveller</button></PlayerStatusPopover>);

    fireEvent.click(getByRole("button", { name: "Traveller" }));
    const exile = await waitFor(() => getByRole("button", { name: "Exilar" }));
    expect(queryByRole("button", { name: "Executar" })).toBeNull();
    fireEvent.click(exile);
    expect(onSetExiled).toHaveBeenCalledOnce();
  });
});
