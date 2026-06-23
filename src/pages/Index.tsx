import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Crown } from "lucide-react";
import villagerIcon from "@/assets/icons/villager.png";
import { SUPPORTED_LANGUAGES, t, type Language } from "@/lib/i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const generateRoomCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
};

const Index = () => {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<Language>(() => {
    const stored = localStorage.getItem("preferred_language");
    return (stored === "fr" || stored === "pt") ? stored : "pt";
  });

  const createRoom = async () => {
    setLoading(true);
    localStorage.setItem("preferred_language", language);
    const code = generateRoomCode();
    const { data, error } = await supabase
      .from("rooms")
      .insert({ code, language })
      .select()
      .single();

    if (data && !error) {
      localStorage.setItem(`gm_token_${data.id}`, data.gm_token);
      navigate(`/gm/${data.id}`);
    }
    setLoading(false);
  };

  const joinRoom = () => {
    if (joinCode.trim().length >= 4) {
      navigate(`/join/${joinCode.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md text-center space-y-10"
      >
        <div className="space-y-3">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <img src={villagerIcon} alt="" className="mx-auto h-12 w-12 opacity-60" />
          </motion.div>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-wide text-gradient-blood">
            {t("appTitle", language)}
          </h1>
          <p className="text-muted-foreground/40 text-xs font-body">
            por AnJoMorto e L_PT_1463
          </p>
          <p className="text-muted-foreground text-lg">
            {t("appTagline", language)}
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          <div className="space-y-2 text-left">
            <label className="font-display text-xs tracking-widest uppercase text-muted-foreground">
              {t("language", language)}
            </label>
            <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
              <SelectTrigger className="h-12 bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LANGUAGES.map((l) => (
                  <SelectItem key={l.code} value={l.code}>
                    <span className="mr-2">{l.flag}</span>{l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={createRoom}
            disabled={loading}
            className="w-full h-14 text-lg font-display tracking-wider bg-primary hover:bg-blood-glow glow-blood transition-all duration-300"
          >
            <Crown className="mr-2 h-5 w-5" />
            {t("createRoom", language)}
          </Button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-muted-foreground text-sm font-display tracking-widest uppercase">{t("orJoin", language)}</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="flex gap-3">
            <Input
              placeholder={t("roomCode", language)}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && joinRoom()}
              maxLength={6}
              className="h-14 text-center text-xl font-display tracking-[0.3em] bg-secondary border-border placeholder:text-muted-foreground/50 placeholder:tracking-normal placeholder:text-base"
            />
            <Button
              onClick={joinRoom}
              disabled={joinCode.trim().length < 4}
              variant="secondary"
              className="h-14 px-6"
            >
              <Users className="h-5 w-5" />
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Index;
