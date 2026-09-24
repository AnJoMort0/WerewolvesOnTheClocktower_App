import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GypsyRevealModal } from "@/components/game/GypsyRevealModal";
import { PHONE_MODE } from "@/lib/phoneActionModes";
import type { PhoneView } from "@/lib/phoneActions";
import { getTranslation } from "@/lib/i18n";

const players: PhoneView["players"] = [
  { id: "left", name: "Left", seat_position: 0, dead: false, redX: false, selectable: true, marker: null },
  { id: "target", name: "Target", seat_position: 1, dead: false, redX: false, selectable: true, marker: null },
  { id: "right", name: "Right", seat_position: 2, dead: false, redX: false, selectable: true, marker: null },
];
const view: PhoneView = { id: "gypsy", mode: PHONE_MODE.GYPSY_POISON_CHECK, participantIds: ["gypsy"], votes: {}, players };

describe("Gypsy reveal modal", () => {
  it("selects a trio, confirms separately, and keeps the answer visible", () => {
    const onConfirm = vi.fn();
    const confirmLabel = getTranslation("en").ui.gypsyReveal.confirm;
    const { rerender } = render(<GypsyRevealModal embedded language="en" session={view} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole("button", { name: "Target" }));
    expect(screen.getByRole("button", { name: "Left" }).querySelector("span")).toHaveClass("border-amber-400");
    fireEvent.click(screen.getByRole("button", { name: `${confirmLabel}: Target` }));
    expect(onConfirm).toHaveBeenCalledWith("target");

    rerender(<GypsyRevealModal embedded language="en" session={{ ...view, gypsyReveal: {
      targetPlayerId: "target", playerIds: ["left", "target", "right"], poisoned: true,
    } }} onConfirm={onConfirm} />);
    expect(screen.getByRole("status")).toHaveTextContent("one of them is poisoned");
    expect(screen.queryByRole("button", { name: new RegExp(confirmLabel) })).not.toBeInTheDocument();
  });
});
