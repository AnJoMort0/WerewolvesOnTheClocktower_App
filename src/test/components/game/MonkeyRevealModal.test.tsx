import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MonkeyRevealModal } from "@/components/game/MonkeyRevealModal";
import type { PhoneView } from "@/lib/phoneActions";

const view: PhoneView = { id: "monkey", mode: "monkey", participantIds: ["monkey"], votes: {}, players: [
  { id: "wolf", name: "Wolf", seat_position: 0, dead: false, redX: false, selectable: true, marker: null },
] };
describe("Monkey reveal modal", () => {
  it("can render inside the player screen without opening a covering dialog", () => {
    render(<MonkeyRevealModal embedded language="en" session={view} onConfirm={vi.fn()} onClose={vi.fn()} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Monkey Tamer" })).toBeVisible();
  });

  it("requires choosing and confirming a player, then preserves a revealed card when reopened", () => {
    const onConfirm = vi.fn(), onClose = vi.fn(), onReopen = vi.fn(), onRoleClick = vi.fn();
    const props = { language: "en" as const, onConfirm, onClose, onReopen, onRoleClick };
    const { rerender } = render(<MonkeyRevealModal {...props} session={view} />);
    expect(screen.getByRole("button", { name: "Reveal card" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reveal card" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Close" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Wolf" }));
    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Reveal card: Wolf" }));
    expect(onConfirm).toHaveBeenCalledExactlyOnceWith("wolf");
    const resolved = { ...view, monkeyReveal: { targetPlayerId: "wolf", roleId: "e01" as const, evil: true } };
    rerender(<MonkeyRevealModal {...props} session={resolved} />);
    expect(screen.getByRole("img", { name: "Werewolf" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Werewolf" }));
    expect(onRoleClick).toHaveBeenCalledExactlyOnceWith("e01");
    expect(onClose).not.toHaveBeenCalled();
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: "Wolf" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledOnce();
    rerender(<MonkeyRevealModal {...props} session={{ ...resolved, visible: false }} />);
    fireEvent.click(screen.getByRole("button", { name: "Reopen card" }));
    expect(onReopen).toHaveBeenCalledOnce();
    rerender(<MonkeyRevealModal {...props} session={{ ...resolved, visible: true }} />);
    expect(screen.getByRole("img", { name: "Werewolf" })).toBeInTheDocument();
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
