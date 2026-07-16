import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import {
  SKIN_PACK_STORAGE_KEY,
  getDefaultSkinPackForPath,
  isSkinPackId,
  type SkinPackId,
} from "@/lib/skinPacks";
import { SkinPackContext, type SkinPackContextValue } from "@/lib/skinPackContext";

function readStoredSkinPack(): SkinPackId | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(SKIN_PACK_STORAGE_KEY);
  return isSkinPackId(stored) ? stored : null;
}

export function SkinPackProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [storedSkinPackId, setStoredSkinPackId] = useState<SkinPackId | null>(() => readStoredSkinPack());
  const defaultSkinPackId = getDefaultSkinPackForPath(location.pathname);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === SKIN_PACK_STORAGE_KEY) setStoredSkinPackId(readStoredSkinPack());
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const value = useMemo<SkinPackContextValue>(() => ({
    skinPackId: storedSkinPackId ?? defaultSkinPackId,
    setSkinPackId: (skinPackId) => {
      window.localStorage.setItem(SKIN_PACK_STORAGE_KEY, skinPackId);
      setStoredSkinPackId(skinPackId);
    },
    isDeviceChoiceSaved: storedSkinPackId !== null,
  }), [defaultSkinPackId, storedSkinPackId]);

  return (
    <SkinPackContext.Provider value={value}>
      {children}
    </SkinPackContext.Provider>
  );
}
