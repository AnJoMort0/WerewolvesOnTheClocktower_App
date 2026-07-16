import { createContext, useContext } from "react";
import { SKIN_PACK_STORAGE_KEY, type SkinPackId } from "@/lib/skinPacks";

export interface SkinPackContextValue {
  skinPackId: SkinPackId;
  setSkinPackId: (skinPackId: SkinPackId) => void;
  isDeviceChoiceSaved: boolean;
}

export const SkinPackContext = createContext<SkinPackContextValue | null>(null);

export function useSkinPack(): SkinPackContextValue {
  const context = useContext(SkinPackContext);
  return context ?? {
    skinPackId: "default",
    setSkinPackId: (skinPackId) => {
      if (typeof window !== "undefined") window.localStorage.setItem(SKIN_PACK_STORAGE_KEY, skinPackId);
    },
    isDeviceChoiceSaved: false,
  };
}
