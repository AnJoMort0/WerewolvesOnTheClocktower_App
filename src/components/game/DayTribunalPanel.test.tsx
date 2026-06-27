import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DayTribunalPanel } from "@/components/game/DayTribunalPanel";
import { LanguageContext } from "@/lib/i18n";

const commonProps = {
  nightNumber: 2,
  alivePlayers: 8,
  onStartNight: vi.fn(),
  onStartTribunal: vi.fn(),
  onPhaseChange: vi.fn(),
  dayDefaultSeconds: 300,
  tribunalDefaultSeconds: 180,
};

describe("DayTribunalPanel timer synchronization", () => {
  it("never publishes the old day duration as the tribunal timer", async () => {
    const onTimerSync = vi.fn();
    const initialDayTimer = { phase: "day" as const, timeLeft: 300, isRunning: false, timerDone: false };
    const { rerender } = render(
      <LanguageContext.Provider value="pt">
        <DayTribunalPanel {...commonProps} gamePhase="day" initialTimerState={initialDayTimer} onTimerSync={onTimerSync} />
      </LanguageContext.Provider>,
    );

    await waitFor(() => expect(onTimerSync).toHaveBeenCalledWith(initialDayTimer));
    onTimerSync.mockClear();

    rerender(
      <LanguageContext.Provider value="pt">
        <DayTribunalPanel {...commonProps} gamePhase="tribunal" initialTimerState={initialDayTimer} onTimerSync={onTimerSync} />
      </LanguageContext.Provider>,
    );

    await waitFor(() => expect(onTimerSync).toHaveBeenCalledWith({
      phase: "tribunal",
      timeLeft: 180,
      isRunning: false,
      timerDone: false,
    }));
    expect(onTimerSync).not.toHaveBeenCalledWith(expect.objectContaining({ phase: "tribunal", timeLeft: 300 }));
  });

  it("uses durable state only for initial hydration, not as a feedback controller", async () => {
    const onTimerSync = vi.fn();
    const initialTribunalTimer = { phase: "tribunal" as const, timeLeft: 180, isRunning: false, timerDone: false };
    const { rerender } = render(
      <LanguageContext.Provider value="pt">
        <DayTribunalPanel {...commonProps} gamePhase="tribunal" initialTimerState={initialTribunalTimer} onTimerSync={onTimerSync} />
      </LanguageContext.Provider>,
    );

    await waitFor(() => expect(onTimerSync).toHaveBeenCalledWith(initialTribunalTimer));
    onTimerSync.mockClear();

    rerender(
      <LanguageContext.Provider value="pt">
        <DayTribunalPanel
          {...commonProps}
          gamePhase="tribunal"
          initialTimerState={{ ...initialTribunalTimer, timeLeft: 300 }}
          onTimerSync={onTimerSync}
        />
      </LanguageContext.Provider>,
    );

    expect(onTimerSync).not.toHaveBeenCalledWith(expect.objectContaining({ timeLeft: 300 }));
  });
});
