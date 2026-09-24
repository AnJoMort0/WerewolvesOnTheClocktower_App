import { lazy, Suspense } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import { SkinPackChrome } from "@/components/game/SkinPackSelector";
import { SkinPackProvider } from "@/components/game/SkinPackProvider";

const CharacterGeneratorPage = lazy(() => import("./pages/CharacterGenerator"));
const GMRoom = lazy(() => import("./pages/GMRoom"));
const JoinRoom = lazy(() => import("./pages/JoinRoom"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PlayerView = lazy(() => import("./pages/PlayerView"));
const RoomDisplay = lazy(() => import("./pages/RoomDisplay"));
const RulebookPage = lazy(() => import("./pages/RulebookPage"));

const App = () => (
  <>
    <Sonner />
    <BrowserRouter>
      <SkinPackProvider>
        <SkinPackChrome />
        <Suspense fallback={<main className="flex min-h-screen items-center justify-center font-display text-muted-foreground">Loading…</main>}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/characters" element={<CharacterGeneratorPage />} />
            <Route path="/host" element={<Index />} />
            <Route path="/host/:roomId" element={<GMRoom />} />
            <Route path="/gm/:roomId" element={<GMRoom />} />
            <Route path="/join" element={<JoinRoom />} />
            <Route path="/join/:code" element={<JoinRoom />} />
            <Route path="/play/:playerId" element={<PlayerView />} />
            <Route path="/display/:roomId" element={<RoomDisplay />} />
            <Route path="/rulebook" element={<RulebookPage />} />
            <Route path="/rulebook/:roleId" element={<RulebookPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </SkinPackProvider>
    </BrowserRouter>
  </>
);

export default App;
