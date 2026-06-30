-- Timer duration changes belong to a room, not to a GM browser.
ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS timer_defaults JSONB NOT NULL DEFAULT '{"day":300,"tribunal":180}'::jsonb;
