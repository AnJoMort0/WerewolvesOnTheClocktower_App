import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GameModal } from "@/components/game/GameModal";
import { GameModalMinimizeContext } from "@/lib/gameModalMinimize";
import { LanguageContext } from "@/lib/i18n";

describe("GM action modal", () => {
  it("minimizes without closing the action and can render the same content again", () => {
    const onClose = vi.fn(), onMinimize = vi.fn();
    const renderModal = (minimized: boolean) => <LanguageContext.Provider value="en">
      <GameModalMinimizeContext.Provider value={{ minimized, onMinimize }}>
        <GameModal open title="Private action" closeLabel="Close" onClose={onClose}>
          <p>Unfinished choice</p>
        </GameModal>
      </GameModalMinimizeContext.Provider>
    </LanguageContext.Provider>;
    const { rerender, queryByText, getByRole } = render(renderModal(false));
    fireEvent.click(getByRole("button", { name: "Minimize" }));
    expect(onMinimize).toHaveBeenCalledOnce();
    expect(onClose).not.toHaveBeenCalled();
    rerender(renderModal(true));
    expect(queryByText("Unfinished choice")).toBeNull();
    rerender(renderModal(false));
    expect(queryByText("Unfinished choice")).toBeInTheDocument();
  });
});
