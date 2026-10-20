-- Grant table privileges to authenticated users. RLS still restricts rows by auth.uid().
-- Required because creating tables through migrations does not always apply the
-- default anon/authenticated grants that the Supabase dashboard sets up.

grant usage on schema public to authenticated;

grant select, insert, update on public.user_profiles to authenticated;
grant select, insert, update on public.smoking_events to authenticated;
grant select, insert, update on public.inventory_logs to authenticated;
grant select, insert, update on public.user_achievements to authenticated;

-- Refresh PostgREST schema cache so the grants/columns are visible immediately.
notify pgrst, 'reload schema';
