-- Ensure student/admin roles are assigned on every new account and profiles are created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role text := 'user';
BEGIN
  IF EXISTS (SELECT 1 FROM public.admin_users WHERE lower(email) = lower(NEW.email)) THEN
    v_role := 'admin';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, phone, role, preferred_course_id)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    v_role,
    NULLIF(NEW.raw_user_meta_data->>'preferred_course_id','')::uuid
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    preferred_course_id = COALESCE(EXCLUDED.preferred_course_id, public.profiles.preferred_course_id),
    role = CASE
      WHEN EXISTS (SELECT 1 FROM public.admin_users WHERE lower(email) = lower(NEW.email)) THEN 'admin'
      ELSE public.profiles.role
    END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add a registrations table for captured course registration submissions
CREATE TABLE IF NOT EXISTS public.registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid,
  full_name text,
  email text,
  phone text,
  status text NOT NULL DEFAULT 'submitted',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "registrations self read" ON public.registrations;
CREATE POLICY "registrations self read"
ON public.registrations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "registrations self insert" ON public.registrations;
CREATE POLICY "registrations self insert"
ON public.registrations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "registrations admin all" ON public.registrations;
CREATE POLICY "registrations admin all"
ON public.registrations
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS registrations_user_id_idx ON public.registrations(user_id);
CREATE INDEX IF NOT EXISTS registrations_course_id_idx ON public.registrations(course_id);

-- Backfill missing profiles for any existing users from previous broken trigger state
INSERT INTO public.profiles (id, email, full_name, phone, role, preferred_course_id)
SELECT
  u.id,
  u.email,
  u.raw_user_meta_data->>'full_name',
  u.raw_user_meta_data->>'phone',
  CASE WHEN au.email IS NOT NULL THEN 'admin' ELSE 'user' END,
  NULLIF(u.raw_user_meta_data->>'preferred_course_id','')::uuid
FROM auth.users u
LEFT JOIN public.admin_users au ON lower(au.email) = lower(u.email)
ON CONFLICT (id) DO NOTHING;