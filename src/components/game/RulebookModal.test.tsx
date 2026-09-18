import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RulebookModal } from "@/components/game/RulebookModal";
import { SkinPackProvider } from "@/components/game/SkinPackProvider";

describe("RulebookModal", () => {
  beforeEach(() => vi.stubGlobal("ResizeObserver", class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }));
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  function renderWitch() {
    HTMLElement.prototype.scrollTo = vi.fn();
    const onOpenChange = vi.fn();
    render(<MemoryRouter><SkinPackProvider><RulebookModal open onOpenChange={onOpenChange} language="en" roleId="e02" /></SkinPackProvider></MemoryRouter>);
    return onOpenChange;
  }

  async function expandLore() {
    const details = await waitFor(() => {
      const element = document.querySelector<HTMLDetailsElement>('details[data-character-lore="e02"]');
      expect(element).toBeInTheDocument();
      return element!;
    });
    details.open = true;
    fireEvent(details, new Event("toggle"));
    return details;
  }

  it("updates generated rulebook skin previews inside the modal", async () => {
    HTMLElement.prototype.scrollTo = vi.fn();

    render(
      <MemoryRouter initialEntries={["/play/test-room"]}>
        <SkinPackProvider>
          <RulebookModal open onOpenChange={vi.fn()} language="pt" />
        </SkinPackProvider>
      </MemoryRouter>,
    );

    const select = await waitFor(() => {
      const element = document.querySelector<HTMLSelectElement>('select[data-rulebook-skin-select="a02"]');
      expect(element).toBeInTheDocument();
      return element!;
    });
    const thiercelieuxOption = Array.from(select.options).find((option) => option.value === "thiercelieux");
    expect(thiercelieuxOption?.dataset.previewImage).toBeTruthy();

    fireEvent.change(select, { target: { value: "thiercelieux" } });

    await waitFor(() => {
      const image = document.querySelector<HTMLImageElement>('img[data-rulebook-role-image="a02"]');
      expect(image?.getAttribute("src")).toBe(thiercelieuxOption?.dataset.previewImage);
    });
  });

  it("opens lore notes on phone taps and dismisses them without closing the rulebook", async () => {
    const onOpenChange = renderWitch();
    const details = await expandLore();
    const sentence = details.querySelector<HTMLButtonElement>("button[data-lore-explanation]")!;
    fireEvent.mouseOver(sentence);
    expect(screen.queryByRole("dialog", { name: "Behind the story" })).not.toBeInTheDocument();

    fireEvent.click(sentence);
    expect(await screen.findByRole("dialog", { name: "Behind the story" })).toHaveTextContent("poisoning the Little Girl made her die immediately");
    expect(sentence).toHaveAttribute("aria-expanded", "true");
    fireEvent.keyDown(document.activeElement!, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Behind the story" })).not.toBeInTheDocument());
    expect(onOpenChange).not.toHaveBeenCalled();

    fireEvent.click(sentence);
    expect(await screen.findByRole("dialog", { name: "Behind the story" })).toBeInTheDocument();
    fireEvent.click(sentence);
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Behind the story" })).not.toBeInTheDocument());
    expect(sentence).toHaveAttribute("aria-expanded", "false");
  });

  it("supports desktop hover and closes the bubble when the story collapses", async () => {
    const originalMatchMedia = window.matchMedia;
    vi.spyOn(window, "matchMedia").mockImplementation((query) => ({ ...originalMatchMedia(query), matches: true }));
    renderWitch();
    const details = await expandLore();
    const sentence = details.querySelector<HTMLButtonElement>("button[data-lore-explanation]")!;
    fireEvent.mouseOver(sentence);
    expect(await screen.findByRole("dialog", { name: "Behind the story" })).toBeInTheDocument();
    fireEvent.mouseOut(sentence, { relatedTarget: document.body });
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Behind the story" })).not.toBeInTheDocument());

    fireEvent.mouseOver(sentence);
    expect(await screen.findByRole("dialog", { name: "Behind the story" })).toBeInTheDocument();
    details.open = false;
    fireEvent(details, new Event("toggle"));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Behind the story" })).not.toBeInTheDocument());
  });

  it("keeps expanded stories open while switching card artwork", async () => {
    renderWitch();
    await expandLore();
    const select = document.querySelector<HTMLSelectElement>('select[data-rulebook-skin-select="e02"]')!;
    fireEvent.change(select, { target: { value: "thiercelieux" } });
    await waitFor(() => expect(document.querySelector<HTMLDetailsElement>('details[data-character-lore="e02"]')?.open).toBe(true));
  });
});
