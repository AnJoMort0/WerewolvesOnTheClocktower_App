import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import CharacterGeneratorPage from "./pages/CharacterGenerator";
import GMRoom from "./pages/GMRoom";
import JoinRoom from "./pages/JoinRoom";
import PlayerView from "./pages/PlayerView";
import RulebookPage from "./pages/RulebookPage";
import RoomDisplay from "./pages/RoomDisplay";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Sonner />
    <BrowserRouter>
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
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
