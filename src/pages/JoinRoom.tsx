import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import villagerIcon from "@/assets/icons/villager.png";
import { t, getToast, type Language } from "@/lib/i18n";

const JoinRoom = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
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
      // Try to rejoin (per-room storage key) regardless of status
      const codeKey = code.toUpperCase();
      const storedPlayerId = localStorage.getItem(`player_id_${codeKey}`) || (localStorage.getItem("player_room") === data.id ? localStorage.getItem("player_id") : null);
      if (storedPlayerId) {
        const { data: pCheck } = await supabase
          .from("players").select("id").eq("id", storedPlayerId).eq("room_id", data.id).maybeSingle();
        if (pCheck) { navigate(`/play/${storedPlayerId}`); return; }
      }
      if (data.status !== "lobby") {
        setError(t("gameAlreadyStarted", (roomLang === "fr" || roomLang === "pt") ? roomLang : "pt"));
        return;
      }
      setRoomId(data.id);
    };
    fetchRoom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, navigate]);

  const joinGame = async () => {
    if (!roomId || !name.trim()) return;
    setLoading(true);

    const { data: existing } = await supabase
      .from("players")
      .select("name")
      .eq("room_id", roomId);

    if (existing?.some((p) => p.name.toLowerCase() === name.trim().toLowerCase())) {
      toast.error(getToast("warnDuplicateName", lang));
      setLoading(false);
      return;
    }

    const { data, error: err } = await supabase
      .from("players")
      .insert({ room_id: roomId, name: name.trim() })
      .select()
      .single();

    if (data && !err) {
      const codeKey = (code || "").toUpperCase();
      localStorage.setItem(`player_token_${data.id}`, data.player_token);
      localStorage.setItem(`player_room`, roomId);
      localStorage.setItem(`player_id`, data.id);
      localStorage.setItem(`player_id_${codeKey}`, data.id);
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
