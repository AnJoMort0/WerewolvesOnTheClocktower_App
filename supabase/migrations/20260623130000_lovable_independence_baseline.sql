-- Ownership baseline for GitHub/Supabase deployments.
-- This migration is intentionally additive so it can be applied to an existing
-- personal project without deleting room or player data.

ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS is_ready BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS rooms_code_idx ON public.rooms (code);
CREATE INDEX IF NOT EXISTS rooms_last_activity_idx ON public.rooms (last_activity_at);
CREATE INDEX IF NOT EXISTS players_room_id_idx ON public.players (room_id);
CREATE INDEX IF NOT EXISTS players_room_id_name_idx ON public.players (room_id, lower(name));

CREATE OR REPLACE FUNCTION public.touch_room_activity()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_TABLE_NAME = 'rooms' THEN
    NEW.last_activity_at = now();
    IF NEW.status = 'finished' AND OLD.status IS DISTINCT FROM NEW.status THEN
      NEW.completed_at = now();
    END IF;
    RETURN NEW;
  END IF;

  UPDATE public.rooms
  SET last_activity_at = now()
  WHERE id = COALESCE(NEW.room_id, OLD.room_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS touch_rooms_activity ON public.rooms;
CREATE TRIGGER touch_rooms_activity
BEFORE UPDATE ON public.rooms
FOR EACH ROW
EXECUTE FUNCTION public.touch_room_activity();

DROP TRIGGER IF EXISTS touch_players_room_activity ON public.players;
CREATE TRIGGER touch_players_room_activity
AFTER INSERT OR UPDATE OR DELETE ON public.players
FOR EACH ROW
EXECUTE FUNCTION public.touch_room_activity();

CREATE OR REPLACE FUNCTION public.cleanup_old_rooms(retention INTERVAL DEFAULT INTERVAL '24 hours')
RETURNS integer
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.rooms
  WHERE last_activity_at < now() - retention
    AND status IN ('lobby', 'finished');

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION public.cleanup_old_rooms(INTERVAL)
  IS 'Manual/free-tier cleanup helper. Call from Supabase SQL editor or a future room-open/create RPC; no paid cron required.';
