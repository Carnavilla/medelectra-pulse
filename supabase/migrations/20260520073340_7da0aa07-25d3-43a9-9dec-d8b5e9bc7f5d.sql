
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_course_id uuid;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, role, preferred_course_id)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    'user',
    NULLIF(NEW.raw_user_meta_data->>'preferred_course_id','')::uuid
  );
  RETURN NEW;
END;
$function$;

UPDATE public.courses SET thumbnail_url = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80&auto=format&fit=crop' WHERE title = 'Health Informatics & Digital Health';
UPDATE public.courses SET thumbnail_url = 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&q=80&auto=format&fit=crop' WHERE title = 'AI in Medicine & Clinical Decision Support';
UPDATE public.courses SET thumbnail_url = 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=1200&q=80&auto=format&fit=crop' WHERE title = 'Biomedical Device & Wearable Technology';
UPDATE public.courses SET thumbnail_url = 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&q=80&auto=format&fit=crop' WHERE title = 'Healthcare Cybersecurity & Data Privacy';
UPDATE public.courses SET thumbnail_url = 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=1200&q=80&auto=format&fit=crop' WHERE title = 'Bioinformatics & Genomics for Engineers';
