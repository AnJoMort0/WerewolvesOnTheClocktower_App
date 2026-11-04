-- Local-only contract test. All room changes are rolled back at the end.
BEGIN;
SET LOCAL ROLE anon;

DO $$
DECLARE
  room_id uuid;
  result jsonb;
  before_row tid;
  after_row tid;
  clock_ms bigint;
BEGIN
  INSERT INTO public.rooms (code) VALUES ('TIMERLOCAL') RETURNING id INTO room_id;

  clock_ms := public.get_server_time();
  IF abs(clock_ms - floor(extract(epoch FROM clock_timestamp()) * 1000)::bigint) > 5000 THEN
    RAISE EXCEPTION 'server clock RPC returned an unexpected value';
  END IF;

  result := public.transition_room_timer(room_id, 'set_phase', 0, 'day-1', 'day', 1, false);
  IF (result->>'changed')::boolean IS DISTINCT FROM true
    OR result->'phaseState'->>'phase' IS DISTINCT FROM 'day'
    OR result->'timerState'->>'phase' IS DISTINCT FROM 'day'
    OR (result->'timerState'->>'revision')::integer IS DISTINCT FROM 1
    OR (result->'timerState'->>'remainingMs')::integer IS DISTINCT FROM 300000 THEN
    RAISE EXCEPTION 'day phase/timer was not initialized together: %', result;
  END IF;

  SELECT ctid INTO before_row FROM public.rooms WHERE id = room_id;
  result := public.transition_room_timer(room_id, 'set_phase', 0, 'day-1', 'day', 1, false);
  SELECT ctid INTO after_row FROM public.rooms WHERE id = room_id;
  IF (result->>'changed')::boolean IS DISTINCT FROM false OR before_row IS DISTINCT FROM after_row THEN
    RAISE EXCEPTION 'duplicate command wrote the room';
  END IF;

  BEGIN
    PERFORM public.transition_room_timer(room_id, 'set_phase', 0, 'stale', 'tribunal', 1, false);
    RAISE EXCEPTION 'stale command was accepted';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM <> 'TIMER_STALE_REVISION' THEN RAISE; END IF;
  END;

  result := public.transition_room_timer(room_id, 'set_phase', 1, 'mode', 'day', 1, true);
  IF (result->'timerState'->>'revision')::integer IS DISTINCT FROM 2
    OR result->'timerState'->>'status' IS DISTINCT FROM 'paused'
    OR (result->'phaseState'->>'beginnerMode')::boolean IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'mode-only phase update changed the timer: %', result;
  END IF;

  result := public.transition_room_timer(room_id, 'start', 2, 'start', 'day', 1);
  IF result->'timerState'->>'status' IS DISTINCT FROM 'running'
    OR (result->'timerState'->>'revision')::integer IS DISTINCT FROM 3
    OR (result->'timerState'->>'deadlineAt')::timestamptz <= clock_timestamp() THEN
    RAISE EXCEPTION 'start did not create a future server deadline: %', result;
  END IF;

  result := public.transition_room_timer(room_id, 'pause', 3, 'pause', 'day', 1);
  IF result->'timerState'->>'status' IS DISTINCT FROM 'paused'
    OR (result->'timerState'->>'remainingMs')::integer NOT BETWEEN 1 AND 300000 THEN
    RAISE EXCEPTION 'pause did not preserve remaining time: %', result;
  END IF;

  result := public.transition_room_timer(room_id, 'set_duration', 4, 'duration', 'day', 1, NULL, 90);
  IF (result->'timerState'->>'revision')::integer IS DISTINCT FROM 5
    OR (result->'timerState'->>'remainingMs')::integer IS DISTINCT FROM 90000
    OR (result->'timerDefaults'->>'day')::integer IS DISTINCT FROM 90 THEN
    RAISE EXCEPTION 'duration/default were not updated together: %', result;
  END IF;

  SELECT ctid INTO before_row FROM public.rooms WHERE id = room_id;
  result := public.transition_room_timer(room_id, 'reset', 5, 'same-reset', 'day', 1);
  SELECT ctid INTO after_row FROM public.rooms WHERE id = room_id;
  IF (result->>'changed')::boolean IS DISTINCT FROM false OR before_row IS DISTINCT FROM after_row THEN
    RAISE EXCEPTION 'unchanged reset wrote the room';
  END IF;

  PERFORM public.transition_room_timer(room_id, 'start', 5, 'resume', 'day', 1);
  UPDATE public.rooms
    SET timer_state = jsonb_set(timer_state, '{deadlineAt}', to_jsonb(clock_timestamp() - interval '1 second'))
    WHERE id = room_id;
  result := public.transition_room_timer(room_id, 'complete', 6, 'complete', 'day', 1);
  IF result->'timerState'->>'status' IS DISTINCT FROM 'done'
    OR (result->'timerState'->>'remainingMs')::integer IS DISTINCT FROM 0 THEN
    RAISE EXCEPTION 'expired timer was not completed: %', result;
  END IF;

  result := public.transition_room_timer(room_id, 'set_phase', 7, 'tribunal', 'tribunal', 1, true);
  IF result->'phaseState'->>'phase' IS DISTINCT FROM 'tribunal'
    OR result->'timerState'->>'phase' IS DISTINCT FROM 'tribunal'
    OR (result->'timerState'->>'remainingMs')::integer IS DISTINCT FROM 180000 THEN
    RAISE EXCEPTION 'tribunal transition retained the day timer: %', result;
  END IF;

  result := public.transition_room_timer(room_id, 'set_phase', 8, 'night', 'night', 2, true);
  IF result->'phaseState'->>'phase' IS DISTINCT FROM 'night'
    OR result->'timerState'->>'status' IS DISTINCT FROM 'inactive' THEN
    RAISE EXCEPTION 'night transition retained an active timer: %', result;
  END IF;

  RAISE NOTICE 'Local timer RPC contract passed';
END;
$$;

ROLLBACK;
