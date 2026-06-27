export type TimerAlarmState = {
  phase: "day" | "tribunal";
  timerDone: boolean;
};

type AudioContextWindow = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext;
};

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (audioContext?.state === "closed") audioContext = null;
  if (audioContext) return audioContext;
  const AudioContextConstructor = window.AudioContext
    || (window as AudioContextWindow).webkitAudioContext;
  if (!AudioContextConstructor) return null;
  audioContext = new AudioContextConstructor();
  return audioContext;
}

export function unlockTimerAlarm() {
  try {
    const context = getAudioContext();
    if (context?.state === "suspended") void context.resume().catch(() => undefined);
  } catch {
    // Audio is optional and may be blocked by browser policy.
  }
}

export function playTimerAlarm() {
  try {
    const context = getAudioContext();
    if (!context) return;
    const schedule = () => {
      for (let index = 0; index < 3; index += 1) {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.frequency.value = 880;
        oscillator.type = "square";
        gain.gain.value = 0.3;
        oscillator.start(context.currentTime + index * 0.3);
        oscillator.stop(context.currentTime + index * 0.3 + 0.15);
      }
    };
    if (context.state === "suspended") void context.resume().then(schedule).catch(() => undefined);
    else schedule();
  } catch {
    // Keep the timer functional when audio is unavailable.
  }
}

export function shouldPlayTimerAlarm(previous: TimerAlarmState | null, current: TimerAlarmState): boolean {
  return previous?.phase === current.phase && !previous.timerDone && current.timerDone;
}
