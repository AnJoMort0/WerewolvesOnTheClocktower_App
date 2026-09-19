import { createContext, useContext } from "react";

/** GM dialogs may be shown to players: their backdrop must conceal the entire room. */
export const OpaqueModalBackdropContext = createContext(false);

export function useModalBackdrop() {
  const opaque = useContext(OpaqueModalBackdropContext);
  return { opaque, className: opaque ? "bg-background" : "bg-background/90 backdrop-blur-sm" };
}
