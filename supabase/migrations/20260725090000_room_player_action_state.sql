ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS player_action_state JSONB;
