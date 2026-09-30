ALTER TABLE public.players
  ADD COLUMN is_traveller BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN traveller_state TEXT,
  ADD COLUMN traveller_role TEXT,
  ADD COLUMN traveller_alignment TEXT;

ALTER TABLE public.players
  ADD CONSTRAINT players_traveller_state_check
    CHECK (traveller_state IS NULL OR traveller_state IN ('requested', 'assigning', 'revealing', 'ready', 'placed', 'denied', 'exiled')),
  ADD CONSTRAINT players_traveller_role_check
    CHECK (traveller_role IS NULL OR traveller_role IN ('t01', 't02', 't03')),
  ADD CONSTRAINT players_traveller_alignment_check
    CHECK (traveller_alignment IS NULL OR traveller_alignment IN ('villager', 'evil')),
  ADD CONSTRAINT players_traveller_fields_check
    CHECK (
      (is_traveller AND traveller_state IS NOT NULL)
      OR
      (NOT is_traveller AND traveller_state IS NULL AND traveller_role IS NULL AND traveller_alignment IS NULL)
    );

CREATE INDEX players_room_traveller_state_idx
  ON public.players (room_id, traveller_state)
  WHERE is_traveller;
