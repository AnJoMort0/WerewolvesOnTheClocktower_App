import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { resolveKillerCard, RevealModal } from "@/components/game/RevealModal";
import { FortuneTellerRevealModal } from "@/components/game/FortuneTellerRevealModal";
import { RulebookModal } from "@/components/game/RulebookModal";
import { LanguageContext } from "@/lib/i18n";
import { ROLES, type RoleId } from "@/lib/roles";

describe("shared reveal dialogs", () => {
  it("shows the Illusionist when the Little Girl's selected victim was killed by an illusion", () => {
    expect(resolveKillerCard("e01", { killer: "e01" }, "killer", "en")).toMatchObject({ roleId: "a06", label: "Illusionist" });
    expect(resolveKillerCard("soldier", { soldier: "v09" }, "soldier", "en")).toMatchObject({ roleId: "a06", label: "Illusionist" });
  });

  it("opens the rulebook over a copied card without dismissing the GM-controlled reveal", () => {
    const onClose = vi.fn();
    function RevealWithRulebook() {
      const [role, setRole] = useState<RoleId | null>(null);
      return <>
        <RevealModal open language="en" title="Mime's reveal" dismissible={false} actionLabel="OK" onClose={onClose}
          cards={[{ image: ROLES.e01.image, label: "Werewolf", roleId: "e01", cornerRoleId: "a03" }]}
          onRoleClick={setRole} />
        <RulebookModal open={role !== null} roleId={role} language="en" onOpenChange={(open) => { if (!open) setRole(null); }} />
      </>;
    }
    render(<MemoryRouter><RevealWithRulebook /></MemoryRouter>);
    expect(screen.getByRole("img", { name: "Mime" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("img", { name: "Werewolf" }));
    expect(screen.getByRole("dialog", { name: "Werewolf" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.getByRole("dialog", { name: "Mime's reveal" })).toBeVisible();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "OK" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("preserves names, rulebook links, and disabled charge markers when a group becomes one card", () => {
    const onRoleClick = vi.fn();
    const first = { image: ROLES.e03.image, label: "Shaman", roleId: "e03" as const, name: "Sam", checkboxes: [true, false] };
    const { rerender } = render(<RevealModal open language="en" title="Revealed cards" onClose={vi.fn()}
      cards={[first, { image: ROLES.e02.image, label: "Witch", roleId: "e02", name: "Wendy" }]}
      onRoleClick={onRoleClick} />);
    expect(screen.getByText("Wendy")).toBeVisible();
    const charges = screen.getAllByRole("checkbox");
    expect(charges[0]).toBeChecked();
    expect(charges[1]).not.toBeChecked();
    charges.forEach((charge) => expect(charge).toBeDisabled());
    rerender(<RevealModal open language="en" title="Revealed cards" onClose={vi.fn()}
      cards={[first]} onRoleClick={onRoleClick} />);
    expect(screen.queryByText("Wendy")).not.toBeInTheDocument();
    expect(screen.getByText("Sam")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Shaman" }));
    expect(onRoleClick).toHaveBeenCalledExactlyOnceWith("e03");
  });

  it("keeps Fortune Teller poison and illusion information in the shared gallery", () => {
    const onRoleClick = vi.fn();
    const props = { open: true, onClose: vi.fn(), deadPlayerIds: ["wolf", "seer"], illusionPlayerId: "wolf",
      roleAssignments: { wolf: "e01" as const, seer: "e04" as const },
      players: [{ id: "wolf", name: "Wolf player" }, { id: "seer", name: "Seer player" }], onRoleClick };
    const { rerender } = render(<LanguageContext.Provider value="en"><FortuneTellerRevealModal {...props}
      isFortuneTellerPoisoned precomputedFakeMap={{ wolf: "v04", seer: "v26" }} /></LanguageContext.Provider>);
    expect(screen.getByRole("img", { name: "Fox Tamer" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Monkey Tamer" }));
    expect(onRoleClick).toHaveBeenCalledExactlyOnceWith("v26");
    rerender(<LanguageContext.Provider value="en"><FortuneTellerRevealModal {...props} /></LanguageContext.Provider>);
    expect(screen.getByRole("img", { name: "Illusionist" })).toBeVisible();
    expect(screen.getByRole("img", { name: "Fortune Teller" })).toBeVisible();
    expect(screen.getByText("Wolf player")).toBeVisible();
  });
});
