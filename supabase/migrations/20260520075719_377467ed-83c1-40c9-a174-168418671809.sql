
CREATE TABLE IF NOT EXISTS public.admin_users (
  email text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_users admin all" ON public.admin_users;
CREATE POLICY "admin_users admin all" ON public.admin_users
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

INSERT INTO public.admin_users (email) VALUES ('polayinka49@gmail.com')
  ON CONFLICT (email) DO NOTHING;

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
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Promote already-existing allowlisted profile(s) immediately
UPDATE public.profiles p
SET role = 'admin'
FROM public.admin_users a
WHERE lower(p.email) = lower(a.email) AND p.role <> 'admin';
