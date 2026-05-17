
-- profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  phone text,
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- security definer role check (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.is_admin(_uid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _uid AND role = 'admin');
$$;

-- prevent role escalation (only admins can change role)
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_admin(auth.uid()) THEN
    NEW.role := OLD.role;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER profiles_prevent_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_escalation();

CREATE POLICY "profiles self read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles admin read" ON public.profiles FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "profiles self update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles admin update" ON public.profiles FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));

-- new user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    'user'
  );
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- courses
CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  price integer NOT NULL DEFAULT 0,
  thumbnail_url text,
  intro_video_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "courses public read" ON public.courses FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "courses admin write" ON public.courses FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- enrollments
CREATE TABLE public.enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  access_granted boolean NOT NULL DEFAULT true,
  UNIQUE (user_id, course_id)
);
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "enrollments self read" ON public.enrollments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "enrollments self insert" ON public.enrollments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "enrollments admin all" ON public.enrollments FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- helper to check enrollment
CREATE OR REPLACE FUNCTION public.has_course_access(_uid uuid, _course_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.enrollments
    WHERE user_id = _uid AND course_id = _course_id AND access_granted = true
  );
$$;

-- course_videos
CREATE TABLE public.course_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  video_url text NOT NULL,
  description text,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.course_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "videos enrolled read" ON public.course_videos FOR SELECT TO authenticated
  USING (public.has_course_access(auth.uid(), course_id) OR public.is_admin(auth.uid()));
CREATE POLICY "videos admin write" ON public.course_videos FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- course_resources
CREATE TABLE public.course_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  file_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.course_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "resources enrolled read" ON public.course_resources FOR SELECT TO authenticated
  USING (public.has_course_access(auth.uid(), course_id) OR public.is_admin(auth.uid()));
CREATE POLICY "resources admin write" ON public.course_resources FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- progress
CREATE TABLE public.progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_id uuid NOT NULL REFERENCES public.course_videos(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  watched boolean NOT NULL DEFAULT false,
  watched_at timestamptz,
  UNIQUE (user_id, video_id)
);
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "progress self all" ON public.progress FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "progress admin read" ON public.progress FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- announcements
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
-- everyone authenticated sees global announcements; enrolled users see course-specific
CREATE POLICY "announcements read" ON public.announcements FOR SELECT TO authenticated
  USING (
    course_id IS NULL
    OR public.has_course_access(auth.uid(), course_id)
    OR public.is_admin(auth.uid())
  );
CREATE POLICY "announcements admin write" ON public.announcements FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
