import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PhoneActionScreen } from "./PhoneActionScreen";
import { getTranslation } from "@/lib/i18n";
import type { PhoneView } from "@/lib/phoneActions";

const baseView: PhoneView = {
  id: "phone-session",
  mode: "hunt",
  participantIds: ["wolf"],
  votes: {},
  players: [
    { id: "wolf", name: "Wolf", seat_position: 0, selectable: true, redX: false, dead: false, marker: "werewolf" },
    { id: "target", name: "Target", seat_position: 1, selectable: true, redX: false, dead: false, marker: null },
  ],
};

describe("PhoneActionScreen", () => {
  it("does not show the GM waiting message while a hunt selection is synchronizing", () => {
    render(
      <PhoneActionScreen
        session={baseView}
        playerId="wolf"
        language="en"
        pending
        connected
        onSend={vi.fn()}
      />,
    );

    expect(screen.queryByText(getTranslation("en").ui.phoneActions.waiting)).not.toBeInTheDocument();
  });

  it("keeps the waiting message for actions that require a final submission", () => {
    render(
      <PhoneActionScreen
        session={{ ...baseView, mode: "poison", participantIds: ["wolf"] }}
        playerId="wolf"
        language="en"
        pending
        connected
        onSend={vi.fn()}
      />,
    );

    expect(screen.getByText(getTranslation("en").ui.phoneActions.waiting)).toBeInTheDocument();
  });

  it("uses a fluid map without a horizontal scroll container for large games", () => {
    const players = Array.from({ length: 24 }, (_, index) => ({
      id: `player-${index}`,
      name: `Player ${index + 1}`,
      seat_position: index,
      selectable: true,
      redX: false,
      dead: false,
      marker: null,
    }));
    const { container } = render(
      <PhoneActionScreen
        session={{ ...baseView, players }}
        playerId="wolf"
        language="en"
        pending={false}
        connected
        onSend={vi.fn()}
      />,
    );

    const map = screen.getByTestId("phone-action-map");
    expect(map).toHaveClass("w-full", "max-w-[19rem]");
    expect(map.parentElement).toHaveClass("overflow-hidden");
    expect(container.querySelector(".overflow-x-auto")).not.toBeInTheDocument();
    expect(map.querySelector("button")?.style.left).toMatch(/%$/);
  });
});
