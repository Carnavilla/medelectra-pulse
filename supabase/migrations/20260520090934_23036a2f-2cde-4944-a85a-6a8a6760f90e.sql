CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.is_admin(_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _uid AND role = 'admin');
$$;

CREATE OR REPLACE FUNCTION private.has_course_access(_uid uuid, _course_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.enrollments
    WHERE user_id = _uid AND course_id = _course_id AND access_granted = true
  );
$$;

GRANT EXECUTE ON FUNCTION private.is_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.has_course_access(uuid, uuid) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION private.is_admin(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION private.has_course_access(uuid, uuid) FROM anon, PUBLIC;

CREATE UNIQUE INDEX IF NOT EXISTS enrollments_user_course_unique
ON public.enrollments(user_id, course_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role text := 'user';
  v_course_id uuid := NULLIF(NEW.raw_user_meta_data->>'preferred_course_id','')::uuid;
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
    v_course_id
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

  INSERT INTO public.registrations (user_id, course_id, full_name, email, phone)
  VALUES (
    NEW.id,
    v_course_id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    NEW.raw_user_meta_data->>'phone'
  );

  IF v_course_id IS NOT NULL THEN
    INSERT INTO public.enrollments (user_id, course_id, access_granted)
    VALUES (NEW.id, v_course_id, true)
    ON CONFLICT (user_id, course_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT private.is_admin(auth.uid()) THEN
    NEW.role := OLD.role;
  END IF;
  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS "admin_users admin all" ON public.admin_users;
CREATE POLICY "admin_users admin all" ON public.admin_users FOR ALL TO authenticated
USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));

DROP POLICY IF EXISTS "announcements admin write" ON public.announcements;
CREATE POLICY "announcements admin write" ON public.announcements FOR ALL TO authenticated
USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));
DROP POLICY IF EXISTS "announcements read" ON public.announcements;
CREATE POLICY "announcements read" ON public.announcements FOR SELECT TO authenticated
USING ((course_id IS NULL) OR private.has_course_access(auth.uid(), course_id) OR private.is_admin(auth.uid()));

DROP POLICY IF EXISTS "resources admin write" ON public.course_resources;
CREATE POLICY "resources admin write" ON public.course_resources FOR ALL TO authenticated
USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));
DROP POLICY IF EXISTS "resources enrolled read" ON public.course_resources;
CREATE POLICY "resources enrolled read" ON public.course_resources FOR SELECT TO authenticated
USING (private.has_course_access(auth.uid(), course_id) OR private.is_admin(auth.uid()));

DROP POLICY IF EXISTS "videos admin write" ON public.course_videos;
CREATE POLICY "videos admin write" ON public.course_videos FOR ALL TO authenticated
USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));
DROP POLICY IF EXISTS "videos enrolled read" ON public.course_videos;
CREATE POLICY "videos enrolled read" ON public.course_videos FOR SELECT TO authenticated
USING (private.has_course_access(auth.uid(), course_id) OR private.is_admin(auth.uid()));

DROP POLICY IF EXISTS "courses admin write" ON public.courses;
CREATE POLICY "courses admin write" ON public.courses FOR ALL TO authenticated
USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));

DROP POLICY IF EXISTS "enrollments admin all" ON public.enrollments;
CREATE POLICY "enrollments admin all" ON public.enrollments FOR ALL TO authenticated
USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));

DROP POLICY IF EXISTS "profiles admin read" ON public.profiles;
CREATE POLICY "profiles admin read" ON public.profiles FOR SELECT TO authenticated
USING (private.is_admin(auth.uid()));
DROP POLICY IF EXISTS "profiles admin update" ON public.profiles;
CREATE POLICY "profiles admin update" ON public.profiles FOR UPDATE TO authenticated
USING (private.is_admin(auth.uid()));

DROP POLICY IF EXISTS "progress admin read" ON public.progress;
CREATE POLICY "progress admin read" ON public.progress FOR SELECT TO authenticated
USING (private.is_admin(auth.uid()));

DROP POLICY IF EXISTS "registrations admin all" ON public.registrations;
CREATE POLICY "registrations admin all" ON public.registrations FOR ALL TO authenticated
USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));

REVOKE EXECUTE ON FUNCTION public.has_course_access(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_role_escalation() FROM PUBLIC, anon, authenticated;