import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GMPhoneActionModal } from "@/components/game/GMPhoneActionModal";
import { GMPlayerActionModal } from "@/components/game/GMPlayerActionModal";
import { getTranslation, t } from "@/lib/i18n";
import type { PhoneSession, PhoneView } from "@/lib/phoneActions";

const session: PhoneSession = { id: "retaliation", mode: "colossus", sourcePlayerId: "actor", lineKey: "line", participantIds: ["actor"], votes: {}, sequences: {} };
const view: PhoneView = { ...session, players: [
  { id: "actor", name: "Actor", seat_position: 0, dead: false, redX: false, marker: null, selectable: false },
  { id: "target", name: "Target", seat_position: 1, dead: false, redX: false, marker: null, selectable: true },
] };

describe("usable GM action mirrors", () => {
  it("allows selection and requires a separate, explicit Colossus approval", () => {
    const onSend = vi.fn(), onResolveColossus = vi.fn(), onResolveHunt = vi.fn();
    const props = { language: "en" as const, onSend, onResolveColossus, onResolveHunt, onClose: vi.fn() };
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

  it.each(["poison", "shaman", "web", "hunt"] as const)("allows a GM to confirm a %s target", (mode) => {
    const onSend = vi.fn();
    render(<GMPhoneActionModal session={{ ...session, mode }} view={{ ...view, mode }} language="en"
      onClose={vi.fn()} onSend={onSend} onResolveHunt={vi.fn()} onResolveColossus={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Target" }));
    fireEvent.click(screen.getByRole("button", { name: mode === "shaman" ? getTranslation("en").ui.phoneActions.save : getTranslation("en").ui.phoneActions.confirm }));
    expect(onSend).toHaveBeenCalledWith("confirm", "target");
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
});
