import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";

export const createStudentAccount = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      full_name: z.string().min(1).max(160),
      email: z.string().email().max(254),
      phone: z.string().min(1).max(40),
      password: z.string().min(6).max(128),
      preferred_course_id: z.string().uuid().nullable().optional(),
      emailRedirectTo: z.string().url().max(2048),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !publishableKey) {
      throw new Error("Missing Supabase Project URL or anon public key.");
    }

    const authClient = createClient<Database>(supabaseUrl, publishableKey, {
      auth: {
        storage: undefined,
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: authData, error: authError } = await authClient.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: data.emailRedirectTo,
        data: {
          full_name: data.full_name,
          phone: data.phone,
          preferred_course_id: data.preferred_course_id ?? null,
        },
      },
    });

    if (authError) throw new Error(authError.message);
    if (!authData.user) throw new Error("Account could not be created.");

    const { data: adminMatch, error: adminError } = await supabaseAdmin
      .from("admin_users")
      .select("email")
      .eq("email", data.email.toLowerCase())
      .maybeSingle();
    if (adminError) throw new Error(adminError.message);

    const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
      id: authData.user.id,
      email: data.email,
      full_name: data.full_name,
      phone: data.phone,
      preferred_course_id: data.preferred_course_id ?? null,
      role: adminMatch ? "admin" : "user",
    }, { onConflict: "id" });
    if (profileError) throw new Error(profileError.message);

    const { error: registrationError } = await supabaseAdmin.from("registrations").insert({
      user_id: authData.user.id,
      course_id: data.preferred_course_id ?? null,
      full_name: data.full_name,
      email: data.email,
      phone: data.phone,
    });
    if (registrationError) throw new Error(registrationError.message);

    if (data.preferred_course_id) {
      const { error: enrollmentError } = await supabaseAdmin.from("enrollments").upsert({
        user_id: authData.user.id,
        course_id: data.preferred_course_id,
        access_granted: true,
      }, { onConflict: "user_id,course_id" });
      if (enrollmentError) throw new Error(enrollmentError.message);
    }

    return {
      userId: authData.user.id,
      session: authData.session ? {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
      } : null,
    };
  });