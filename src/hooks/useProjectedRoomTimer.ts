import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { playTimerAlarm, shouldPlayProjectedTimerAlarm } from "@/lib/timerAlarm";
import { projectServerNow, projectTimerState, sampleTimerClock, type TimerClockSample, type TimerPhaseState, type TimerProjection, type TimerState } from "@/lib/timerState";

/** The interval only redraws a deadline. Clock requests occur on entry and wake. */
export function useProjectedRoomTimer(
  timer: TimerState | null,
  phase: TimerPhaseState | null,
  alarm = false,
): TimerProjection | null {
  const [clock, setClock] = useState<TimerClockSample | null>(null);
  const [now, setNow] = useState(() => performance.now());
  const previous = useRef<TimerProjection | null>(null);
  const recovering = useRef(true);
  const lastSync = useRef(-Infinity);

  useEffect(() => {
    let active = true;
    let pending = false;
    const synchronize = async () => {
      if (pending || document.visibilityState === "hidden" || performance.now() - lastSync.current < 2000) return;
      pending = true;
      lastSync.current = performance.now();
      recovering.current = true;
      const started = performance.now();
      try {
        const { data, error } = await supabase.rpc("get_server_time");
        const received = performance.now();
        if (active && !error && typeof data === "number") {
          setClock(sampleTimerClock(data, started, received));
        }
        if (active) setNow(received);
      } catch {
        // Keep the local display alive; the next wake may restore server calibration.
      } finally {
        pending = false;
      }
    };
    const wake = () => { if (document.visibilityState !== "hidden") void synchronize(); };
    const hidden = () => { if (document.visibilityState === "hidden") recovering.current = true; };
    void synchronize();
    window.addEventListener("focus", wake);
    window.addEventListener("online", wake);
    document.addEventListener("visibilitychange", wake);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      active = false;
      window.removeEventListener("focus", wake);
      window.removeEventListener("online", wake);
      document.removeEventListener("visibilitychange", wake);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(performance.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const serverNow = clock ? projectServerNow(clock, now) : Date.now();
  const projection = phase ? projectTimerState(timer, phase, serverNow) : null;
  useEffect(() => {
    if (projection && alarm && shouldPlayProjectedTimerAlarm(
      previous.current, projection, recovering.current ? "recovery" : "live", document.visibilityState === "visible",
    )) playTimerAlarm();
    previous.current = projection;
    recovering.current = false;
  }, [projection, alarm]);
  return projection;
}
