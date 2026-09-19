import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SkinPackProvider } from "@/components/game/SkinPackProvider";
import RulebookPage from "@/pages/RulebookPage";

describe("standalone rulebook lore explanations", () => {
  beforeEach(() => {
    HTMLElement.prototype.scrollIntoView = vi.fn();
    vi.stubGlobal("ResizeObserver", class {
      observe() {}
      unobserve() {}
      disconnect() {}
    });
  });
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it("opens a public character anchor and lets readers change language without game navigation", async () => {
    render(<MemoryRouter initialEntries={["/?lang=en#v27"]}><SkinPackProvider><RulebookPage standalone /></SkinPackProvider></MemoryRouter>);
    expect(screen.queryByRole("link", { name: /back/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute("aria-pressed", "true");
    await waitFor(() => expect(vi.mocked(HTMLElement.prototype.scrollIntoView).mock.contexts).toContain(document.getElementById("v27")));
    fireEvent.click(screen.getByRole("button", { name: "Português" }));
    expect(document.querySelector("article")).toHaveAttribute("lang", "pt");
    expect(screen.getByRole("button", { name: "Português" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Français" }));
    expect(document.querySelector("article")).toHaveAttribute("lang", "fr");
    expect(document.getElementById("v27")).toBeInTheDocument();
  });

  it.each(["desktop", "phone"])("opens explanation bubbles on %s and closes them on dismissal or page scroll", async (device) => {
    const matchMedia = window.matchMedia;
    vi.spyOn(window, "matchMedia").mockImplementation((query) => ({ ...matchMedia(query), matches: device === "desktop" }));
    render(<MemoryRouter initialEntries={["/rulebook?lang=en"]}><SkinPackProvider><RulebookPage /></SkinPackProvider></MemoryRouter>);

    const details = document.querySelector<HTMLDetailsElement>('details[data-character-lore="e02"]')!;
    details.open = true;
    fireEvent(details, new Event("toggle"));
    const sentence = details.querySelector<HTMLButtonElement>("button[data-lore-explanation]")!;
    fireEvent.mouseOver(sentence);
    if (device === "phone") {
      expect(screen.queryByRole("dialog", { name: "Behind the story" })).not.toBeInTheDocument();
      fireEvent.click(sentence);
    }
    expect(await screen.findByRole("dialog", { name: "Behind the story" })).toHaveTextContent(sentence.dataset.loreExplanation!);
    expect(sentence).toHaveAttribute("aria-expanded", "true");
    fireEvent.keyDown(document.activeElement!, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Behind the story" })).not.toBeInTheDocument());

    fireEvent.click(sentence);
    expect(await screen.findByRole("dialog", { name: "Behind the story" })).toBeInTheDocument();
    fireEvent.scroll(window);
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Behind the story" })).not.toBeInTheDocument());
    expect(sentence).toHaveAttribute("aria-expanded", "false");
  });
});
