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
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
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
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onConfirmRole).toHaveBeenCalledWith("v02");

    rerender(<GamblerGuessModal {...props} session={{ ...view, pendingTargetPlayerIds: ["b", "c"], completed: true,
      gamblerReveal: { playerIds: ["b", "c"], roleId: "v02", correct: false } }} />);
    expect(screen.getByRole("status")).toHaveTextContent("NO");
    expect(screen.getByRole("status")).toHaveTextContent("commits suicide");
  });

  it("keeps its embedded character list scrollable and groups the available roles", () => {
    const props = { embedded: true, language: "en" as const, onConfirmPlayers: vi.fn(), onConfirmRole: vi.fn() };
    const { rerender } = render(<GamblerGuessModal {...props}
      session={{ ...view, pendingTargetPlayerIds: ["b", "c"] }} />);

    expect(screen.getByRole("region", { name: "Gambler" })).toHaveClass("max-h-[calc(100dvh-12rem)]");
    expect(screen.getByRole("heading", { name: "Villagers" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Evil Beings" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Flexible" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Solo" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Actor" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ordinary Townsfolk" })).not.toBeInTheDocument();

    rerender(<GamblerGuessModal {...props} session={{ ...view, pendingTargetPlayerIds: ["b", "c"],
      hasAdvancedRolesInGame: true, hasLameRolesInGame: true }} />);
    expect(screen.getByRole("button", { name: "Actor" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Ordinary Townsfolk" })).toBeVisible();
  });

  it("lets the player ignore only before confirming a group and leaves later closing to the GM", () => {
    const onIgnore = vi.fn();
    const props = { embedded: true, language: "en" as const, onConfirmPlayers: vi.fn(), onConfirmRole: vi.fn(), onIgnore };
    const { rerender } = render(<GamblerGuessModal {...props} session={view} />);
    fireEvent.click(screen.getByRole("button", { name: "Ignore" }));
    expect(onIgnore).toHaveBeenCalledOnce();

    rerender(<GamblerGuessModal {...props} session={{ ...view, pendingTargetPlayerIds: ["b", "c"] }} />);
    expect(screen.queryByRole("button", { name: "Ignore" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /close/i })).not.toBeInTheDocument();

    rerender(<GamblerGuessModal {...props} session={{ ...view, completed: true, ignored: true }} />);
    expect(screen.getByRole("status")).toHaveTextContent("chose not to use this action");
    expect(screen.queryByRole("button", { name: "Ignore" })).not.toBeInTheDocument();
  });
});
