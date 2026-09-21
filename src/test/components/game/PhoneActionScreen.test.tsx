import { PHONE_MODE } from "@/lib/phoneActionModes";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PhoneActionScreen } from "@/components/game/PhoneActionScreen";
import { getTranslation } from "@/lib/i18n";
import type { PhoneView } from "@/lib/phoneActions";

const baseView: PhoneView = {
  id: "phone-session",
  mode: PHONE_MODE.WEREWOLF_HUNT,
  participantIds: ["wolf"],
  votes: {},
  players: [
    { id: "wolf", name: "Wolf", seat_position: 0, selectable: true, redX: false, dead: false, marker: "werewolf" },
    { id: "target", name: "Target", seat_position: 1, selectable: true, redX: false, dead: false, marker: null },
  ],
};

describe("PhoneActionScreen", () => {
  it("lets the GM select and confirm a hunt without casting a player vote", () => {
    const onSend = vi.fn();
    render(<PhoneActionScreen session={baseView} playerId="gm" language="en" pending={false} connected gmControlled onSend={onSend} />);
    fireEvent.click(screen.getByRole("button", { name: "Target" }));
    expect(onSend).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: getTranslation("en").ui.phoneActions.confirm }));
    expect(onSend).toHaveBeenCalledWith("confirm", "target");
  });

  it("greys out ineligible Colossus targets and locks confirmed requests for approval", () => {
    const onSend = vi.fn();
    const session: PhoneView = { ...baseView, mode: PHONE_MODE.COLOSSUS_RETALIATION, players: baseView.players.map((p) => p.id === "wolf" ? { ...p, selectable: false } : p) };
    const { rerender } = render(<PhoneActionScreen session={session} playerId="wolf" language="en" pending={false} connected onSend={onSend} />);
    expect(screen.getByRole("button", { name: "Wolf" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Wolf" }).querySelector("span")).toHaveClass("opacity-40");
    fireEvent.click(screen.getByRole("button", { name: "Target" }));
    fireEvent.click(screen.getByRole("button", { name: getTranslation("en").ui.phoneActions.confirm }));
    expect(onSend).toHaveBeenCalledWith("confirm", "target");
    rerender(<PhoneActionScreen session={{ ...session, pendingTargetPlayerId: "target" }} playerId="wolf" language="en" pending={false} connected onSend={onSend} />);
    expect(screen.getByRole("button", { name: "Target" })).toBeDisabled();
    expect(screen.getByRole("button", { name: getTranslation("en").ui.phoneActions.confirm })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent(getTranslation("en").ui.phoneActions.waiting);
  });
  it("mirrors votes for the GM without allowing a GM vote", () => {
    const onSend = vi.fn();
    const { rerender } = render(<PhoneActionScreen session={{ ...baseView, votes: { wolf: "target" } }}
      playerId="gm" language="en" pending={false} connected readOnly onSend={onSend} />);
    expect(screen.getByRole("button", { name: "Target" }).querySelector('span[title="Wolf"]')).toHaveTextContent("1");
    expect(screen.getByRole("button", { name: "Target" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Target" }));
    expect(onSend).not.toHaveBeenCalled();
    rerender(<PhoneActionScreen session={baseView} playerId="gm" language="en"
      pending={false} connected readOnly onSend={onSend} />);
    expect(screen.getByRole("button", { name: "Target" }).querySelector('span[title="Wolf"]')).not.toBeInTheDocument();
  });
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
        session={{ ...baseView, mode: PHONE_MODE.EVIL_WITCH_POISON, participantIds: ["wolf"] }}
        playerId="wolf"
        language="en"
        pending
        connected
        onSend={vi.fn()}
      />,
    );

    expect(screen.getByText(getTranslation("en").ui.phoneActions.waiting)).toBeInTheDocument();
  });

  it("applies a Spider web selection immediately and keeps the target visible", () => {
    const onSend = vi.fn();
    const session: PhoneView = { ...baseView, mode: PHONE_MODE.SPIDER_TAMER_WEB, participantIds: ["wolf"] };
    const { rerender } = render(
      <PhoneActionScreen
        session={session}
        playerId="wolf"
        language="en"
        pending={false}
        connected
        onSend={onSend}
      />,
    );

    expect(screen.getByRole("region", { name: getTranslation("en").roleLabels.v23 })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Target" }));
    expect(onSend).toHaveBeenCalledWith("select", "target");
    rerender(<PhoneActionScreen session={{ ...session, pendingTargetPlayerId: "target" }} playerId="wolf"
      language="en" pending={false} connected onSend={onSend} />);
    expect(screen.getByRole("status")).toHaveTextContent("Wolf selected Target.");
    expect(screen.queryByRole("button", { name: getTranslation("en").ui.phoneActions.confirm })).not.toBeInTheDocument();
  });

  it.each([
    PHONE_MODE.SLEEPWALKER_VISIT,
    PHONE_MODE.PRIEST_CONFESSION,
  ] as const)("allows a %s to change targets before confirming", (mode) => {
    const onSend = vi.fn();
    const session: PhoneView = { ...baseView, mode, participantIds: ["wolf"], players: [
      ...baseView.players,
      { id: "other", name: "Other", seat_position: 2, selectable: true, redX: false, dead: false, marker: null },
    ] };
    render(<PhoneActionScreen session={session} playerId="wolf" language="en" pending={false} connected onSend={onSend} />);

    fireEvent.click(screen.getByRole("button", { name: "Target" }));
    expect(screen.getByRole("button", { name: "Target" })).toHaveAttribute("aria-pressed", "true");
    expect(onSend).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Other" }));
    expect(screen.getByRole("button", { name: "Target" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Other" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: getTranslation("en").ui.phoneActions.confirm }));
    expect(onSend).toHaveBeenCalledExactlyOnceWith("confirm", "other");
  });

  it("shows selectable Priest Ghosts without disabled styling and marks them with a ghost icon", () => {
    const ghost = { id: "ghost", name: "Ghost", seat_position: 2, selectable: true, redX: false, dead: true, marker: null };
    render(<PhoneActionScreen session={{ ...baseView, mode: PHONE_MODE.PRIEST_CONFESSION, participantIds: ["wolf"], players: [...baseView.players, ghost] }}
      playerId="wolf" language="en" pending={false} connected onSend={vi.fn()} />);

    const ghostButton = screen.getByRole("button", { name: "Ghost" });
    expect(ghostButton).toBeEnabled();
    expect(ghostButton.querySelector("span")).not.toHaveClass("opacity-40");
    expect(screen.getByTestId("ghost-marker-ghost")).toBeInTheDocument();
  });

  it("shows an approved Priest character card and opens its rulebook entry", () => {
    const onRoleClick = vi.fn();
    render(<PhoneActionScreen session={{ ...baseView, mode: PHONE_MODE.PRIEST_CONFESSION, priestReveal: { targetPlayerId: "target", roleId: "v03" } }}
      playerId="wolf" language="en" pending={false} connected onSend={vi.fn()} onRoleClick={onRoleClick} />);
    expect(screen.queryByTestId("phone-action-map")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: getTranslation("en").ui.phoneActions.confirm })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Raven Tamer/i }));
    expect(onRoleClick).toHaveBeenCalledWith("v03");
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

  it("collects both Cupid targets before submitting the pair", () => {
    const onSend = vi.fn();
    const session: PhoneView = {
      ...baseView,
      mode: PHONE_MODE.CUPID_PAIR,
      participantIds: ["wolf"],
      minTargetCount: 2,
      targetCount: 2,
      players: [...baseView.players, { id: "second", name: "Second", seat_position: 2, selectable: true, redX: false, dead: false, marker: null }],
    };
    render(<PhoneActionScreen session={session} playerId="wolf" language="en" pending={false} connected onSend={onSend} />);
    const confirm = screen.getByRole("button", { name: getTranslation("en").ui.phoneActions.confirm });
    expect(confirm).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Target" }));
    expect(confirm).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Second" }));
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);
    expect(onSend).toHaveBeenCalledWith("confirm", "target", ["target", "second"]);
  });

  it("allows a poisoned White Werewolf to confirm one or two victims", () => {
    const onSend = vi.fn();
    const session: PhoneView = {
      ...baseView,
      mode: PHONE_MODE.WHITE_WEREWOLF_ASSASSINATION,
      minTargetCount: 1,
      targetCount: 2,
      players: [...baseView.players, { id: "second", name: "Second", seat_position: 2, selectable: true, redX: false, dead: false, marker: "werewolf" }],
    };
    render(<PhoneActionScreen session={session} playerId="wolf" language="en" pending={false} connected onSend={onSend} />);
    fireEvent.click(screen.getByRole("button", { name: "Target" }));
    const confirm = screen.getByRole("button", { name: getTranslation("en").ui.phoneActions.confirm });
    expect(confirm).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Second" }));
    fireEvent.click(confirm);
    expect(onSend).toHaveBeenCalledWith("confirm", "target", ["target", "second"]);
  });

  it("shows the Secret Lover result without asking for another confirmation", () => {
    render(<PhoneActionScreen session={{ ...baseView, mode: PHONE_MODE.SECRET_LOVER_CHECK, pendingTargetPlayerId: "target", approvalResult: "denied" }} playerId="wolf"
      language="en" pending={false} connected onSend={vi.fn()} />);
    expect(screen.getByRole("status")).toHaveTextContent(getTranslation("en").ui.phoneActions.denied);
    expect(screen.getByRole("status")).toHaveTextContent("Target");
    expect(screen.queryByTestId("phone-action-map")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: getTranslation("en").ui.phoneActions.confirm })).not.toBeInTheDocument();
  });

  it("lets optional role actions be ignored", () => {
    const onSend = vi.fn();
    render(<PhoneActionScreen session={{ ...baseView, mode: PHONE_MODE.VINTNER_POISON }} playerId="wolf"
      language="en" pending={false} connected onSend={onSend} />);
    fireEvent.click(screen.getByRole("button", { name: getTranslation("en").ui.phoneActions.ignore }));
    expect(onSend).toHaveBeenCalledWith("ignore");
  });
});
