-- Make API permissions explicit for fresh Supabase projects.
-- RLS policies still control what anon/authenticated clients can actually do.

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE ON TABLE public.rooms TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.players TO anon, authenticated;
