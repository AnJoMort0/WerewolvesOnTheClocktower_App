import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WinConfirmModal } from "@/components/game/WinConfirmModal";
import { LanguageContext } from "@/lib/i18n";

describe("WinConfirmModal", () => {
  it("lets the GM select any winner groups for a manual tie", () => {
    const onAccept = vi.fn();
    const onTieWinnerGroupToggle = vi.fn();
    render(
      <LanguageContext.Provider value="pt">
        <WinConfirmModal
          open
          kind="tie"
          onAccept={onAccept}
          onDecline={vi.fn()}
          tieWinnerGroups={new Set()}
          onTieWinnerGroupToggle={onTieWinnerGroupToggle}
        />
      </LanguageContext.Provider>,
    );

    expect(screen.getAllByRole("checkbox")).toHaveLength(5);
    fireEvent.click(screen.getByText("Vitória da Aldeia"));
    expect(onTieWinnerGroupToggle).toHaveBeenCalledWith("village");

    fireEvent.click(screen.getByRole("button", { name: "Sim, terminar" }));
    expect(onAccept).toHaveBeenCalledOnce();
  });
});
