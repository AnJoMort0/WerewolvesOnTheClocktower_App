import { PHONE_MODE } from "@/lib/phoneActionModes";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FoxRevealModal } from "@/components/game/FoxRevealModal";
import { getTranslation } from "@/lib/i18n";
import type { PhoneView } from "@/lib/phoneActions";

const players: PhoneView["players"] = [
  { id: "left", name: "Left", seat_position: 0, dead: false, redX: false, selectable: true, marker: null },
  { id: "target", name: "Target", seat_position: 1, dead: false, redX: false, selectable: true, marker: null },
  { id: "right", name: "Right", seat_position: 2, dead: false, redX: false, selectable: true, marker: null },
  { id: "outside", name: "Outside", seat_position: 3, dead: false, redX: false, selectable: true, marker: null },
];
const view: PhoneView = { id: "fox", mode: PHONE_MODE.FOX_TAMER_CHECK, participantIds: ["fox"], votes: {}, players };

describe("Fox Tamer reveal modal", () => {
  it("can render inside the player screen without hiding its surrounding context", () => {
    render(<FoxRevealModal embedded language="en" session={view} onConfirm={vi.fn()} onClose={vi.fn()} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Fox Tamer" })).toBeVisible();
  });

  it("highlights the living trio, confirms separately, and shows a persistent result", () => {
    const onConfirm = vi.fn(), onClose = vi.fn(), onReopen = vi.fn();
    const props = { language: "en" as const, onConfirm, onClose, onReopen };
    const { rerender } = render(<FoxRevealModal {...props} session={view} />);
    const confirm = screen.getByRole("button", { name: getTranslation("en").ui.foxReveal.confirm });
    expect(confirm).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Target" }));
    expect(screen.getByRole("button", { name: "Left" }).querySelector("span")).toHaveClass("border-amber-400");
    expect(screen.getByRole("button", { name: "Right" }).querySelector("span")).toHaveClass("border-amber-400");
    fireEvent.click(screen.getByRole("button", { name: "Check these players: Target" }));
    expect(onConfirm).toHaveBeenCalledExactlyOnceWith("target");

    const resolved: PhoneView = { ...view, foxReveal: {
      targetPlayerId: "target", playerIds: ["left", "target", "right"], result: "clear", foxRanAway: true,
    } };
    rerender(<FoxRevealModal {...props} session={resolved} />);
    expect(screen.getByRole("status")).toHaveTextContent(getTranslation("en").ui.foxReveal.clear);
    expect(screen.getByRole("status")).toHaveTextContent(getTranslation("en").ui.foxReveal.ranAway);
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledOnce();
    rerender(<FoxRevealModal {...props} session={{ ...resolved, visible: false }} />);
    fireEvent.click(screen.getByRole("button", { name: "Reopen result" }));
    expect(onReopen).toHaveBeenCalledOnce();
  });

  it("states that an Illusion confused the Fox", () => {
    render(<FoxRevealModal language="en" session={{ ...view, foxReveal: {
      targetPlayerId: "target", playerIds: ["left", "target", "right"], result: "confused", foxRanAway: false,
    } }} onConfirm={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole("status")).toHaveTextContent(getTranslation("en").ui.foxReveal.confused);
  });
});
