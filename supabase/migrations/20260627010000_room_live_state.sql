-- Durable live-room snapshots complement realtime broadcasts. Broadcasts remain
-- the low-latency path; these columns let late or reconnected clients catch up.
ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS phase_state JSONB,
  ADD COLUMN IF NOT EXISTS timer_state JSONB,
  ADD COLUMN IF NOT EXISTS game_over_state JSONB;
