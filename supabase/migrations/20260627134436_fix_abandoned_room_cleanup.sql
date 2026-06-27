-- Remove abandoned rooms even when users close the game without
-- pressing the Finish button.

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