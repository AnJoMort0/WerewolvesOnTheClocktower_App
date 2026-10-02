-- Clean baseline migration for a fresh Supabase project.
-- Consolidated from the project's historical migrations through 2026-09-29.
-- Intended for NEW projects only. Do not push this baseline to the existing
-- production project until its migration history has been deliberately reconciled.

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'lobby'
    CHECK (status IN ('lobby', 'assigning', 'playing', 'finished')),
  gm_token TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  language TEXT NOT NULL DEFAULT 'pt',
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  phase_state JSONB,
  timer_state JSONB,
  game_over_state JSONB,
  timer_defaults JSONB NOT NULL DEFAULT '{"day":300,"tribunal":180}'::jsonb,
  player_action_state JSONB
);

CREATE TABLE public.players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  seat_position INTEGER,
  character TEXT,
  is_alive BOOLEAN NOT NULL DEFAULT true,
  player_token TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_ready BOOLEAN NOT NULL DEFAULT false,
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_traveller BOOLEAN NOT NULL DEFAULT false,
  traveller_state TEXT,
  traveller_role TEXT,
  traveller_alignment TEXT,

  CONSTRAINT players_traveller_state_check
    CHECK (
      traveller_state IS NULL
      OR traveller_state IN (
        'requested',
        'assigning',
        'revealing',
        'ready',
        'placed',
        'denied',
        'exiled'
      )
    ),

  CONSTRAINT players_traveller_role_check
    CHECK (traveller_role IS NULL OR traveller_role IN ('t01', 't02', 't03')),

  CONSTRAINT players_traveller_alignment_check
    CHECK (traveller_alignment IS NULL OR traveller_alignment IN ('villager', 'evil')),

  CONSTRAINT players_traveller_fields_check
    CHECK (
      (is_traveller AND traveller_state IS NOT NULL)
      OR
      (
        NOT is_traveller
        AND traveller_state IS NULL
        AND traveller_role IS NULL
        AND traveller_alignment IS NULL
      )
    )
);

-- -----------------------------------------------------------------------------
-- Indexes
-- rooms.code is UNIQUE above, which already creates the required unique index.
-- -----------------------------------------------------------------------------

CREATE INDEX rooms_last_activity_idx
  ON public.rooms (last_activity_at);

CREATE INDEX players_room_id_idx
  ON public.players (room_id);

CREATE INDEX players_room_id_name_idx
  ON public.players (room_id, lower(name));

CREATE INDEX players_room_traveller_state_idx
  ON public.players (room_id, traveller_state)
  WHERE is_traveller;

-- -----------------------------------------------------------------------------
-- Row Level Security and policies
-- These reproduce the current application's permissive access model.
-- -----------------------------------------------------------------------------

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read rooms"
  ON public.rooms
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create rooms"
  ON public.rooms
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "GM can update rooms"
  ON public.rooms
  FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can read players"
  ON public.players
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can join"
  ON public.players
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update players"
  ON public.players
  FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete players"
  ON public.players
  FOR DELETE
  USING (true);

-- -----------------------------------------------------------------------------
-- Activity tracking
-- -----------------------------------------------------------------------------

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

CREATE TRIGGER touch_rooms_activity
BEFORE UPDATE ON public.rooms
FOR EACH ROW
EXECUTE FUNCTION public.touch_room_activity();

CREATE TRIGGER touch_players_room_activity
AFTER INSERT OR UPDATE OR DELETE ON public.players
FOR EACH ROW
EXECUTE FUNCTION public.touch_room_activity();

-- -----------------------------------------------------------------------------
-- Historical-room cleanup helper
-- This defines the final historical behavior: stale rooms are eligible regardless
-- of status, with a default retention period of five days. Deleting a room also
-- deletes its players through the ON DELETE CASCADE foreign key.
--
-- This function is NOT scheduled by this migration. A cron job can be added later
-- after Project B has been verified.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.cleanup_old_rooms(
  retention INTERVAL DEFAULT INTERVAL '5 days'
)
RETURNS integer
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.rooms
  WHERE last_activity_at < now() - retention;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION public.cleanup_old_rooms(INTERVAL)
  IS 'Deletes rooms with no activity during the retention period, regardless of game status. Associated players are removed through ON DELETE CASCADE.';

-- -----------------------------------------------------------------------------
-- Explicit API grants
-- RLS policies above still determine which rows anon/authenticated clients can use.
-- -----------------------------------------------------------------------------

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE
  ON TABLE public.rooms
  TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE public.players
  TO anon, authenticated;

-- Preserved from the historical migrations for application compatibility.
-- Because the function is SECURITY INVOKER and rooms has no DELETE RLS policy,
-- anonymous callers cannot actually delete rooms through it; privileged/manual
-- invocation can do so. This can be redesigned separately without changing the
-- fresh-project baseline.
GRANT EXECUTE
  ON FUNCTION public.cleanup_old_rooms(INTERVAL)
  TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- Realtime
-- -----------------------------------------------------------------------------

ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
