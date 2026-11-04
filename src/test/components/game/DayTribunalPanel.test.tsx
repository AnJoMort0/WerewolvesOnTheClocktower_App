import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DayTribunalPanel } from "@/components/game/DayTribunalPanel";
import { LanguageContext } from "@/lib/i18n";
import type { TimerProjection } from "@/lib/timerState";

const timer: TimerProjection = {
  phase: "day", phaseNumber: 2, revision: 3, timeLeft: 90, remainingMs: 90000,
  isRunning: true, timerDone: false,
};
const commonProps = {
  nightNumber: 2,
  alivePlayers: 8,
  onStartNight: vi.fn(),
  onStartTribunal: vi.fn(),
  onPhaseChange: vi.fn(),
  onTimerAction: vi.fn(),
  dayDefaultSeconds: 300,
  tribunalDefaultSeconds: 180,
};

describe("DayTribunalPanel timer controls", () => {
  it("keeps the Traveller exile threshold", () => {
    const { getByText } = render(<LanguageContext.Provider value="en">
      <DayTribunalPanel {...commonProps} gamePhase="tribunal" timer={null} travellerCount={1} totalPlayers={9} />
    </LanguageContext.Provider>);
    expect(getByText(/5 votes are needed to exile a Traveller/)).toBeInTheDocument();
  });

  it("renders projected ticks without publishing transitions", () => {
    const onTimerAction = vi.fn();
    const { getByText, rerender } = render(<LanguageContext.Provider value="en">
      <DayTribunalPanel {...commonProps} gamePhase="day" timer={timer} onTimerAction={onTimerAction} />
    </LanguageContext.Provider>);
    expect(getByText("01:30")).toBeInTheDocument();
    rerender(<LanguageContext.Provider value="en">
      <DayTribunalPanel {...commonProps} gamePhase="day" timer={{ ...timer, timeLeft: 89 }} onTimerAction={onTimerAction} />
    </LanguageContext.Provider>);
    expect(getByText("01:29")).toBeInTheDocument();
    expect(onTimerAction).not.toHaveBeenCalled();
  });

  it("sends one pause request from the control", () => {
    const onTimerAction = vi.fn();
    const { getAllByRole } = render(<LanguageContext.Provider value="en">
      <DayTribunalPanel {...commonProps} gamePhase="day" timer={timer} onTimerAction={onTimerAction} />
    </LanguageContext.Provider>);
    fireEvent.click(getAllByRole("button")[0]);
    expect(onTimerAction).toHaveBeenCalledOnce();
    expect(onTimerAction).toHaveBeenCalledWith("pause");
  });
});
