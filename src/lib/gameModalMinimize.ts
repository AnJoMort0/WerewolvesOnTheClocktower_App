import { createContext } from "react";

/** Only GM action mirrors receive this context; minimizing never ends the phone session. */
export const GameModalMinimizeContext = createContext<{
  minimized: boolean;
  onMinimize: () => void;
} | null>(null);
