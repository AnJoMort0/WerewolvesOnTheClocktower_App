import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GamblerGuessModal } from "@/components/game/GamblerGuessModal";
import { getGamblerPathPlayerIds } from "@/lib/gambler";
import { PHONE_MODE } from "@/lib/phoneActionModes";
import type { PhoneView } from "@/lib/phoneActions";

const players: PhoneView["players"] = ["A", "B", "C", "D", "E", "F"].map((name, seat_position) => ({
  id: name.toLowerCase(), name, seat_position, dead: false, redX: false, selectable: true, marker: null,
}));
const view: PhoneView = {
  id: "gambler", mode: PHONE_MODE.GAMBLER_GUESS, participantIds: ["gambler"], votes: {}, players,
};

describe("Gambler guess modal", () => {
  it("calculates both circular paths including their endpoints", () => {
    const ids = players.map((player) => player.id);
    expect(getGamblerPathPlayerIds(ids, "a", "d")).toEqual(["a", "b", "c", "d"]);
    expect(getGamblerPathPlayerIds(ids, "a", "d", true)).toEqual(["a", "f", "e", "d"]);
    expect(getGamblerPathPlayerIds(ids, "c")).toEqual(["c"]);
  });

  it("switches to the longer path when an endpoint is deselected and selected again", () => {
    const onConfirmPlayers = vi.fn();
    render(<GamblerGuessModal embedded session={view} language="en"
      onConfirmPlayers={onConfirmPlayers} onConfirmRole={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "A" }));
    fireEvent.click(screen.getByRole("button", { name: "D" }));
    expect(screen.getByRole("button", { name: "B" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "F" })).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(screen.getByRole("button", { name: "D" }));
    fireEvent.click(screen.getByRole("button", { name: "D" }));
    expect(screen.getByRole("button", { name: "B" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "F" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Confirm group" }));
    expect(onConfirmPlayers).toHaveBeenCalledWith(["a", "f", "e", "d"]);
  });

  it("switches paths when the first endpoint is the one selected again", () => {
    render(<GamblerGuessModal embedded session={view} language="en"
      onConfirmPlayers={vi.fn()} onConfirmRole={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "A" }));
    fireEvent.click(screen.getByRole("button", { name: "D" }));
    fireEvent.click(screen.getByRole("button", { name: "A" }));
    fireEvent.click(screen.getByRole("button", { name: "A" }));
    expect(screen.getByRole("button", { name: "B" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "F" })).toHaveAttribute("aria-pressed", "true");
  });

  it("shows the character list and then a persistent result", () => {
    const onConfirmRole = vi.fn();
    const props = { embedded: true, language: "en" as const, onConfirmPlayers: vi.fn(), onConfirmRole };
    const { rerender } = render(<GamblerGuessModal {...props} session={{ ...view, pendingTargetPlayerIds: ["b", "c"] }} />);
    expect(screen.getByTestId("gambler-role-grid")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Gambler" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Bear Tamer" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm guess" }));
    expect(onConfirmRole).toHaveBeenCalledWith("v02");

    rerender(<GamblerGuessModal {...props} session={{ ...view, pendingTargetPlayerIds: ["b", "c"], completed: true,
      gamblerReveal: { playerIds: ["b", "c"], roleId: "v02", correct: false } }} />);
    expect(screen.getByRole("status")).toHaveTextContent("NO");
    expect(screen.getByRole("status")).toHaveTextContent("commits suicide");
  });
});
