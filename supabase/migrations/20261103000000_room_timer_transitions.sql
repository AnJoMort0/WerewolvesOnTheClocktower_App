-- One durable room change per timer/phase transition. No scheduled tick writes.
-- The functions use the caller's existing rooms permissions and RLS policies.

CREATE FUNCTION public.get_server_time()
RETURNS bigint
LANGUAGE sql
VOLATILE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT floor(extract(epoch FROM clock_timestamp()) * 1000)::bigint;
$$;

CREATE FUNCTION public.transition_room_timer(
  p_room_id uuid,
  p_action text,
  p_expected_revision bigint,
  p_mutation_id text,
  p_phase text DEFAULT NULL,
  p_phase_number integer DEFAULT NULL,
  p_beginner_mode boolean DEFAULT NULL,
  p_duration_seconds integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_room public.rooms%ROWTYPE;
  v_phase jsonb;
  v_timer jsonb;
  v_defaults jsonb;
  v_revision bigint;
  v_now_ms bigint;
  v_deadline_ms bigint;
  v_remaining_ms bigint;
  v_default_seconds integer;
  v_phase_changed boolean := false;
  v_timer_changed boolean := false;
  v_changed boolean;
BEGIN
  IF p_action IS NULL OR p_action NOT IN ('set_phase', 'start', 'pause', 'reset', 'set_duration', 'complete')
    OR p_mutation_id IS NULL OR length(p_mutation_id) NOT BETWEEN 1 AND 100
    OR p_expected_revision IS NULL OR p_expected_revision < 0 THEN
    RAISE EXCEPTION 'TIMER_INVALID_COMMAND';
  END IF;

  SELECT * INTO v_room FROM public.rooms WHERE id = p_room_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'TIMER_ROOM_NOT_FOUND'; END IF;

  v_phase := v_room.phase_state;
  v_timer := v_room.timer_state;
  v_defaults := coalesce(v_room.timer_defaults, '{}'::jsonb);
  IF v_timer IS NOT NULL AND (v_timer->>'version') IS DISTINCT FROM '2' THEN
    RAISE EXCEPTION 'TIMER_STATE_UNSUPPORTED';
  END IF;
  v_revision := coalesce((v_timer->>'revision')::bigint, 0);
  v_now_ms := floor(extract(epoch FROM clock_timestamp()) * 1000)::bigint;

  -- A lost response may cause the same request to arrive again. Never repeat its write.
  IF v_timer->>'lastMutationId' = p_mutation_id THEN
    RETURN jsonb_build_object('phaseState', v_phase, 'timerState', v_timer,
      'timerDefaults', v_defaults, 'serverNowMs', v_now_ms, 'changed', false);
  END IF;
  IF v_revision <> p_expected_revision THEN RAISE EXCEPTION 'TIMER_STALE_REVISION'; END IF;

  IF p_action = 'set_phase' THEN
    IF p_phase IS NULL OR p_phase NOT IN ('night', 'day', 'tribunal')
      OR p_phase_number IS NULL OR p_phase_number < 1 OR p_beginner_mode IS NULL THEN
      RAISE EXCEPTION 'TIMER_INVALID_PHASE';
    END IF;
    v_phase_changed := v_phase IS NULL OR (v_phase->>'phase') IS DISTINCT FROM p_phase
      OR (v_phase->>'number')::integer IS DISTINCT FROM p_phase_number;
    v_phase := jsonb_build_object('phase', p_phase, 'number', p_phase_number,
      'beginnerMode', p_beginner_mode);
    IF v_phase_changed OR v_timer IS NULL OR (v_timer->>'phase') IS DISTINCT FROM p_phase
      OR (v_timer->>'phaseNumber')::integer IS DISTINCT FROM p_phase_number THEN
      IF p_phase = 'night' THEN
        v_timer := jsonb_build_object('version', 2, 'revision', v_revision + 1,
          'phase', 'night', 'phaseNumber', p_phase_number, 'status', 'inactive',
          'remainingMs', 0, 'deadlineAt', NULL, 'lastMutationId', p_mutation_id);
      ELSE
        v_default_seconds := coalesce((v_defaults->>p_phase)::integer,
          CASE p_phase WHEN 'day' THEN 300 ELSE 180 END);
        IF v_default_seconds NOT BETWEEN 1 AND 1859 THEN
          v_default_seconds := CASE p_phase WHEN 'day' THEN 300 ELSE 180 END;
        END IF;
        v_timer := jsonb_build_object('version', 2, 'revision', v_revision + 1,
          'phase', p_phase, 'phaseNumber', p_phase_number, 'status', 'paused',
          'remainingMs', v_default_seconds * 1000, 'deadlineAt', NULL,
          'lastMutationId', p_mutation_id);
      END IF;
      v_timer_changed := true;
    ELSIF v_phase IS DISTINCT FROM v_room.phase_state THEN
      -- A mode-only phase edit still advances the revision, so an older edit cannot overwrite it.
      v_timer := v_timer || jsonb_build_object('revision', v_revision + 1,
        'lastMutationId', p_mutation_id);
      v_timer_changed := true;
    END IF;
  ELSE
    IF p_phase IS NULL OR p_phase NOT IN ('day', 'tribunal')
      OR p_phase_number IS NULL OR p_phase_number < 1
      OR (v_phase->>'phase') IS DISTINCT FROM p_phase
      OR (v_phase->>'number')::integer IS DISTINCT FROM p_phase_number
      OR v_timer IS NULL OR (v_timer->>'phase') IS DISTINCT FROM p_phase
      OR (v_timer->>'phaseNumber')::integer IS DISTINCT FROM p_phase_number THEN
      RAISE EXCEPTION 'TIMER_PHASE_MISMATCH';
    END IF;
    v_default_seconds := coalesce((v_defaults->>p_phase)::integer,
      CASE p_phase WHEN 'day' THEN 300 ELSE 180 END);
    IF v_default_seconds NOT BETWEEN 1 AND 1859 THEN
      v_default_seconds := CASE p_phase WHEN 'day' THEN 300 ELSE 180 END;
    END IF;
    IF p_action = 'set_duration' THEN
      IF p_duration_seconds IS NULL OR p_duration_seconds NOT BETWEEN 1 AND 1859 THEN
        RAISE EXCEPTION 'TIMER_INVALID_DURATION';
      END IF;
      v_defaults := jsonb_set(v_defaults, ARRAY[p_phase], to_jsonb(p_duration_seconds), true);
      IF v_timer->>'status' IS DISTINCT FROM 'paused'
        OR (v_timer->>'remainingMs')::bigint IS DISTINCT FROM p_duration_seconds::bigint * 1000 THEN
        v_remaining_ms := p_duration_seconds::bigint * 1000;
        v_timer_changed := true;
      ELSIF v_defaults IS DISTINCT FROM v_room.timer_defaults THEN
        -- A default-only edit must also invalidate commands based on the old revision.
        v_timer := v_timer || jsonb_build_object('revision', v_revision + 1,
          'lastMutationId', p_mutation_id);
      END IF;
    ELSIF p_action = 'reset' THEN
      IF v_timer->>'status' IS DISTINCT FROM 'paused'
        OR (v_timer->>'remainingMs')::bigint IS DISTINCT FROM v_default_seconds::bigint * 1000 THEN
        v_remaining_ms := v_default_seconds::bigint * 1000;
        v_timer_changed := true;
      END IF;
    ELSIF p_action = 'start' THEN
      IF v_timer->>'status' = 'running' THEN
        v_deadline_ms := floor(extract(epoch FROM (v_timer->>'deadlineAt')::timestamptz) * 1000)::bigint;
      END IF;
      IF v_timer->>'status' IS DISTINCT FROM 'running' OR v_deadline_ms <= v_now_ms THEN
        v_remaining_ms := CASE WHEN v_timer->>'status' = 'paused'
          AND (v_timer->>'remainingMs')::bigint > 0
          THEN (v_timer->>'remainingMs')::bigint ELSE v_default_seconds::bigint * 1000 END;
        v_timer := jsonb_build_object('version', 2, 'revision', v_revision + 1,
          'phase', p_phase, 'phaseNumber', p_phase_number, 'status', 'running',
          'remainingMs', v_remaining_ms,
          'deadlineAt', to_timestamp((v_now_ms + v_remaining_ms) / 1000.0),
          'lastMutationId', p_mutation_id);
        v_timer_changed := true;
      END IF;
    ELSIF p_action IN ('pause', 'complete') AND v_timer->>'status' = 'running' THEN
      v_deadline_ms := floor(extract(epoch FROM (v_timer->>'deadlineAt')::timestamptz) * 1000)::bigint;
      v_remaining_ms := greatest(0, v_deadline_ms - v_now_ms);
      IF p_action = 'pause' OR v_remaining_ms = 0 THEN
        v_timer_changed := true;
      END IF;
    END IF;

    IF v_timer_changed AND p_action IN ('reset', 'set_duration', 'pause', 'complete') THEN
      v_timer := jsonb_build_object('version', 2, 'revision', v_revision + 1,
        'phase', p_phase, 'phaseNumber', p_phase_number,
        'status', CASE WHEN v_remaining_ms = 0 THEN 'done' ELSE 'paused' END,
        'remainingMs', v_remaining_ms, 'deadlineAt', NULL,
        'lastMutationId', p_mutation_id);
    END IF;
  END IF;

  v_changed := v_phase IS DISTINCT FROM v_room.phase_state
    OR v_timer IS DISTINCT FROM v_room.timer_state
    OR v_defaults IS DISTINCT FROM v_room.timer_defaults;
  IF v_changed THEN
    UPDATE public.rooms SET phase_state = v_phase, timer_state = v_timer,
      timer_defaults = v_defaults WHERE id = p_room_id;
  END IF;
  RETURN jsonb_build_object('phaseState', v_phase, 'timerState', v_timer,
    'timerDefaults', v_defaults, 'serverNowMs', v_now_ms, 'changed', v_changed);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_server_time() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.transition_room_timer(uuid, text, bigint, text, text, integer, boolean, integer)
  TO anon, authenticated;
