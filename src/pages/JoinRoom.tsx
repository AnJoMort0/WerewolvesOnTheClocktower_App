import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import villagerIcon from "@/assets/icons/villager.png";
import { t, getToast, type Language } from "@/lib/i18n";
import { getPlayerSession, savePlayerSession } from "@/lib/playerSession";

const JoinRoom = () => {
  const { code: pathCode } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();
  const code = pathCode ?? searchParams.get("room") ?? "";
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomStatus, setRoomStatus] = useState<string>("lobby");
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<Language>("pt");

  useEffect(() => {
    if (!code) return;
    const fetchRoom = async () => {
      const { data } = await supabase
        .from("rooms")
        .select("id, status, language")
        .eq("code", code.toUpperCase())
        .single();

      if (!data) {
        setError(t("roomNotFound", lang));
        return;
      }
      const roomLang = (data as { language?: string }).language;
      if (roomLang === "fr" || roomLang === "pt") setLang(roomLang);
      // Try the bounded current-player session first, regardless of room status.
      const codeKey = code.toUpperCase();
      const storedSession = getPlayerSession({ roomId: data.id, roomCode: codeKey });
      if (storedSession?.playerId) {
        const { data: pCheck } = await supabase
          .from("players").select("id").eq("id", storedSession.playerId).eq("room_id", data.id).maybeSingle();
        if (pCheck) { navigate(`/play/${storedSession.playerId}`); return; }
      }
      setRoomId(data.id);
      setRoomStatus(data.status);
    };
    fetchRoom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, navigate]);

  const joinGame = async () => {
    if (!roomId || !name.trim()) return;
    setLoading(true);

    const { data: existing } = await supabase
      .from("players")
      .select("id, name, player_token")
      .eq("room_id", roomId);

    const existingPlayer = existing?.find((player) => player.name.toLowerCase() === name.trim().toLowerCase());
    if (existingPlayer) {
      savePlayerSession({
        playerId: existingPlayer.id,
        playerToken: existingPlayer.player_token,
        roomId,
        roomCode: code,
      });
      navigate(`/play/${existingPlayer.id}`);
      setLoading(false);
      return;
    }

    if (roomStatus !== "lobby") {
      toast.error(t("gameAlreadyStarted", lang));
      setLoading(false);
      return;
    }

    const { data, error: err } = await supabase
      .from("players")
      .insert({ room_id: roomId, name: name.trim() })
      .select()
      .single();

    if (data && !err) {
      savePlayerSession({ playerId: data.id, playerToken: data.player_token, roomId, roomCode: code });
      navigate(`/play/${data.id}`);
    } else {
      toast.error(getToast("genericError", lang));
    }
    setLoading(false);
  };

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center space-y-4"
        >
          <img src={villagerIcon} alt="" className="mx-auto h-10 w-10 opacity-40" />
          <p className="font-display text-xl text-primary">{error}</p>
          <Button variant="secondary" onClick={() => navigate("/")}>
            {t("backHome", lang)}
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm space-y-8 text-center"
      >
        <div className="space-y-2">
          <img src={villagerIcon} alt="" className="mx-auto h-10 w-10 opacity-60" />
          <h1 className="font-display text-2xl font-bold text-gradient-blood">
            {t("appTitle", lang)}
          </h1>
          <p className="text-muted-foreground/40 text-xs font-body">
            {t("byline", lang)}
          </p>
          <p className="text-muted-foreground">
            {t("roomLabel", lang)} <span className="font-display tracking-widest">{code?.toUpperCase()}</span>
          </p>
        </div>

        <div className="space-y-4">
          <Input
            placeholder={t("yourName", lang)}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && joinGame()}
            maxLength={20}
            className="h-14 text-center text-xl bg-secondary border-border placeholder:text-muted-foreground/50"
          />
          <Button
            onClick={joinGame}
            disabled={!name.trim() || loading}
            className="w-full h-14 text-lg font-display tracking-wider bg-primary hover:bg-blood-glow glow-blood"
          >
            {t("enter", lang)}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default JoinRoom;
