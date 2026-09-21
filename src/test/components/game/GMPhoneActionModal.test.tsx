import { PHONE_MODE } from "@/lib/phoneActionModes";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GMPhoneActionModal } from "@/components/game/GMPhoneActionModal";
import { GMPlayerActionModal } from "@/components/game/GMPlayerActionModal";
import { getTranslation, t } from "@/lib/i18n";
import type { PhoneSession, PhoneView } from "@/lib/phoneActions";

const session: PhoneSession = { id: "retaliation", mode: PHONE_MODE.COLOSSUS_RETALIATION, sourcePlayerId: "actor", lineKey: "line", participantIds: ["actor"], votes: {}, sequences: {} };
const view: PhoneView = { ...session, players: [
  { id: "actor", name: "Actor", seat_position: 0, dead: false, redX: false, marker: null, selectable: false },
  { id: "target", name: "Target", seat_position: 1, dead: false, redX: false, marker: null, selectable: true },
] };

describe("usable GM action mirrors", () => {
  it("allows selection and requires a separate, explicit Colossus approval", () => {
    const onSend = vi.fn(), onResolveColossus = vi.fn(), onResolveHunt = vi.fn();
    const props = { language: "en" as const, onSend, onResolveColossus, onResolveHunt, onResolvePriest: vi.fn(), onClose: vi.fn() };
    const { rerender } = render(<GMPhoneActionModal {...props} session={session} view={view} />);
    fireEvent.click(screen.getByRole("button", { name: "Target" }));
    fireEvent.click(screen.getByRole("button", { name: getTranslation("en").ui.phoneActions.confirm }));
    expect(onSend).toHaveBeenCalledWith("confirm", "target");
    expect(onResolveColossus).not.toHaveBeenCalled();
    rerender(<GMPhoneActionModal {...props} session={{ ...session, pendingTargetPlayerId: "target" }} view={{ ...view, pendingTargetPlayerId: "target" }} />);
    expect(screen.getByRole("button", { name: "Target" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: getTranslation("en").ui.gmAcceptAction }));
    expect(onResolveColossus).toHaveBeenCalledExactlyOnceWith("retaliation", "target", true);
    expect(onResolveHunt).not.toHaveBeenCalled();
  });

  it.each([
    PHONE_MODE.EVIL_WITCH_POISON,
    PHONE_MODE.SHAMAN_SAVE,
    PHONE_MODE.WEREWOLF_HUNT,
  ] as const)("allows a GM to confirm a %s target", (mode) => {
    const onSend = vi.fn();
    render(<GMPhoneActionModal session={{ ...session, mode }} view={{ ...view, mode }} language="en"
      onClose={vi.fn()} onSend={onSend} onResolveHunt={vi.fn()} onResolveColossus={vi.fn()} onResolvePriest={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Target" }));
    fireEvent.click(screen.getByRole("button", { name: mode === PHONE_MODE.SHAMAN_SAVE ? getTranslation("en").ui.phoneActions.save : getTranslation("en").ui.phoneActions.confirm }));
    expect(onSend).toHaveBeenCalledWith("confirm", "target");
  });

  it.each([
    PHONE_MODE.SPIDER_TAMER_WEB,
    PHONE_MODE.SLEEPWALKER_VISIT,
  ] as const)("keeps a submitted %s selection visible without approval controls", (mode) => {
    const onSend = vi.fn();
    const props = { language: "en" as const, onClose: vi.fn(), onSend, onResolveHunt: vi.fn(), onResolveColossus: vi.fn(), onResolvePriest: vi.fn() };
    const { rerender } = render(<GMPhoneActionModal {...props} session={{ ...session, mode }} view={{ ...view, mode }} />);
    fireEvent.click(screen.getByRole("button", { name: "Target" }));
    if (mode === PHONE_MODE.SLEEPWALKER_VISIT) fireEvent.click(screen.getByRole("button", { name: getTranslation("en").ui.phoneActions.confirm }));
    expect(onSend).toHaveBeenCalledWith(mode === PHONE_MODE.SPIDER_TAMER_WEB ? "select" : "confirm", "target");
    rerender(<GMPhoneActionModal {...props} session={{ ...session, mode, pendingTargetPlayerId: "target" }}
      view={{ ...view, mode, pendingTargetPlayerId: "target" }} />);
    expect(screen.getByRole("dialog")).toHaveTextContent("Actor selected Target.");
    expect(screen.queryByRole("button", { name: getTranslation("en").ui.gmAcceptAction })).not.toBeInTheDocument();
  });

  it("requires GM approval before showing the Priest's revealed character", () => {
    const onSend = vi.fn(), onResolvePriest = vi.fn(), onRoleClick = vi.fn();
    const props = { language: "en" as const, onClose: vi.fn(), onSend, onResolveHunt: vi.fn(), onResolveColossus: vi.fn(), onResolvePriest, onRoleClick };
    const priestSession: PhoneSession = { ...session, mode: PHONE_MODE.PRIEST_CONFESSION };
    const priestView: PhoneView = { ...view, mode: PHONE_MODE.PRIEST_CONFESSION };
    const { rerender } = render(<GMPhoneActionModal {...props} session={priestSession} view={priestView} />);
    fireEvent.click(screen.getByRole("button", { name: "Target" }));
    fireEvent.click(screen.getByRole("button", { name: getTranslation("en").ui.phoneActions.confirm }));
    expect(onSend).toHaveBeenCalledWith("confirm", "target");
    rerender(<GMPhoneActionModal {...props} session={{ ...priestSession, pendingTargetPlayerId: "target" }}
      view={{ ...priestView, pendingTargetPlayerId: "target" }} />);
    fireEvent.click(screen.getByRole("button", { name: getTranslation("en").ui.gmAcceptAction }));
    expect(onResolvePriest).toHaveBeenCalledWith("retaliation", "target", true);
    rerender(<GMPhoneActionModal {...props} session={{ ...priestSession, priestReveal: { targetPlayerId: "target", roleId: "v03" } }}
      view={{ ...priestView, priestReveal: { targetPlayerId: "target", roleId: "v03" } }} />);
    fireEvent.click(screen.getByRole("button", { name: /Raven Tamer/i }));
    expect(onRoleClick).toHaveBeenCalledWith("v03");
  });

  it.each(["v10-assassinate", "v18-resurrect", "v23-web"] as const)("mirrors %s with the correct targets and role controls", (kind) => {
    const onConfirm = vi.fn();
    const resurrection = kind === "v18-resurrect";
    render(<GMPlayerActionModal mode={{ id: "day-action", actorPlayerId: "actor", kind }} language="en"
      onClose={vi.fn()} onConfirm={onConfirm} players={[
        { id: "actor", name: "Actor", seat_position: 0, dead: false },
        { id: "target", name: "Target", seat_position: 1, dead: false },
        { id: "ghost", name: "Ghost", seat_position: 2, dead: true },
      ]} />);
    expect(screen.getByRole("button", { name: resurrection ? "Target" : "Ghost" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: resurrection ? "Ghost" : "Target" }));
    fireEvent.click(screen.getByRole("button", { name: t(resurrection ? "resurrectPlayer" : kind === "v23-web" ? "changeWeb" : "assassinationConfirm", "en") }));
    expect(onConfirm).toHaveBeenCalledExactlyOnceWith(resurrection ? "ghost" : "target");
    expect(screen.queryByText(getTranslation("en").ui.phoneActions.poison)).toBeNull();
  });

  it("keeps a completed mirrored assassination visible until the GM closes it", () => {
    render(<GMPlayerActionModal mode={{
      id: "day-action", actorPlayerId: "actor", kind: "v10-assassinate", completedTargetPlayerId: "target",
    }} language="en" onClose={vi.fn()} onConfirm={vi.fn()} players={[
      { id: "actor", name: "Actor", seat_position: 0, dead: false },
      { id: "target", name: "Target", seat_position: 1, dead: false },
    ]} />);

    expect(screen.getByRole("dialog")).toHaveTextContent("Actor chose to assassinate Target.");
    expect(screen.queryByRole("button", { name: "Target" })).not.toBeInTheDocument();
    expect(document.querySelector(".lucide-target")).toBeInTheDocument();
  });
});
