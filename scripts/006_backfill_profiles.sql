-- Backfill profiles for users created before the trigger existed
INSERT INTO public.profiles (id, display_name, avatar_url)
SELECT
  au.id,
  COALESCE(
    au.raw_user_meta_data ->> 'full_name',
    au.raw_user_meta_data ->> 'name',
    au.raw_user_meta_data ->> 'user_name',
    au.raw_user_meta_data ->> 'preferred_username'
  ),
  au.raw_user_meta_data ->> 'avatar_url'
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL;
